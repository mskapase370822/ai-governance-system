/**
 * RiskScorer.js — Computes a weighted numeric risk score (0-100)
 *
 * Algorithm:
 *   score = Σ ( rule.weight × rule.score ) × 100
 *
 * Thresholds:
 *   0  – 30  → LOW
 *   31 – 70  → MEDIUM
 *   71 – 100 → HIGH
 */

import { evaluateRules } from "./RuleEngine.js";
import { scoreToBand, RULES } from "./RuleDefinitions.js";

/**
 * Compute a full risk assessment for the given text.
 *
 * @param {string} text             - The prompt to score
 * @param {Object} [context={}]     - Optional contextual hints
 * @param {string} [context.userRole]     - User's role (admin/employee)
 * @param {number} [context.recentCount]  - Number of recent submissions by this user
 * @returns {RiskAssessment}
 *
 * @typedef {Object} RiskAssessment
 * @property {number}   score         - Numeric risk score 0-100
 * @property {string}   riskLevel     - "LOW" | "MEDIUM" | "HIGH"
 * @property {number}   confidence    - 0-1 confidence value (score / 100)
 * @property {string}   reason        - Human-readable summary
 * @property {string[]} riskDetails   - Matched evidence items
 * @property {string}   category      - Prompt category (sql/file-ops/config/…)
 * @property {Object}   factorScores  - Per-factor sub-scores
 * @property {Object[]} triggeredRules- Details of every triggered rule
 */
export const computeRiskScore = (text, context = {}) => {
  const { matches, factorScores, allEvidence } = evaluateRules(text);

  // ── Weighted sum ─────────────────────────────────────────────────────────
  let weightedSum = 0;
  for (const match of matches) {
    weightedSum += match.weight * match.score;
  }

  // ── Context modifier ─────────────────────────────────────────────────────
  // High-frequency users get a slight bump; admins get a small reduction
  let contextModifier = 0;
  if (context.recentCount && context.recentCount > 20) {
    contextModifier += 0.05; // slight uplift for high-frequency submitters
  }
  if ((context.userRole || "").toLowerCase() === "admin") {
    contextModifier -= 0.03; // admins are trusted slightly more
  }

  const rawScore = Math.min(1, Math.max(0, weightedSum + contextModifier));
  const score    = Math.round(rawScore * 100);
  const riskLevel = scoreToBand(score);

  // ── Confidence ────────────────────────────────────────────────────────────
  // Confidence is higher when more rules agree at the same severity
  const highMatches = matches.filter((m) => m.severity === "high").length;
  const baseConf    = rawScore;
  const confidence  = parseFloat(Math.min(0.99, baseConf + highMatches * 0.02).toFixed(2));

  // ── Human-readable reason ─────────────────────────────────────────────────
  let reason;
  if (!matches.length) {
    reason = "No risk indicators detected — prompt appears safe.";
  } else {
    const topRules = matches
      .sort((a, b) => b.weight * b.score - a.weight * a.score)
      .slice(0, 3)
      .map((m) => m.ruleName);
    reason = `Risk triggered by: ${topRules.join(", ")}. Score: ${score}/100.`;
  }

  // ── Category detection ────────────────────────────────────────────────────
  const category = categorizePrompt(text);

  return {
    score,
    riskLevel,
    confidence,
    reason,
    riskDetails: allEvidence.slice(0, 10),
    category,
    factorScores,
    triggeredRules: matches.map((m) => ({
      ruleId:      m.ruleId,
      ruleName:    m.ruleName,
      factor:      m.factor,
      weight:      m.weight,
      score:       m.score,
      severity:    m.severity,
      contribution: parseFloat((m.weight * m.score * 100).toFixed(1)),
      evidence:    m.evidence,
    })),
  };
};

// ── Internal helpers ──────────────────────────────────────────────────────────

function categorizePrompt(text) {
  if (/\b(select|insert|update|delete|drop|alter|create|truncate)\b.*\b(from|table|into|database)\b/i.test(text))
    return "sql";
  if (/\b(rm|del|copy|move|mkdir|chmod|chown|cat|nano|vim|write|read)\b/i.test(text))
    return "file-ops";
  if (/\b(config|setting|env|environment|variable|parameter)\b/i.test(text))
    return "config";
  if (/\b(login|logout|access|permission|role|user|auth|grant|revoke)\b/i.test(text))
    return "access";
  if (/\b(export|import|backup|restore|migrate|transfer|download|upload)\b/i.test(text))
    return "data";
  return "general";
}

export default { computeRiskScore };
