const crypto = require('crypto');

/**
 * Generate MD5 hash
 * @param {string} data - Data to hash
 * @returns {string} - MD5 hash
 */
const md5Hash = (data) => {
  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Generate SHA256 hash
 * @param {string} data - Data to hash
 * @returns {string} - SHA256 hash
 */
const sha256Hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate checksum for Stanbic Bank API
 * Checksum = sha256(token + md5(reference))
 * @param {string} token - Shared token
 * @param {string} reference - Control number/payment reference
 * @returns {string} - Generated checksum
 */
const generateStanbicChecksum = (token, reference) => {
  const md5Reference = md5Hash(reference);
  const checksum = sha256Hash(token + md5Reference);
  return checksum;
};

/**
 * Validate Stanbic checksum
 * @param {string} token - Shared token
 * @param {string} reference - Control number
 * @param {string} checksum - Checksum to validate
 * @returns {boolean} - True if valid
 */
const validateStanbicChecksum = (token, reference, checksum) => {
  const expectedChecksum = generateStanbicChecksum(token, reference);
  return expectedChecksum === checksum;
};

/**
 * Generate HMAC SHA256 for Selcom API
 * @param {string} apiSecret - API secret
 * @param {string} data - Data to sign
 * @returns {string} - Base64 encoded HMAC
 */
const generateSelcomDigest = (apiSecret, data) => {
  const hmac = crypto.createHmac('sha256', apiSecret);
  hmac.update(data);
  return hmac.digest('base64');
};

/**
 * Generate signed fields data for Selcom
 * @param {string} timestamp - ISO 8601 timestamp
 * @param {Object} fields - Fields object
 * @returns {string} - Formatted data string
 */
const generateSelcomSignedData = (timestamp, fields) => {
  let data = `timestamp=${timestamp}`;
  for (const [key, value] of Object.entries(fields)) {
    data += `&${key}=${value}`;
  }
  return data;
};

module.exports = {
  md5Hash,
  sha256Hash,
  generateStanbicChecksum,
  validateStanbicChecksum,
  generateSelcomDigest,
  generateSelcomSignedData
};
