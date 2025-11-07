const express = require('express');
const { body, param } = require('express-validator');
const serviceController = require('../controllers/serviceController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);

router.get('/', serviceController.getServices);

router.post(
  '/',
  requireRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('status')
      .optional()
      .isIn(['Operational', 'Degraded', 'Partial Outage', 'Major Outage'])
      .withMessage('Invalid status'),
  ],
  validateRequest,
  serviceController.createService,
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Service id must be valid')],
  validateRequest,
  serviceController.getServiceById,
);

router.put(
  '/:id',
  requireRole('admin'),
  [
    param('id').isMongoId().withMessage('Service id must be valid'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim().isLength({ max: 500 }),
    body('status')
      .optional()
      .isIn(['Operational', 'Degraded', 'Partial Outage', 'Major Outage'])
      .withMessage('Invalid status'),
  ],
  validateRequest,
  serviceController.updateService,
);

router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isMongoId().withMessage('Service id must be valid')],
  validateRequest,
  serviceController.deleteService,
);

router.put(
  '/:id/status',
  requireRole('admin'),
  [
    param('id').isMongoId().withMessage('Service id must be valid'),
    body('status')
      .isIn(['Operational', 'Degraded', 'Partial Outage', 'Major Outage'])
      .withMessage('Invalid status'),
    body('message').optional().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  serviceController.updateServiceStatus,
);

module.exports = router;
