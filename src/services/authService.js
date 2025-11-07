const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

const buildTokenPayload = (user) => ({
  sub: user.id,
  role: user.role,
  organization: user.organization?.toString(),
});

const signToken = (user) => {
  const secret = process.env.JWT_SECRET || 'development_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '12h';
  return jwt.sign(buildTokenPayload(user), secret, { expiresIn });
};

const toSafeUser = (userDoc) => {
  const doc = userDoc.toObject ? userDoc.toObject() : userDoc;
  return {
    id: doc._id?.toString() || doc.id,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    organization: doc.organization?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const attachUserToOrganization = async ({ organization, userId, email }) => {
  if (!organization.members) {
    organization.members = [];
  }

  if (!organization.pendingInvites) {
    organization.pendingInvites = [];
  }

  if (!organization.members.find((memberId) => memberId.toString() === userId.toString())) {
    organization.members.push(userId);
  }

  const emailLc = email ? email.toLowerCase() : null;
  if (emailLc) {
    organization.pendingInvites = organization.pendingInvites.filter(
      (invite) => invite.email && invite.email.toLowerCase() !== emailLc,
    );
  }

  await organization.save();
};

exports.registerUser = async ({
  name,
  email,
  password,
  organizationName,
  organizationId,
  inviteToken,
}) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError(409, 'User with this email already exists');
  }

  let organization;
  let role = 'member';

  if (organizationId) {
    organization = await Organization.findById(organizationId);
    if (!organization) {
      throw createError(404, 'Organization not found');
    }

    organization.pendingInvites = organization.pendingInvites || [];

    const invite = organization.pendingInvites.find(
      (item) =>
        item.email?.toLowerCase() === email.toLowerCase() && item.token === inviteToken,
    );

    if (!invite) {
      throw createError(403, 'Valid invitation is required to join this organization');
    }

    role = invite.role || 'member';
  } else {
    if (!organizationName) {
      throw createError(400, 'Organization name is required for new registrations');
    }

    organization = await Organization.create({
      name: organizationName,
    });
    role = 'admin';
  }

  const user = await User.create({
    name,
    email,
    password,
    organization: organization.id,
    role,
  });

  if (!organization.createdBy) {
    organization.createdBy = user.id;
  }

  await attachUserToOrganization({ organization, userId: user.id, email });

  const token = signToken(user);

  return {
    token,
    user: toSafeUser(user),
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
  };
};

exports.loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw createError(401, 'Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError(401, 'Invalid credentials');
  }

  const token = signToken(user);

  const organization =
    user.organization && (await Organization.findById(user.organization).select('name slug'));

  return {
    token,
    user: toSafeUser(user),
    organization: organization
      ? { id: organization.id, name: organization.name, slug: organization.slug }
      : null,
  };
};

exports.getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createError(404, 'User not found');
  }

  const organization =
    user.organization && (await Organization.findById(user.organization).select('name slug'));

  return {
    user: toSafeUser(user),
    organization: organization
      ? { id: organization.id, name: organization.name, slug: organization.slug }
      : null,
  };
};
