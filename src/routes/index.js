const express = require('express');
const authRoutes = require('./authRoutes');
const orgRoutes = require('./orgRoutes');
const serviceRoutes = require('./serviceRoutes');
const incidentRoutes = require('./incidentRoutes');
const publicRoutes = require('./publicRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/org', orgRoutes);
router.use('/services', serviceRoutes);
router.use('/incidents', incidentRoutes);
router.use('/public', publicRoutes);

module.exports = router;
