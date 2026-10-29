// Secure JWT Secret Resolver

function getJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0) {
    return process.env.JWT_SECRET.trim();
  }
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable must be set in production!');
  }
  
  return 'student_complaint_box_dev_jwt_secret_change_in_production_2026';
}

module.exports = {
  getJwtSecret
};
