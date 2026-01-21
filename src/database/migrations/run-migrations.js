require('dotenv').config();
const { pool, testConnection } = require('../../config/database');

const migrations = [
  require('./001_create_transactions_table'),
  require('./002_create_mno_config_table'),
  require('./003_create_users_table')
];

const runMigrations = async () => {
  console.log('Starting database migrations...');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('Cannot run migrations: Database connection failed');
    process.exit(1);
  }

  try {
    // Run each migration
    for (const migration of migrations) {
      await migration();
    }
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
