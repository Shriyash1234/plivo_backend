const createError = require('http-errors');

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(createError(403, 'Insufficient permissions'));
  }
  return next();
};
