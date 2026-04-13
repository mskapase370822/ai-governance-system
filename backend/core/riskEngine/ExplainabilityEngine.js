/**
 * ExplainabilityEngine.js — Generates human-readable explanations for risk assessments
 *
 * For each risk assessment, produces:
 *   - A structured explanation with factor breakdown
 *   - Natural-language reasoning
 *   - Actionable recommendations
 *   - Visual score breakdown (for API/UI consumers)
 */

import { RISK_THRESHOLDS } from "./RuleDefinitions.js";

/**
 * Generate a full explainability report for a risk assessment.
 *
 * @param {Object} assessment  - Output from RiskScorer.computeRiskScore()
 * @param {Object} [context]   - Optional context (userId, userRole, timestamp)
 * @returns {ExplainabilityReport}
 *
 * @typedef {Object} ExplainabilityReport
 * @property {string}         summary          - One-line human summary
 * @property {string}         classification   - "LOW" | "MEDIUM" | "HIGH"
 * @property {number}         numericScore     - 0–100
 * @property {string}         scoreLabel       - e.g. "71 / 100 — HIGH RISK"
 * @property {FactorBreakdown[]} factorBreakdown - Per-factor details
 * @property {RuleContribution[]} topContributors - Rules with highest contribution
 * @property {string[]}       evidenceList     - Raw evidence items
 * @property {string[]}       recommendations  - Actionable next steps
 * @property {Object}         thresholds       - Band boundary info
 */
export const generateExplanation = (assessment, context = {}) => {
  const { score, riskLevel, triggeredRules = [], riskDetails = [], factorScores = {} } = assessment;

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = buildSummary(riskLevel, score, triggeredRules.length);

  // ── Score label ───────────────────────────────────────────────────────────
  const scoreLabel = `${score} / 100 — ${riskLevel} RISK`;

  // ── Factor breakdown ──────────────────────────────────────────────────────
  const factorBreakdown = buildFactorBreakdown(triggeredRules, factorScores);

  // ── Top contributors ──────────────────────────────────────────────────────
  const topContributors = (triggeredRules || [])
    .slice()
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5)
    .map((r) => ({
      ruleId:       r.ruleId,
      ruleName:     r.ruleName,
      factor:       r.factor,
      severity:     r.severity,
      contribution: r.contribution,
      evidence:     r.evidence,
      explanation:  buildRuleExplanation(r),
    }));

  // ── Recommendations ───────────────────────────────────────────────────────
  const recommendations = buildRecommendations(riskLevel, triggeredRules, context);

  return {
    summary,
    classification: riskLevel,
    numericScore: score,
    scoreLabel,
    factorBreakdown,
    topContributors,
    evidenceList: riskDetails,
    recommendations,
    thresholds: RISK_THRESHOLDS,
  };
};

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildSummary(riskLevel, score, ruleCount) {
  if (ruleCount === 0) {
    return "This prompt contains no detected risk indicators and is classified as LOW RISK.";
  }
  const ruleWord = ruleCount === 1 ? "rule" : "rules";
  switch (riskLevel) {
    case "HIGH":
      return `This prompt scored ${score}/100 and triggered ${ruleCount} risk ${ruleWord}. It is classified as HIGH RISK and may require blocking or admin review.`;
    case "MEDIUM":
      return `This prompt scored ${score}/100 and triggered ${ruleCount} risk ${ruleWord}. It is classified as MEDIUM RISK and should be reviewed before proceeding.`;
    default:
      return `This prompt scored ${score}/100 and triggered ${ruleCount} minor risk ${ruleWord}. It is classified as LOW RISK.`;
  }
}

function buildFactorBreakdown(triggeredRules, factorScores) {
  // Group triggered rules by factor
  const factorMap = {};
  for (const rule of triggeredRules) {
    if (!factorMap[rule.factor]) {
      factorMap[rule.factor] = { factor: rule.factor, rules: [], totalContribution: 0 };
    }
    factorMap[rule.factor].rules.push(rule);
    factorMap[rule.factor].totalContribution += rule.contribution;
  }

  return Object.values(factorMap).map((group) => ({
    factor:            group.factor,
    label:             FACTOR_LABELS[group.factor] || group.factor,
    rulesTriggered:    group.rules.length,
    totalContribution: parseFloat(group.totalContribution.toFixed(1)),
    subScore:          parseFloat((factorScores[group.factor] || 0).toFixed(2)),
    rules:             group.rules.map((r) => r.ruleName),
  }));
}

function buildRuleExplanation(rule) {
  const contrib = rule.contribution.toFixed(1);
  return `"${rule.ruleName}" contributed ${contrib} points to the risk score (weight=${rule.weight}, sub-score=${rule.score.toFixed(2)}).`;
}

function buildRecommendations(riskLevel, triggeredRules, context) {
  const recs = [];
  const factors = [...new Set(triggeredRules.map((r) => r.factor))];

  if (riskLevel === "HIGH") {
    recs.push("🚫 Block this prompt — it contains high-risk content that may compromise security.");
    recs.push("📋 Create an admin review task for this submission.");
  } else if (riskLevel === "MEDIUM") {
    recs.push("⚠️  Warn the user and require explicit confirmation before proceeding.");
    recs.push("📝 Log this interaction for the compliance audit trail.");
  }

  if (factors.includes("pii")) {
    recs.push("🔒 PII detected — ensure no sensitive data is sent to external AI services.");
  }
  if (factors.includes("pattern")) {
    recs.push("🛡️  Potential injection attack — sanitize and validate all inputs.");
  }
  if (factors.includes("keyword") && riskLevel !== "LOW") {
    recs.push("📌 Review your organization's AI usage policy for restricted keywords.");
  }
  if (factors.includes("length")) {
    recs.push("📏 Unusually long prompt — consider breaking it into smaller, focused requests.");
  }

  if (recs.length === 0) {
    recs.push("✅ No specific action required. Continue monitoring as part of regular governance.");
  }

  return recs;
}

const FACTOR_LABELS = {
  keyword: "Keyword Detection",
  pii:     "PII / Sensitive Data",
  pattern: "Dangerous Patterns",
  length:  "Prompt Length",
  context: "Contextual Signals",
};

export default { generateExplanation };
