const axios = require('axios');
const moment = require('moment');
const { generateSelcomDigest, generateSelcomSignedData } = require('../utils/checksum');
const logger = require('../utils/logger');

class SelcomService {
  constructor() {
    this.apiUrl = process.env.SELCOM_API_URL;
    this.apiKey = process.env.SELCOM_API_KEY;
    this.apiSecret = process.env.SELCOM_API_SECRET;
    this.vendorId = process.env.SELCOM_VENDOR_ID;
    this.vendorPin = process.env.SELCOM_VENDOR_PIN;
  }

  /**
   * Generate authentication headers for Selcom API
   */
  generateHeaders(signedFields, requestData) {
    const timestamp = moment().format('YYYY-MM-DDTHH:mm:ssZ');
    const authorization = `SELCOM ${Buffer.from(this.apiKey).toString('base64')}`;
    
    // Create signed data string
    const signedData = generateSelcomSignedData(timestamp, requestData);
    
    // Generate digest
    const digest = generateSelcomDigest(this.apiSecret, signedData);

    return {
      'Authorization': authorization,
      'Content-Type': 'application/json',
      'Timestamp': timestamp,
      'Digest-Method': 'HS256',
      'Digest': digest,
      'Signed-Fields': signedFields
    };
  }

  /**
   * Utility Payment - Lookup
   */
  async utilityLookup(utilityCode, utilityRef, transId) {
    const requestData = {
      utilitycode: utilityCode,
      utilityref: utilityRef,
      transid: transId
    };

    const signedFields = 'utilitycode,utilityref,transid';
    const headers = this.generateHeaders(signedFields, requestData);

    try {
      logger.info('Selcom Utility Lookup Request', {
        utilityCode,
        utilityRef,
        transId
      });

      const response = await axios.get(
        `${this.apiUrl}/v1/utilitypayment/lookup`,
        {
          params: requestData,
          headers,
          timeout: 30000
        }
      );

      logger.info('Selcom Utility Lookup Response', {
        transId,
        resultcode: response.data.resultcode
      });

      return {
        success: response.data.resultcode === '000',
        data: response.data,
        resultcode: response.data.resultcode,
        message: response.data.message
      };

    } catch (error) {
      logger.error('Selcom Utility Lookup Error', {
        transId,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        resultcode: error.response?.data?.resultcode || '999',
        message: error.response?.data?.message || error.message,
        error: error.message
      };
    }
  }

  /**
   * Utility Payment - Process
   */
  async utilityPayment(paymentData) {
    const requestData = {
      transid: paymentData.transid,
      utilitycode: paymentData.utilitycode,
      utilityref: paymentData.utilityref,
      amount: paymentData.amount,
      vendor: this.vendorId,
      pin: this.vendorPin,
      msisdn: paymentData.msisdn || ''
    };

    const signedFields = 'transid,utilitycode,utilityref,amount,vendor,pin,msisdn';
    const headers = this.generateHeaders(signedFields, requestData);

    try {
      logger.info('Selcom Utility Payment Request', {
        transid: paymentData.transid,
        utilitycode: paymentData.utilitycode,
        amount: paymentData.amount
      });

      const response = await axios.post(
        `${this.apiUrl}/v1/utilitypayment/process`,
        requestData,
        {
          headers,
          timeout: 60000
        }
      );

      logger.info('Selcom Utility Payment Response', {
        transid: paymentData.transid,
        resultcode: response.data.resultcode,
        reference: response.data.reference
      });

      return {
        success: response.data.resultcode === '000',
        data: response.data,
        resultcode: response.data.resultcode,
        message: response.data.message,
        reference: response.data.reference,
        receipt: response.data.data?.[0]?.receipt
      };

    } catch (error) {
      logger.error('Selcom Utility Payment Error', {
        transid: paymentData.transid,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        resultcode: error.response?.data?.resultcode || '999',
        message: error.response?.data?.message || error.message,
        error: error.message
      };
    }
  }

  /**
   * Query Transaction Status
   */
  async queryStatus(transId) {
    const requestData = {
      transid: transId
    };

    const signedFields = 'transid';
    const headers = this.generateHeaders(signedFields, requestData);

    try {
      logger.info('Selcom Query Status Request', { transId });

      const response = await axios.get(
        `${this.apiUrl}/v1/utilitypayment/query`,
        {
          params: requestData,
          headers,
          timeout: 30000
        }
      );

      logger.info('Selcom Query Status Response', {
        transId,
        resultcode: response.data.resultcode
      });

      return {
        success: response.data.resultcode === '000',
        data: response.data,
        resultcode: response.data.resultcode,
        message: response.data.message
      };

    } catch (error) {
      logger.error('Selcom Query Status Error', {
        transId,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        resultcode: error.response?.data?.resultcode || '999',
        message: error.response?.data?.message || error.message,
        error: error.message
      };
    }
  }

  /**
   * Wallet Cash-in
   */
  async walletCashin(cashinData) {
    const requestData = {
      transid: cashinData.transid,
      utilitycode: cashinData.utilitycode || 'CASHIN',
      utilityref: cashinData.utilityref,
      amount: cashinData.amount,
      vendor: this.vendorId,
      pin: this.vendorPin,
      msisdn: cashinData.msisdn || ''
    };

    const signedFields = 'transid,utilitycode,utilityref,amount,vendor,pin,msisdn';
    const headers = this.generateHeaders(signedFields, requestData);

    try {
      logger.info('Selcom Wallet Cashin Request', {
        transid: cashinData.transid,
        utilityref: cashinData.utilityref,
        amount: cashinData.amount
      });

      const response = await axios.post(
        `${this.apiUrl}/v1/walletcashin/process`,
        requestData,
        {
          headers,
          timeout: 60000
        }
      );

      logger.info('Selcom Wallet Cashin Response', {
        transid: cashinData.transid,
        resultcode: response.data.resultcode
      });

      return {
        success: response.data.resultcode === '000',
        data: response.data,
        resultcode: response.data.resultcode,
        message: response.data.message,
        reference: response.data.reference
      };

    } catch (error) {
      logger.error('Selcom Wallet Cashin Error', {
        transid: cashinData.transid,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        resultcode: error.response?.data?.resultcode || '999',
        message: error.response?.data?.message || error.message,
        error: error.message
      };
    }
  }

  /**
   * Get float balance
   */
  async getBalance(transId) {
    const requestData = {
      vendor: this.vendorId,
      pin: this.vendorPin,
      transid: transId
    };

    const signedFields = 'vendor,pin,transid';
    const headers = this.generateHeaders(signedFields, requestData);

    try {
      logger.info('Selcom Get Balance Request', { transId });

      const response = await axios.post(
        `${this.apiUrl}/v1/vendor/balance`,
        requestData,
        {
          headers,
          timeout: 30000
        }
      );

      logger.info('Selcom Get Balance Response', {
        transId,
        resultcode: response.data.resultcode
      });

      return {
        success: response.data.resultcode === '000',
        data: response.data,
        resultcode: response.data.resultcode,
        balance: response.data.data?.[0]?.balance,
        message: response.data.message
      };

    } catch (error) {
      logger.error('Selcom Get Balance Error', {
        transId,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        resultcode: error.response?.data?.resultcode || '999',
        message: error.response?.data?.message || error.message,
        error: error.message
      };
    }
  }

  /**
   * Map Selcom result codes to status
   */
  getTransactionStatus(resultcode) {
    if (resultcode === '000') return 'SUCCESS';
    if (['111', '927'].includes(resultcode)) return 'PROCESSING';
    if (resultcode === '999') return 'TIMEOUT';
    return 'FAILED';
  }
}

module.exports = new SelcomService();
