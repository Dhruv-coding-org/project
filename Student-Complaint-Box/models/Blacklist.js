const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  reason: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null } // Optional expiration
});

module.exports = mongoose.model('Blacklist', blacklistSchema);