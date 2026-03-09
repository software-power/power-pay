const express = require('express');
const router = express.Router();
const CrdbController = require('../controllers/CrdbController');
const { authenticateCrdb } = require('../middleware/crdbAuth');
const { validate } = require('../middleware/validation');
const { queryLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/crdb/verify
 * @desc    Verification endpoint - CRDB calls this to verify bill details
 * @access  Public (with token + checksum authentication)
 * 
 * Request Body:
 * {
 *   "paymentReference": "2001234423",
 *   "token": "463917799b220d99f68b84419570267eef6a34b181c47",
 *   "checksum": "de809c4f9f3f05f20e2b6c5fc3312423ac32b783",
 *   "institutionID": 8008
 * }
 * 
 * Response:
 * {
 *   "status": 200,
 *   "statusDesc": "success",
 *   "data": {
 *     "payerName": "Michael Shaka",
 *     "amount": 1200000,
 *     "amountType": "FLEXIBLE",
 *     "currency": "TZS",
 *     "paymentReference": "2001234423",
 *     "paymentType": "90",
 *     "paymentDesc": "Tuition Fee",
 *     "payerID": "E300/90"
 *   }
 * }
 */
router.post('/verify',
  queryLimiter,
  authenticateCrdb,
  validate('crdbVerify'),
  CrdbController.verify
);

/**
 * @route   POST /api/crdb/callback
 * @desc    Payment posting endpoint - CRDB calls this after successful payment
 * @access  Public (with token + checksum authentication)
 * 
 * Request Body:
 * {
 *   "payerName": "Michael Shaka",
 *   "amount": 1200000,
 *   "amountType": "FLEXIBLE",
 *   "currency": "TZS",
 *   "paymentReference": "2001234423",
 *   "paymentType": "90",
 *   "payerMobile": "0787000000",
 *   "paymentDesc": "Tuition Fee",
 *   "payerID": "E300/90",
 *   "transactionRef": "FA435553423355",
 *   "transactionChannel": "MOBILEAPP",
 *   "transactionDate": "2017-06-30 14:48:42",
 *   "token": "463917799b220d94418f70267eef6a34b181c47",
 *   "checksum": "de809c4f9f3f05f20e2b63ac32b783",
 *   "institutionID": 8008
 * }
 * 
 * Response:
 * {
 *   "status": 200,
 *   "statusDesc": "success",
 *   "data": {
 *     "receipt": "AC998323534"
 *   }
 * }
 */
router.post('/callback',
  queryLimiter,
  authenticateCrdb,
  validate('crdbCallback'),
  CrdbController.callback
);

module.exports = router;
