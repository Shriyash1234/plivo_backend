const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateRequest');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('organizationName')
      .if(body('organizationId').not().exists())
      .notEmpty()
      .withMessage('Organization name is required when organizationId is not provided'),
    body('organizationId').optional().isMongoId().withMessage('organizationId must be a valid id'),
    body('inviteToken')
      .if(body('organizationId').exists())
      .notEmpty()
      .withMessage('Invite token is required when joining an organization'),
  ],
  validateRequest,
  authController.register,
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  authController.login,
);

router.get('/me', authenticate, authController.getProfile);

module.exports = router;
