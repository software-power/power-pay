const { pool } = require('../../config/database');

/**
 * Migration: Add partial payment tracking
 * Adds columns to support FLEXIBLE amount type payments
 */

const addPartialPaymentColumns = async () => {
  const query = `
    ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0.00 AFTER amount,
    ADD COLUMN IF NOT EXISTS payment_count INT DEFAULT 0 AFTER total_paid,
    ADD COLUMN IF NOT EXISTS is_fully_paid BOOLEAN DEFAULT FALSE AFTER payment_count,
    ADD COLUMN IF NOT EXISTS partial_payments JSON AFTER is_fully_paid;
  `;

  try {
    await pool.query(query);
    console.log('✓ Added partial payment tracking columns');
    console.log('  • total_paid: Tracks cumulative payments');
    console.log('  • payment_count: Number of partial payments');
    console.log('  • is_fully_paid: Whether full amount received');
    console.log('  • partial_payments: JSON array of payment records');
  } catch (error) {
    console.error('Error adding partial payment columns:', error);
    throw error;
  }
};

const run = async () => {
  try {
    console.log('Running migration: Add partial payment tracking...');
    await addPartialPaymentColumns();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  run();
}

module.exports = { addPartialPaymentColumns };
