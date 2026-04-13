/**
 * Encryption.js — Utility helpers for hashing, comparing, and field encryption
 *
 * Uses bcryptjs for password hashing.
 * Field-level encryption uses AES-256-GCM via Node's built-in `crypto` module
 * (no extra dependencies required).
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS     = 12;
const ALGORITHM       = "aes-256-gcm";
const IV_LENGTH       = 16; // bytes
const AUTH_TAG_LENGTH = 16; // bytes
const KEY_LENGTH      = 32; // bytes (256 bit)

// ── Password hashing ──────────────────────────────────────────────────────────

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} bcrypt hash
 */
export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Compare a plain-text password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);

// ── Field-level encryption ────────────────────────────────────────────────────

/**
 * Derive a 32-byte key from the ENCRYPTION_KEY environment variable.
 * Falls back to a warning key if not set (development only).
 */
const getEncryptionKey = () => {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY environment variable is required in production.");
    }
    // In development, derive a stable key from a default phrase
    return crypto.scryptSync("dev-fallback-key", "salt", KEY_LENGTH);
  }
  // If the key looks like hex (64 chars), use it directly; otherwise scrypt-derive it
  if (/^[0-9a-f]{64}$/i.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }
  return crypto.scryptSync(envKey, "ai-governance-salt", KEY_LENGTH);
};

/**
 * Encrypt a UTF-8 string value.
 * Returns a base64-encoded string: iv:authTag:ciphertext
 *
 * @param {string} plaintext
 * @returns {string}
 */
export const encrypt = (plaintext) => {
  const key    = getEncryptionKey();
  const iv     = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag   = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
};

/**
 * Decrypt a string produced by `encrypt()`.
 *
 * @param {string} ciphertext  - "iv:authTag:data" (base64 parts)
 * @returns {string}           - Decrypted plain-text
 */
export const decrypt = (ciphertext) => {
  const [ivB64, authTagB64, dataB64] = ciphertext.split(":");
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error("Invalid ciphertext format.");
  }

  const key      = getEncryptionKey();
  const iv       = Buffer.from(ivB64, "base64");
  const authTag  = Buffer.from(authTagB64, "base64");
  const data     = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
};

export default { hashPassword, comparePassword, encrypt, decrypt };
