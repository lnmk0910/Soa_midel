const express = require('express');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');
const { connectDB } = require('./config/db');
const dotenv = require('dotenv');
const path = require('path');

// Configure dotenv to look for .env file in the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

const app = express();
app.use(bodyParser.json());

// Serve static files from frontend directory
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));

// Redirect root to frontend/index.html
app.get('/', (req, res) => {
  res.redirect('/frontend/index.html');
});

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});