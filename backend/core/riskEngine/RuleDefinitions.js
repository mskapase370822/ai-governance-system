/**
 * RuleDefinitions.js — Dynamic Risk Rule Repository
 *
 * Rules are data-driven objects with:
 *   - id        : unique rule identifier
 *   - name      : human-readable label
 *   - factor    : logical grouping (keyword | pii | pattern | length | context)
 *   - weight    : contribution to final score  ∈ [0, 1]
 *   - severity  : "high" | "medium" | "low"
 *   - test(text): function returning { matched: bool, evidence: string[] }
 *
 * Final score formula:
 *   score = Σ ( rule.weight × rule.score ) × 100   ∈ [0, 100]
 *   LOW  :  0 – 30
 *   MEDIUM: 31 – 70
 *   HIGH : 71 – 100
 */

// ── Keyword lists ─────────────────────────────────────────────────────────────

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
  // Sensitive data identifiers
  "ssn", "social security", "credit card number", "bank account",
  // Unauthorized access
  "unauthorized access", "bypass authentication", "disable security",
  "escalate privilege", "root access", "admin override",
];

const MEDIUM_RISK_KEYWORDS = [
  "employee", "salary", "internal", "confidential",
  "revenue", "financial", "proprietary", "trade secret",
  "customer data", "user data", "personal information",
  "database", "production server", "admin panel",
  "update table", "alter table", "modify config",
  "export data", "download database", "bulk delete",
  "change permissions", "modify access", "grant access",
  "transfer funds", "payment processing",
];

// ── PII patterns ──────────────────────────────────────────────────────────────

const PII_PATTERNS = [
  { name: "email address",   regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { name: "phone number",    regex: /\b(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/ },
  { name: "SSN",             regex: /\b\d{3}-?\d{2}-?\d{4}\b/ },
  { name: "credit card",     regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/ },
  { name: "IP address",      regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { name: "API key pattern", regex: /\b(sk|pk|key|token|secret)[-_]?[a-zA-Z0-9]{16,}\b/i },
];

// ── Dangerous injection / command patterns ────────────────────────────────────

const DANGEROUS_PATTERNS = [
  { name: "SQL injection",     regex: /(\b(union\s+select|or\s+1\s*=\s*1|'--|;\s*drop|;\s*delete|xp_)\b)/i },
  { name: "path traversal",    regex: /\.\.\//g },
  { name: "script injection",  regex: /<script[\s>]/i },
  { name: "command injection", regex: /[;&|`$]\s*(cat|ls|dir|whoami|id|env|set)\b/i },
  { name: "LDAP injection",    regex: /[()=*|&]{3,}/ },
  { name: "template injection",regex: /\{\{.*\}\}|\$\{.*\}/ },
];

// ── Rule definitions ─────────────────────────────────────────────────────────

/**
 * Each rule returns { matched, score ∈ [0,1], evidence[] }
 */
export const RULES = [
  // ── Factor: HIGH-RISK KEYWORD (weight 0.30) ────────────────────────────────
  {
    id: "keyword_high",
    name: "High-Risk Keyword Match",
    factor: "keyword",
    weight: 0.30,
    severity: "high",
    test(text) {
      const lower = text.toLowerCase();
      const hits = HIGH_RISK_KEYWORDS.filter((kw) => lower.includes(kw));
      if (!hits.length) return { matched: false, score: 0, evidence: [] };
      // More hits → higher sub-score, capped at 1
      const score = Math.min(1, 0.6 + hits.length * 0.1);
      return {
        matched: true,
        score,
        evidence: hits.map((kw) => `High-risk keyword: "${kw}"`),
      };
    },
  },

  // ── Factor: MEDIUM-RISK KEYWORD (weight 0.10) ─────────────────────────────
  {
    id: "keyword_medium",
    name: "Medium-Risk Keyword Match",
    factor: "keyword",
    weight: 0.10,
    severity: "medium",
    test(text) {
      const lower = text.toLowerCase();
      const hits = MEDIUM_RISK_KEYWORDS.filter((kw) => lower.includes(kw));
      if (!hits.length) return { matched: false, score: 0, evidence: [] };
      const score = Math.min(1, 0.4 + hits.length * 0.08);
      return {
        matched: true,
        score,
        evidence: hits.map((kw) => `Sensitive keyword: "${kw}"`),
      };
    },
  },

  // ── Factor: PII DETECTION (weight 0.25) ───────────────────────────────────
  {
    id: "pii_detection",
    name: "PII / Sensitive Data Detection",
    factor: "pii",
    weight: 0.25,
    severity: "high",
    test(text) {
      const hits = PII_PATTERNS.filter(({ regex }) => regex.test(text));
      if (!hits.length) return { matched: false, score: 0, evidence: [] };
      return {
        matched: true,
        score: Math.min(1, 0.7 + hits.length * 0.1),
        evidence: hits.map(({ name }) => `PII detected: ${name}`),
      };
    },
  },

  // ── Factor: DANGEROUS PATTERN (weight 0.20) ───────────────────────────────
  {
    id: "dangerous_pattern",
    name: "Dangerous Injection / Command Pattern",
    factor: "pattern",
    weight: 0.20,
    severity: "high",
    test(text) {
      const hits = DANGEROUS_PATTERNS.filter(({ regex }) => regex.test(text));
      if (!hits.length) return { matched: false, score: 0, evidence: [] };
      return {
        matched: true,
        score: Math.min(1, 0.75 + hits.length * 0.08),
        evidence: hits.map(({ name }) => `Dangerous pattern: ${name}`),
      };
    },
  },

  // ── Factor: PROMPT LENGTH (weight 0.05) ───────────────────────────────────
  {
    id: "prompt_length",
    name: "Prompt Length Analysis",
    factor: "length",
    weight: 0.05,
    severity: "low",
    test(text) {
      const len = text.length;
      if (len > 2000)  return { matched: true, score: 1.0, evidence: [`Very long prompt (${len} chars) — possible obfuscation attempt`] };
      if (len > 1000)  return { matched: true, score: 0.6, evidence: [`Long prompt (${len} chars)`] };
      if (len > 500)   return { matched: true, score: 0.3, evidence: [`Above-average prompt length (${len} chars)`] };
      return { matched: false, score: 0, evidence: [] };
    },
  },

  // ── Factor: CODE DETECTION (weight 0.10) ──────────────────────────────────
  {
    id: "code_detection",
    name: "Code / Script Detection",
    factor: "pattern",
    weight: 0.10,
    severity: "medium",
    test(text) {
      const codeRegex = /[{}();=<>]|(\b(function|const|let|var|import|class|def|return|import os|subprocess|System\.exec)\b)/i;
      if (!codeRegex.test(text)) return { matched: false, score: 0, evidence: [] };
      return {
        matched: true,
        score: 0.5,
        evidence: ["Code or scripting patterns detected"],
      };
    },
  },
];

/**
 * Default factor weights used by RiskScorer.
 * Keys match the `factor` field in RULES above.
 * Weights across all rules already sum to 1.0.
 */
export const FACTOR_WEIGHTS = {
  keyword: 0.40,  // keyword_high (0.30) + keyword_medium (0.10)
  pii:     0.25,
  pattern: 0.30,  // dangerous_pattern (0.20) + code_detection (0.10)
  length:  0.05,
};

/**
 * Risk band thresholds for the 0-100 numeric score
 */
export const RISK_THRESHOLDS = {
  LOW:    { min: 0,  max: 30  },
  MEDIUM: { min: 31, max: 70  },
  HIGH:   { min: 71, max: 100 },
};

/**
 * Get the risk level label from a numeric score
 */
export const scoreToBand = (score) => {
  if (score >= RISK_THRESHOLDS.HIGH.min)   return "HIGH";
  if (score >= RISK_THRESHOLDS.MEDIUM.min) return "MEDIUM";
  return "LOW";
};
