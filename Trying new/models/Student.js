const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  course: { type: String, required: true },
  year: { type: String, required: true },
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String, default: null },
  blacklistedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

studentSchema.methods.comparePassword = async function(candidate) {
  return await bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Student', studentSchema);