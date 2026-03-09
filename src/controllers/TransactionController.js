const Transaction = require('../models/Transaction');
const { pool } = require('../config/database');

class TransactionController {
  /**
   * Get all transactions
   * @route GET /api/transactions
   */
  async getAllTransactions(req, res) {
    try {
      const { status, mno_provider, limit = 100, offset = 0 } = req.query;

      let query = `
        SELECT 
          id, reference, transaction_id, amount, currency,
          status, mno_provider, payer_name, payer_phone, payer_email,
          payment_desc, total_paid, payment_count, is_fully_paid,
          partial_payments, receipt_number, payment_date,
          created_at, updated_at
        FROM transactions
        WHERE 1=1
      `;

      const params = [];

      if (status && status !== 'ALL') {
        params.push(status);
        query += ` AND status = ?`;
      }

      if (mno_provider && mno_provider !== 'ALL') {
        params.push(mno_provider);
        query += ` AND mno_provider = ?`;
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [transactions] = await pool.query(query, params);

      res.json({
        success: true,
        data: transactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: transactions.length
        }
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Get single transaction by ID
   * @route GET /api/transactions/:id
   */
  async getTransactionById(req, res) {
    try {
      const { id } = req.params;

      const [transactions] = await pool.query(
        `SELECT 
          id, reference, transaction_id, amount, currency,
          status, mno_provider, payer_name, payer_phone, payer_email,
          payment_desc, total_paid, payment_count, is_fully_paid,
          partial_payments, receipt_number, payment_date,
          created_at, updated_at
        FROM transactions
        WHERE id = ?`,
        [id]
      );

      if (transactions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transactions[0]
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Get transaction by reference
   * @route GET /api/transactions/reference/:reference
   */
  async getTransactionByReference(req, res) {
    try {
      const { reference } = req.params;

      // Use Transaction model method
      const transaction = await Transaction.findByReference(reference);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Get transaction by transaction ID
   * @route GET /api/transactions/txn/:transactionId
   */
  async getTransactionByTxnId(req, res) {
    try {
      const { transactionId } = req.params;

      // Use Transaction model method
      const transaction = await Transaction.findByTransactionId(transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Get transaction statistics
   * @route GET /api/transactions/stats/summary
   */
  async getStatistics(req, res) {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'PARTIAL' THEN 1 ELSE 0 END) as partial_count,
          SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
          SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'PARTIAL' THEN total_paid ELSE 0 END) as partial_revenue
        FROM transactions
      `);

      res.json({
        success: true,
        data: stats[0]
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Get transaction statistics by MNO
   * @route GET /api/transactions/stats/by-mno
   */
  async getStatsByMNO(req, res) {
    try {
      const { start_date, end_date, mno_provider } = req.query;

      // Use Transaction model method
      const stats = await Transaction.getStatistics(
        mno_provider || null,
        start_date || null,
        end_date || null
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching MNO stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch MNO statistics',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Get recent transactions
   * @route GET /api/transactions/recent
   */
  async getRecentTransactions(req, res) {
    try {
      const { limit = 10 } = req.query;

      const [transactions] = await pool.query(
        `SELECT 
          id, reference, transaction_id, amount, currency,
          status, mno_provider, payer_name,
          created_at
        FROM transactions
        ORDER BY created_at DESC
        LIMIT ?`,
        [parseInt(limit)]
      );

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent transactions',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Get transactions by client system
   * @route GET /api/transactions/client/:clientSystem
   */
  async getTransactionsByClient(req, res) {
    try {
      const { clientSystem } = req.params;
      const { limit = 100, offset = 0 } = req.query;

      // Use Transaction model method
      const transactions = await Transaction.findByClientSystem(
        clientSystem,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: transactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: transactions.length
        }
      });
    } catch (error) {
      console.error('Error fetching client transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client transactions',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Search transactions
   * @route GET /api/transactions/search
   */
  async searchTransactions(req, res) {
    try {
      const { q, limit = 50 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      const searchTerm = `%${q}%`;
      const [transactions] = await pool.query(
        `SELECT 
          id, reference, transaction_id, amount, currency,
          status, mno_provider, payer_name, payer_phone,
          created_at
        FROM transactions
        WHERE reference LIKE ? 
           OR transaction_id LIKE ?
           OR payer_name LIKE ?
           OR payer_phone LIKE ?
        ORDER BY created_at DESC
        LIMIT ?`,
        [searchTerm, searchTerm, searchTerm, searchTerm, parseInt(limit)]
      );

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('Error searching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search transactions',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }

  /**
   * Update transaction status
   * @route PATCH /api/transactions/:transactionId/status
   */
  async updateTransactionStatus(req, res) {
    try {
      const { transactionId } = req.params;
      const { status, error_message } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      // Use Transaction model method
      const updated = await Transaction.updateStatus(
        transactionId,
        status,
        error_message || null
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        message: 'Transaction status updated successfully'
      });
    } catch (error) {
      console.error('Error updating transaction status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction status',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }
}

module.exports = new TransactionController();
