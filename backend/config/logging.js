/**
 * logging.js — Application-wide logging configuration
 *
 * Uses Node's built-in console for simplicity.
 * Structured log entries include timestamp, level, and optional context.
 *
 * Usage:
 *   import logger from "../config/logging.js";
 *   logger.info("Server started", { port: 5000 });
 *   logger.warn("Slow response", { ms: 1200 });
 *   logger.error("DB error", { err: error.message });
 */

import config from "./environment.js";

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[config.logLevel] ?? LEVELS.info;

const format = (level, message, context) => {
  const ts   = new Date().toISOString();
  const ctx  = context && Object.keys(context).length ? ` ${JSON.stringify(context)}` : "";
  return `[${ts}] [${level.toUpperCase()}] ${message}${ctx}`;
};

const log = (level, message, context = {}) => {
  if ((LEVELS[level] ?? 0) > currentLevel) return;

  const output = format(level, message, context);
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
};

const logger = {
  error: (msg, ctx)  => log("error", msg, ctx),
  warn:  (msg, ctx)  => log("warn",  msg, ctx),
  info:  (msg, ctx)  => log("info",  msg, ctx),
  debug: (msg, ctx)  => log("debug", msg, ctx),
};

export default logger;
