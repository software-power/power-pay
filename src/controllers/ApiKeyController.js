const ApiKey = require('../models/ApiKey');
const logger = require('../utils/logger');

class ApiKeyController {
  /**
   * Get all API keys
   */
  async getAllKeys(req, res) {
    const { limit = 100, offset = 0 } = req.query;

    try {
      const keys = await ApiKey.findAll(parseInt(limit), parseInt(offset));
      
      // Hide secrets
      const sanitized = keys.map(key => ({
        ...key,
        api_secret: undefined
      }));

      return res.status(200).json({
        success: true,
        data: sanitized
      });
    } catch (error) {
      logger.error('Get API keys error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve API keys',
        error: error.message
      });
    }
  }

  /**
   * Create new API key
   */
  async createKey(req, res) {
    const {
      key_name,
      organization,
      contact_email,
      contact_phone,
      permissions,
      rate_limit,
      expires_at
    } = req.body;

    try {
      const result = await ApiKey.create({
        key_name,
        organization,
        contact_email,
        contact_phone,
        permissions: permissions || ['payments:verify', 'payments:process', 'payments:lookup'],
        rate_limit,
        expires_at,
        created_by: req.user?.id
      });

      logger.info('API key created', {
        organization,
        key_name,
        created_by: req.user?.username
      });

      return res.status(201).json({
        success: true,
        message: 'API key created successfully',
        data: {
          id: result.id,
          api_key: result.apiKey,
          api_secret: result.apiSecret,
          note: 'Save the API secret securely. It will not be shown again!'
        }
      });
    } catch (error) {
      logger.error('Create API key error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to create API key',
        error: error.message
      });
    }
  }

  /**
   * Update API key
   */
  async updateKey(req, res) {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const updated = await ApiKey.update(id, updateData);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'API key not found'
        });
      }

      logger.info('API key updated', { id, updated_by: req.user?.username });

      return res.status(200).json({
        success: true,
        message: 'API key updated successfully'
      });
    } catch (error) {
      logger.error('Update API key error', { error: error.message, id });
      return res.status(500).json({
        success: false,
        message: 'Failed to update API key',
        error: error.message
      });
    }
  }

  /**
   * Delete API key
   */
  async deleteKey(req, res) {
    const { id } = req.params;

    try {
      const deleted = await ApiKey.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'API key not found'
        });
      }

      logger.info('API key deleted', { id, deleted_by: req.user?.username });

      return res.status(200).json({
        success: true,
        message: 'API key deleted successfully'
      });
    } catch (error) {
      logger.error('Delete API key error', { error: error.message, id });
      return res.status(500).json({
        success: false,
        message: 'Failed to delete API key',
        error: error.message
      });
    }
  }

  /**
   * Revoke API key (set to INACTIVE)
   */
  async revokeKey(req, res) {
    const { id } = req.params;

    try {
      const revoked = await ApiKey.revoke(id);
      
      if (!revoked) {
        return res.status(404).json({
          success: false,
          message: 'API key not found'
        });
      }

      logger.info('API key revoked', { id, revoked_by: req.user?.username });

      return res.status(200).json({
        success: true,
        message: 'API key revoked successfully'
      });
    } catch (error) {
      logger.error('Revoke API key error', { error: error.message, id });
      return res.status(500).json({
        success: false,
        message: 'Failed to revoke API key',
        error: error.message
      });
    }
  }

  /**
   * Get API key statistics
   */
  async getStats(req, res) {
    try {
      const stats = await ApiKey.getStats();

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get API key stats error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error.message
      });
    }
  }
}

module.exports = new ApiKeyController();
