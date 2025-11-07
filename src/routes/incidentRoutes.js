const express = require('express');
const { body, param } = require('express-validator');
const incidentController = require('../controllers/incidentController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/requireRole');
const { validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);

router.get('/', incidentController.listIncidents);

router.post(
  '/',
  requireRole('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('incidentType')
      .optional()
      .isIn(['incident', 'maintenance'])
      .withMessage('incidentType must be incident or maintenance'),
    body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
    body('services.*').isMongoId().withMessage('Service ids must be valid'),
    body('status')
      .optional()
      .isIn(['open', 'investigating', 'monitoring', 'resolved'])
      .withMessage('Invalid status'),
  ],
  validateRequest,
  incidentController.createIncident,
);

router.put(
  '/:id',
  requireRole('admin'),
  [
    param('id').isMongoId().withMessage('Incident id must be valid'),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('status')
      .optional()
      .isIn(['open', 'investigating', 'monitoring', 'resolved'])
      .withMessage('Invalid status'),
    body('services').optional().isArray({ min: 1 }),
    body('services.*').optional().isMongoId(),
  ],
  validateRequest,
  incidentController.updateIncident,
);

router.put(
  '/:id/resolve',
  requireRole('admin'),
  [param('id').isMongoId().withMessage('Incident id must be valid')],
  validateRequest,
  incidentController.resolveIncident,
);

router.put(
  '/:id/update',
  requireRole('admin'),
  [
    param('id').isMongoId().withMessage('Incident id must be valid'),
    body('message').trim().notEmpty().withMessage('Update message is required'),
  ],
  validateRequest,
  incidentController.addIncidentUpdate,
);

module.exports = router;
