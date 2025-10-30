const { findTuitionByStudentId, findTuitionById, updateTuitionStatus } = require('../models/tuitionModel');
const { createPayment, completePayment, cancelPayment, getPaymentById, getPaymentByTuitionId } = require('../models/paymentModel');
const { findCustomerById, updateBalance, lockCustomer, unlockCustomer } = require('../models/customerModel');
const { sendOtpEmail,sendInvoiceEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
async function searchTuition(req, res) {
  const { studentId } = req.params;
  const tuitions = await findTuitionByStudentId(studentId);
  if (!tuitions || tuitions.length === 0) {
    return res.status(404).json({ message: 'No tuition found for this student or invalid StudentId' });
  }
  res.json(tuitions);
}

async function getTuitionById(req, res) {
  const { tuitionFeeId } = req.params;
  const tuition = await findTuitionById(tuitionFeeId);
  if (!tuition) {
    return res.status(404).json({ message: 'Tuition not found' });
  }
  res.json(tuition);
}

async function createTuitionPayment(req, res) {
  const { tuitionFeeId } = req.body;
  const { messageTransaction } = req.body;
  const customerId = req.user.customerId;
  console.log(tuitionFeeId);
  const customer = await findCustomerById(customerId);
  const tuition = await findTuitionById(tuitionFeeId);
  
  if (!tuition) {
    return res.status(404).json({ message: 'Tuition not found' });
  }
  
  if (tuition.status === 'PAID') {
    return res.status(400).json({ message: 'Tuition already paid' });
  }
  const existingPayment = await getPaymentByTuitionId(tuitionFeeId);
  if (existingPayment && (existingPayment.status === 'PENDING' )) {
    return res.status(400).json({ message: 'This tuition is already being processed by another account' });
  }

  if (customer.available_balance < tuition.tuition_amount) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  const { paymentId } = await createPayment(customerId, tuitionFeeId, tuition.tuition_amount,messageTransaction);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpToken = jwt.sign(
    { otp, paymentId },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  await sendOtpEmail(customer.email, otp);

  console.log(`Created payment ${paymentId} with OTP: ${otp}`);

  res.json({ 
    paymentId,
    otpToken, 
    message: 'OTP sent to your email',
    tuition: {
      tuition_fee_id: tuition.tuition_fee_id,
      student_name: tuition.student_name,
      amount: tuition.tuition_amount
    }
  });
}

async function completeTuitionPayment(req, res) {
  const { paymentId, otp, otpToken } = req.body;
  const customerId = req.user.customerId;
  try{
  let decoded;
  try {
    decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ message: 'OTP expired or invalid' });
  }

  if (decoded.paymentId !== paymentId || decoded.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  const locked = await lockCustomer(customerId);
  if (!locked) {
    return res.status(409).json({ message: 'Account is currently processing another transaction' });
  }

  const payment = await getPaymentById(paymentId);
  if (!payment || payment.status !== 'PENDING') {
    return res.status(400).json({ message: 'Invalid payment or payment already processed' });
  }

  const completedPayment = await completePayment(paymentId);
  
  await updateBalance(payment.customer_id, payment.amount);
  
  await updateTuitionStatus(payment.tuition_fee_id, 'PAID');

  

  const tuition = await findTuitionById(payment.tuition_fee_id);
  const customer = await findCustomerById(payment.customer_id);
  if (customer && customer.email) {
    await sendInvoiceEmail(customer.email, payment, tuition, customer);
  }

  const invoice = {
    paymentId: payment.payment_id,
    studentName: tuition.student_name,
    studentId: tuition.student_id,
    tuitionFeeId: payment.tuition_fee_id,
    amount: payment.amount,
    message:payment.message,
    paymentDate: payment.payment_date,
    status: 'Success'
  };

  res.json({ invoice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await unlockCustomer(customerId);
  }
}

async function resendOtp(req, res) {
  const { paymentId } = req.body;
  const customerId = req.user.customerId;

  console.log(`Resend OTP request - PaymentId: ${paymentId}, CustomerId: ${customerId}`);

  try {
    const payment = await getPaymentById(paymentId);
    
    if (!payment) {
      console.log('Payment not found');
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.customer_id !== customerId) {
      console.log(`Customer mismatch - Payment belongs to: ${payment.customer_id}, Request from: ${customerId}`);
      return res.status(403).json({ message: 'Unauthorized access to payment' });
    }

    console.log(`Payment status: ${payment.status}`);
    if (payment.status === 'COMPLETED') {
      console.log('Payment already completed');
      return res.status(400).json({ message: 'Payment already completed' });
    }

    if (payment.status === 'FAILED') {
      console.log('Payment has failed');
      return res.status(400).json({ message: 'Payment has failed, cannot resend OTP' });
    }

    const customer = await findCustomerById(customerId);
    console.log(`Customer found:`, customer?.email);
    
    if (!customer) {
      console.log('Customer not found');
      return res.status(404).json({ message: 'Customer not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpToken = jwt.sign(
      { otp, paymentId },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    await sendOtpEmail(customer.email, otp);

    console.log(`Resend OTP for payment ${paymentId}: ${otp} to email: ${customer.email}`); // Log để debug

    res.json({ 
      otpToken, 
      message: 'New OTP sent to your email successfully'
    });

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
}

module.exports = { searchTuition, getTuitionById, createTuitionPayment, completeTuitionPayment, resendOtp };