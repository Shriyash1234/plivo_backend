const publicService = require('../services/publicService');

exports.getStatusPage = async (req, res, next) => {
  try {
    const data = await publicService.getStatusSnapshot(req.query.organizationId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
