const { pool } = require('../config/database');
const crypto = require('crypto');

class ApiKey {
  /**
   * Generate a new API key and secret
   */
  static generateKey() {
    const apiKey = 'pk_' + crypto.randomBytes(32).toString('hex');
    const apiSecret = crypto.randomBytes(48).toString('hex');
    return { apiKey, apiSecret };
  }

  /**
   * Create a new API key
   */
  static async create(data) {
    const { apiKey, apiSecret } = this.generateKey();
    
    const query = `
      INSERT INTO api_keys (
        key_name, api_key, api_secret, organization,
        contact_email, contact_phone, status, permissions,
        rate_limit, expires_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.key_name,
      apiKey,
      apiSecret, // In production, hash this
      data.organization,
      data.contact_email || null,
      data.contact_phone || null,
      data.status || 'ACTIVE',
      JSON.stringify(data.permissions || []),
      data.rate_limit || 1000,
      data.expires_at || null,
      data.created_by || null
    ];

    try {
      const [result] = await pool.query(query, values);
      return { 
        id: result.insertId, 
        apiKey, 
        apiSecret // Return secret only on creation
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find API key by key string
   */
  static async findByKey(apiKey) {
    const query = `
      SELECT * FROM api_keys 
      WHERE api_key = ?
    `;
    
    try {
      const [rows] = await pool.query(query, [apiKey]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate API key
   */
  static async validate(apiKey) {
    const key = await this.findByKey(apiKey);
    
    if (!key) {
      return { valid: false, reason: 'Invalid API key' };
    }

    // Check if active
    if (key.status !== 'ACTIVE') {
      return { valid: false, reason: `API key is ${key.status.toLowerCase()}` };
    }

    // Check expiration
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return { valid: false, reason: 'API key has expired' };
    }

    return { valid: true, key };
  }

  /**
   * Update last used timestamp and usage count
   */
  static async updateUsage(apiKey) {
    const query = `
      UPDATE api_keys 
      SET last_used_at = CURRENT_TIMESTAMP,
          usage_count = usage_count + 1
      WHERE api_key = ?
    `;

    try {
      await pool.query(query, [apiKey]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all API keys
   */
  static async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT 
        id, key_name, api_key, organization, contact_email,
        contact_phone, status, permissions, rate_limit,
        expires_at, last_used_at, usage_count, created_at
      FROM api_keys 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    try {
      const [rows] = await pool.query(query, [limit, offset]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update API key
   */
  static async update(id, updateData) {
    const allowedFields = [
      'key_name', 'organization', 'contact_email', 'contact_phone',
      'status', 'permissions', 'rate_limit', 'expires_at'
    ];
    
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(key === 'permissions' ? JSON.stringify(value) : value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `
      UPDATE api_keys 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    try {
      const [result] = await pool.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete API key
   */
  static async delete(id) {
    const query = `DELETE FROM api_keys WHERE id = ?`;

    try {
      const [result] = await pool.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoke API key (set to INACTIVE)
   */
  static async revoke(id) {
    return await this.update(id, { status: 'INACTIVE' });
  }

  /**
   * Check if API key has permission
   */
  static hasPermission(key, permission) {
    if (!key.permissions) return false;
    
    const permissions = typeof key.permissions === 'string' 
      ? JSON.parse(key.permissions) 
      : key.permissions;
      
    return permissions.includes(permission) || permissions.includes('*');
  }

  /**
   * Get API key statistics
   */
  static async getStats() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(usage_count) as total_usage
      FROM api_keys 
      GROUP BY status
    `;
    
    try {
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ApiKey;
