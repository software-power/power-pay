const crypto = require('crypto');
const logger = require('../utils/logger');

class ChecksumController {
  /**
   * Generate Stanbic Checksum
   * Formula: SHA256(token + MD5(reference))
   * 
   * @route POST /api/utils/checksum/stanbic
   */
  generateStanbicChecksum(req, res) {
    try {
      const { token, reference } = req.body;

      if (!token || !reference) {
        return res.status(400).json({
          success: false,
          message: 'Both token and reference are required'
        });
      }

      // Step 1: Calculate MD5 of reference
      const md5Hash = crypto
        .createHash('md5')
        .update(reference)
        .digest('hex');

      // Step 2: Concatenate token + md5Hash
      const combined = token + md5Hash;

      // Step 3: Calculate SHA256 of combined string
      const checksum = crypto
        .createHash('sha256')
        .update(combined)
        .digest('hex');

      logger.info('Stanbic checksum generated', {
        reference,
        checksum: checksum.substring(0, 10) + '...'
      });

      return res.status(200).json({
        success: true,
        data: {
          reference,
          token_preview: token.substring(0, 10) + '...',
          md5_hash: md5Hash,
          checksum: checksum,
          algorithm: 'SHA256(token + MD5(reference))',
          length: checksum.length,
          steps: {
            step1: `MD5("${reference}") = ${md5Hash}`,
            step2: `token + md5Hash = "${token.substring(0, 10)}..." + "${md5Hash}"`,
            step3: `SHA256(combined) = ${checksum}`
          }
        }
      });

    } catch (error) {
      logger.error('Error generating Stanbic checksum', {
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to generate checksum',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Generate CRDB Checksum
   * Formula: SHA1(token + MD5(paymentReference))
   * 
   * @route POST /api/utils/checksum/crdb
   */
  generateCrdbChecksum(req, res) {
    try {
      const { token, paymentReference } = req.body;

      if (!token || !paymentReference) {
        return res.status(400).json({
          success: false,
          message: 'Both token and paymentReference are required'
        });
      }

      // Step 1: Calculate MD5 of payment reference
      const md5Hash = crypto
        .createHash('md5')
        .update(paymentReference)
        .digest('hex');

      // Step 2: Concatenate token + md5Hash
      const combined = token + md5Hash;

      // Step 3: Calculate SHA1 of combined string
      const checksum = crypto
        .createHash('sha1')
        .update(combined)
        .digest('hex');

      logger.info('CRDB checksum generated', {
        paymentReference,
        checksum: checksum.substring(0, 10) + '...'
      });

      return res.status(200).json({
        success: true,
        data: {
          paymentReference,
          token_preview: token.substring(0, 10) + '...',
          md5_hash: md5Hash,
          checksum: checksum,
          algorithm: 'SHA1(token + MD5(paymentReference))',
          length: checksum.length,
          steps: {
            step1: `MD5("${paymentReference}") = ${md5Hash}`,
            step2: `token + md5Hash = "${token.substring(0, 10)}..." + "${md5Hash}"`,
            step3: `SHA1(combined) = ${checksum}`
          }
        }
      });

    } catch (error) {
      logger.error('Error generating CRDB checksum', {
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to generate checksum',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Verify Stanbic Checksum
   * 
   * @route POST /api/utils/checksum/stanbic/verify
   */
  verifyStanbicChecksum(req, res) {
    try {
      const { token, reference, checksum } = req.body;

      if (!token || !reference || !checksum) {
        return res.status(400).json({
          success: false,
          message: 'token, reference, and checksum are required'
        });
      }

      // Calculate expected checksum
      const md5Hash = crypto
        .createHash('md5')
        .update(reference)
        .digest('hex');

      const combined = token + md5Hash;

      const calculatedChecksum = crypto
        .createHash('sha256')
        .update(combined)
        .digest('hex');

      const isValid = calculatedChecksum === checksum;

      return res.status(200).json({
        success: true,
        data: {
          valid: isValid,
          provided_checksum: checksum,
          calculated_checksum: calculatedChecksum,
          match: isValid ? '✅ Checksums match' : '❌ Checksums do not match',
          algorithm: 'SHA256(token + MD5(reference))'
        }
      });

    } catch (error) {
      logger.error('Error verifying Stanbic checksum', {
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to verify checksum',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Verify CRDB Checksum
   * 
   * @route POST /api/utils/checksum/crdb/verify
   */
  verifyCrdbChecksum(req, res) {
    try {
      const { token, paymentReference, checksum } = req.body;

      if (!token || !paymentReference || !checksum) {
        return res.status(400).json({
          success: false,
          message: 'token, paymentReference, and checksum are required'
        });
      }

      // Calculate expected checksum
      const md5Hash = crypto
        .createHash('md5')
        .update(paymentReference)
        .digest('hex');

      const combined = token + md5Hash;

      const calculatedChecksum = crypto
        .createHash('sha1')
        .update(combined)
        .digest('hex');

      const isValid = calculatedChecksum === checksum;

      return res.status(200).json({
        success: true,
        data: {
          valid: isValid,
          provided_checksum: checksum,
          calculated_checksum: calculatedChecksum,
          match: isValid ? '✅ Checksums match' : '❌ Checksums do not match',
          algorithm: 'SHA1(token + MD5(paymentReference))'
        }
      });

    } catch (error) {
      logger.error('Error verifying CRDB checksum', {
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to verify checksum',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Generate both checksums at once
   * 
   * @route POST /api/utils/checksum/both
   */
  generateBothChecksums(req, res) {
    try {
      const { token, reference } = req.body;

      if (!token || !reference) {
        return res.status(400).json({
          success: false,
          message: 'Both token and reference are required'
        });
      }

      // Calculate MD5 of reference (same for both)
      const md5Hash = crypto
        .createHash('md5')
        .update(reference)
        .digest('hex');

      const combined = token + md5Hash;

      // Stanbic: SHA256
      const stanbicChecksum = crypto
        .createHash('sha256')
        .update(combined)
        .digest('hex');

      // CRDB: SHA1
      const crdbChecksum = crypto
        .createHash('sha1')
        .update(combined)
        .digest('hex');

      return res.status(200).json({
        success: true,
        data: {
          reference,
          token_preview: token.substring(0, 10) + '...',
          md5_hash: md5Hash,
          stanbic: {
            checksum: stanbicChecksum,
            algorithm: 'SHA256(token + MD5(reference))',
            length: 64
          },
          crdb: {
            checksum: crdbChecksum,
            algorithm: 'SHA1(token + MD5(reference))',
            length: 40
          },
          steps: {
            step1: `MD5("${reference}") = ${md5Hash}`,
            step2: `Concatenate: token + md5Hash`,
            step3_stanbic: `SHA256(combined) = ${stanbicChecksum}`,
            step3_crdb: `SHA1(combined) = ${crdbChecksum}`
          }
        }
      });

    } catch (error) {
      logger.error('Error generating checksums', {
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to generate checksums',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }
}

module.exports = new ChecksumController();
