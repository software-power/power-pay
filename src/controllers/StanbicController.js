const Transaction = require('../models/Transaction');
const ApiKey = require('../models/ApiKey');
const logger = require('../utils/logger');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class StanbicController {
  /**
   * Generate checksum using Stanbic formula
   * Checksum = SHA256(token + MD5(reference))
   */
  generateChecksum(reference, token) {
    // Step 1: MD5 hash of reference
    const md5Hash = crypto
      .createHash('md5')
      .update(reference)
      .digest('hex');
    
    // Step 2: Concatenate token + md5Hash
    const combined = token + md5Hash;
    
    // Step 3: SHA256 hash of combined string
    const checksum = crypto
      .createHash('sha256')
      .update(combined)
      .digest('hex');
    
    return checksum;
  }

  /**
   * Verify checksum
   */
  verifyChecksum(providedChecksum, reference, token) {
    const calculatedChecksum = this.generateChecksum(reference, token);
    return providedChecksum === calculatedChecksum;
  }

  /**
   * Find Stanbic token (single shared token)
   */
  async findStanbicToken() {
    try {
      // Get all active API keys
      const apiKeys = await ApiKey.findAll(100, 0);
      
      // Find one with Stanbic permissions
      const stanbicKey = apiKeys.find(key => {
        if (key.status !== 'ACTIVE') return false;
        
        const permissions = typeof key.permissions === 'string' 
          ? JSON.parse(key.permissions) 
          : key.permissions;
        
        return permissions.includes('stanbic:lookup');
      });
      
      return stanbicKey || null;
    } catch (error) {
      logger.error('Error finding Stanbic token', { error: error.message });
      throw error;
    }
  }

  /**
   * Stanbic Lookup Endpoint
   * Verifies payment reference exists in Power-Pay
   * Authentication: Checksum only (no API key header required)
   */
  async lookup(req, res) {
    const {
      reference,
      institutionId,
      checksum,
      token
    } = req.body;

    try {
      // Log request
      logger.info('Stanbic lookup request', {
        reference,
        institutionId,
        timestamp: new Date().toISOString()
      });

      // Validate required fields - using Stanbic error format
      if (!reference) {
        return res.status(400).json({
          statusCode: 203,
          message: 'Invalid payment reference'
        });
      }

      if (!institutionId) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Missing institutionId'
        });
      }

      if (!token) {
        return res.status(401).json({
          statusCode: 201,
          message: 'Invalid token'
        });
      }

      if (!checksum) {
        return res.status(401).json({
          statusCode: 202,
          message: 'Invalid checksum'
        });
      }

      // Find Stanbic shared token
      const stanbicToken = await this.findStanbicToken();
      
      if (!stanbicToken) {
        logger.error('No Stanbic token configured');
        return res.status(500).json({
          statusCode: 500,
          message: 'System configuration error',
          data: null
        });
      }

      // Verify token matches shared secret
      if (stanbicToken.api_secret !== token) {
        logger.warn('Invalid token in Stanbic lookup', {
          reference,
          institutionId
        });

        return res.status(401).json({
          statusCode: 201,
          message: 'Invalid token'
        });
      }

      // Verify checksum using Stanbic formula: SHA256(token + MD5(reference))
      const isValidChecksum = this.verifyChecksum(
        checksum,
        reference,
        stanbicToken.api_secret
      );

      if (!isValidChecksum) {
        logger.warn('Invalid checksum in Stanbic lookup', {
          reference,
          institutionId,
          providedChecksum: checksum
        });

        return res.status(401).json({
          statusCode: 202,
          message: 'Invalid checksum'
        });
      }

      // Update token usage
      await ApiKey.updateUsage(stanbicToken.api_key);

      // Lookup transaction in database
      const transaction = await Transaction.findByReference(reference);

      if (!transaction) {
        logger.info('Transaction not found in Stanbic lookup', {
          reference,
          institutionId
        });

        return res.status(404).json({
          statusCode: 203,
          message: 'Invalid payment reference'
        });
      }

      // Note: We allow lookup of already paid transactions
      // Stanbic may need to verify payment details even after payment

      // Parse MNO request data
      let mnoRequest = {};
      try {
        mnoRequest = typeof transaction.mno_request === 'string' 
          ? JSON.parse(transaction.mno_request) 
          : transaction.mno_request || {};
      } catch (e) {
        mnoRequest = {};
      }

      // Calculate amount to return based on amount type
      const originalAmount = parseFloat(transaction.amount);
      const amountType = mnoRequest.amount_type || 'FULL';
      let amountToReturn = originalAmount;

      // For FLEXIBLE payments, return remaining amount to pay
      if (amountType === 'FLEXIBLE') {
        const totalPaid = parseFloat(transaction.total_paid || 0);
        const remainingAmount = originalAmount - totalPaid;
        
        // If fully paid, return 0 (or you could return original amount with a flag)
        amountToReturn = remainingAmount > 0 ? remainingAmount : 0;
        
        logger.info('FLEXIBLE payment lookup', {
          reference,
          originalAmount,
          totalPaid,
          remainingAmount: amountToReturn
        });
      }

      // Generate response data
      const responseData = {
        reference: transaction.reference,
        amount: amountToReturn, // Return remaining amount for FLEXIBLE
        institutionId,
        payerName: transaction.payer_name,
        accId: mnoRequest.acc_opt || mnoRequest.accId || '001',
        amountType: amountType,
        currency: transaction.currency || 'TZS',
        paymentDesc: transaction.payment_desc || '',
        payerPhone: transaction.payer_phone || '',
        payerEmail: transaction.payer_email || ''
      };

      // Generate response checksum using same formula
      const responseChecksum = this.generateChecksum(
        transaction.reference,
        stanbicToken.api_secret
      );

      logger.info('Stanbic lookup successful', {
        reference,
        institutionId,
        amount: transaction.amount
      });

      return res.status(200).json({
        statusCode: 200,
        message: 'Verification successful',
        data: {
          ...responseData,
          checksum: responseChecksum
        }
      });

    } catch (error) {
      logger.error('Stanbic lookup error', {
        error: error.message,
        reference,
        institutionId
      });

      return res.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
        data: null
      });
    }
  }

  /**
   * Stanbic Callback Endpoint
   * Receives payment confirmation from Stanbic
   * Authentication: Checksum only (no API key header required)
   */
  async callback(req, res) {
    const {
      reference,
      amount,
      institutionId,
      payerName,
      payType,
      amountType,
      currency,
      paymentDesc,
      payerPhone,
      channel,
      transactionDate,
      transactionId,
      checksum
    } = req.body;

    try {
      // Log callback request
      logger.info('Stanbic callback received', {
        reference,
        amount,
        institutionId,
        transactionId,
        timestamp: new Date().toISOString()
      });

      // Validate required fields - using Stanbic error format
      if (!reference) {
        return res.status(400).json({
          statusCode: 203,
          message: 'Invalid payment reference'
        });
      }

      if (!amount) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Invalid amount'
        });
      }

      if (!institutionId) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Missing institutionId'
        });
      }

      if (!checksum) {
        return res.status(401).json({
          statusCode: 202,
          message: 'Invalid checksum'
        });
      }

      // Find Stanbic shared token
      const stanbicToken = await this.findStanbicToken();
      
      if (!stanbicToken) {
        logger.error('No Stanbic token configured');
        return res.status(500).json({
          statusCode: 500,
          message: 'System configuration error',
          data: null
        });
      }

      // Verify checksum using Stanbic formula: SHA256(token + MD5(reference))
      const isValidChecksum = this.verifyChecksum(
        checksum,
        reference,
        stanbicToken.api_secret
      );

      if (!isValidChecksum) {
        logger.warn('Invalid checksum in Stanbic callback', {
          reference,
          institutionId,
          providedChecksum: checksum
        });

        return res.status(401).json({
          statusCode: 202,
          message: 'Invalid checksum'
        });
      }

      // Update token usage
      await ApiKey.updateUsage(stanbicToken.api_key);

      // Find transaction
      const transaction = await Transaction.findByReference(reference);

      if (!transaction) {
        logger.warn('Transaction not found in Stanbic callback', {
          reference,
          institutionId
        });

        return res.status(404).json({
          statusCode: 203,
          message: 'Invalid payment reference'
        });
      }

      // Check if already paid - duplicate transaction
      if (transaction.status === 'SUCCESS' && transaction.receipt_number) {
        logger.info('Duplicate transaction in Stanbic callback', {
          reference,
          institutionId,
          existingReceipt: transaction.receipt_number
        });

        // Return error 207 - transaction already paid
        return res.status(400).json({
          statusCode: 207,
          message: 'Transaction reference number already paid (When posting)'
        });
      }

      // Parse MNO request data to get amount type
      let mnoRequest = {};
      try {
        mnoRequest = typeof transaction.mno_request === 'string' 
          ? JSON.parse(transaction.mno_request) 
          : transaction.mno_request || {};
      } catch (e) {
        mnoRequest = {};
      }

      // Determine amount type from transaction data or request body
      const transactionAmountType = mnoRequest.amount_type || req.body.amountType || 'FULL';
      const expectedAmount = parseFloat(transaction.amount);
      const paidAmount = parseFloat(amount);

      // Validate amount based on amount type
      if (transactionAmountType === 'FULL' || transactionAmountType === 'FIXED') {
        // FULL/FIXED: Must pay exact amount
        if (paidAmount !== expectedAmount) {
          logger.warn('Amount mismatch for FULL/FIXED payment', {
            reference,
            expectedAmount,
            paidAmount,
            amountType: transactionAmountType
          });

          return res.status(400).json({
            statusCode: 400,
            message: `Invalid amount. Expected ${expectedAmount}, received ${paidAmount}. Payment type ${transactionAmountType} requires exact amount.`
          });
        }
      } else if (transactionAmountType === 'FLEXIBLE') {
        // FLEXIBLE: Can pay partial amounts
        if (paidAmount > expectedAmount) {
          logger.warn('Overpayment for FLEXIBLE payment', {
            reference,
            expectedAmount,
            paidAmount
          });

          return res.status(400).json({
            statusCode: 400,
            message: `Invalid amount. Cannot pay more than ${expectedAmount}.`
          });
        }

        if (paidAmount <= 0) {
          return res.status(400).json({
            statusCode: 400,
            message: 'Invalid amount. Amount must be greater than 0.'
          });
        }

        // For FLEXIBLE payments, check if this is a partial payment
        const totalPaid = paidAmount; // In future, sum all previous payments
        const isFullyPaid = totalPaid >= expectedAmount;

        logger.info('FLEXIBLE payment received', {
          reference,
          paidAmount,
          expectedAmount,
          totalPaid,
          isFullyPaid
        });

        // If not fully paid, mark as PARTIAL (you may need to add this status)
        // For now, only mark SUCCESS if fully paid
        if (!isFullyPaid) {
          logger.info('Partial payment received - not marking as SUCCESS', {
            reference,
            paidAmount,
            expectedAmount,
            remaining: expectedAmount - totalPaid
          });

          // You could create a PARTIAL status or track partial payments
          // For now, we'll process it but log as partial
        }
      }

      // Generate receipt ID
      const receipt = uuidv4();
      const receiptDate = new Date().toISOString();

      // Calculate total paid (including this payment)
      const previousTotalPaid = parseFloat(transaction.total_paid || 0);
      const newTotalPaid = previousTotalPaid + paidAmount;
      const isFullyPaid = newTotalPaid >= expectedAmount;

      // Build partial payments array
      let partialPayments = [];
      try {
        partialPayments = typeof transaction.partial_payments === 'string'
          ? JSON.parse(transaction.partial_payments)
          : transaction.partial_payments || [];
      } catch (e) {
        partialPayments = [];
      }

      // Add this payment to partial payments array
      partialPayments.push({
        receipt: receipt,
        amount: paidAmount,
        transactionId: transactionId,
        transactionDate: transactionDate || receiptDate,
        payerName: payerName,
        channel: channel
      });

      // Determine final status based on amount type and payment
      let finalStatus = 'SUCCESS';
      if (transactionAmountType === 'FLEXIBLE' && !isFullyPaid) {
        finalStatus = 'PARTIAL'; // Partial payment received
      }

      // Update transaction
      const updateData = {
        status: finalStatus,
        receipt_number: receipt,
        payment_date: transactionDate || receiptDate,
        payer_name: payerName || transaction.payer_name,
        payer_phone: payerPhone || transaction.payer_phone,
        mno_provider: 'STANBIC',
        total_paid: newTotalPaid,
        payment_count: partialPayments.length,
        is_fully_paid: isFullyPaid,
        partial_payments: JSON.stringify(partialPayments),
        mno_response: {
          stanbic_transaction_id: transactionId,
          amount: paidAmount,
          total_paid: newTotalPaid,
          is_fully_paid: isFullyPaid,
          amount_type: transactionAmountType,
          institutionId,
          payType,
          currency,
          channel,
          transactionDate,
          callback_received_at: receiptDate
        }
      };

      const updated = await Transaction.updateFromCallback(
        reference,
        updateData
      );

      if (!updated) {
        logger.error('Failed to update transaction in Stanbic callback', {
          reference,
          institutionId
        });

        return res.status(500).json({
          statusCode: 500,
          message: 'Failed to update transaction'
        });
      }

      logger.info('Stanbic callback processed successfully', {
        reference,
        receipt,
        amount: paidAmount,
        totalPaid: newTotalPaid,
        isFullyPaid,
        amountType: transactionAmountType,
        institutionId,
        transactionId
      });

      return res.status(200).json({
        statusCode: 200,
        message: isFullyPaid 
          ? 'Payment processed successfully' 
          : 'Partial payment processed successfully',
        data: {
          reference,
          receipt,
          receiptDate,
          amountPaid: paidAmount,
          totalPaid: newTotalPaid,
          expectedAmount: expectedAmount,
          isFullyPaid: isFullyPaid,
          amountType: transactionAmountType,
          remainingAmount: isFullyPaid ? 0 : (expectedAmount - newTotalPaid)
        }
      });

    } catch (error) {
      logger.error('Stanbic callback error', {
        error: error.message,
        reference,
        institutionId
      });

      return res.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
        data: null
      });
    }
  }
}

module.exports = new StanbicController();
