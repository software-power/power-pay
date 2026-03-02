const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { validate } = require('../middleware/validation');
const { paymentLimiter, queryLimiter } = require('../middleware/rateLimiter');
const { authenticateApiKey, requirePermission } = require('../middleware/apiKeyAuth');

// ALL payment routes require API key authentication
router.use(authenticateApiKey);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment/biller information
 * @access  Requires API key with 'payments:verify' permission
 */
router.post(
  '/verify',
  paymentLimiter,
  requirePermission('payments:verify'),
  validate('verifyPayment'),
  PaymentController.verifyPayment.bind(PaymentController)
);

/**
 * @route   POST /api/payments/process
 * @desc    Process payment transaction
 * @access  Requires API key with 'payments:process' permission
 */
router.post(
  '/process',
  paymentLimiter,
  requirePermission('payments:process'),
  validate('processPayment'),
  PaymentController.processPayment.bind(PaymentController)
);

/**
 * @route   GET /api/payments/status/:transaction_id
 * @desc    Query transaction status
 * @access  Requires API key
 */
router.get(
  '/status/:transaction_id',
  queryLimiter,
  PaymentController.queryTransaction.bind(PaymentController)
);

/**
 * @route   GET /api/payments/history/:client_system
 * @desc    Get transaction history for a client system
 * @access  Requires API key
 */
router.get(
  '/history/:client_system',
  queryLimiter,
  PaymentController.getTransactionHistory.bind(PaymentController)
);

/**
 * @route   GET /api/payments/selcom/balance
 * @desc    Get Selcom float balance
 * @access  Requires API key
 */
router.get(
  '/selcom/balance',
  queryLimiter,
  PaymentController.getSelcomBalance.bind(PaymentController)
);

/**
 * @route   GET /api/payments/lookup
 * @desc    Lookup transaction in Power-Pay database only (for MNO verification)
 * @access  Requires API key with 'payments:lookup' permission
 * @query   reference (required)
 */
router.get(
  '/lookup',
  queryLimiter,
  requirePermission('payments:lookup'),
  PaymentController.lookupTransaction.bind(PaymentController)
);

/**
 * @route   POST /api/payments/callback
 * @desc    Webhook endpoint for MNO to update payment status
 * @access  Requires API key with 'payments:callback' permission
 */
router.post(
  '/callback',
  requirePermission('payments:callback'),
  validate('mnoCallback'),
  PaymentController.paymentCallback.bind(PaymentController)
);

module.exports = router;
