const User = require('../models/User');
const logger = require('../utils/logger');

class UserController {
  /**
   * Get all users
   */
  async getAllUsers(req, res) {
    const { limit = 100, offset = 0 } = req.query;

    try {
      const users = await User.findAll(parseInt(limit), parseInt(offset));
      const total = await User.count();

      return res.status(200).json({
        success: true,
        data: {
          users,
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      logger.error('Get all users error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error.message
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res) {
    const { id } = req.params;

    try {
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get user by ID error', { error: error.message, userId: id });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: error.message
      });
    }
  }

  /**
   * Create new user
   */
  async createUser(req, res) {
    const { username, email, password, full_name, role } = req.body;

    try {
      // Check if username exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Check if email exists
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Create user
      const result = await User.create({
        username,
        email,
        password,
        full_name,
        role: role || 'VIEWER',
        created_by: req.user.id
      });

      logger.info('User created', { 
        newUserId: result.id, 
        username, 
        createdBy: req.user.id 
      });

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result
      });
    } catch (error) {
      logger.error('Create user error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res) {
    const { id } = req.params;
    const updateData = req.body;

    try {
      // Don't allow updating admin user's role or status
      const user = await User.findById(id);
      if (user && user.username === 'admin') {
        if (updateData.role || updateData.status) {
          return res.status(403).json({
            success: false,
            message: 'Cannot modify admin user role or status'
          });
        }
      }

      const updated = await User.update(id, updateData);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'User not found or no changes made'
        });
      }

      logger.info('User updated', { userId: id, updatedBy: req.user.id });

      return res.status(200).json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      logger.error('Update user error', { error: error.message, userId: id });
      return res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req, res) {
    const { id } = req.params;

    try {
      // Prevent self-deletion
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const deleted = await User.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'User not found or cannot delete admin user'
        });
      }

      logger.info('User deleted', { userId: id, deletedBy: req.user.id });

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error', { error: error.message, userId: id });
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }

  /**
   * Reset user password (admin only)
   */
  async resetPassword(req, res) {
    const { id } = req.params;
    const { newPassword } = req.body;

    try {
      await User.updatePassword(id, newPassword);

      logger.info('Password reset by admin', { userId: id, resetBy: req.user.id });

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password error', { error: error.message, userId: id });
      return res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: error.message
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    try {
      const totalUsers = await User.count();
      const statsByRole = await User.getStatsByRole();

      return res.status(200).json({
        success: true,
        data: {
          total: totalUsers,
          byRole: statsByRole
        }
      });
    } catch (error) {
      logger.error('Get user stats error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
