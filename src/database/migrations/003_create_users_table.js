const { pool } = require('../../config/database');

const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role ENUM('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER') DEFAULT 'VIEWER',
      status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
      last_login DATETIME,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_username (username),
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_status (status),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  // Insert default admin user (password: admin123 - should be changed immediately)
  const defaultAdminQuery = `
    INSERT INTO users (username, email, password, full_name, role, status)
    SELECT 'admin', 'admin@power-pay.com', '$2a$10$rKvVJvNzLVvL8UO9P8qCBuH5HqJQQJxN8QUjLZGgJJpXFfKxZVzKm', 'System Administrator', 'ADMIN', 'ACTIVE'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
  `;

  try {
    await pool.query(query);
    console.log('Users table created successfully');
    
    // Create default admin
    await pool.query(defaultAdminQuery);
    console.log('Default admin user created (username: admin, password: admin123)');
  } catch (error) {
    console.error('Error creating users table:', error);
    throw error;
  }
};

module.exports = createUsersTable;
