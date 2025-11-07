// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const payload = {
    message: err.message || 'Internal server error',
  };

  if (err.errors) {
    payload.errors = err.errors;
  }

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};
