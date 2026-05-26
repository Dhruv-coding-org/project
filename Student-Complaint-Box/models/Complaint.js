const mongoose = require('mongoose');

// Comment Schema for nested comments
const commentSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  author: { 
    type: String, 
    enum: ['student', 'admin'], 
    required: true 
  },
  authorName: { 
    type: String, 
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// File Schema for multiple file uploads
const fileSchema = new mongoose.Schema({
  filename: { 
    type: String, 
    required: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  path: { 
    type: String, 
    required: true 
  },
  size: { 
    type: Number, 
    required: true 
  },
  mimetype: { 
    type: String, 
    required: true 
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Main Complaint Schema
const complaintSchema = new mongoose.Schema({
  // Student reference
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true,
    index: true
  },
  
  // Complaint details
  category: { 
    type: String, 
    required: true, 
    enum: ['Academic', 'Facility', 'Harassment', 'Administrative', 'Other'],
    index: true
  },
  
  description: { 
    type: String, 
    required: true,
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // File attachments (supports multiple files)
  files: [fileSchema],
  
  // Legacy single file support (for backward compatibility)
  file: { 
    type: String, 
    default: null 
  },
  
  // Status tracking
  status: { 
    type: String, 
    default: 'Pending', 
    enum: ['Pending', 'In Progress', 'Resolved', 'Escalated', 'Rejected'],
    index: true
  },
  
  // Priority levels
  priority: { 
    type: Number, 
    default: 0,
    enum: [0, 1, 2, 3],
    index: true,
    comment: '0=Normal, 1=Medium, 2=High, 3=Urgent'
  },
  
  // View counters
  views: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  adminViews: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // Comments section
  comments: [commentSchema],
  
  // Assignment
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    default: null 
  },
  
  // Resolution details
  resolvedAt: { 
    type: Date, 
    default: null 
  },
  
  resolutionNotes: { 
    type: String, 
    default: null,
    maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
  },
  
  // Escalation tracking
  escalatedAt: { 
    type: Date, 
    default: null 
  },
  
  escalatedReason: { 
    type: String, 
    default: null 
  },
  
  // Timestamps
  date: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// ==================== Indexes for Performance ====================

// Compound indexes for common queries
complaintSchema.index({ priority: -1, date: -1 });
complaintSchema.index({ studentId: 1, date: -1 });
complaintSchema.index({ status: 1, priority: -1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });

// Text index for search functionality
complaintSchema.index({ 
  description: 'text', 
  category: 'text',
  'comments.text': 'text'
});

// ==================== Virtual Properties ====================

// Virtual for complaint age in days
complaintSchema.virtual('ageInDays').get(function() {
  const diffTime = Math.abs(Date.now() - this.date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for isOverdue (older than 7 days and not resolved)
complaintSchema.virtual('isOverdue').get(function() {
  if (this.status === 'Resolved' || this.status === 'Rejected') return false;
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return this.date < sevenDaysAgo;
});

// Virtual for short description
complaintSchema.virtual('shortDescription').get(function() {
  if (this.description.length <= 100) return this.description;
  return this.description.substring(0, 100) + '...';
});

// ==================== Methods ====================

// Add comment method
complaintSchema.methods.addComment = async function(text, author, authorName = null) {
  if (!text || text.trim().length === 0) {
    throw new Error('Comment cannot be empty');
  }
  
  this.comments.push({
    text: text.trim(),
    author: author,
    authorName: authorName,
    createdAt: new Date()
  });
  
  this.lastUpdated = new Date();
  return this.save();
};

// Add file method
complaintSchema.methods.addFile = async function(fileData) {
  this.files.push({
    filename: fileData.filename,
    originalName: fileData.originalname,
    path: fileData.path,
    size: fileData.size,
    mimetype: fileData.mimetype
  });
  
  this.lastUpdated = new Date();
  return this.save();
};

// Update status method
complaintSchema.methods.updateStatus = async function(newStatus, notes = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  if (newStatus === 'Resolved') {
    this.resolvedAt = new Date();
    if (notes) this.resolutionNotes = notes;
  }
  
  if (newStatus === 'Escalated') {
    this.escalatedAt = new Date();
  }
  
  this.lastUpdated = new Date();
  await this.save();
  
  return { oldStatus, newStatus };
};

// Increment view count
complaintSchema.methods.incrementView = async function(isAdmin = false) {
  if (isAdmin) {
    this.adminViews = (this.adminViews || 0) + 1;
  } else {
    this.views = (this.views || 0) + 1;
  }
  return this.save();
};

// Check if complaint is editable by student
complaintSchema.methods.isEditableByStudent = function() {
  return this.status === 'Pending';
};

// Get priority label
complaintSchema.methods.getPriorityLabel = function() {
  const labels = {
    0: 'Normal',
    1: 'Medium',
    2: 'High',
    3: 'Urgent'
  };
  return labels[this.priority] || 'Normal';
};

// Get status label
complaintSchema.methods.getStatusLabel = function() {
  const labels = {
    'Pending': 'Pending Review',
    'In Progress': 'Being Addressed',
    'Resolved': 'Resolved',
    'Escalated': 'Escalated to Principal',
    'Rejected': 'Rejected'
  };
  return labels[this.status] || this.status;
};

// ==================== Static Methods ====================

// Get statistics for dashboard
complaintSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
        escalated: { $sum: { $cond: [{ $eq: ['$status', 'Escalated'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
        totalViews: { $sum: '$views' },
        totalAdminViews: { $sum: '$adminViews' }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        pending: 1,
        inProgress: 1,
        resolved: 1,
        escalated: 1,
        rejected: 1,
        totalViews: 1,
        totalAdminViews: 1
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    escalated: 0,
    rejected: 0,
    totalViews: 0,
    totalAdminViews: 0
  };
};

// Get complaints by category distribution
complaintSchema.statics.getCategoryDistribution = async function() {
  const distribution = await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return distribution;
};

// Get complaints by priority distribution
complaintSchema.statics.getPriorityDistribution = async function() {
  const distribution = await this.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
  
  return distribution;
};

// Get overdue complaints (older than 7 days and not resolved)
complaintSchema.statics.getOverdueComplaints = async function() {
  const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  
  return await this.find({
    status: { $nin: ['Resolved', 'Rejected'] },
    date: { $lt: sevenDaysAgo }
  }).populate('studentId', 'name email').sort({ date: 1 });
};

// Search complaints
complaintSchema.statics.searchComplaints = async function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm }
  };
  
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.priority) query.priority = filters.priority;
  
  return await this.find(query)
    .populate('studentId', 'name email')
    .sort({ date: -1 });
};

// ==================== Pre-save Middleware ====================

// Update lastUpdated timestamp on save
complaintSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastUpdated = new Date();
  }
  next();
});

// Validate description doesn't contain prohibited patterns
complaintSchema.pre('save', function(next) {
  const prohibitedPatterns = [
    /(https?:\/\/[^\s]+)/gi, // URLs
    /(\+\d{1,3}[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4})/g // Phone numbers
  ];
  
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(this.description)) {
      next(new Error('Description contains prohibited content (URLs or phone numbers)'));
      return;
    }
  }
  
  next();
});

// ==================== Virtual Population ====================

// Enable virtual population
complaintSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

complaintSchema.virtual('assignee', {
  ref: 'Admin',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true
});

// ==================== Configuration ====================

// Ensure virtuals are included when converting to JSON
complaintSchema.set('toJSON', { virtuals: true });
complaintSchema.set('toObject', { virtuals: true });

// Create the model
const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;