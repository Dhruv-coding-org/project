const express = require('express');
const multer = require('multer');
const path = require('path');
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const { complaintLimiter } = require('../middleware/rateLimit');
const Filter = require('bad-words');
const filter = new Filter();

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
};

const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Calculate priority based on complaint content and category
function calculatePriority(description, category) {
  const urgentKeywords = ['urgent', 'emergency', 'immediate', 'critical', 'violence', 'abuse', 'danger'];
  const highKeywords = ['harassment', 'discrimination', 'safety', 'threat', 'bullying'];
  
  const lowerDesc = description.toLowerCase();
  
  if (urgentKeywords.some(keyword => lowerDesc.includes(keyword))) return 3; // Urgent
  if (highKeywords.some(keyword => lowerDesc.includes(keyword))) return 2; // High
  if (category === 'Harassment') return 2;
  return 0; // Normal
}

// ==================== PUBLIC ROUTES ====================

// Get all complaints (public - anonymous feed)
router.get('/all', async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    let query = {};
    
    if (status && status !== 'all') query.status = status;
    if (priority) query.priority = { $gte: parseInt(priority) };
    
    // Don't show studentId to public
    const complaints = await Complaint.find(query)
      .select('-studentId')
      .sort({ priority: -1, date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Complaint.countDocuments(query);
    
    res.json({
      complaints,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error('Error loading public complaints:', error);
    res.status(500).json({ message: 'Error loading complaints' });
  }
});

// Get single complaint by ID (public view)
router.get('/view/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .select('-studentId');
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Increment view count
    complaint.views += 1;
    await complaint.save();
    
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ message: 'Error fetching complaint' });
  }
});

// ==================== STUDENT ROUTES (Protected) ====================

// Create complaint
router.post('/create', protect, complaintLimiter, upload.single('file'), async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    
    // Check if student is blacklisted
    if (student.isBlacklisted) {
      return res.status(403).json({ 
        message: 'You are restricted from posting complaints. Reason: ' + (student.blacklistReason || 'Violation of community guidelines')
      });
    }
    
    const { category, description } = req.body;
    
    if (!category || !description) {
      return res.status(400).json({ message: 'Category and description are required' });
    }
    
    if (description.length < 10) {
      return res.status(400).json({ message: 'Description must be at least 10 characters' });
    }
    
    // Check for profanity
    if (filter.isProfane(description)) {
      return res.status(400).json({ 
        message: 'Complaint contains inappropriate language. Please revise and resubmit.'
      });
    }
    
    // Check for spam (too many complaints in short time)
    const recentComplaints = await Complaint.countDocuments({
      studentId: req.user._id,
      date: { $gt: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });
    
    if (recentComplaints >= 2) {
      return res.status(429).json({ 
        message: 'Too many complaints. Please wait before posting again.' 
      });
    }
    
    const priority = calculatePriority(description, category);
    
    const complaint = await Complaint.create({
      studentId: req.user._id,
      category,
      description: description.trim(),
      file: req.file ? `/uploads/${req.file.filename}` : null,
      priority,
      status: 'Pending',
      views: 0,
      adminViews: 0
    });
    
    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint
    });
    
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Error submitting complaint' });
  }
});

// Get my complaints (student dashboard)
router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ studentId: req.user._id })
      .sort({ date: -1 });
    
    // Increment student view count for each complaint
    for (const complaint of complaints) {
      complaint.views = (complaint.views || 0) + 1;
      await complaint.save();
    }
    
    res.json(complaints);
  } catch (error) {
    console.error('Error loading my complaints:', error);
    res.status(500).json({ message: 'Error loading complaints' });
  }
});

// Get single complaint (student view)
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Check if complaint belongs to the student
    if (complaint.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ message: 'Error fetching complaint' });
  }
});

// Add comment to complaint
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Check if complaint belongs to the student
    if (complaint.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }
    
    // Check for profanity in comment
    if (filter.isProfane(text)) {
      return res.status(400).json({ message: 'Comment contains inappropriate language' });
    }
    
    complaint.comments = complaint.comments || [];
    complaint.comments.push({
      text: text.trim(),
      author: 'student',
      createdAt: new Date()
    });
    
    await complaint.save();
    
    res.json({ 
      message: 'Comment added successfully',
      comment: complaint.comments[complaint.comments.length - 1]
    });
    
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Get comments for a complaint
router.get('/:id/comments', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Check if complaint belongs to the student
    if (complaint.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(complaint.comments || []);
    
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// Delete complaint
router.delete('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Check if complaint belongs to the student
    if (complaint.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this complaint' });
    }
    
    // Delete associated file if exists
    if (complaint.file) {
      const fs = require('fs');
      const filePath = path.join(__dirname, '..', complaint.file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await complaint.deleteOne();
    
    res.json({ message: 'Complaint deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ message: 'Error deleting complaint' });
  }
});

// Update complaint (student can only update if not resolved)
router.put('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Check if complaint belongs to the student
    if (complaint.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Can only update if status is pending
    if (complaint.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot update complaint once it is being processed' });
    }
    
    const { category, description } = req.body;
    
    if (category) complaint.category = category;
    if (description) {
      if (description.length < 10) {
        return res.status(400).json({ message: 'Description must be at least 10 characters' });
      }
      if (filter.isProfane(description)) {
        return res.status(400).json({ message: 'Description contains inappropriate language' });
      }
      complaint.description = description;
      complaint.priority = calculatePriority(description, complaint.category);
    }
    
    await complaint.save();
    
    res.json({ message: 'Complaint updated successfully', complaint });
    
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ message: 'Error updating complaint' });
  }
});

// Get complaint statistics for student
router.get('/stats/my', protect, async (req, res) => {
  try {
    const total = await Complaint.countDocuments({ studentId: req.user._id });
    const pending = await Complaint.countDocuments({ 
      studentId: req.user._id, 
      status: 'Pending' 
    });
    const inProgress = await Complaint.countDocuments({ 
      studentId: req.user._id, 
      status: 'In Progress' 
    });
    const resolved = await Complaint.countDocuments({ 
      studentId: req.user._id, 
      status: 'Resolved' 
    });
    
    res.json({
      total,
      pending,
      inProgress,
      resolved
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;