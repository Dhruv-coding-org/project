const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

// Protect routes - Student authentication
const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get student from token (excluding password)
      const student = await Student.findById(decoded.id).select('-password');
      
      if (!student) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      // Check if student is blacklisted
      if (student.isBlacklisted) {
        return res.status(403).json({ 
          message: 'Your account has been restricted. Reason: ' + (student.blacklistReason || 'Violation of community guidelines')
        });
      }
      
      req.user = student;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin authentication (generic - for both teacher and principal)
const adminAuth = (requiredRole = null) => {
  return async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const admin = await Admin.findById(decoded.id).select('-password');
        
        if (!admin) {
          return res.status(401).json({ message: 'Not authorized, admin not found' });
        }
        
        // Check if role is required and matches
        if (requiredRole && admin.role !== requiredRole) {
          return res.status(403).json({ 
            message: `Access denied. ${requiredRole} privileges required.` 
          });
        }
        
        req.admin = admin;
        next();
      } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
  };
};

// Teacher-only authentication (alias for adminAuth with 'teacher' role)
const teacherAuth = adminAuth('teacher');

// Principal-only authentication (alias for adminAuth with 'principal' role)
const principalAuth = adminAuth('principal');

// Optional: Check if user is blacklisted (can be used as separate middleware)
const checkBlacklisted = async (req, res, next) => {
  if (req.user && req.user.isBlacklisted) {
    return res.status(403).json({ 
      message: 'Your account has been restricted. Please contact administration.',
      reason: req.user.blacklistReason
    });
  }
  next();
};

// Optional: Rate limit for complaint submissions (already in rateLimit.js)
// This is an additional check for spam
const checkSpam = (req, res, next) => {
  // This is a simple check - actual rate limiting is in rateLimit.js
  // You can add additional spam detection here
  const { description } = req.body;
  
  // Check for repetitive text (basic spam detection)
  if (description && description.length > 500) {
    return res.status(400).json({ message: 'Description too long. Please keep it under 500 characters.' });
  }
  
  next();
};

module.exports = { 
  protect, 
  adminAuth, 
  teacherAuth, 
  principalAuth,
  checkBlacklisted,
  checkSpam
};