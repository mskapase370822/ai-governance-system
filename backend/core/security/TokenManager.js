/**
 * TokenManager.js — JWT token creation, verification, and expiry handling
 *
 * Centralises all JWT logic so token behaviour (expiry, algorithm, etc.)
 * can be adjusted in one place without touching controllers or middleware.
 */

import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRY  = process.env.JWT_EXPIRES_IN  || "1d";
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Sign an access token for a user.
 *
 * @param {Object} payload   - Data to embed (typically { id, role })
 * @returns {string}         - Signed JWT string
 */
export const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

/**
 * Sign a refresh token.
 *
 * @param {Object} payload
 * @returns {string}
 */
export const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

/**
 * Verify an access token and return its decoded payload.
 * Throws a TokenExpiredError or JsonWebTokenError on failure.
 *
 * @param {string} token
 * @returns {Object} decoded payload
 */
export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

/**
 * Verify a refresh token.
 *
 * @param {string} token
 * @returns {Object} decoded payload
 */
export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

/**
 * Decode a token WITHOUT verifying the signature.
 * Useful for extracting the payload from an expired token.
 *
 * @param {string} token
 * @returns {Object|null}
 */
export const decodeToken = (token) => jwt.decode(token);

/**
 * Check if a token is expired without throwing.
 *
 * @param {string} token
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return false;
  } catch (err) {
    return err.name === "TokenExpiredError";
  }
};

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
};
