const crypto = require('crypto');
const createError = require('http-errors');
const Organization = require('../models/Organization');
const User = require('../models/User');
const slugify = require('../utils/slugify');

const ensureUniqueSlug = async (name) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  // eslint-disable-next-line no-await-in-loop
  while (await Organization.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

exports.createOrganization = async ({ name, ownerId }) => {
  const owner = await User.findById(ownerId);
  if (!owner) {
    throw createError(404, 'Owner not found');
  }

  const organization = await Organization.create({
    name,
    slug: await ensureUniqueSlug(name),
    members: [owner.id],
    createdBy: owner.id,
  });

  owner.organization = organization.id;
  owner.role = 'admin';
  await owner.save();

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
  };
};

exports.listMembers = async ({ organizationId }) => {
  const organization = await Organization.findById(organizationId, 'members');
  if (!organization) {
    throw createError(404, 'Organization not found');
  }

  const members = await User.find({ organization: organizationId }).select(
    'name email role createdAt updatedAt',
  );

  return members.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  }));
};

exports.inviteMember = async ({ organizationId, invitedBy, email, name, role = 'member' }) => {
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw createError(404, 'Organization not found');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.organization?.toString() === organizationId.toString()) {
      throw createError(409, 'User is already a member of this organization');
    }

    if (existingUser.organization) {
      throw createError(409, 'User belongs to another organization');
    }

    existingUser.organization = organizationId;
    existingUser.role = role;
    if (name) {
      existingUser.name = name;
    }
    await existingUser.save();

    const alreadyMember = organization.members.some(
      (memberId) => memberId.toString() === existingUser.id.toString(),
    );
    if (!alreadyMember) {
      organization.members.push(existingUser.id);
      await organization.save();
    }

    return {
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
      message: 'Existing user added to organization',
    };
  }

  const token = crypto.randomBytes(20).toString('hex');

  const invite = {
    email: email.toLowerCase(),
    name,
    role,
    token,
    invitedBy,
  };

  organization.pendingInvites = organization.pendingInvites.filter(
    (item) => item.email !== invite.email,
  );
  organization.pendingInvites.push(invite);
  await organization.save();

  return {
    invite: {
      email: invite.email,
      role: invite.role,
      token: invite.token,
    },
    message: 'Invite created. Send the invite token to the user for registration.',
  };
};
