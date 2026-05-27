const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventhub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Admin Server: MongoDB Connected'))
.catch(err => console.error('Admin Server: MongoDB Connection Error:', err));

// Routes
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Admin Portal API is running on port 5001' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Admin Server running on port ${PORT}`);
});
