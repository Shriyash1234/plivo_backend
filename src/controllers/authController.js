const authService = require('../services/authService');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, organizationName, organizationId, inviteToken } = req.body;
    const response = await authService.registerUser({
      name,
      email,
      password,
      organizationName,
      organizationId,
      inviteToken,
    });
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const response = await authService.loginUser({ email, password });
    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};
