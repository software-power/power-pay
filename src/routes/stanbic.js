const express = require('express');
const router = express.Router();
const StanbicController = require('../controllers/StanbicController');
const { validate } = require('../middleware/validation');
const { queryLimiter } = require('../middleware/rateLimiter');

// Stanbic routes use CHECKSUM authentication only (no API key header required)
// Authentication is done via institution prefix + token + checksum validation

/**
 * @route   POST /api/stanbic/lookup
 * @desc    Stanbic-specific lookup endpoint (verifies payment in Power-Pay)
 * @access  Public (authenticated via checksum)
 * @body    { reference, institutionId, checksum, token }
 */
router.post(
  '/lookup',
  queryLimiter,
  validate('stanbicLookup'),
  StanbicController.lookup.bind(StanbicController)
);

/**
 * @route   POST /api/stanbic/callback
 * @desc    Stanbic-specific callback endpoint (receives payment confirmation)
 * @access  Public (authenticated via checksum)
 * @body    { reference, amount, institutionId, payerName, ...checksum }
 */
router.post(
  '/callback',
  queryLimiter,
  validate('stanbicCallback'),
  StanbicController.callback.bind(StanbicController)
);

module.exports = router;
