require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/admin', require('./routes/admin'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/complaintbox';

console.log('Attempting to connect to MongoDB at:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully to:', MONGODB_URI);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('\n📌 Troubleshooting tips:');
  console.log('1. MongoDB is installed and running');
  console.log('2. Check if MongoDB service is started');
  console.log('3. Verify the connection string is correct');
  console.log('4. If using localhost, ensure MongoDB is listening on port 27017');
  console.log('\nTo start MongoDB:');
  console.log('  - Windows: net start MongoDB');
  console.log('  - Mac: brew services start mongodb-community');
  console.log('  - Linux: sudo systemctl start mongod');
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log('\n📋 Login credentials:');
  console.log('  👨‍🎓 Student: Register your account');
  console.log('  👨‍🏫 Teacher: HOD@gmail.com / teacher123');
  console.log('  👑 Principal: director@gmail.com / principal123');
  console.log('\n✨ System ready!');
});