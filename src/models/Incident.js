const { Schema, model } = require('mongoose');

const INCIDENT_STATUS = ['open', 'investigating', 'monitoring', 'resolved'];

const updateSchema = new Schema(
  {
    message: { type: String, required: true },
    status: { type: String, enum: INCIDENT_STATUS },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const incidentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: INCIDENT_STATUS,
      default: 'open',
    },
    incidentType: { type: String, enum: ['incident', 'maintenance'], default: 'incident' },
    services: [{ type: Schema.Types.ObjectId, ref: 'Service', required: true }],
    updates: [updateSchema],
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

module.exports = model('Incident', incidentSchema);
