import crypto from "crypto";

/**
 * Hashes a plaintext password using Node.js PBKDF2 with salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;

    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, "sha512")
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Validates password rules:
 * 1. At least 6 characters
 * 2. At least one uppercase English letter (A-Z)
 * 3. At least one digit (0-9)
 * 4. Only English characters (no Hebrew or non-ASCII characters)
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "יש להזין סיסמה" };
  }
  if (password.length < 6) {
    return { valid: false, error: "הסיסמה חייבת להכיל לפחות 6 תווים" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "הסיסמה חייבת להכיל לפחות אות אנגלית גדולה אחת (A-Z)" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "הסיסמה חייבת להכיל לפחות ספרה אחת (0-9)" };
  }
  if (/[^\x00-\x7F]/.test(password)) {
    return { valid: false, error: "הסיסמה חייבת להכיל אותיות באנגלית בלבד (ללא עברית)" };
  }
  return { valid: true };
}
