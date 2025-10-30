const express = require('express');
const router = express.Router();
const { login, getUserProfile } = require('../controllers/authController');
const { searchTuition, getTuitionById, createTuitionPayment, completeTuitionPayment, resendOtp } = require('../controllers/paymentController');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const { getPaymentsByCustomer, cancelPayment } = require('../models/paymentModel'); 

// Middleware auth
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
};


router.post('/login', login);
router.get('/profile', authMiddleware, getUserProfile);

// Tuition routes
router.get('/tuition/student/:studentId', authMiddleware, searchTuition);
router.get('/tuition/:tuitionFeeId', authMiddleware, getTuitionById);

router.post('/tuition/create-payment', authMiddleware, createTuitionPayment);
router.post('/tuition/complete-payment', authMiddleware, completeTuitionPayment);
router.post('/tuition/resend-otp', authMiddleware, resendOtp);
router.post('/tuition/cancel-payment', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }
    
    const cancelledPayment = await cancelPayment(paymentId);
    if (!cancelledPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json({ message: 'Payment cancelled successfully', payment: cancelledPayment });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const customerId = req.user.customerId; 
    const payments = await getPaymentsByCustomer(customerId);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;