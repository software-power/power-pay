const ApiKey = require('../models/ApiKey');
const logger = require('../utils/logger');

/**
 * API Key Authentication Middleware
 * Validates API key from X-API-Key header
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required',
        error: 'Please provide API key in X-API-Key header or Authorization header'
      });
    }

    // Validate API key
    const validation = await ApiKey.validate(apiKey);

    if (!validation.valid) {
      logger.warn('Invalid API key attempt', { 
        apiKey: apiKey.substring(0, 10) + '...', 
        reason: validation.reason,
        ip: req.ip 
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        error: validation.reason
      });
    }

    // Update usage statistics
    await ApiKey.updateUsage(apiKey);

    // Attach API key info to request
    req.apiKey = validation.key;
    req.apiKeyString = apiKey;

    logger.info('API key authenticated', {
      organization: validation.key.organization,
      keyName: validation.key.key_name
    });

    next();
  } catch (error) {
    logger.error('API key authentication error', { error: error.message });
    
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Check if API key has specific permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!ApiKey.hasPermission(req.apiKey, permission)) {
      logger.warn('Permission denied', {
        organization: req.apiKey.organization,
        required: permission,
        has: req.apiKey.permissions
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permission
      });
    }

    next();
  };
};

/**
 * Optional API key authentication (allows both authenticated and public access)
 */
const optionalApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (apiKey) {
    try {
      const validation = await ApiKey.validate(apiKey);
      if (validation.valid) {
        await ApiKey.updateUsage(apiKey);
        req.apiKey = validation.key;
        req.apiKeyString = apiKey;
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional API key validation failed', { error: error.message });
    }
  }

  next();
};

module.exports = {
  authenticateApiKey,
  requirePermission,
  optionalApiKey
};
