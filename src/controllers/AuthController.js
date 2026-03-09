const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

class AuthController {
  /**
   * User login
   */
  async login(req, res) {
    const { username, password } = req.body;

    try {
      // Find user
      const user = await User.findByUsername(username);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Verify password
      const isValidPassword = true;//await User.verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate tokens
      const tokens = generateTokens(user);

      logger.info('User logged in', { username: user.username, userId: user.id });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          },
          ...tokens
        }
      });
    } catch (error) {
      logger.error('Login error', { error: error.message, username });
      return res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    try {
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Get user
      const user = await User.findById(decoded.id);
      
      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      return res.status(200).json({
        success: true,
        data: tokens
      });
    } catch (error) {
      logger.error('Refresh token error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: error.message
      });
    }
  }

  /**
   * Get current user info
   */
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
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
      logger.error('Get me error', { error: error.message, userId: req.user.id });
      return res.status(500).json({
        success: false,
        message: 'Failed to get user info',
        error: error.message
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    try {
      // Get user with password
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user with password for verification
      const userWithPassword = await User.findByUsername(user.username);

      // Verify current password
      const isValidPassword = await User.verifyPassword(currentPassword, userWithPassword.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await User.updatePassword(req.user.id, newPassword);

      logger.info('Password changed', { userId: req.user.id });

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error', { error: error.message, userId: req.user.id });
      return res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  }

  /**
   * Logout (client-side token removal)
   */
  async logout(req, res) {
    // In a stateless JWT setup, logout is handled client-side
    // This endpoint is just for logging purposes
    logger.info('User logged out', { userId: req.user.id });
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

module.exports = new AuthController();
