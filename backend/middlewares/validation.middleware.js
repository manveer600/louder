/**
 * Validation Middleware
 * Request validation utilities
 */

const { EMAIL_REGEX, MESSAGES } = require('../utils/constants');

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, message: MESSAGES.INVALID_EMAIL };
  }

  return { valid: true };
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id) => {
  if (!id) {
    return { valid: false, message: 'ID is required' };
  }

  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    return { valid: false, message: 'Invalid ID format' };
  }

  return { valid: true };
};

/**
 * Validate email capture request
 */
const validateEmailCapture = (req, res, next) => {
  const { email, eventId, consentGiven } = req.body;

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({
      success: false,
      message: emailValidation.message
    });
  }

  // Validate event ID
  const idValidation = validateObjectId(eventId);
  if (!idValidation.valid) {
    return res.status(400).json({
      success: false,
      message: idValidation.message
    });
  }

  // Validate consent
  if (consentGiven !== true) {
    return res.status(400).json({
      success: false,
      message: MESSAGES.CONSENT_REQUIRED
    });
  }

  next();
};

module.exports = {
  validateEmail,
  validateObjectId,
  validateEmailCapture
};

