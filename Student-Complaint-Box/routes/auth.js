const express = require('express');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Blacklist = require('../models/Blacklist');
const { loginLimiter } = require('../middleware/rateLimit');
const { getJwtSecret } = require('../utils/jwt');
const Filter = require('bad-words');
const filter = new Filter();

const router = express.Router();

// Register with content filtering
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, course, year } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const exists = await Student.findOne({ email: cleanEmail });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    
    const cleanName = filter.isProfane(name) ? 'Anonymous Student' : name.trim();
    
    const student = await Student.create({
      name: cleanName,
      email: cleanEmail,
      password,
      course: course || 'General',
      year: year || '1st Year'
    });
    
    const token = jwt.sign({ id: student._id, role: 'student' }, getJwtSecret(), { expiresIn: '7d' });
    
    res.json({ 
      token, 
      student: { 
        id: student._id, 
        name: student.name, 
        email: student.email, 
        course: student.course, 
        year: student.year,
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
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const student = await Student.findOne({ email: cleanEmail });
    
    if (!student || !(await student.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (student.isBlacklisted) {
      return res.status(403).json({ 
        message: `Account restricted: ${student.blacklistReason || 'Violation of community guidelines'}` 
      });
    }
    
    const token = jwt.sign({ id: student._id, role: 'student' }, getJwtSecret(), { expiresIn: '7d' });
    res.json({ 
      token, 
      student: { 
        id: student._id, 
        name: student.name, 
        email: student.email, 
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
