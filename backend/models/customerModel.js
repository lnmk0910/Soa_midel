const { mongoose } = require('../config/db');

const customerSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
    unique: true,
    maxlength: 20
  },
  username: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    maxlength: 255
  },
  full_name: {
    type: String,
    required: true,
    maxlength: 100
  },
  phone_number: {
    type: String,
    required: true,
    maxlength: 15
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100
  },
  address: {
    type: String,
    maxlength: 255
  },
  available_balance: {
    type: Number,
    default: 0.00
  },
  is_locked: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);

async function findCustomerByUsername(username) {
  return await Customer.findOne({ username });
}

async function findCustomerById(customerId) {
  return await Customer.findOne({ customer_id: customerId });
}

async function updateBalance(customerId, amount) {
  return await Customer.findOneAndUpdate(
    { customer_id: customerId },
    { $inc: { available_balance: -amount } },
    { new: true }
  );
}


async function lockCustomer(customerId) {
  // Chỉ lock nếu hiện đang unlock
  return await Customer.findOneAndUpdate(
    { customer_id: customerId, is_locked: false },
    { $set: { is_locked: true } },
    { new: true }
  );
}

async function unlockCustomer(customerId) {
  return await Customer.updateOne(
    { customer_id: customerId },
    { $set: { is_locked: false } }
  );
}

module.exports = {
  Customer,
  findCustomerByUsername,
  findCustomerById,
  updateBalance,
  lockCustomer,    
  unlockCustomer  
};
