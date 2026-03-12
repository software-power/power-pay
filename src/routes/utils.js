const express = require('express');
const router = express.Router();
const ChecksumController = require('../controllers/ChecksumController');

/**
 * @route   POST /api/utils/checksum/stanbic
 * @desc    Generate Stanbic checksum (SHA256)
 * @access  Public (for testing/integration)
 * 
 * Request Body:
 * {
 *   "token": "your-api-secret-token",
 *   "reference": "SAL00001"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "checksum": "abc123...",
 *     "algorithm": "SHA256(token + MD5(reference))",
 *     "steps": { ... }
 *   }
 * }
 */
router.post('/checksum/stanbic', ChecksumController.generateStanbicChecksum);

/**
 * @route   POST /api/utils/checksum/crdb
 * @desc    Generate CRDB checksum (SHA1)
 * @access  Public (for testing/integration)
 * 
 * Request Body:
 * {
 *   "token": "your-api-secret-token",
 *   "paymentReference": "SAL00001"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "checksum": "abc123...",
 *     "algorithm": "SHA1(token + MD5(paymentReference))",
 *     "steps": { ... }
 *   }
 * }
 */
router.post('/checksum/crdb', ChecksumController.generateCrdbChecksum);

/**
 * @route   POST /api/utils/checksum/both
 * @desc    Generate both Stanbic and CRDB checksums
 * @access  Public (for testing/integration)
 * 
 * Request Body:
 * {
 *   "token": "your-api-secret-token",
 *   "reference": "SAL00001"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "stanbic": { "checksum": "..." },
 *     "crdb": { "checksum": "..." }
 *   }
 * }
 */
router.post('/checksum/both', ChecksumController.generateBothChecksums);

/**
 * @route   POST /api/utils/checksum/stanbic/verify
 * @desc    Verify Stanbic checksum
 * @access  Public (for testing/integration)
 * 
 * Request Body:
 * {
 *   "token": "your-api-secret-token",
 *   "reference": "SAL00001",
 *   "checksum": "abc123..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "valid": true,
 *     "match": "✅ Checksums match"
 *   }
 * }
 */
router.post('/checksum/stanbic/verify', ChecksumController.verifyStanbicChecksum);

/**
 * @route   POST /api/utils/checksum/crdb/verify
 * @desc    Verify CRDB checksum
 * @access  Public (for testing/integration)
 * 
 * Request Body:
 * {
 *   "token": "your-api-secret-token",
 *   "paymentReference": "SAL00001",
 *   "checksum": "abc123..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "valid": true,
 *     "match": "✅ Checksums match"
 *   }
 * }
 */
router.post('/checksum/crdb/verify', ChecksumController.verifyCrdbChecksum);

module.exports = router;
