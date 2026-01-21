const axios = require('axios');
const { generateStanbicChecksum } = require('../utils/checksum');
const logger = require('../utils/logger');

class StanbicService {
  constructor() {
    this.apiUrl = process.env.STANBIC_API_URL;
    this.institutionId = process.env.STANBIC_INSTITUTION_ID;
    this.token = process.env.STANBIC_TOKEN;
    this.prefix = process.env.STANBIC_PREFIX;
  }

  /**
   * Generate checksum for Stanbic API
   */
  generateChecksum(reference) {
    return generateStanbicChecksum(this.token, reference);
  }

  /**
   * Verify biller information
   */
  async verifyBiller(reference) {
    const checksum = this.generateChecksum(reference);
    
    const requestBody = {
      reference,
      institutionId: this.institutionId,
      checksum,
      token: this.token
    };

    try {
      logger.info('Stanbic Biller Verification Request', {
        reference,
        institutionId: this.institutionId
      });

      const response = await axios.post(
        `${this.apiUrl}/biller/verify`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds
        }
      );

      logger.info('Stanbic Biller Verification Response', {
        reference,
        statusCode: response.data.statusCode
      });

      return {
        success: response.data.statusCode === 200,
        data: response.data,
        statusCode: response.data.statusCode,
        message: response.data.message
      };

    } catch (error) {
      logger.error('Stanbic Biller Verification Error', {
        reference,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        statusCode: error.response?.data?.statusCode || 500,
        message: error.response?.data?.message || error.message,
        error: error.message
      };
    }
  }

  /**
   * Post payment to Stanbic
   */
  async postPayment(paymentData) {
    const checksum = this.generateChecksum(paymentData.reference);
    
    const requestBody = {
      reference: paymentData.reference,
      amount: paymentData.amount,
      institutionId: this.institutionId,
      payerName: paymentData.payerName,
      accOpt: paymentData.accOpt || '001',
      amountType: paymentData.amountType || 'FULL',
      currency: paymentData.currency || 'TZS',
      paymentDesc: paymentData.paymentDesc || '',
      payerPhone: paymentData.payerPhone || '',
      payerEmail: paymentData.payerEmail || '',
      channel: paymentData.channel || 'API',
      transactionDate: paymentData.transactionDate || new Date().toISOString(),
      transactionId: paymentData.transactionId,
      checksum
    };

    try {
      logger.info('Stanbic Payment Request', {
        reference: paymentData.reference,
        amount: paymentData.amount,
        transactionId: paymentData.transactionId
      });

      const response = {
        data:{
          statusCode:200,
          receipt:'',
          message:'Success',
          receiptDate:null
        }
      } 
      /*await axios.post(
        `${this.apiUrl}/biller/pay`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds for payment
        }
      );*/

      logger.info('Stanbic Payment Response', {
        reference: paymentData.reference,
        statusCode: response.data.statusCode,
        receipt: response.data.data?.receipt
      });

      return {
        success: response.data.statusCode === 200,
        data: response.data,
        statusCode: response.data.statusCode,
        message: response.data.message,
        receipt: response.data.data?.receipt,
        receiptDate: response.data.data?.receiptDate
      };

    } catch (error) {
      logger.error('Stanbic Payment Error', {
        reference: paymentData.reference,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        statusCode: error.response?.data?.statusCode || 500,
        message: error.response?.data?.message || error.message,
        error: error.message
      };
    }
  }

  /**
   * Map Stanbic error codes to human-readable messages
   */
  getErrorMessage(statusCode) {
    const errorMessages = {
      201: 'Invalid token',
      202: 'Invalid checksum',
      203: 'Invalid payment reference',
      204: 'Payment reference has expired',
      205: 'Duplicate transaction',
      206: 'Transaction reference already paid (verification)',
      207: 'Transaction reference already paid (posting)'
    };

    return errorMessages[statusCode] || 'Unknown error occurred';
  }
}

module.exports = new StanbicService();
