const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/status', publicController.getStatusPage);
router.get('/organizations', publicController.listOrganizations);

module.exports = router;
