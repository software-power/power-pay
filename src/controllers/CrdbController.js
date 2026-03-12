const CrdbService = require('../services/CrdbService');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

class CrdbController {
  /**
   * Verification Endpoint (HTTP POST)
   * CRDB calls this to verify bill details before payment
   * 
   * @route POST /api/crdb/verify
   * @access API Key + Token + Checksum
   */
  async verify(req, res) {
    try {
      const { paymentReference, token, checksum, institutionID } = req.body;

      logger.info('CRDB Verify Request', {
        paymentReference,
        institutionID,
        ip: req.ip
      });

      // Find transaction by reference
      const transaction = await Transaction.findByReference(paymentReference);

      if (!transaction) {
        return res.status(200).json({
          status: 204,
          statusDesc: 'Invalid payment reference number',
          data: null
        });
      }

      // Check if already paid (for FIXED amount type only)
      if (transaction.amount_type === 'FIXED' && transaction.status === 'SUCCESS') {
        return res.status(200).json({
          status: 203,
          statusDesc: 'Payment reference number already paid',
          data: null
        });
      }

      // Check if expired (optional - add expiry logic if needed)
      // if (transaction.expiry_date && new Date() > new Date(transaction.expiry_date)) {
      //   return res.status(200).json({
      //     status: 205,
      //     statusDesc: 'Payment reference number has expired',
      //     data: null
      //   });
      // }

      // Calculate amount to return based on amount type
      const originalAmount = parseFloat(transaction.amount);
      const amountType = transaction.amount_type || 'FIXED';
      let amountToReturn = originalAmount;

      // For FLEXIBLE payments, return remaining amount to pay
      if (amountType === 'FLEXIBLE') {
        const totalPaid = parseFloat(transaction.total_paid || 0);
        const remainingAmount = originalAmount - totalPaid;
        
        // If fully paid, return 0
        amountToReturn = remainingAmount > 0 ? remainingAmount : 0;
        
        logger.info('CRDB FLEXIBLE payment verification', {
          paymentReference,
          originalAmount,
          totalPaid,
          remainingAmount: amountToReturn
        });
      }

      // Return verification response
      return res.status(200).json({
        status: 200,
        statusDesc: 'success',
        data: {
          payerName: transaction.payer_name,
          amount: amountToReturn, // Return remaining amount for FLEXIBLE
          amountType: amountType, // FIXED, FLEXIBLE, FULL
          currency: transaction.currency || 'TZS',
          paymentReference: transaction.reference,
          paymentType: transaction.transaction_type || null,
          paymentDesc: transaction.payment_desc || null,
          payerID: transaction.account_id || null
        }
      });

    } catch (error) {
      logger.error('CRDB Verify Error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        status: 500,
        statusDesc: 'Internal server error',
        data: null
      });
    }
  }

  /**
   * Payment Posting Endpoint (HTTP POST)
   * CRDB calls this after successful payment
   * 
   * @route POST /api/crdb/callback
   * @access API Key + Token + Checksum
   */
  async callback(req, res) {
    try {
      const {
        payerName,
        amount,
        amountType,
        currency,
        paymentReference,
        paymentType,
        paymentDesc,
        payerID,
        transactionRef,
        transactionChannel,
        transactionDate,
        payerMobile
      } = req.body;

      logger.info('CRDB Callback Request', {
        paymentReference,
        amount,
        transactionRef,
        transactionChannel
      });

      // Find transaction
      const transaction = await Transaction.findByReference(paymentReference);

      if (!transaction) {
        return res.status(200).json({
          status: 204,
          statusDesc: 'Invalid payment reference number',
          data: null
        });
      }

      // Check for duplicate payment
      if (transaction.status === 'SUCCESS' && transaction.receipt_number) {
        return res.status(200).json({
          status: 206,
          statusDesc: 'Duplicate entry',
          data: {
            receipt: transaction.receipt_number
          }
        });
      }

      // Validate amount based on amount type
      const expectedAmount = parseFloat(transaction.amount);
      const paidAmount = parseFloat(amount);
      const transactionAmountType = transaction.amount_type || amountType || 'FIXED';

      let paymentStatus = 'SUCCESS';
      let totalPaid = paidAmount;
      let paymentCount = 1;
      let isFullyPaid = false;
      let partialPayments = [];

      // Handle different amount types
      if (transactionAmountType === 'FIXED') {
        // Must pay exact amount
        if (paidAmount !== expectedAmount) {
          return res.status(200).json({
            status: 400,
            statusDesc: `Amount mismatch. Expected: ${expectedAmount}, Received: ${paidAmount}`,
            data: null
          });
        }
        isFullyPaid = true;
      } else if (transactionAmountType === 'FLEXIBLE') {
        // Can pay less or exact (partial payments allowed)
        if (paidAmount > expectedAmount) {
          return res.status(200).json({
            status: 400,
            statusDesc: `Amount exceeds expected. Expected: ${expectedAmount}, Received: ${paidAmount}`,
            data: null
          });
        }

        // Handle partial payments
        const existingTotalPaid = parseFloat(transaction.total_paid || 0);
        totalPaid = existingTotalPaid + paidAmount;
        paymentCount = (transaction.payment_count || 0) + 1;
        isFullyPaid = totalPaid >= expectedAmount;
        paymentStatus = isFullyPaid ? 'SUCCESS' : 'PARTIAL';

        // Parse existing partial payments
        let existingPayments = [];
        if (transaction.partial_payments) {
          try {
            existingPayments = typeof transaction.partial_payments === 'string' 
              ? JSON.parse(transaction.partial_payments)
              : transaction.partial_payments;
          } catch (e) {
            existingPayments = [];
          }
        }

        // Add new payment to history
        partialPayments = [
          ...existingPayments,
          {
            amount: paidAmount,
            transactionRef,
            transactionDate,
            transactionChannel,
            payerName,
            payerMobile: payerMobile || null
          }
        ];
      } else if (transactionAmountType === 'FULL') {
        // Can pay more or exact
        if (paidAmount < expectedAmount) {
          return res.status(200).json({
            status: 400,
            statusDesc: `Insufficient amount. Expected at least: ${expectedAmount}, Received: ${paidAmount}`,
            data: null
          });
        }
        isFullyPaid = true;
      }

      // Generate receipt number
      const receiptNumber = `CRDB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Update transaction with callback data
      const updated = await Transaction.updateFromCallback(paymentReference, {
        status: paymentStatus,
        receipt_number: receiptNumber,
        payment_date: transactionDate,
        payer_name: payerName,
        payer_phone: payerMobile || transaction.payer_phone,
        mno_provider: 'CRDB',
        mno_response: {
          transactionRef,
          transactionChannel,
          transactionDate,
          paymentType,
          paymentDesc
        },
        total_paid: totalPaid,
        payment_count: paymentCount,
        is_fully_paid: isFullyPaid,
        partial_payments: partialPayments.length > 0 ? JSON.stringify(partialPayments) : null
      });

      if (!updated) {
        return res.status(200).json({
          status: 500,
          statusDesc: 'Failed to update transaction',
          data: null
        });
      }

      logger.info('CRDB Callback Success', {
        paymentReference,
        receiptNumber,
        status: paymentStatus,
        totalPaid,
        isFullyPaid
      });

      // Return success response
      return res.status(200).json({
        status: 200,
        statusDesc: 'success',
        data: {
          receipt: receiptNumber
        }
      });

    } catch (error) {
      logger.error('CRDB Callback Error', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      return res.status(500).json({
        status: 500,
        statusDesc: 'Internal server error',
        data: null
      });
    }
  }
}

module.exports = new CrdbController();
