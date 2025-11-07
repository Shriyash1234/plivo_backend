const createError = require('http-errors');
const Service = require('../models/Service');
const { eventBus } = require('../utils/eventBus');

const mapService = (serviceDoc) => {
  const service = serviceDoc.toObject ? serviceDoc.toObject() : serviceDoc;
  return {
    id: service._id?.toString() || service.id,
    name: service.name,
    description: service.description,
    status: service.status,
    organization: service.organization?.toString(),
    statusHistory: service.statusHistory,
    displayOrder: service.displayOrder,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
};

exports.listServices = async (organizationId) => {
  const services = await Service.find({ organization: organizationId }).sort({ displayOrder: 1, name: 1 });
  return services.map(mapService);
};

exports.getServiceById = async ({ organizationId, serviceId }) => {
  const service = await Service.findOne({ _id: serviceId, organization: organizationId });
  if (!service) {
    throw createError(404, 'Service not found');
  }
  return mapService(service);
};

exports.createService = async ({ organizationId, payload }) => {
  const service = await Service.create({
    name: payload.name,
    description: payload.description,
    organization: organizationId,
    status: payload.status || 'Operational',
    displayOrder: payload.displayOrder || 0,
    statusHistory: [
      {
        status: payload.status || 'Operational',
        message: 'Service created',
        updatedBy: payload.actorId,
      },
    ],
  });

  const normalized = mapService(service);
  eventBus.emit('status:update', { type: 'service', action: 'created', data: normalized });
  return normalized;
};

exports.updateService = async ({ organizationId, serviceId, payload }) => {
  const service = await Service.findOne({ _id: serviceId, organization: organizationId });
  if (!service) {
    throw createError(404, 'Service not found');
  }

  const statusChanged = payload.status && payload.status !== service.status;

  service.name = payload.name ?? service.name;
  service.description = payload.description ?? service.description;
  service.displayOrder = payload.displayOrder ?? service.displayOrder;

  if (statusChanged) {
    service.status = payload.status;
    service.statusHistory.push({
      status: payload.status,
      message: payload.message || 'Status updated',
      updatedBy: payload.actorId,
      updatedAt: new Date(),
    });
  }

  await service.save();

  const normalized = mapService(service);
  eventBus.emit('status:update', {
    type: 'service',
    action: statusChanged ? 'status-changed' : 'updated',
    data: normalized,
  });

  return normalized;
};

exports.updateServiceStatus = async ({ organizationId, serviceId, status, message, actorId }) => {
  const service = await Service.findOne({ _id: serviceId, organization: organizationId });
  if (!service) {
    throw createError(404, 'Service not found');
  }

  service.status = status;
  service.statusHistory.push({
    status,
    message,
    updatedBy: actorId,
    updatedAt: new Date(),
  });

  await service.save();

  const normalized = mapService(service);
  eventBus.emit('status:update', { type: 'service', action: 'status-changed', data: normalized });
  return normalized;
};

exports.deleteService = async ({ organizationId, serviceId }) => {
  const service = await Service.findOneAndDelete({ _id: serviceId, organization: organizationId });
  if (!service) {
    throw createError(404, 'Service not found');
  }
  eventBus.emit('status:update', { type: 'service', action: 'deleted', data: { id: serviceId } });
};
