const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const query = `
      INSERT INTO users (
        username, email, password, full_name, role, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userData.username,
      userData.email,
      hashedPassword,
      userData.full_name,
      userData.role || 'VIEWER',
      userData.status || 'ACTIVE',
      userData.created_by || null
    ];

    try {
      const [result] = await pool.query(query, values);
      return { id: result.insertId, username: userData.username };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const query = `SELECT * FROM users WHERE username = ?`;
    
    try {
      const [rows] = await pool.query(query, [username]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = `SELECT * FROM users WHERE email = ?`;
    
    try {
      const [rows] = await pool.query(query, [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = `SELECT id, username, email, full_name, role, status, last_login, created_at FROM users WHERE id = ?`;
    
    try {
      const [rows] = await pool.query(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users
   */
  static async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT id, username, email, full_name, role, status, last_login, created_at 
      FROM users 
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
   * Update user
   */
  static async update(id, updateData) {
    const allowedFields = ['email', 'full_name', 'role', 'status'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    try {
      const [result] = await pool.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update password
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    try {
      const [result] = await pool.query(query, [hashedPassword, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const query = `DELETE FROM users WHERE id = ? AND username != 'admin'`;

    try {
      const [result] = await pool.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update last login
   */
  static async updateLastLogin(id) {
    const query = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;

    try {
      await pool.query(query, [id]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Count users
   */
  static async count() {
    const query = `SELECT COUNT(*) as total FROM users`;
    
    try {
      const [rows] = await pool.query(query);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics by role
   */
  static async getStatsByRole() {
    const query = `
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `;
    
    try {
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
