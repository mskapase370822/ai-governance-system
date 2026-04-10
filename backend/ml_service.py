# ml_service.py — Enhanced AI Risk Classification Service
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI(title="AI Governance Risk Classifier")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskRequest(BaseModel):
    prompt_length: int = 0
    contains_code: bool = False
    user_dept: str = "general"
    action_text: str = ""

# Weighted risk indicators
HIGH_RISK_INDICATORS = [
    (r"\b(drop|delete|truncate|destroy|wipe|format)\b.*\b(table|database|disk|all|data)\b", 0.9),
    (r"\b(hack|exploit|inject|xss|phishing|malware|ransomware)\b", 0.95),
    (r"\b(password|secret|api.?key|private.?key|access.?token)\b", 0.8),
    (r"\b(rm\s+-rf|sudo|cmd\.exe|powershell|eval|exec)\b", 0.9),
    (r"\b(bypass|unauthorized|escalat|backdoor|brute.?force)\b", 0.85),
    (r"\b\d{3}-?\d{2}-?\d{4}\b", 0.75),  # SSN pattern
    (r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", 0.8),  # Credit card
]

MEDIUM_RISK_INDICATORS = [
    (r"\b(salary|confidential|internal|proprietary|financial)\b", 0.6),
    (r"\b(customer.?data|personal.?info|user.?data|employee)\b", 0.55),
    (r"\b(export|download|backup|transfer|bulk)\b.*\b(data|database|records)\b", 0.5),
    (r"\b(admin|config|setting|permission|access|grant)\b", 0.45),
    (r"\b(update|alter|modify)\b.*\b(table|config|system|server)\b", 0.5),
]

@app.post("/predict-risk")
def predict_risk(data: RiskRequest):
    text = data.action_text.lower() if data.action_text else ""
    
    high_score = 0.0
    medium_score = 0.0
    reasons = []
    
    # Check high-risk patterns
    for pattern, weight in HIGH_RISK_INDICATORS:
        if re.search(pattern, text, re.IGNORECASE):
            high_score = max(high_score, weight)
            match = re.search(pattern, text, re.IGNORECASE)
            reasons.append(f"High-risk pattern: '{match.group()}'")
    
    # Check medium-risk patterns
    for pattern, weight in MEDIUM_RISK_INDICATORS:
        if re.search(pattern, text, re.IGNORECASE):
            medium_score = max(medium_score, weight)
            match = re.search(pattern, text, re.IGNORECASE)
            reasons.append(f"Sensitive pattern: '{match.group()}'")
    
    # Additional heuristics
    if data.contains_code:
        medium_score = max(medium_score, 0.4)
        reasons.append("Contains code patterns")
    
    if data.prompt_length > 500:
        medium_score = max(medium_score, 0.35)
        reasons.append("Unusually long action text")
    
    # Determine final classification
    if high_score >= 0.7:
        risk_level = "HIGH"
        confidence = high_score
    elif high_score >= 0.4 or medium_score >= 0.5:
        risk_level = "MEDIUM"
        confidence = max(high_score, medium_score)
    else:
        risk_level = "LOW"
        confidence = max(0.3, 1.0 - max(high_score, medium_score))
    
    reason_text = "; ".join(reasons[:3]) if reasons else "No significant risk indicators found"
    
    return {
        "risk_level": risk_level,
        "confidence": round(confidence, 2),
        "reason": f"AI Analysis: {reason_text}",
    }

@app.get("/predict-risk")
def health_check():
    return {"status": "ok", "service": "AI Risk Classifier"}

@app.get("/")
def root():
    return {"status": "ok", "service": "AI Governance ML Service"}
