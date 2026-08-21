const rateLimit = require('express-rate-limit');

// Limit complaints per user per day
const complaintLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // limit each student to 3 complaints per day
  message: { message: 'Too many complaints. You can only submit 3 complaints per day.' }
});

// Limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many login attempts. Please try again later.' }
});

module.exports = { complaintLimiter, loginLimiter };