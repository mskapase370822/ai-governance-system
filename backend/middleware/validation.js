/**
 * middleware/validation.js — Re-exports common validation helpers
 *
 * Centralises express-validator usage so routes only need one import.
 *
 * Usage:
 *   import { body, validateRequest } from "../middleware/validation.js";
 *
 *   router.post("/", [ body("name").notEmpty() ], validateRequest, handler);
 */

export { body, param, query, header } from "express-validator";
export { validateRequest } from "./validateRequest.js";
