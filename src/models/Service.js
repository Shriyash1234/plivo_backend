const { Schema, model } = require('mongoose');

const STATUS_VALUES = ['Operational', 'Degraded', 'Partial Outage', 'Major Outage'];

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: STATUS_VALUES, required: true },
    message: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'Operational',
      required: true,
    },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    statusHistory: [statusHistorySchema],
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = model('Service', serviceSchema);
