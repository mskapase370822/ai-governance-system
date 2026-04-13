/**
 * services/auth.js — Authentication helper service
 *
 * Provides:
 *   login(credentials)   — POST /api/auth/login, store token
 *   register(data)       — POST /api/auth/register
 *   logout()             — Clear stored token, redirect to /
 *   getToken()           — Read token from localStorage
 *   getUser()            — Decode current user from token
 *   isAuthenticated()    — Check if a valid token exists
 */

import { loginAPI, registerAPI } from "./api";
import { jwtDecode }             from "jwt-decode";

const TOKEN_KEY = "token";

// ── Token storage ─────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// ── User info from token ──────────────────────────────────────────────────────

/**
 * Decode the JWT payload without verification.
 * Returns null if no token or token is malformed.
 */
export const getUser = () => {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

/**
 * Returns true if a token exists and has not expired.
 */
export const isAuthenticated = () => {
  const user = getUser();
  if (!user) return false;
  // exp is in seconds
  return user.exp ? Date.now() / 1000 < user.exp : true;
};

// ── Auth actions ──────────────────────────────────────────────────────────────

/**
 * Log in a user and store the token.
 * @param {{ username: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: Object }>}
 */
export const login = async (credentials) => {
  const res = await loginAPI(credentials);
  const { token } = res.data;
  setToken(token);
  return res.data;
};

/**
 * Register a new user.
 * @param {{ username: string, password: string, role?: string }} data
 * @returns {Promise<Object>}
 */
export const register = async (data) => {
  const res = await registerAPI(data);
  return res.data;
};

/**
 * Log out: remove the token and redirect to the login page.
 */
export const logout = () => {
  removeToken();
  window.location.href = "/";
};

export default { login, register, logout, getToken, setToken, removeToken, getUser, isAuthenticated };
