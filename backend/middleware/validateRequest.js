import { validationResult } from "express-validator";

/**
 * Reads the results of any express-validator checks that ran before this
 * middleware and returns a 422 with an array of error messages if any failed.
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};
