/**
 * RuleEngine.js — Evaluates individual rules against a prompt
 *
 * Runs each rule in RuleDefinitions.RULES and collects:
 *   - which rules matched
 *   - per-rule scores and evidence
 *   - per-factor aggregate scores
 */

import { RULES } from "./RuleDefinitions.js";

/**
 * Evaluate all rules for the given text.
 *
 * @param {string} text   - The prompt/action text to evaluate
 * @returns {RuleEngineResult}
 *
 * @typedef {Object} RuleEngineResult
 * @property {RuleMatch[]} matches         - All triggered rules with details
 * @property {RuleMatch[]} allResults      - Every rule (matched or not)
 * @property {Object}      factorScores    - { keyword: 0.8, pii: 0, pattern: 0.5, length: 0 }
 * @property {string[]}    allEvidence     - Flat list of evidence strings
 */
export const evaluateRules = (text) => {
  if (typeof text !== "string") text = String(text ?? "");

  const matches = [];
  const allResults = [];
  const factorScores = {};

  for (const rule of RULES) {
    const result = rule.test(text);

    const entry = {
      ruleId:   rule.id,
      ruleName: rule.name,
      factor:   rule.factor,
      weight:   rule.weight,
      severity: rule.severity,
      matched:  result.matched,
      score:    result.score,
      evidence: result.evidence,
    };

    allResults.push(entry);

    if (result.matched) {
      matches.push(entry);

      // Track the highest sub-score per factor
      if (factorScores[rule.factor] === undefined || result.score > factorScores[rule.factor]) {
        factorScores[rule.factor] = result.score;
      }
    }
  }

  const allEvidence = matches.flatMap((m) => m.evidence);

  return { matches, allResults, factorScores, allEvidence };
};
