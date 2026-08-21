const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const Blacklist = require('../models/Blacklist');
const Filter = require('bad-words');
const filter = new Filter();

const router = express.Router();

// Admin authentication middleware
const adminAuth = (requiredRole = null) => async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: 'Not authorized' });
    
    if (requiredRole && admin.role !== requiredRole) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin login (unified)
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const admin = await Admin.findOne({ email, role });
    
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create default admins (run once)
router.post('/setup', async (req, res) => {
  try {
    const teacherExists = await Admin.findOne({ email: 'teacher@school.com' });
    const principalExists = await Admin.findOne({ email: 'principal@school.com' });
    
    // Admins and Director login credentials
   
    if (!teacherExists) {
      await Admin.create({
        name: 'Teacher Admin',
        email: 'HOD@gmail.com.com',
        password: 'teacher123',
        role: 'teacher',
        department: 'General'
      });
    }
    
    if (!principalExists) {
      await Admin.create({
        name: 'Principal',
        email: 'director@gmail.com',
        password: 'principal123',
        role: 'principal'
      });
    }
    
    res.json({ 
      message: 'Admins created!',
      teacher: { email: 'teacher@school.com', password: 'teacher123' },
      principal: { email: 'principal@school.com', password: 'principal123' }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEACHER ADMIN ROUTES ====================

// Get all complaints (with filters)
router.get('/teacher/complaints', adminAuth('teacher'), async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = { $gte: parseInt(priority) };
    
    const complaints = await Complaint.find(query)
      .populate('studentId', 'name email course year')
      .sort({ priority: -1, date: -1 });
    
    // Increment admin views
    complaints.forEach(async complaint => {
      complaint.adminViews += 1;
      await complaint.save();
    });
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update complaint status
router.put('/teacher/complaint/:id', adminAuth('teacher'), async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    
    complaint.status = status;
    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
      complaint.resolutionNotes = resolutionNotes || complaint.resolutionNotes;
    }
    
    await complaint.save();
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unresolved complaints older than 1 week
router.get('/teacher/unresolved-old', adminAuth('teacher'), async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oldComplaints = await Complaint.find({
      status: { $ne: 'Resolved' },
      date: { $lt: oneWeekAgo }
    }).populate('studentId', 'name email');
    
    res.json(oldComplaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PRINCIPAL ROUTES ====================

// Get all complaints (principal view - all data)
router.get('/principal/complaints', adminAuth('principal'), async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('studentId', 'name email course year')
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, date: -1 });
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get staff performance metrics
router.get('/principal/staff-performance', adminAuth('principal'), async (req, res) => {
  try {
    const teachers = await Admin.find({ role: 'teacher' });
    const performance = [];
    
    for (const teacher of teachers) {
      const assignedComplaints = await Complaint.find({ assignedTo: teacher._id });
      const resolvedComplaints = assignedComplaints.filter(c => c.status === 'Resolved');
      const avgResolutionTime = resolvedComplaints.reduce((sum, c) => {
        const time = c.resolvedAt - c.date;
        return sum + time;
      }, 0) / (resolvedComplaints.length || 1);
      
      performance.push({
        teacher: { id: teacher._id, name: teacher.name, email: teacher.email },
        totalAssigned: assignedComplaints.length,
        resolved: resolvedComplaints.length,
        pending: assignedComplaints.filter(c => c.status === 'Pending').length,
        inProgress: assignedComplaints.filter(c => c.status === 'In Progress').length,
        averageResolutionHours: Math.round(avgResolutionTime / (1000 * 60 * 60)),
        overdueComplaints: assignedComplaints.filter(c => {
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          return c.status !== 'Resolved' && (Date.now() - c.date) > oneWeek;
        }).length
      });
    }
    
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Punish/Flag teacher for unresolved complaints
router.post('/principal/punish-teacher/:teacherId', adminAuth('principal'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { action, reason } = req.body;
    
    const teacher = await Admin.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Get all unresolved complaints older than 1 week assigned to this teacher
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oldComplaints = await Complaint.find({
      assignedTo: teacherId,
      status: { $ne: 'Resolved' },
      date: { $lt: oneWeekAgo }
    });
    
    // Mark complaints as escalated
    for (const complaint of oldComplaints) {
      complaint.status = 'Escalated';
      complaint.escalatedAt = new Date();
      await complaint.save();
    }
    
    // Log punishment action
    const punishment = {
      teacherId,
      action,
      reason,
      complaintsCount: oldComplaints.length,
      date: new Date()
    };
    
    // In production, save to a Punishment model
    console.log('Punishment issued:', punishment);
    
    res.json({
      message: `Teacher ${teacher.name} has been ${action}`,
      affectedComplaints: oldComplaints.length,
      punishment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== SHARED ADMIN ROUTES ====================

// Get stats
router.get('/stats', adminAuth(), async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const escalated = await Complaint.countDocuments({ status: 'Escalated' });
    const students = await Student.countDocuments();
    const blacklisted = await Student.countDocuments({ isBlacklisted: true });
    
    res.json({ total, pending, inProgress, resolved, escalated, students, blacklisted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Blacklist student
router.post('/blacklist/:studentId', adminAuth(), async (req, res) => {
  try {
    const { reason } = req.body;
    const student = await Student.findById(req.params.studentId);
    
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    student.isBlacklisted = true;
    student.blacklistReason = reason;
    student.blacklistedAt = new Date();
    await student.save();
    
    await Blacklist.create({
      studentId: student._id,
      reason,
      adminId: req.admin._id
    });
    
    res.json({ message: 'Student blacklisted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unblacklist student
router.delete('/blacklist/:studentId', adminAuth(), async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    student.isBlacklisted = false;
    student.blacklistReason = null;
    student.blacklistedAt = null;
    await student.save();
    
    res.json({ message: 'Student removed from blacklist' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;