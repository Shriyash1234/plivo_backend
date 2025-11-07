const express = require('express');
const { body } = require('express-validator');
const orgController = require('../controllers/orgController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/',
  authenticate,
  requireRole('admin'),
  [body('name').trim().notEmpty().withMessage('Organization name is required')],
  validateRequest,
  orgController.createOrganization,
);

router.get('/members', authenticate, orgController.listMembers);

router.post(
  '/members',
  authenticate,
  requireRole('admin'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').optional().trim(),
    body('role').optional().isIn(['admin', 'member']).withMessage('role must be admin or member'),
  ],
  validateRequest,
  orgController.inviteMember,
);

module.exports = router;
