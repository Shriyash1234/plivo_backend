const createError = require('http-errors');
const Incident = require('../models/Incident');
const Service = require('../models/Service');
const { eventBus } = require('../utils/eventBus');

const mapIncident = (incidentDoc) => {
  const incident = incidentDoc.toObject ? incidentDoc.toObject() : incidentDoc;
  return {
    id: incident._id?.toString() || incident.id,
    title: incident.title,
    description: incident.description,
    status: incident.status,
    incidentType: incident.incidentType,
    services: incident.services?.map((id) => id.toString()),
    updates: incident.updates,
    organization: incident.organization?.toString(),
    startedAt: incident.startedAt,
    resolvedAt: incident.resolvedAt,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };
};

const ensureServicesBelongToOrg = async (organizationId, serviceIds) => {
  const count = await Service.countDocuments({
    _id: { $in: serviceIds },
    organization: organizationId,
  });

  if (count !== serviceIds.length) {
    throw createError(400, 'One or more services do not belong to the organization');
  }
};

exports.listIncidents = async (organizationId) => {
  const incidents = await Incident.find({ organization: organizationId })
    .sort({ createdAt: -1 })
    .limit(50);
  return incidents.map(mapIncident);
};

exports.createIncident = async ({ organizationId, payload }) => {
  const serviceIds = payload.services || [];
  if (!serviceIds.length) {
    throw createError(400, 'At least one service must be selected');
  }

  await ensureServicesBelongToOrg(organizationId, serviceIds);

  const incident = await Incident.create({
    title: payload.title,
    description: payload.description,
    status: payload.status || 'open',
    incidentType: payload.incidentType || 'incident',
    services: serviceIds,
    organization: organizationId,
    createdBy: payload.actorId,
    updates: [
      {
        message: payload.initialUpdate || 'Incident created',
        status: payload.status || 'open',
        createdBy: payload.actorId,
      },
    ],
  });

  const normalized = mapIncident(incident);
  eventBus.emit('status:update', { type: 'incident', action: 'created', data: normalized });
  return normalized;
};

exports.updateIncident = async ({ organizationId, incidentId, payload }) => {
  const incident = await Incident.findOne({ _id: incidentId, organization: organizationId });
  if (!incident) {
    throw createError(404, 'Incident not found');
  }

  if (payload.services) {
    await ensureServicesBelongToOrg(organizationId, payload.services);
    incident.services = payload.services;
  }

  if (payload.title) incident.title = payload.title;
  if (payload.description) incident.description = payload.description;
  if (payload.incidentType) incident.incidentType = payload.incidentType;

  if (payload.status && payload.status !== incident.status) {
    incident.status = payload.status;
    incident.updates.push({
      message: payload.statusMessage || 'Status updated',
      status: payload.status,
      createdBy: payload.actorId,
    });
  }

  incident.updatedBy = payload.actorId;
  await incident.save();

  const normalized = mapIncident(incident);
  eventBus.emit('status:update', { type: 'incident', action: 'updated', data: normalized });
  return normalized;
};

exports.resolveIncident = async ({ organizationId, incidentId, actorId }) => {
  const incident = await Incident.findOne({ _id: incidentId, organization: organizationId });
  if (!incident) {
    throw createError(404, 'Incident not found');
  }

  incident.status = 'resolved';
  incident.resolvedAt = new Date();
  incident.updates.push({
    message: 'Incident resolved',
    status: 'resolved',
    createdBy: actorId,
  });
  incident.updatedBy = actorId;

  await incident.save();

  const normalized = mapIncident(incident);
  eventBus.emit('status:update', { type: 'incident', action: 'resolved', data: normalized });
  return normalized;
};

exports.addIncidentUpdate = async ({ organizationId, incidentId, message, actorId }) => {
  const incident = await Incident.findOne({ _id: incidentId, organization: organizationId });
  if (!incident) {
    throw createError(404, 'Incident not found');
  }

  incident.updates.push({
    message,
    status: incident.status,
    createdBy: actorId,
  });
  incident.updatedBy = actorId;
  await incident.save();

  const normalized = mapIncident(incident);
  eventBus.emit('status:update', { type: 'incident', action: 'update-added', data: normalized });
  return normalized;
};
