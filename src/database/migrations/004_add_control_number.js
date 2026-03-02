const { pool } = require('../../config/database');

const addControlNumberColumn = async () => {
  const checkColumnQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'transactions' 
    AND COLUMN_NAME = 'control_number'
  `;

  const addColumnQuery = `
    ALTER TABLE transactions
    ADD COLUMN control_number VARCHAR(100) AFTER reference,
    ADD INDEX idx_control_number (control_number)
  `;

  try {
    // Check if column already exists
    const [columns] = await pool.query(checkColumnQuery);
    
    if (columns.length === 0) {
      // Column doesn't exist, add it
      await pool.query(addColumnQuery);
      console.log('✓ Added control_number column to transactions table');
    } else {
      console.log('✓ control_number column already exists');
    }
  } catch (error) {
    console.error('Error adding control_number column:', error);
    throw error;
  }
};

module.exports = addControlNumberColumn;
