const crypto = require('crypto');
const logger = require('../utils/logger');

class CrdbService {
  /**
   * Calculate CRDB checksum
   * Formula: SHA1(token + MD5(paymentReference))
   * 
   * @param {string} token - API token
   * @param {string} paymentReference - Payment reference number
   * @returns {string} - Checksum hash
   */
  static calculateChecksum(token, paymentReference) {
    try {
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

      return checksum;
    } catch (error) {
      logger.error('CRDB Checksum Calculation Error', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate CRDB checksum
   * 
   * @param {string} token - API token
   * @param {string} paymentReference - Payment reference number
   * @param {string} receivedChecksum - Checksum from CRDB
   * @returns {boolean} - True if valid
   */
  static validateChecksum(token, paymentReference, receivedChecksum) {
    try {
      const calculatedChecksum = this.calculateChecksum(token, paymentReference);
      
      logger.info('CRDB Checksum Validation', {
        paymentReference,
        calculated: calculatedChecksum,
        received: receivedChecksum,
        match: calculatedChecksum === receivedChecksum
      });

      return calculatedChecksum === receivedChecksum;
    } catch (error) {
      logger.error('CRDB Checksum Validation Error', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Validate amount based on amount type
   * 
   * @param {number} expectedAmount - Expected amount
   * @param {number} paidAmount - Amount paid
   * @param {string} amountType - FIXED, FLEXIBLE, or FULL
   * @returns {object} - { valid: boolean, message: string }
   */
  static validateAmount(expectedAmount, paidAmount, amountType) {
    const expected = parseFloat(expectedAmount);
    const paid = parseFloat(paidAmount);

    switch (amountType) {
      case 'FIXED':
        // Must pay exact amount
        if (paid !== expected) {
          return {
            valid: false,
            message: `Exact amount required. Expected: ${expected}, Received: ${paid}`
          };
        }
        return { valid: true, message: 'Amount valid' };

      case 'FLEXIBLE':
        // Can pay less or exact (no overpayment)
        if (paid > expected) {
          return {
            valid: false,
            message: `Amount exceeds expected. Maximum: ${expected}, Received: ${paid}`
          };
        }
        if (paid <= 0) {
          return {
            valid: false,
            message: 'Amount must be greater than zero'
          };
        }
        return { valid: true, message: 'Amount valid' };

      case 'FULL':
        // Can pay more or exact (no underpayment)
        if (paid < expected) {
          return {
            valid: false,
            message: `Insufficient amount. Minimum: ${expected}, Received: ${paid}`
          };
        }
        return { valid: true, message: 'Amount valid' };

      default:
        return {
          valid: false,
          message: `Invalid amount type: ${amountType}`
        };
    }
  }

  /**
   * Generate receipt number
   * 
   * @param {string} prefix - Receipt prefix (default: CRDB)
   * @returns {string} - Receipt number
   */
  static generateReceipt(prefix = 'CRDB') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

module.exports = CrdbService;
