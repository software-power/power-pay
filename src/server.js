require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const connected = await testConnection();

    if (!connected) {
      logger.error('Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`Power-Pay Gateway server started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Base URL: http://localhost:${PORT}/api`);
      console.log(`
╔════════════════════════════════════════════════════════════╗
║              POWER-PAY GATEWAY SERVER                      ║
║   Power computer payment gateway - Multi-MNO Support       ║
║                                                            ║
║  Status:  ✓ Running                                       ║
║  Port:    ${PORT}                                              ║
║  Env:     ${process.env.NODE_ENV || 'development'}                                      ║
║                                                            ║
║  Endpoints:                                                ║
║  - POST   /api/payments/verify                            ║
║  - POST   /api/payments/process                           ║
║  - GET    /api/payments/status/:transaction_id            ║
║  - GET    /api/payments/history/:client_system            ║
║  - GET    /api/payments/selcom/balance                    ║
║                                                            ║
║  Supported MNOs:                                           ║
║  - Stanbic Bank                                            ║
║  - Selcom                                                  ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
