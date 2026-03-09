const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');
const { authenticateApiKey } = require('../middleware/apiKeyAuth');

// Apply JWT authentication to all routes
router.use(authenticateApiKey);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions (for dashboard)
 * @access  Protected (JWT)
 */
router.get('/', TransactionController.getAllTransactions);

/**
 * @route   GET /api/transactions/stats/summary
 * @desc    Get transaction statistics
 * @access  Protected (JWT)
 */
router.get('/stats/summary', TransactionController.getStatistics);

/**
 * @route   GET /api/transactions/stats/by-mno
 * @desc    Get statistics grouped by MNO
 * @access  Protected (JWT)
 */
router.get('/stats/by-mno', TransactionController.getStatsByMNO);

/**
 * @route   GET /api/transactions/recent
 * @desc    Get recent transactions
 * @access  Protected (JWT)
 */
router.get('/recent', TransactionController.getRecentTransactions);

/**
 * @route   GET /api/transactions/search
 * @desc    Search transactions
 * @access  Protected (JWT)
 */
router.get('/search', TransactionController.searchTransactions);

/**
 * @route   GET /api/transactions/reference/:reference
 * @desc    Get transaction by reference
 * @access  Protected (JWT)
 */
router.get('/reference/:reference', TransactionController.getTransactionByReference);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction by ID
 * @access  Protected (JWT)
 */
router.get('/:id', TransactionController.getTransactionById);

module.exports = router;
