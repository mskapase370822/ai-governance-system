import axios from "axios";
import { detectRisk } from "./detectRisk.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Call the Python ML service to analyze text risk.
 * Falls back to the local rule-based engine if the service is unavailable.
 *
 * @param {string} text - The user input text to analyze
 * @returns {{ riskLevel: string, confidence: number, reason: string }}
 */
export const analyzeRisk = async (text) => {
  // Layer 1: Local rule-based detection (always runs)
  const ruleResult = detectRisk(text);

  // Layer 2: ML service (best-effort, 3-second timeout)
  try {
    const hasProgrammingPatterns =
      /[{}();=<>]/.test(text) ||
      /\b(function|const|let|var|import|class|def|return)\b/i.test(text);

    const res = await axios.post(
      `${ML_SERVICE_URL}/predict-risk`,
      {
        prompt_length: text.length,
        contains_code: hasProgrammingPatterns,
        user_dept: "general",
        action_text: text,
      },
      { timeout: 3000 }
    );

    const mlRiskLevel = res.data.risk_level || "LOW";
    const mlConfidence = res.data.confidence || 0.5;
    const mlReason = res.data.reason || "AI classification";

    // Take the higher of the two risk levels
    const riskOrder = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    if (riskOrder[mlRiskLevel] > riskOrder[ruleResult.riskLevel]) {
      return {
        riskLevel: mlRiskLevel,
        confidence: Math.max(ruleResult.confidence, mlConfidence),
        reason: `${mlReason}. Rule engine: ${ruleResult.reason}`,
      };
    }

    return {
      riskLevel: ruleResult.riskLevel,
      confidence: Math.max(ruleResult.confidence, mlConfidence),
      reason: ruleResult.reason,
    };
  } catch {
    // ML service unavailable — use rule-based result only
    return {
      riskLevel: ruleResult.riskLevel,
      confidence: ruleResult.confidence,
      reason: ruleResult.reason,
    };
  }
};
