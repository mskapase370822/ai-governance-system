# AI Governance System — API Reference

## Base URL

| Environment | URL                        |
|-------------|----------------------------|
| Development | `http://localhost:5000`    |
| Production  | As configured in FRONTEND_URL |

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

Obtain a token via `POST /api/auth/login`.

---

## v1 API Endpoints

### Prompts

#### Submit a Prompt
```
POST /api/v1/prompts/submit
```
**Auth:** Required  
**Rate limit:** 30 req/min per user

**Request body:**
```json
{
  "action": "string (1–5000 chars)",
  "confirmed": false
}
```

**Response `201`:**
```json
{
  "log": { ... },
  "promptLog": { ... },
  "riskAnalysis": {
    "riskLevel": "LOW | MEDIUM | HIGH",
    "numericScore": 0,
    "confidence": 0.0,
    "reason": "string",
    "riskDetails": ["string"],
    "category": "sql | file-ops | config | access | data | general",
    "factorScores": { "keyword": 0, "pii": 0, "pattern": 0, "length": 0 },
    "triggeredRules": [
      {
        "ruleId": "string",
        "ruleName": "string",
        "factor": "string",
        "weight": 0,
        "score": 0,
        "severity": "high | medium | low",
        "contribution": 0,
        "evidence": ["string"]
      }
    ]
  },
  "explainability": {
    "summary": "string",
    "classification": "LOW | MEDIUM | HIGH",
    "numericScore": 0,
    "scoreLabel": "0 / 100 — LOW RISK",
    "factorBreakdown": [...],
    "topContributors": [...],
    "evidenceList": ["string"],
    "recommendations": ["string"]
  },
  "decision": {
    "status": "allowed | warned | blocked | pending_approval",
    "systemResponse": "string"
  },
  "anomaly": {
    "isAnomaly": false,
    "anomalyReason": ""
  },
  "approvalRequest": null
}
```

#### Confirm a Warned Prompt
```
PUT /api/v1/prompts/confirm/:logId
```
**Auth:** Required  

#### Get My Prompt Logs
```
GET /api/v1/prompts/?page=1&limit=20&riskLevel=HIGH
```
**Auth:** Required  

---

### Alerts

#### List Alerts
```
GET /api/v1/alerts/?type=risk_alert&riskLevel=HIGH&isRead=false&page=1&limit=20
```
**Auth:** Admin only

**Response:**
```json
{
  "alerts": [...],
  "total": 0,
  "page": 1,
  "pages": 1
}
```

#### Get Unread Count
```
GET /api/v1/alerts/unread-count
```
**Auth:** Admin only

#### Mark Alert Read
```
PUT /api/v1/alerts/:id/read
```
**Auth:** Admin only

#### Mark All Alerts Read
```
PUT /api/v1/alerts/read-all
```
**Auth:** Admin only

#### Dismiss Alert
```
PUT /api/v1/alerts/:id/dismiss
```
**Auth:** Admin only

---

### Policies

#### List Policies
```
GET /api/v1/policies/
```
**Auth:** Required

#### Get One Policy
```
GET /api/v1/policies/:id
```
**Auth:** Required

#### Create Policy
```
POST /api/v1/policies/
```
**Auth:** Admin only

**Request body:**
```json
{
  "name": "string",
  "description": "string",
  "type": "block_keywords | time_restriction | role_restriction | rate_limit | custom",
  "isActive": true,
  "blockedKeywords": ["keyword"],
  "priority": 0
}
```

#### Update Policy
```
PUT /api/v1/policies/:id
```
**Auth:** Admin only

#### Toggle Policy (enable/disable)
```
PUT /api/v1/policies/:id/toggle
```
**Auth:** Admin only

#### Delete Policy
```
DELETE /api/v1/policies/:id
```
**Auth:** Admin only

---

### Analytics

#### Dashboard Stats
```
GET /api/v1/analytics/dashboard
```
**Auth:** Admin only

#### My Stats
```
GET /api/v1/analytics/me
```
**Auth:** Required

#### Risk Score Distribution
```
GET /api/v1/analytics/risk-score
```
**Auth:** Admin only

**Response:**
```json
{
  "scoreBuckets": [...],
  "scoreTrend": [...],
  "topRules": [...]
}
```

#### Explainability for a Log
```
GET /api/v1/analytics/explainability/:logId
```
**Auth:** Admin only

---

### Admin

#### List Users
```
GET /api/v1/admin/users
```
**Auth:** Admin only

#### Update User Role
```
PUT /api/v1/admin/users/:id/role
```
**Auth:** Admin only

**Request body:**
```json
{ "role": "admin | employee | manager" }
```

#### Audit Logs
```
GET /api/v1/admin/audit-logs?actorId=&action=&entity=&startDate=&endDate=&page=1&limit=50
```
**Auth:** Admin only

#### Prompt Logs (with explainability)
```
GET /api/v1/admin/prompt-logs?page=1&limit=20&riskLevel=HIGH&minScore=70&maxScore=100
```
**Auth:** Admin only

#### System Stats
```
GET /api/v1/admin/system-stats
```
**Auth:** Admin only

---

## Health Endpoints

### Liveness Check
```
GET /health
```
No auth required.

**Response `200`:**
```json
{
  "status": "ok",
  "service": "ai-governance-backend",
  "timestamp": "ISO-8601"
}
```

### Readiness Check
```
GET /health/detailed
```
No auth required.

**Response:**
```json
{
  "status": "healthy | degraded",
  "timestamp": "ISO-8601",
  "uptime": "5m 30s",
  "database": { "connected": true, "state": "connected" },
  "memory": { "heapUsed": "45 MB", "heapTotal": "64 MB", "rss": "72 MB" },
  "system": { "platform": "linux", "nodeVersion": "v20.x", "cpus": 2 }
}
```

---

## Risk Scoring

### Algorithm

```
Score = Σ (rule.weight × rule.score) × 100   ∈ [0, 100]

Risk Level:
  0  – 30  → LOW
  31 – 70  → MEDIUM
  71 – 100 → HIGH
```

### Rule Factors

| Factor   | Rules                      | Max Weight |
|----------|----------------------------|------------|
| keyword  | High-risk & medium keywords | 0.40       |
| pii      | PII pattern detection       | 0.25       |
| pattern  | Injection & code detection  | 0.30       |
| length   | Prompt length analysis      | 0.05       |

### Risk Levels

| Score   | Level  | Action                |
|---------|--------|-----------------------|
| 0–30    | LOW    | Allow                 |
| 31–70   | MEDIUM | Warn, require confirm |
| 71–100  | HIGH   | Block, escalate       |

---

## Error Responses

All errors follow this format:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning                            |
|--------|------------------------------------|
| 400    | Bad request / validation error     |
| 401    | Not authenticated                  |
| 403    | Insufficient permissions           |
| 404    | Resource not found                 |
| 422    | Validation failed (field errors)   |
| 429    | Rate limit exceeded                |
| 500    | Internal server error              |
