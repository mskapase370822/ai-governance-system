import { detectRisk } from "./detectRisk.js";

/**
 * Analyze risk for the given text using the keyword-based rule engine.
 *
 * @param {string} text - The user input text to analyze
 * @returns {{ riskLevel: string, reason: string, riskDetails: string[], category: string }}
 */
export const analyzeRisk = async (text) => {
  return detectRisk(text);
};
