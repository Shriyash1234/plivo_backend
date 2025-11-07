const incidentService = require('../services/incidentService');

exports.listIncidents = async (req, res, next) => {
  try {
    const incidents = await incidentService.listIncidents(req.user.organization);
    res.json({ incidents });
  } catch (error) {
    next(error);
  }
};

exports.createIncident = async (req, res, next) => {
  try {
    const incident = await incidentService.createIncident({
      organizationId: req.user.organization,
      payload: { ...req.body, actorId: req.user.id },
    });
    res.status(201).json({ incident });
  } catch (error) {
    next(error);
  }
};

exports.updateIncident = async (req, res, next) => {
  try {
    const incident = await incidentService.updateIncident({
      organizationId: req.user.organization,
      incidentId: req.params.id,
      payload: { ...req.body, actorId: req.user.id },
    });
    res.json({ incident });
  } catch (error) {
    next(error);
  }
};

exports.resolveIncident = async (req, res, next) => {
  try {
    const incident = await incidentService.resolveIncident({
      organizationId: req.user.organization,
      incidentId: req.params.id,
      actorId: req.user.id,
    });
    res.json({ incident });
  } catch (error) {
    next(error);
  }
};

exports.addIncidentUpdate = async (req, res, next) => {
  try {
    const incident = await incidentService.addIncidentUpdate({
      organizationId: req.user.organization,
      incidentId: req.params.id,
      message: req.body.message,
      actorId: req.user.id,
    });
    res.json({ incident });
  } catch (error) {
    next(error);
  }
};
