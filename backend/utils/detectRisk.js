/**
 * Rule-Based Risk Detection Engine
 *
 * HIGH   : drop, delete, truncate, remove, shutdown, export, grant, revoke
 * MEDIUM : update, modify, change, insert
 * LOW    : everything else
 */

const HIGH_RISK_WORDS = ["drop", "delete", "truncate", "remove", "shutdown", "export", "grant", "revoke"];
const MEDIUM_RISK_WORDS = ["update", "modify", "change", "insert"];

/**
 * Categorize the action type
 */
export const categorizeAction = (action) => {
  const lower = action.toLowerCase();
  if (/\b(select|insert|update|delete|drop|alter|create|truncate)\b.*\b(from|table|into|database)\b/.test(lower)) {
    return "sql";
  }
  if (/\b(rm|del|copy|move|mkdir|chmod|chown|cat|nano|vim|write|read)\b/.test(lower)) {
    return "file-ops";
  }
  if (/\b(config|setting|env|environment|variable|parameter)\b/.test(lower)) {
    return "config";
  }
  if (/\b(login|logout|access|permission|role|user|auth|grant|revoke)\b/.test(lower)) {
    return "access";
  }
  if (/\b(export|import|backup|restore|migrate|transfer|download|upload)\b/.test(lower)) {
    return "data";
  }
  return "general";
};

/**
 * Detect risk level using keyword-based rule engine.
 *
 * @param {string} action
 * @returns {{ riskLevel: string, reason: string, riskDetails: string[], category: string }}
 */
export const detectRisk = (action) => {
  const lower = (typeof action === "string" ? action : String(action ?? "")).toLowerCase();

  const highHits = HIGH_RISK_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
  if (highHits.length > 0) {
    return {
      riskLevel: "HIGH",
      reason: `High-risk keyword(s) detected: ${highHits.join(", ")}.`,
      riskDetails: highHits.map((w) => `High-risk keyword: "${w}"`),
      category: categorizeAction(action),
    };
  }

  const mediumHits = MEDIUM_RISK_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
  if (mediumHits.length > 0) {
    return {
      riskLevel: "MEDIUM",
      reason: `Medium-risk keyword(s) detected: ${mediumHits.join(", ")}.`,
      riskDetails: mediumHits.map((w) => `Medium-risk keyword: "${w}"`),
      category: categorizeAction(action),
    };
  }

  return {
    riskLevel: "LOW",
    reason: "Action appears safe — no risk indicators found.",
    riskDetails: [],
    category: categorizeAction(action),
  };
};
