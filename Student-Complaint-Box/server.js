require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/complaintbox';

console.log('Attempting to connect to MongoDB at:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully to:', MONGODB_URI);
})
.catch((err) => {
  console.warn('⚠️ MongoDB connection warning:', err.message);
  console.warn('📌 Running in offline mode: Database operations will fail until MongoDB is started.');
  console.warn('To start MongoDB: net start MongoDB (Windows) or brew services start mongodb-community (Mac)');
});

// Start server
if (!process.env.FUNCTION_TARGET) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Student Complaint Box server running on http://localhost:${PORT}`);
    console.log('✨ Institutional Grievance System ready.\n');
  });
}

// Export for Firebase Cloud Functions if available
try {
  const functions = require('firebase-functions');
  exports.api = functions.https.onRequest(app);
} catch (e) {
  // Not running in Firebase Functions environment
}
