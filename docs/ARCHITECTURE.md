# AI Governance System — Architecture Overview

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (React / Vite)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────┐  ┌────────────┐  │
│  │  Dashboard  │  │PromptSubmit  │  │Alerts  │  │ Policies   │  │
│  └──────┬──────┘  └──────┬───────┘  └───┬────┘  └─────┬──────┘  │
│         └───────────────┬┴──────────────┘              │         │
│                  services/api.js (axios)                │         │
│                  services/auth.js (JWT)                 │         │
└──────────────────────────┬──────────────────────────────┘         
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                      Backend (Node.js / Express)                  │
│                                                                   │
│  ┌─── Routes ───────────────────────────────────────────────┐    │
│  │  /api/v1/prompts   /api/v1/alerts   /api/v1/policies     │    │
│  │  /api/v1/analytics /api/v1/admin    /health              │    │
│  │  + Legacy /api/* routes (backward-compat)                │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                     │
│  ┌─── Middleware ───────────▼─────────────────────────────────┐  │
│  │  helmet | cors | requestLogger | rateLimiters              │  │
│  │  auth (JWT) | validateRequest | errorHandler               │  │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                     │
│  ┌─── Services ─────────────▼─────────────────────────────────┐  │
│  │  PromptService     AlertService    AuditService             │  │
│  │  PolicyService                                              │  │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                     │
│  ┌─── Core Engine ──────────▼─────────────────────────────────┐  │
│  │  RuleDefinitions  RuleEngine  RiskScorer  Explainability   │  │
│  │  PromptValidator  TokenManager  Encryption  RateLimiter    │  │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                     │
│  ┌─── Models ───────────────▼─────────────────────────────────┐  │
│  │  PromptLog  Log  Alert  AuditLog  Policy  User             │  │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                     │
│  ┌─── Jobs ─────────────────▼─────────────────────────────────┐  │
│  │  AlertProcessor (every 5min)                               │  │
│  │  AnalyticsAggregator (every hour)                          │  │
│  └──────────────────────────┬───────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                   ┌───────────▼────────────┐
                   │     MongoDB Atlas       │
                   │  Collections:           │
                   │  promptlogs, logs,      │
                   │  alerts, auditlogs,     │
                   │  policies, users        │
                   └────────────────────────┘
```

## Directory Structure

```
ai-governance-system/
├── backend/
│   ├── app.js                    # Express app factory
│   ├── server.js                 # Entry point (DB + server start)
│   ├── config/
│   │   ├── database.js           # MongoDB connection helper
│   │   ├── environment.js        # Env var config object
│   │   └── logging.js            # Structured logger
│   ├── core/
│   │   ├── riskEngine/
│   │   │   ├── RuleDefinitions.js    # Rule data (keywords, patterns, weights)
│   │   │   ├── RuleEngine.js         # Rule evaluation
│   │   │   ├── RiskScorer.js         # Weighted 0-100 score calculation
│   │   │   └── ExplainabilityEngine.js # Human-readable explanations
│   │   ├── validator/
│   │   │   └── PromptValidator.js    # Input sanitisation middleware
│   │   └── security/
│   │       ├── RateLimiter.js        # Per-user & per-key rate limiters
│   │       ├── TokenManager.js       # JWT create/verify helpers
│   │       └── Encryption.js         # AES-256-GCM field encryption
│   ├── models/
│   │   ├── PromptLog.js          # Enhanced log with explainability
│   │   ├── Log.js                # Legacy log (backward compat)
│   │   ├── Alert.js              # Risk/anomaly alerts
│   │   ├── AuditLog.js           # Compliance audit trail
│   │   ├── Policy.js             # Organisation policies
│   │   └── User.js               # User accounts
│   ├── services/
│   │   ├── PromptService.js      # Full prompt processing pipeline
│   │   ├── AlertService.js       # Alert CRUD
│   │   ├── AuditService.js       # Audit log queries
│   │   └── PolicyService.js      # Policy CRUD
│   ├── routes/
│   │   ├── health.js             # /health endpoints
│   │   └── v1/
│   │       ├── prompts.js        # /api/v1/prompts
│   │       ├── alerts.js         # /api/v1/alerts
│   │       ├── policies.js       # /api/v1/policies
│   │       ├── analytics.js      # /api/v1/analytics
│   │       └── admin.js          # /api/v1/admin
│   ├── middleware/
│   │   ├── auth.js               # Re-export of authMiddleware
│   │   ├── errorHandler.js       # Centralised error handler
│   │   ├── requestLogger.js      # Structured request logging
│   │   ├── validation.js         # express-validator helpers
│   │   ├── authMiddleware.js     # JWT + role guards
│   │   ├── rateLimiters.js       # Express rate limiters
│   │   └── validateRequest.js    # Validation result middleware
│   ├── jobs/
│   │   ├── AlertProcessor.js     # Cron: auto-dismiss, WebSocket push
│   │   └── AnalyticsAggregator.js# Cron: hourly stats + spike detection
│   └── controllers/              # Legacy controllers (thin HTTP handlers)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Dashboard/         # Re-export barrel
│       │   ├── PromptSubmission/  # Re-export barrel
│       │   ├── AlertCenter/       # Re-export barrel
│       │   ├── Analytics/         # Re-export barrel
│       │   └── PolicyManager/     # Re-export barrel
│       ├── services/
│       │   ├── api.js             # Axios API client
│       │   └── auth.js            # Auth helpers (login/logout/decode)
│       └── pages/                 # Page-level components
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
└── docker-compose.yml
```

## Risk Scoring Engine

### Algorithm

```
Risk Score = Σ (rule.weight × rule.score) × 100

Where:
  rule.score  ∈ [0, 1]   (how strongly the rule matched)
  rule.weight ∈ [0, 1]   (importance of the rule)
  Total Score ∈ [0, 100]

Risk Bands:
  0  – 30  → LOW    (allow)
  31 – 70  → MEDIUM (warn)
  71 – 100 → HIGH   (block)
```

### Rule Factors

| Factor ID          | Weight | Description                              |
|--------------------|--------|------------------------------------------|
| `keyword_high`     | 0.30   | Dangerous keywords (destroy, hack, etc.) |
| `keyword_medium`   | 0.10   | Sensitive business keywords              |
| `pii_detection`    | 0.25   | PII patterns (email, SSN, credit card)   |
| `dangerous_pattern`| 0.20   | SQL injection, command injection, etc.   |
| `code_detection`   | 0.10   | Code/script patterns                     |
| `prompt_length`    | 0.05   | Unusually long prompts                   |

### Processing Pipeline

```
User Input
    │
    ▼
PromptValidator      ← Sanitise, length check, control chars
    │
    ▼
RuleEngine           ← Evaluate each rule → score + evidence
    │
    ▼
RiskScorer           ← Σ (weight × score) × 100 = 0-100 score
    │
    ▼
ExplainabilityEngine ← Factor breakdown, recommendations, summary
    │
    ▼
PolicyEngine         ← Check org policies (keywords, time, role, rate)
    │
    ▼
RBAC Decision        ← allow / warn / block based on role + risk
    │
    ▼
AnomalyDetector      ← Detect unusual frequency patterns
    │
    ▼
PromptLog + Log      ← Persist with full explainability data
    │
    ▼
Alert + WebSocket    ← Notify admin in real-time
```

## Security Architecture

| Layer                | Implementation                              |
|----------------------|---------------------------------------------|
| Transport            | HTTPS (via reverse proxy / TLS termination) |
| Headers              | Helmet (CSP, HSTS, X-Frame-Options, etc.)   |
| Authentication       | JWT (HS256, configurable expiry)            |
| Authorisation        | Role-based: admin / employee / manager      |
| Rate Limiting        | Per-IP (general), per-user (submit), per-API-key |
| Input Validation     | express-validator + PromptValidator         |
| Input Sanitisation   | Null-byte removal, control char stripping   |
| Audit Trail          | AuditLog model for every admin action       |
| Field Encryption     | AES-256-GCM via Encryption.js               |
| Password Hashing     | bcrypt (12 rounds)                          |

## Data Flow: Prompt Submission

```
Browser → POST /api/actions/submit (or /api/v1/prompts/submit)
         │
         ├─ JWT auth middleware
         ├─ Rate limit check
         ├─ PromptValidator (sanitise)
         ├─ RiskScorer (0-100 weighted score)
         ├─ ExplainabilityEngine (factor breakdown)
         ├─ PolicyEngine (org policies)
         ├─ RBAC decision (allow/warn/block)
         ├─ AnomalyDetector (frequency)
         ├─ PromptLog.create() (full data)
         ├─ Log.create() (backward-compat)
         ├─ Alert.create() (if MEDIUM/HIGH)
         ├─ io.emit("risk_alert") (WebSocket)
         └─ Response 201 with full analysis
```
