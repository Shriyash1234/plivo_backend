const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const User = require('../models/User');

const getTokenFromHeaders = (req) => {
  const authorization = req.headers.authorization;
  if (!authorization) return null;
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer') return null;
  return token;
};

exports.authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromHeaders(req);
    if (!token) {
      throw createError(401, 'Authentication token missing');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development_secret');

    const user = await User.findById(payload.sub).select('-password');
    if (!user) {
      throw createError(401, 'User not found');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      organization: user.organization?.toString(),
      role: user.role,
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(createError(401, 'Invalid or expired token'));
    } else {
      next(error);
    }
  }
};
