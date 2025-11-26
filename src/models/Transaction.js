const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Transaction {
  /**
   * Create a new transaction record
   */
  static async create(data) {
    const transactionId = data.transaction_id || `TXN-${uuidv4()}`;
    
    const query = `
      INSERT INTO transactions (
        transaction_id, reference, mno_provider, transaction_type,
        client_system, client_reference, amount, currency,
        payer_name, payer_phone, payer_email, account_id,
        institution_id, payment_desc, amount_type, channel,
        transaction_date, mno_request, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      transactionId,
      data.reference,
      data.mno_provider,
      data.transaction_type,
      data.client_system || 'UNKNOWN',
      data.client_reference || null,
      data.amount || null,
      data.currency || 'TZS',
      data.payer_name || null,
      data.payer_phone || null,
      data.payer_email || null,
      data.account_id || null,
      data.institution_id || null,
      data.payment_desc || null,
      data.amount_type || null,
      data.channel || null,
      data.transaction_date || new Date(),
      JSON.stringify(data.mno_request || {}),
      data.status || 'PENDING'
    ];

    try {
      const [result] = await pool.query(query, values);
      return { id: result.insertId, transaction_id: transactionId };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update transaction with MNO response
   */
  static async updateMnoResponse(transactionId, responseData) {
    const query = `
      UPDATE transactions
      SET mno_response = ?,
          mno_status_code = ?,
          status = ?,
          receipt_number = ?,
          receipt_date = ?,
          error_message = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE transaction_id = ?
    `;

    const values = [
      JSON.stringify(responseData.mno_response || {}),
      responseData.mno_status_code || null,
      responseData.status || 'PENDING',
      responseData.receipt_number || null,
      responseData.receipt_date || null,
      responseData.error_message || null,
      transactionId
    ];

    try {
      const [result] = await pool.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find transaction by transaction ID
   */
  static async findByTransactionId(transactionId) {
    const query = `SELECT * FROM transactions WHERE transaction_id = ?`;
    
    try {
      const [rows] = await pool.query(query, [transactionId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find transaction by reference
   */
  static async findByReference(reference) {
    const query = `SELECT * FROM transactions WHERE reference = ? ORDER BY created_at DESC LIMIT 1`;
    
    try {
      const [rows] = await pool.query(query, [reference]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find all transactions by client system
   */
  static async findByClientSystem(clientSystem, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM transactions 
      WHERE client_system = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    try {
      const [rows] = await pool.query(query, [clientSystem, limit, offset]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  static async getStatistics(mnoProvider = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        mno_provider,
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM transactions
      WHERE 1=1
    `;
    
    const values = [];
    
    if (mnoProvider) {
      query += ` AND mno_provider = ?`;
      values.push(mnoProvider);
    }
    
    if (startDate) {
      query += ` AND created_at >= ?`;
      values.push(startDate);
    }
    
    if (endDate) {
      query += ` AND created_at <= ?`;
      values.push(endDate);
    }
    
    query += ` GROUP BY mno_provider, status`;
    
    try {
      const [rows] = await pool.query(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  static async updateStatus(transactionId, status, errorMessage = null) {
    const query = `
      UPDATE transactions
      SET status = ?,
          error_message = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE transaction_id = ?
    `;

    try {
      const [result] = await pool.query(query, [status, errorMessage, transactionId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Transaction;
