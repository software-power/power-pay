const StanbicService = require('../services/StanbicService');
const SelcomService = require('../services/SelcomService');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class PaymentController {
  /**
   * Verify payment (biller verification)
   */
  async verifyPayment(req, res) {
    const { reference, mno_provider, client_system } = req.body;

    try {
      // Generate transaction ID
      const transactionId = `TXN-${uuidv4()}`;

      // Create transaction record
      const transaction = await Transaction.create({
        transaction_id: transactionId,
        reference,
        mno_provider: mno_provider.toUpperCase(),
        transaction_type: 'VERIFICATION',
        client_system: client_system || 'API',
        client_reference: req.body.client_reference,
        mno_request: req.body,
        status: 'PROCESSING'
      });

      let result;

      // Route to appropriate MNO
      if (mno_provider.toUpperCase() === 'STANBIC') {
        result = await StanbicService.verifyBiller(reference);
      } else if (mno_provider.toUpperCase() === 'SELCOM') {
        const utilityCode = req.body.utility_code || 'GEPG';
        result = await SelcomService.utilityLookup(utilityCode, reference, transactionId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid MNO provider. Supported: STANBIC, SELCOM'
        });
      }

      // Update transaction with response
      await Transaction.updateMnoResponse(transactionId, {
        mno_response: result.data,
        mno_status_code: result.statusCode || result.resultcode,
        status: result.success ? 'SUCCESS' : 'FAILED',
        error_message: result.success ? null : result.message
      });

      // Format response
      const response = {
        success: result.success,
        transaction_id: transactionId,
        reference,
        mno_provider: mno_provider.toUpperCase(),
        message: result.message,
        data: result.data?.data || result.data
      };

      return res.status(result.success ? 200 : 400).json(response);

    } catch (error) {
      logger.error('Verify Payment Error', {
        error: error.message,
        reference,
        mno_provider
      });

      // Handle duplicate reference error
      if (error.code === 'DUPLICATE_REFERENCE') {
        return res.status(409).json({
          success: false,
          message: 'Duplicate reference number',
          error: 'This reference has already been used. Please use a unique reference number.',
          reference: error.reference
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Process payment
   */
  async processPayment(req, res) {
    const {
      reference,
      amount,
      mno_provider,
      client_system,
      payer_name,
      payer_phone,
      payer_email,
      payment_desc,
      channel,
      bypass_mno  // NEW: If true, don't send to MNO, just save in database
    } = req.body;

    try {
      // Generate transaction ID
      const transactionId = `TXN-${uuidv4()}`;

      // Create transaction record
      const transaction = await Transaction.create({
        transaction_id: transactionId,
        reference,
        control_number: req.body.control_number || reference,
        mno_provider: mno_provider.toUpperCase(),
        transaction_type: 'PAYMENT',
        client_system: client_system || 'API',
        client_reference: req.body.client_reference,
        amount,
        currency: req.body.currency || 'TZS',
        payer_name,
        payer_phone,
        payer_email,
        payment_desc,
        channel: channel || 'API',
        transaction_date: new Date(),
        mno_request: req.body,
        status: bypass_mno ? 'PENDING' : 'PROCESSING'
      });

      // If bypass_mno is true, don't send to MNO
      if (bypass_mno) {
        logger.info('Payment created without MNO posting (bypass enabled)', {
          transaction_id: transactionId,
          reference,
          amount,
          mno_provider: mno_provider.toUpperCase()
        });

        return res.status(200).json({
          success: true,
          transaction_id: transactionId,
          reference,
          amount,
          mno_provider: mno_provider.toUpperCase(),
          message: 'Payment record created. MNO posting bypassed.',
          status: 'PENDING',
          note: 'Transaction saved in database. No request sent to MNO. Waiting for callback update.',
          data: {
            transaction_id: transactionId,
            reference,
            amount,
            currency: req.body.currency || 'TZS',
            payer_name,
            created_at: new Date().toISOString()
          }
        });
      }

      // Normal flow - send to MNO
      let result;

      // Route to appropriate MNO
      if (mno_provider.toUpperCase() === 'STANBIC') {
        const paymentData = {
          reference,
          amount,
          payerName: payer_name,
          payerPhone: payer_phone,
          payerEmail: payer_email,
          paymentDesc: payment_desc,
          channel: channel || 'API',
          transactionId,
          transactionDate: new Date().toISOString(),
          amountType: req.body.amount_type || 'FULL',
          currency: req.body.currency || 'TZS',
          accOpt: req.body.acc_opt || '001'
        };

        result = await StanbicService.postPayment(paymentData);

        // Update transaction with response
        await Transaction.updateMnoResponse(transactionId, {
          mno_response: result.data,
          mno_status_code: result.statusCode,
          status: result.success ? 'SUCCESS' : 'FAILED',
          receipt_number: result.receipt,
          receipt_date: result.receiptDate ? new Date(result.receiptDate) : null,
          error_message: result.success ? null : result.message
        });

      } else if (mno_provider.toUpperCase() === 'SELCOM') {
        const paymentData = {
          transid: transactionId,
          utilitycode: req.body.utility_code || 'GEPG',
          utilityref: reference,
          amount,
          msisdn: payer_phone || ''
        };

        result = await SelcomService.utilityPayment(paymentData);

        // Update transaction with response
        await Transaction.updateMnoResponse(transactionId, {
          mno_response: result.data,
          mno_status_code: result.resultcode,
          status: SelcomService.getTransactionStatus(result.resultcode),
          receipt_number: result.receipt || result.reference,
          error_message: result.success ? null : result.message
        });

      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid MNO provider. Supported: STANBIC, SELCOM'
        });
      }

      // Format response
      const response = {
        success: result.success,
        transaction_id: transactionId,
        reference,
        amount,
        mno_provider: mno_provider.toUpperCase(),
        message: result.message,
        receipt: result.receipt || result.reference,
        receipt_date: result.receiptDate,
        data: result.data
      };

      return res.status(result.success ? 200 : 400).json(response);

    } catch (error) {
      logger.error('Process Payment Error', {
        error: error.message,
        reference,
        mno_provider,
        amount
      });

      // Handle duplicate reference error
      if (error.code === 'DUPLICATE_REFERENCE') {
        return res.status(409).json({
          success: false,
          message: 'Duplicate reference number',
          error: 'This reference has already been used. Please use a unique reference number.',
          reference: error.reference
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Query transaction status
   */
  async queryTransaction(req, res) {
    const { transaction_id } = req.params;

    try {
      // Find transaction in database
      const transaction = await Transaction.findByTransactionId(transaction_id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // If transaction is in final state, return from database
      if (['SUCCESS', 'FAILED'].includes(transaction.status)) {
        return res.status(200).json({
          success: true,
          transaction_id: transaction.transaction_id,
          reference: transaction.reference,
          mno_provider: transaction.mno_provider,
          status: transaction.status,
          amount: transaction.amount,
          receipt: transaction.receipt_number,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
        });
      }

      // Query MNO for latest status
      let result;

      if (transaction.mno_provider === 'STANBIC') {
        // Stanbic doesn't have a query endpoint in the provided docs
        // Return database status
        result = {
          success: transaction.status === 'SUCCESS',
          status: transaction.status,
          message: transaction.error_message || 'Transaction in progress'
        };

      } else if (transaction.mno_provider === 'SELCOM') {
        result = await SelcomService.queryStatus(transaction_id);

        // Update transaction status
        if (result.success) {
          await Transaction.updateMnoResponse(transaction_id, {
            mno_response: result.data,
            mno_status_code: result.resultcode,
            status: SelcomService.getTransactionStatus(result.resultcode),
            error_message: result.message
          });
        }
      }

      return res.status(200).json({
        success: result.success,
        transaction_id,
        reference: transaction.reference,
        mno_provider: transaction.mno_provider,
        status: result.status || SelcomService.getTransactionStatus(result.resultcode),
        amount: transaction.amount,
        message: result.message
      });

    } catch (error) {
      logger.error('Query Transaction Error', {
        error: error.message,
        transaction_id
      });

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get transaction history for a client system
   */
  async getTransactionHistory(req, res) {
    const { client_system } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    try {
      const transactions = await Transaction.findByClientSystem(
        client_system,
        parseInt(limit),
        parseInt(offset)
      );

      return res.status(200).json({
        success: true,
        client_system,
        count: transactions.length,
        transactions: transactions.map(tx => ({
          transaction_id: tx.transaction_id,
          reference: tx.reference,
          mno_provider: tx.mno_provider,
          transaction_type: tx.transaction_type,
          amount: tx.amount,
          status: tx.status,
          receipt: tx.receipt_number,
          created_at: tx.created_at
        }))
      });

    } catch (error) {
      logger.error('Get Transaction History Error', {
        error: error.message,
        client_system
      });

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get Selcom balance
   */
  async getSelcomBalance(req, res) {
    try {
      const transId = `BAL-${uuidv4()}`;
      const result = await SelcomService.getBalance(transId);

      return res.status(result.success ? 200 : 400).json({
        success: result.success,
        balance: result.balance,
        message: result.message
      });

    } catch (error) {
      logger.error('Get Selcom Balance Error', {
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Lookup transaction in Power-Pay database only (for MNO to verify)
   * Does NOT contact external MNO APIs
   * Searches by reference number only
   */
  async lookupTransaction(req, res) {
    const { reference } = req.query;

    try {
      // Reference is required
      if (!reference) {
        return res.status(400).json({
          success: false,
          message: 'Reference number is required'
        });
      }

      // Search by reference in local database only
      const transaction = await Transaction.findByReference(reference);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found in Power-Pay database',
          reference
        });
      }

      // Return transaction details
      return res.status(200).json({
        success: true,
        message: 'Transaction found',
        data: {
          transaction_id: transaction.transaction_id,
          reference: transaction.reference,
          amount: transaction.amount,
          currency: transaction.currency,
          payer_name: transaction.payer_name,
          payer_phone: transaction.payer_phone,
          payer_email: transaction.payer_email,
          payment_desc: transaction.payment_desc,
          status: transaction.status,
          mno_provider: transaction.mno_provider,
          client_system: transaction.client_system,
          receipt_number: transaction.receipt_number,
          payment_date: transaction.payment_date,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
        }
      });

    } catch (error) {
      logger.error('Lookup Transaction Error', {
        error: error.message,
        reference
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to lookup transaction',
        error: error.message
      });
    }
  }

  /**
   * Webhook/Callback endpoint for MNO to update payment status
   * Called by MNO after customer completes payment
   */
  async paymentCallback(req, res) {
    const {
      reference,
      amount,
      receipt_number,
      status,
      payment_date,
      payer_name,
      payer_phone,
      mno_provider,
      checksum,
      callback_data
    } = req.body;

    try {
      // Validate checksum if provided (for security)
      if (checksum) {
        // TODO: Implement checksum validation based on MNO requirements
        // const isValid = await this.validateChecksum(req.body, checksum);
        // if (!isValid) {
        //   return res.status(401).json({ success: false, message: 'Invalid checksum' });
        // }
      }

      // Reference is required
      if (!reference) {
        return res.status(400).json({
          success: false,
          message: 'Reference number is required'
        });
      }

      // Find transaction by reference
      const transaction = await Transaction.findByReference(reference);

      if (!transaction) {
        logger.warn('Payment callback for non-existent transaction', {
          reference
        });

        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          reference
        });
      }

      // Update transaction with callback data
      const updateData = {
        status: status || 'SUCCESS',
        receipt_number: receipt_number || null,
        payment_date: payment_date || new Date(),
        payer_name: payer_name || transaction.payer_name,
        payer_phone: payer_phone || transaction.payer_phone,
        mno_provider: mno_provider || transaction.mno_provider,
        mno_response: callback_data || req.body
      };

      const updated = await Transaction.updateFromCallback(
        reference,
        updateData
      );

      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update transaction'
        });
      }

      logger.info('Payment callback processed', {
        transaction_id: transaction.transaction_id,
        reference: reference,
        status: status,
        receipt: receipt_number
      });

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Payment callback processed successfully',
        transaction_id: transaction.transaction_id,
        reference: reference,
        status: status || 'SUCCESS'
      });

    } catch (error) {
      logger.error('Payment Callback Error', {
        error: error.message,
        body: req.body
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to process payment callback',
        error: error.message
      });
    }
  }

}

module.exports = new PaymentController();
