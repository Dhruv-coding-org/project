const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../utils/jwt');

// Protect routes - Student authentication
const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      const student = await Student.findById(decoded.id).select('-password');
      
      if (!student) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      if (student.isBlacklisted) {
        return res.status(403).json({ 
          message: 'Your account has been restricted. Reason: ' + (student.blacklistReason || 'Violation of community guidelines')
        });
      }
      
      req.user = student;
      next();
    } catch (error) {
      console.error('Auth error:', error.message);
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
        const decoded = jwt.verify(token, getJwtSecret());
        const admin = await Admin.findById(decoded.id).select('-password');
        
        if (!admin) {
          return res.status(401).json({ message: 'Not authorized, admin not found' });
        }
        
        if (requiredRole && admin.role !== requiredRole) {
          return res.status(403).json({ 
            message: `Access denied. ${requiredRole} privileges required.` 
          });
        }
        
        req.admin = admin;
        next();
      } catch (error) {
        console.error('Admin auth error:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
  };
};

const teacherAuth = adminAuth('teacher');
const principalAuth = adminAuth('principal');

const checkBlacklisted = async (req, res, next) => {
  if (req.user && req.user.isBlacklisted) {
    return res.status(403).json({ 
      message: 'Your account has been restricted. Please contact administration.',
      reason: req.user.blacklistReason
    });
  }
  next();
};

const checkSpam = (req, res, next) => {
  const { description } = req.body;
  if (description && description.length > 2000) {
    return res.status(400).json({ message: 'Description too long. Please keep it under 2000 characters.' });
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
