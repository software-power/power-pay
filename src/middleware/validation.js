const Joi = require('joi');

/**
 * Validation schemas
 */
const schemas = {
  verifyPayment: Joi.object({
    reference: Joi.string().required().min(5).max(100),
    mno_provider: Joi.string().required().valid('STANBIC', 'SELCOM', 'stanbic', 'selcom'),
    client_system: Joi.string().optional().max(100),
    client_reference: Joi.string().optional().max(100),
    utility_code: Joi.string().optional() // For Selcom
  }),

  processPayment: Joi.object({
    reference: Joi.string().required().min(5).max(100),
    amount: Joi.number().required().positive(),
    mno_provider: Joi.string().required().valid('STANBIC', 'SELCOM', 'stanbic', 'selcom'),
    client_system: Joi.string().optional().max(100),
    client_reference: Joi.string().optional().max(100),
    payer_name: Joi.string().optional().max(255),
    payer_phone: Joi.string().optional().max(20),
    payer_email: Joi.string().email().optional(),
    payment_desc: Joi.string().optional().max(500),
    channel: Joi.string().optional().max(50),
    currency: Joi.string().optional().length(3).default('TZS'),
    amount_type: Joi.string().optional().valid('FULL', 'FLEXIBLE', 'FIXED'),
    acc_opt: Joi.string().optional(),
    utility_code: Joi.string().optional(), // For Selcom
    
    // NEW: Bypass MNO posting option
    bypass_mno: Joi.boolean().optional().default(false),
    control_number: Joi.string().optional().max(100) // Optional control number
  }),

  // Validation schema for callback from MNO
  mnoCallback: Joi.object({
    reference: Joi.string().required(),
    amount: Joi.number().positive().optional(),
    receipt_number: Joi.string().optional(),
    status: Joi.string().required().valid('SUCCESS', 'FAILED', 'PENDING'),
    payment_date: Joi.string().optional(),
    payer_name: Joi.string().optional(),
    payer_phone: Joi.string().optional(),
    mno_provider: Joi.string().optional(),
    checksum: Joi.string().optional(), // For security verification
    callback_data: Joi.object().optional() // Any additional MNO data
  }),

  // Stanbic Lookup Request
  stanbicLookup: Joi.object({
    reference: Joi.string().required().min(5).max(100),
    institutionId: Joi.string().required().max(100),
    checksum: Joi.string().required().length(64), // SHA256 hex
    token: Joi.string().required()
  }),

  // Stanbic Callback Request
  stanbicCallback: Joi.object({
    reference: Joi.string().required().min(5).max(100),
    amount: Joi.number().required().positive(),
    institutionId: Joi.string().required().max(100),
    payerName: Joi.string().optional().max(255),
    payType: Joi.string().optional().max(50),
    amountType: Joi.string().optional().valid('FULL', 'FLEXIBLE', 'FIXED'),
    currency: Joi.string().optional().length(3).default('TZS'),
    paymentDesc: Joi.string().optional().max(500),
    payerPhone: Joi.string().optional().max(20),
    channel: Joi.string().optional().max(50),
    transactionDate: Joi.string().optional().isoDate(),
    transactionId: Joi.string().optional().max(100),
    checksum: Joi.string().required().length(64) // SHA256 hex
  })
};

/**
 * Validation middleware factory
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    console.log(process.env.STANBIC_TOKEN)

    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Validation schema not found'
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

module.exports = { validate };
