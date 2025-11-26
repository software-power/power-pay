const { pool } = require('../../config/database');

const createTransactionsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transaction_id VARCHAR(100) UNIQUE NOT NULL,
      reference VARCHAR(100) NOT NULL,
      mno_provider ENUM('STANBIC', 'SELCOM') NOT NULL,
      transaction_type ENUM('VERIFICATION', 'PAYMENT') NOT NULL,
      
      -- Client information
      client_system VARCHAR(100) NOT NULL,
      client_reference VARCHAR(100),
      
      -- Transaction details
      amount DECIMAL(15, 2),
      currency VARCHAR(3) DEFAULT 'TZS',
      payer_name VARCHAR(255),
      payer_phone VARCHAR(20),
      payer_email VARCHAR(255),
      account_id VARCHAR(100),
      institution_id VARCHAR(100),
      
      -- Payment specific fields
      payment_desc TEXT,
      amount_type VARCHAR(20),
      channel VARCHAR(50),
      transaction_date DATETIME,
      
      -- MNO request and response
      mno_request JSON,
      mno_response JSON,
      mno_status_code INT,
      
      -- Status tracking
      status ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'TIMEOUT') DEFAULT 'PENDING',
      receipt_number VARCHAR(100),
      receipt_date DATETIME,
      error_message TEXT,
      
      -- Audit fields
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_transaction_id (transaction_id),
      INDEX idx_reference (reference),
      INDEX idx_mno_provider (mno_provider),
      INDEX idx_status (status),
      INDEX idx_client_system (client_system),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(query);
    console.log('Transactions table created successfully');
  } catch (error) {
    console.error('Error creating transactions table:', error);
    throw error;
  }
};

module.exports = createTransactionsTable;
