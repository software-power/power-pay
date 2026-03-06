const { pool } = require('../../config/database');

const createApiKeysTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS api_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      key_name VARCHAR(100) NOT NULL,
      api_key VARCHAR(64) UNIQUE NOT NULL,
      api_secret VARCHAR(128) NOT NULL,
      organization VARCHAR(255) NOT NULL,
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
      permissions JSON,
      rate_limit INT DEFAULT 1000,
      expires_at DATETIME,
      last_used_at DATETIME,
      usage_count INT DEFAULT 0,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_api_key (api_key),
      INDEX idx_status (status),
      INDEX idx_organization (organization),
      INDEX idx_expires_at (expires_at),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  // Create default API key for testing
  const defaultKeyQuery = `
    INSERT INTO api_keys (
      key_name, api_key, api_secret, organization, 
      contact_email, status, permissions, rate_limit
    )
    SELECT 
      'Default Test Key', 
      'pk_test_1234567890abcdef1234567890abcdef12345678',
      '$2a$10$rKvVJvNzLVvL8UO9P8qCBuH5HqJQQJxN8QUjLZGgJJpXFfKxZVzKm',
      'Power-Pay Test',
      'test@power-pay.com',
      'ACTIVE',
      '["payments:verify", "payments:process", "payments:lookup", "payments:callback"]',
      1000
    WHERE NOT EXISTS (
      SELECT 1 FROM api_keys WHERE api_key = 'pk_test_1234567890abcdef1234567890abcdef12345678'
    );
  `;

  // Create default Stanbic shared token
  const stanbicTokenQuery = `
    INSERT INTO api_keys (
      key_name, api_key, api_secret, organization,
      contact_email, status, permissions, rate_limit
    )
    SELECT 
      'Stanbic Bank Shared Token', 
      'stanbic_token_default',
      'stanbic_secret_2024_changeme',
      'Stanbic Bank Tanzania',
      'api@stanbic.co.tz',
      'ACTIVE',
      '["stanbic:lookup", "stanbic:callback"]',
      5000
    WHERE NOT EXISTS (
      SELECT 1 FROM api_keys WHERE organization = 'Stanbic Bank Tanzania'
    );
  `;

  try {
    await pool.query(query);
    console.log('✓ API keys table created successfully');
    
    // Create default test key
    await pool.query(defaultKeyQuery);
    console.log('✓ Default test API key created');
    console.log('  API Key: pk_test_1234567890abcdef1234567890abcdef12345678');
    
    // Create default Stanbic token
    await pool.query(stanbicTokenQuery);
    console.log('✓ Default Stanbic shared token created');
    console.log('  Shared Secret: stanbic_secret_2024_changeme');
    console.log('  📝 Share this secret with Stanbic team');
    console.log('  ⚠️  Change this token in production!');
  } catch (error) {
    console.error('Error creating api_keys table:', error);
    throw error;
  }
};

module.exports = createApiKeysTable;
