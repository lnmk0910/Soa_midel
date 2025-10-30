const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Configure dotenv to look for .env file in the backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Debug: Log environment variables
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ibanking_payment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database Connection Failed:', error);
    process.exit(1);
  }
};

module.exports = { connectDB, mongoose };