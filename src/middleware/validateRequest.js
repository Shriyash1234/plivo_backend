const { validationResult } = require('express-validator');
const createError = require('http-errors');

exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const mapped = errors.array().map((err) => ({ field: err.param, message: err.msg }));
    return next(createError(422, { errors: mapped }));
  }
  return next();
};
