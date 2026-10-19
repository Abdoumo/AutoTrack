/**
 * AuraTrack — Production Security Validators & Sanitizers
 * Defensive input validation against injection, overflows, and DoS.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate and clean email address.
 * Neutralizes CRLF (\r\n) injection attacks for email and logging.
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const clean = email.trim().toLowerCase();
  if (clean.length > 254 || clean.includes('\r') || clean.includes('\n')) return null;
  if (!EMAIL_REGEX.test(clean)) return null;
  return clean;
}

/**
 * Validate password length and type.
 * Max 128 characters protects bcrypt against CPU exhaustion / DoS attacks.
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 128;
}

/**
 * Validate name string (no control chars, safe length)
 */
function validateName(name) {
  if (!name || typeof name !== 'string') return null;
  const clean = name.trim().replace(/[\x00-\x1F\x7F]/g, '');
  if (clean.length === 0 || clean.length > 100) return null;
  return clean;
}

/**
 * Validate UUID format (v4 / standard)
 */
function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  return UUID_REGEX.test(uuid.trim());
}

/**
 * Validate positive quantity or weight
 */
function validatePositiveNumber(val, min = 0, max = 1000000000) {
  const num = parseFloat(val);
  if (isNaN(num) || !isFinite(num) || num < min || num > max) {
    return null;
  }
  return parseFloat(num.toFixed(2));
}

/**
 * Validate unit
 */
function validateUnit(unit) {
  const valid = ['kg', 'piece'];
  return valid.includes(unit) ? unit : 'kg';
}

/**
 * Validate user role
 */
function validateRole(role) {
  const valid = ['admin', 'user'];
  return valid.includes(role) ? role : 'user';
}

/**
 * Validate date string
 */
function validateDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  if (year < 2020 || year > 2100) return null;
  return d.toISOString();
}

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  isValidUUID,
  validatePositiveNumber,
  validateUnit,
  validateRole,
  validateDate,
};
