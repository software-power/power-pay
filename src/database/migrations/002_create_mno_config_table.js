const { pool } = require('../../config/database');

const createMnoConfigTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS mno_configurations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mno_provider VARCHAR(50) UNIQUE NOT NULL,
      api_url VARCHAR(255) NOT NULL,
      api_key VARCHAR(255),
      api_secret VARCHAR(255),
      institution_id VARCHAR(100),
      vendor_id VARCHAR(100),
      vendor_pin VARCHAR(100),
      token TEXT,
      prefix VARCHAR(10),
      is_active BOOLEAN DEFAULT TRUE,
      config_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_mno_provider (mno_provider),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(query);
    console.log('MNO configurations table created successfully');
  } catch (error) {
    console.error('Error creating mno_configurations table:', error);
    throw error;
  }
};

module.exports = createMnoConfigTable;
