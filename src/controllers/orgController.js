const organizationService = require('../services/organizationService');

exports.createOrganization = async (req, res, next) => {
  try {
    const organization = await organizationService.createOrganization({
      name: req.body.name,
      ownerId: req.user.id,
    });
    res.status(201).json({ organization });
  } catch (error) {
    next(error);
  }
};

exports.listMembers = async (req, res, next) => {
  try {
    const members = await organizationService.listMembers({
      organizationId: req.user.organization,
    });
    res.json({ members });
  } catch (error) {
    next(error);
  }
};

exports.inviteMember = async (req, res, next) => {
  try {
    const invite = await organizationService.inviteMember({
      organizationId: req.user.organization,
      invitedBy: req.user.id,
      email: req.body.email,
      name: req.body.name,
      role: req.body.role,
    });
    res.status(201).json(invite);
  } catch (error) {
    next(error);
  }
};
