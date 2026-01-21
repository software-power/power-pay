const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticate, authorize } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (ADMIN, MANAGER)
 */
router.get('/', 
  authorize('ADMIN', 'MANAGER'), 
  UserController.getAllUsers.bind(UserController)
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (ADMIN, MANAGER)
 */
router.get('/stats', 
  authorize('ADMIN', 'MANAGER'), 
  UserController.getUserStats.bind(UserController)
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (ADMIN, MANAGER)
 */
router.get('/:id', 
  authorize('ADMIN', 'MANAGER'), 
  UserController.getUserById.bind(UserController)
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (ADMIN only)
 */
router.post('/', 
  authorize('ADMIN'), 
  UserController.createUser.bind(UserController)
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (ADMIN only)
 */
router.put('/:id', 
  authorize('ADMIN'), 
  UserController.updateUser.bind(UserController)
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (ADMIN only)
 */
router.delete('/:id', 
  authorize('ADMIN'), 
  UserController.deleteUser.bind(UserController)
);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (ADMIN only)
 */
router.post('/:id/reset-password', 
  authorize('ADMIN'), 
  UserController.resetPassword.bind(UserController)
);

module.exports = router;
