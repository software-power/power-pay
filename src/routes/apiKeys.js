const express = require('express');
const router = express.Router();
const ApiKeyController = require('../controllers/ApiKeyController');
const { authenticate, authorize } = require('../middleware/auth');

// All API key management routes require user authentication (not API key)
router.use(authenticate);

/**
 * @route   GET /api/api-keys
 * @desc    Get all API keys
 * @access  Private (ADMIN only)
 */
router.get('/', 
  authorize('ADMIN'), 
  ApiKeyController.getAllKeys.bind(ApiKeyController)
);

/**
 * @route   GET /api/api-keys/stats
 * @desc    Get API key statistics
 * @access  Private (ADMIN only)
 */
router.get('/stats', 
  authorize('ADMIN'), 
  ApiKeyController.getStats.bind(ApiKeyController)
);

/**
 * @route   POST /api/api-keys
 * @desc    Create new API key
 * @access  Private (ADMIN only)
 */
router.post('/', 
  authorize('ADMIN'), 
  ApiKeyController.createKey.bind(ApiKeyController)
);

/**
 * @route   PUT /api/api-keys/:id
 * @desc    Update API key
 * @access  Private (ADMIN only)
 */
router.put('/:id', 
  authorize('ADMIN'), 
  ApiKeyController.updateKey.bind(ApiKeyController)
);

/**
 * @route   DELETE /api/api-keys/:id
 * @desc    Delete API key
 * @access  Private (ADMIN only)
 */
router.delete('/:id', 
  authorize('ADMIN'), 
  ApiKeyController.deleteKey.bind(ApiKeyController)
);

/**
 * @route   POST /api/api-keys/:id/revoke
 * @desc    Revoke API key (set to INACTIVE)
 * @access  Private (ADMIN only)
 */
router.post('/:id/revoke', 
  authorize('ADMIN'), 
  ApiKeyController.revokeKey.bind(ApiKeyController)
);

module.exports = router;
