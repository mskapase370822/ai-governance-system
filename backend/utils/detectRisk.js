/**
 * Rule-Based Risk Detection Engine
 * Layer 1: Pattern matching, keyword detection, and predefined policies
 */

const HIGH_RISK_KEYWORDS = [
  // Data destruction
  "drop table", "delete from", "truncate table", "drop database",
  "delete all", "remove all", "destroy", "wipe data", "format disk",
  "overwrite system", "overwrite config",
  // System commands
  "exec(", "eval(", "cmd.exe", "powershell", "rm -rf", "sudo rm",
  "shutdown", "reboot server", "kill process",
  // Security threats
  "hack", "exploit", "vulnerability", "injection", "xss",
  "phishing", "malware", "ransomware", "brute force", "backdoor",
  // Credential exposure
  "password", "passwd", "secret key", "api_key", "apikey", "api key",
  "private key", "access token", "bearer token", "ssh key",
  // Sensitive data
  "ssn", "social security", "credit card number", "bank account",
  // Unauthorized access
  "unauthorized access", "bypass authentication", "disable security",
  "escalate privilege", "root access", "admin override",
];

const MEDIUM_RISK_KEYWORDS = [
  // Business sensitive
  "employee", "salary", "internal", "confidential",
  "revenue", "financial", "proprietary", "trade secret",
  "customer data", "user data", "personal information",
  "database", "production server", "admin panel",
  // Moderate operations
  "update table", "alter table", "modify config",
  "export data", "download database", "bulk delete",
  "change permissions", "modify access", "grant access",
  "transfer funds", "payment processing",
];

const PII_PATTERNS = [
  { name: "email address", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { name: "phone number", regex: /\b(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/ },
  { name: "SSN", regex: /\b\d{3}-?\d{2}-?\d{4}\b/ },
  { name: "credit card", regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/ },
  { name: "IP address", regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { name: "API key pattern", regex: /\b(sk|pk|key|token|secret)[-_]?[a-zA-Z0-9]{16,}\b/i },
];

// Dangerous command patterns
const DANGEROUS_PATTERNS = [
  { name: "SQL injection attempt", regex: /(\b(union\s+select|or\s+1\s*=\s*1|'--|\bxp_|;\s*drop|;\s*delete)\b)/i },
  { name: "Path traversal", regex: /\.\.\//g },
  { name: "Script injection", regex: /<script[\s>]/i },
  { name: "Command injection", regex: /[;&|`$]\s*(cat|ls|dir|whoami|id|env|set)\b/i },
];

/**
 * Categorize the action type
 */
export const categorizeAction = (action) => {
  const lower = action.toLowerCase();
  if (/\b(select|insert|update|delete|drop|alter|create|truncate)\b.*\b(from|table|into|database)\b/i.test(action)) {
    return "sql";
  }
  if (/\b(rm|del|copy|move|mkdir|chmod|chown|cat|nano|vim|write|read)\b/i.test(action)) {
    return "file-ops";
  }
  if (/\b(config|setting|env|environment|variable|parameter)\b/i.test(action)) {
    return "config";
  }
  if (/\b(login|logout|access|permission|role|user|auth|grant|revoke)\b/i.test(action)) {
    return "access";
  }
  if (/\b(export|import|backup|restore|migrate|transfer|download|upload)\b/i.test(action)) {
    return "data";
  }
  return "general";
};

/**
 * Detect risk level using rule-based engine
 */
export const detectRisk = (action) => {
  const risks = [];
  const lower = action.toLowerCase();

  // Check high-risk keywords
  for (const kw of HIGH_RISK_KEYWORDS) {
    if (lower.includes(kw)) {
      risks.push({ severity: "high", detail: `Dangerous keyword "${kw}" detected` });
    }
  }

  // Check medium-risk keywords
  for (const kw of MEDIUM_RISK_KEYWORDS) {
    if (lower.includes(kw)) {
      risks.push({ severity: "medium", detail: `Sensitive keyword "${kw}" detected` });
    }
  }

  // Check PII patterns
  for (const { name, regex } of PII_PATTERNS) {
    if (regex.test(action)) {
      risks.push({ severity: "high", detail: `${name} pattern detected — possible data exposure` });
    }
  }

  // Check dangerous patterns
  for (const { name, regex } of DANGEROUS_PATTERNS) {
    if (regex.test(action)) {
      risks.push({ severity: "high", detail: `${name} detected` });
    }
  }

  // Check action length (very long prompts can be suspicious)
  if (action.length > 500) {
    risks.push({ severity: "medium", detail: "Unusually long action text detected" });
  }

  // Determine overall risk level and confidence
  const highCount = risks.filter((r) => r.severity === "high").length;
  const mediumCount = risks.filter((r) => r.severity === "medium").length;

  let riskLevel = "LOW";
  let confidence = 0.3;
  let reason = "Action appears safe — no risk indicators found.";

  if (highCount > 0) {
    riskLevel = "HIGH";
    confidence = Math.min(0.95, 0.7 + highCount * 0.05);
    reason = `${highCount} high-risk indicator(s) found: ${risks
      .filter((r) => r.severity === "high")
      .map((r) => r.detail)
      .slice(0, 3)
      .join("; ")}`;
  } else if (mediumCount > 0) {
    riskLevel = "MEDIUM";
    confidence = Math.min(0.85, 0.5 + mediumCount * 0.07);
    reason = `${mediumCount} medium-risk indicator(s) found: ${risks
      .filter((r) => r.severity === "medium")
      .map((r) => r.detail)
      .slice(0, 3)
      .join("; ")}`;
  }

  return {
    riskLevel,
    confidence: parseFloat(confidence.toFixed(2)),
    reason,
    riskDetails: risks.map((r) => r.detail),
    category: categorizeAction(action),
  };
};
