const serviceService = require('../services/serviceService');

exports.getServices = async (req, res, next) => {
  try {
    const services = await serviceService.listServices(req.user.organization);
    res.json({ services });
  } catch (error) {
    next(error);
  }
};

exports.getServiceById = async (req, res, next) => {
  try {
    const service = await serviceService.getServiceById({
      organizationId: req.user.organization,
      serviceId: req.params.id,
    });
    res.json({ service });
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const service = await serviceService.createService({
      organizationId: req.user.organization,
      payload: { ...req.body, actorId: req.user.id },
    });
    res.status(201).json({ service });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const service = await serviceService.updateService({
      organizationId: req.user.organization,
      serviceId: req.params.id,
      payload: { ...req.body, actorId: req.user.id },
    });
    res.json({ service });
  } catch (error) {
    next(error);
  }
};

exports.updateServiceStatus = async (req, res, next) => {
  try {
    const service = await serviceService.updateServiceStatus({
      organizationId: req.user.organization,
      serviceId: req.params.id,
      status: req.body.status,
      message: req.body.message,
      actorId: req.user.id,
    });
    res.json({ service });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    await serviceService.deleteService({
      organizationId: req.user.organization,
      serviceId: req.params.id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
