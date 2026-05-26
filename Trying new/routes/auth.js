const express = require('express');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Blacklist = require('../models/Blacklist');
const { loginLimiter } = require('../middleware/rateLimit');
const Filter = require('bad-words');
const filter = new Filter();

const router = express.Router();

// Register with content filtering
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, course, year } = req.body;
    
    // Check if user is blacklisted by IP or email pattern
    const exists = await Student.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    
    // Filter offensive name
    const cleanName = filter.isProfane(name) ? 'Anonymous Student' : name;
    
    const student = await Student.create({
      name: cleanName,
      email,
      password,
      course,
      year
    });
    
    const token = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET);
    
    res.json({ 
      token, 
      student: { 
        id: student._id, 
        name: student.name, 
        email, 
        course, 
        year,
        isBlacklisted: student.isBlacklisted
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login with rate limiting
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    
    if (!student || !(await student.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if blacklisted
    if (student.isBlacklisted) {
      return res.status(403).json({ 
        message: `Account restricted: ${student.blacklistReason || 'Violation of community guidelines'}` 
      });
    }
    
    const token = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET);
    res.json({ 
      token, 
      student: { 
        id: student._id, 
        name: student.name, 
        email, 
        course: student.course, 
        year: student.year,
        isBlacklisted: student.isBlacklisted
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;