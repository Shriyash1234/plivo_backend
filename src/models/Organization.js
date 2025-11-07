const { Schema, model } = require('mongoose');
const slugify = require('../utils/slugify');

const pendingInviteSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    token: { type: String, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pendingInvites: [pendingInviteSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

organizationSchema.pre('validate', function setSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

organizationSchema.pre('save', async function ensureUniqueSlug(next) {
  if (!this.isModified('slug') || !this.slug) {
    return next();
  }

  const baseSlug = slugify(this.slug);
  let slugCandidate = baseSlug;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await this.constructor.findOne({
      slug: slugCandidate,
      _id: { $ne: this._id },
    });

    if (!existing) {
      this.slug = slugCandidate;
      break;
    }

    slugCandidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return next();
});

module.exports = model('Organization', organizationSchema);
