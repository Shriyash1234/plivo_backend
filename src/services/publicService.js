const mongoose = require('mongoose');
const createError = require('http-errors');
const Organization = require('../models/Organization');
const Service = require('../models/Service');
const Incident = require('../models/Incident');

const STATUS_PRIORITY = ['Operational', 'Degraded', 'Partial Outage', 'Major Outage'];

const computeOverallStatus = (services) => {
  let highestIndex = 0;
  services.forEach((service) => {
    const index = STATUS_PRIORITY.indexOf(service.status);
    if (index > highestIndex) {
      highestIndex = index;
    }
  });
  return STATUS_PRIORITY[highestIndex] || 'Operational';
};

const toServicePublicDto = (service) => ({
  id: service.id,
  name: service.name,
  description: service.description,
  status: service.status,
  updatedAt: service.updatedAt,
});

const toIncidentPublicDto = (incident) => ({
  id: incident._id?.toString() || incident.id,
  title: incident.title,
  description: incident.description,
  status: incident.status,
  incidentType: incident.incidentType,
  services: incident.services?.map((serviceId) => serviceId.toString()),
  updates:
    incident.updates?.map((update) => ({
      message: update.message,
      status: update.status,
      timestamp: update.createdAt,
    })) || [],
  startedAt: incident.startedAt,
  resolvedAt: incident.resolvedAt,
  createdAt: incident.createdAt,
  updatedAt: incident.updatedAt,
});

const buildTimeline = (services, incidents) => {
  const serviceEvents = services.flatMap((service) =>
    service.statusHistory.map((item) => ({
      type: 'service_status',
      serviceId: service.id,
      serviceName: service.name,
      status: item.status,
      message: item.message,
      timestamp: item.updatedAt,
    })),
  );

  const incidentEvents = incidents.flatMap((incident) =>
    incident.updates.map((update) => ({
      type: 'incident_update',
      incidentId: incident.id,
      incidentTitle: incident.title,
      status: update.status || incident.status,
      message: update.message,
      timestamp: update.createdAt,
    })),
  );

  return [...serviceEvents, ...incidentEvents]
    .filter((item) => item.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 25);
};

exports.listPublicOrganizations = async () => {
  const organizations = await Organization.find()
    .select('name slug')
    .sort({ name: 1 })
    .lean();

  return organizations.map((organization) => ({
    id: organization._id.toString(),
    name: organization.name,
    slug: organization.slug,
  }));
};

exports.getStatusSnapshot = async (identifier) => {
  let organizationQuery = {};

  if (identifier) {
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      organizationQuery = { _id: identifier };
    } else {
      organizationQuery = { slug: identifier };
    }
  }

  let organization = await Organization.findOne(organizationQuery);

  if (!organization && !identifier) {
    organization = await Organization.findOne();
  }

  if (!organization) {
    throw createError(404, 'Status page not found');
  }

  const services = await Service.find({ organization: organization.id })
    .sort({ displayOrder: 1, name: 1 })
    .lean({ virtuals: true });

  const incidents = await Incident.find({ organization: organization.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean({ virtuals: true });

  const servicesDto = services.map((service) => toServicePublicDto(service));
  const activeIncidents = incidents
    .filter((incident) => incident.status !== 'resolved')
    .map(toIncidentPublicDto);
  const pastIncidents = incidents
    .filter((incident) => incident.status === 'resolved')
    .slice(0, 10)
    .map(toIncidentPublicDto);

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    overallStatus: computeOverallStatus(servicesDto),
    services: servicesDto,
    activeIncidents,
    pastIncidents,
    timeline: buildTimeline(services, incidents),
    generatedAt: new Date().toISOString(),
  };
};
