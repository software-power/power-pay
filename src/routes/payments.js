const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const { validate } = require('../middleware/validation');
const { paymentLimiter, queryLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment/biller information
 * @access  Public
 */
router.post(
  '/verify',
  paymentLimiter,
  validate('verifyPayment'),
  PaymentController.verifyPayment.bind(PaymentController)
);

/**
 * @route   POST /api/payments/process
 * @desc    Process payment transaction
 * @access  Public
 */
router.post(
  '/process',
  paymentLimiter,
  validate('processPayment'),
  PaymentController.processPayment.bind(PaymentController)
);

/**
 * @route   GET /api/payments/status/:transaction_id
 * @desc    Query transaction status
 * @access  Public
 */
router.get(
  '/status/:transaction_id',
  queryLimiter,
  PaymentController.queryTransaction.bind(PaymentController)
);

/**
 * @route   GET /api/payments/history/:client_system
 * @desc    Get transaction history for a client system
 * @access  Public
 */
router.get(
  '/history/:client_system',
  queryLimiter,
  PaymentController.getTransactionHistory.bind(PaymentController)
);

/**
 * @route   GET /api/payments/selcom/balance
 * @desc    Get Selcom float balance
 * @access  Public
 */
router.get(
  '/selcom/balance',
  queryLimiter,
  PaymentController.getSelcomBalance.bind(PaymentController)
);

module.exports = router;
