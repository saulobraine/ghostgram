/**
 * Shared validators for GhostGram
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  if (password.length < 8) {
    return false;
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber;
}

/**
 * Validate Instagram username format
 * 1-30 characters, letters, numbers, periods, underscores
 */
export function isValidInstagramUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validate Instagram user ID format
 * Numeric string
 */
export function isValidInstagramUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  
  return /^\d+$/.test(userId);
}

/**
 * Validate display name
 * 1-50 characters, any characters except special control chars
 */
export function isValidDisplayName(displayName: string): boolean {
  if (!displayName || typeof displayName !== 'string') {
    return false;
  }
  
  const trimmed = displayName.trim();
  return trimmed.length >= 1 && trimmed.length <= 50;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize username (remove @ symbol if present)
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    return '';
  }
  
  return username.trim().replace(/^@/, '');
}

/**
 * Validate positive integer
 */
export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Validate non-negative integer
 */
export function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Validate enum value
 */
export function isValidEnumValue<T extends Record<string, string>>(
  value: string,
  enumObj: T
): value is T[keyof T] {
  return Object.values(enumObj).includes(value);
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate registration data
 */
export function validateRegistrationData(data: {
  email: string;
  password: string;
  displayName?: string;
}): ValidationResult {
  const errors: string[] = [];
  
  if (!isValidEmail(data.email)) {
    errors.push('errors.invalid_data');
  }
  
  if (!isValidPassword(data.password)) {
    errors.push('auth.password_required');
  }
  
  if (data.displayName && !isValidDisplayName(data.displayName)) {
    errors.push('errors.invalid_data');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate login data
 */
export function validateLoginData(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: string[] = [];
  
  if (!isValidEmail(data.email)) {
    errors.push('auth.email_required');
  }
  
  if (!data.password || data.password.length === 0) {
    errors.push('auth.password_required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
