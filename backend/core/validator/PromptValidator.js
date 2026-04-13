/**
 * PromptValidator.js — Input validation and sanitization for prompts
 *
 * Validates:
 *   - Presence and type of prompt text
 *   - Character length limits
 *   - Null-byte / control-character injection prevention
 *   - Basic content sanitization
 */

const MAX_PROMPT_LENGTH = 5000;
const MIN_PROMPT_LENGTH = 1;

/**
 * Validate and sanitize a raw prompt string.
 *
 * @param {*}      raw    - The raw input value
 * @returns {{ valid: boolean, sanitized: string, error: string|null }}
 */
export const validatePrompt = (raw) => {
  // Type check
  if (raw === null || raw === undefined) {
    return { valid: false, sanitized: "", error: "Prompt is required." };
  }

  // Coerce to string
  const text = String(raw);

  // Strip null-bytes and control characters (except newline/tab)
  const sanitized = text
    .replace(/\0/g, "")
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();

  // Length checks
  if (sanitized.length < MIN_PROMPT_LENGTH) {
    return { valid: false, sanitized: "", error: "Prompt cannot be empty." };
  }

  if (sanitized.length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      sanitized: "",
      error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters.`,
    };
  }

  return { valid: true, sanitized, error: null };
};

/**
 * Express middleware that validates req.body.action (or req.body.prompt)
 * and replaces it with the sanitized version.
 */
export const validatePromptMiddleware = (req, res, next) => {
  const raw = req.body?.action ?? req.body?.prompt;
  const { valid, sanitized, error } = validatePrompt(raw);

  if (!valid) {
    return res.status(400).json({ error });
  }

  // Overwrite with sanitized value (supports both field names)
  if (req.body.action !== undefined) req.body.action = sanitized;
  if (req.body.prompt !== undefined) req.body.prompt = sanitized;

  next();
};

export default { validatePrompt, validatePromptMiddleware };
