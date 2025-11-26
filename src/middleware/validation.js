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
    utility_code: Joi.string().optional() // For Selcom
  })
};

/**
 * Validation middleware factory
 */
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

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
