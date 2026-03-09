const ApiKey = require('../models/ApiKey');
const CrdbService = require('../services/CrdbService');
const logger = require('../utils/logger');

/**
 * CRDB Authentication Middleware
 * Validates token and checksum for CRDB requests
 */
async function authenticateCrdb(req, res, next) {
  try {
    const { token, checksum, paymentReference, institutionID } = req.body;

    // Check required fields
    if (!token) {
      return res.status(200).json({
        status: 201,
        statusDesc: 'Invalid token',
        data: null
      });
    }

    if (!checksum) {
      return res.status(200).json({
        status: 202,
        statusDesc: 'Invalid checksum',
        data: null
      });
    }

    if (!paymentReference) {
      return res.status(200).json({
        status: 204,
        statusDesc: 'Invalid payment reference number',
        data: null
      });
    }

    // Find CRDB API key
    const apiKeys = await ApiKey.findAll();
    const crdbKey = apiKeys.find(key => 
      key.status === 'ACTIVE' && 
      key.permissions && 
      JSON.parse(key.permissions).some(p => p.includes('crdb:'))
    );

    if (!crdbKey) {
      logger.error('CRDB API Key Not Found');
      return res.status(200).json({
        status: 201,
        statusDesc: 'Invalid token',
        data: null
      });
    }

    // Validate token (token should match api_secret)
    if (crdbKey.api_secret !== token) {
      logger.warn('CRDB Token Mismatch', {
        provided: token.substring(0, 10) + '...',
        paymentReference
      });
      return res.status(200).json({
        status: 201,
        statusDesc: 'Invalid token',
        data: null
      });
    }

    // Validate checksum: SHA1(token + MD5(paymentReference))
    const isValidChecksum = CrdbService.validateChecksum(
      token,
      paymentReference,
      checksum
    );

    if (!isValidChecksum) {
      logger.warn('CRDB Checksum Validation Failed', {
        paymentReference,
        checksum
      });
      return res.status(200).json({
        status: 202,
        statusDesc: 'Invalid checksum',
        data: null
      });
    }

    logger.info('CRDB Authentication Success', {
      paymentReference,
      institutionID
    });

    // Attach API key to request
    req.apiKey = crdbKey;
    next();

  } catch (error) {
    logger.error('CRDB Authentication Error', {
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

module.exports = { authenticateCrdb };
