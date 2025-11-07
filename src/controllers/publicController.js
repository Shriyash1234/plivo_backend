const publicService = require('../services/publicService');

exports.getStatusPage = async (req, res, next) => {
  try {
    const data = await publicService.getStatusSnapshot(req.query.organizationId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.listOrganizations = async (req, res, next) => {
  try {
    const organizations = await publicService.listPublicOrganizations();
    res.json({ organizations });
  } catch (error) {
    next(error);
  }
};
