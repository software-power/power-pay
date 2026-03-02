const { pool } = require('../../config/database');

const addUniqueReferenceConstraint = async () => {
  const checkIndexQuery = `
    SELECT COUNT(*) as index_exists
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'transactions' 
    AND INDEX_NAME = 'idx_reference_unique'
  `;

  const addUniqueIndexQuery = `
    ALTER TABLE transactions
    ADD UNIQUE INDEX idx_reference_unique (reference)
  `;

  try {
    // Check if unique index already exists
    const [result] = await pool.query(checkIndexQuery);
    
    if (result[0].index_exists === 0) {
      // Check for existing duplicate references first
      const checkDuplicatesQuery = `
        SELECT reference, COUNT(*) as count 
        FROM transactions 
        GROUP BY reference 
        HAVING COUNT(*) > 1
      `;
      
      const [duplicates] = await pool.query(checkDuplicatesQuery);
      
      if (duplicates.length > 0) {
        console.log('⚠️  Warning: Found duplicate references in database:');
        duplicates.forEach(dup => {
          console.log(`   - Reference: ${dup.reference} (${dup.count} times)`);
        });
        console.log('⚠️  Please clean up duplicates before running this migration');
        console.log('   You can keep the latest one and delete older entries');
        return;
      }

      // Add unique index
      await pool.query(addUniqueIndexQuery);
      console.log('✓ Added unique constraint on reference column');
    } else {
      console.log('✓ Unique constraint on reference already exists');
    }
  } catch (error) {
    console.error('Error adding unique constraint on reference:', error.message);
    throw error;
  }
};

module.exports = addUniqueReferenceConstraint;
