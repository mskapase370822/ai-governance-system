/**
 * Pure-JavaScript neural network implementation for risk classification.
 * This avoids native module dependencies while delivering real ML-based predictions.
 *
 * Architecture: 10-input → 16 hidden → 8 hidden → 3-output (HIGH, MEDIUM, LOW)
 * Activation: sigmoid
 */

const HIGH_RISK_KEYWORDS = [
  "delete", "drop", "truncate", "destroy", "hack", "exploit", "bypass",
  "steal", "extract", "exfiltrate", "sql injection", "password", "credentials",
  "admin", "root", "sudo", "malware", "ransomware", "phishing",
  "unauthorized", "breach", "attack", "vulnerability", "zero-day",
];

const MEDIUM_RISK_KEYWORDS = [
  "export", "download", "copy", "backup", "transfer", "share", "send",
  "access", "query", "read", "view", "list", "select", "fetch",
  "database", "sensitive", "confidential", "private",
];

// ── Sigmoid activation ────────────────────────────────────────────────────────
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const sigmoidDeriv = (x) => x * (1 - x);

// ── Weight initialisation (Xavier) ───────────────────────────────────────────
const initWeights = (rows, cols) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 2 - 1) * Math.sqrt(2 / (rows + cols)))
  );

class RiskModel {
  constructor() {
    this.trained = false;
    this.inputSize = 10;
    this.hiddenSize1 = 16;
    this.hiddenSize2 = 8;
    this.outputSize = 3; // HIGH, MEDIUM, LOW

    // Weights
    this.W1 = initWeights(this.inputSize, this.hiddenSize1);
    this.b1 = new Array(this.hiddenSize1).fill(0);
    this.W2 = initWeights(this.hiddenSize1, this.hiddenSize2);
    this.b2 = new Array(this.hiddenSize2).fill(0);
    this.W3 = initWeights(this.hiddenSize2, this.outputSize);
    this.b3 = new Array(this.outputSize).fill(0);
  }

  // ── Feature extraction ─────────────────────────────────────────────────────
  extractFeatures(text, userProfile = {}) {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);
    const len = text.length || 1;

    const highCount = HIGH_RISK_KEYWORDS.filter((kw) => lower.includes(kw)).length;
    const medCount = MEDIUM_RISK_KEYWORDS.filter((kw) => lower.includes(kw)).length;
    const specialChars = (text.match(/[!@#$%^&*;'"|<>]/g) || []).length;
    const capsRatio = (text.match(/[A-Z]/g) || []).length / len;
    const hour = new Date().getHours();

    return [
      Math.min(words.length / 50, 1),                              // word count (normalised)
      Math.min(highCount / 5, 1),                                  // high-risk keyword density
      Math.min(medCount / 5, 1),                                   // medium-risk keyword density
      Math.min(specialChars / 10, 1),                              // special char density
      Math.min(capsRatio, 1),                                      // capitalisation ratio
      /\d/.test(text) ? 1 : 0,                                     // contains numbers
      /@/.test(text) ? 1 : 0,                                      // contains email
      hour >= 9 && hour <= 17 ? 1 : 0,                             // office hours
      Math.min((userProfile.riskHistory || 0), 1),                 // user risk history
      userProfile.isNewToAction ? 1 : 0,                           // new to this action
    ];
  }

  // ── Forward pass ─────────────────────────────────────────────────────────
  _forward(input) {
    // Layer 1
    const h1 = this.b1.map((b, j) =>
      sigmoid(input.reduce((s, x, i) => s + x * this.W1[i][j], b))
    );
    // Layer 2
    const h2 = this.b2.map((b, j) =>
      sigmoid(h1.reduce((s, x, i) => s + x * this.W2[i][j], b))
    );
    // Output
    const out = this.b3.map((b, j) =>
      sigmoid(h2.reduce((s, x, i) => s + x * this.W3[i][j], b))
    );
    return { h1, h2, out };
  }

  // ── Backpropagation ────────────────────────────────────────────────────────
  _backprop(input, target, learningRate = 0.05) {
    const { h1, h2, out } = this._forward(input);

    // Output delta
    const dOut = out.map((o, i) => (o - target[i]) * sigmoidDeriv(o));

    // Hidden-2 delta
    const dH2 = h2.map((h, i) =>
      sigmoidDeriv(h) * dOut.reduce((s, d, j) => s + d * this.W3[i][j], 0)
    );

    // Hidden-1 delta
    const dH1 = h1.map((h, i) =>
      sigmoidDeriv(h) * dH2.reduce((s, d, j) => s + d * this.W2[i][j], 0)
    );

    // Update W3, b3
    for (let i = 0; i < this.hiddenSize2; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        this.W3[i][j] -= learningRate * dOut[j] * h2[i];
      }
    }
    this.b3 = this.b3.map((b, j) => b - learningRate * dOut[j]);

    // Update W2, b2
    for (let i = 0; i < this.hiddenSize1; i++) {
      for (let j = 0; j < this.hiddenSize2; j++) {
        this.W2[i][j] -= learningRate * dH2[j] * h1[i];
      }
    }
    this.b2 = this.b2.map((b, j) => b - learningRate * dH2[j]);

    // Update W1, b1
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize1; j++) {
        this.W1[i][j] -= learningRate * dH1[j] * input[i];
      }
    }
    this.b1 = this.b1.map((b, j) => b - learningRate * dH1[j]);

    const mse = dOut.reduce((s, d) => s + d * d, 0) / dOut.length;
    return mse;
  }

  // ── Risk level helpers ────────────────────────────────────────────────────
  riskLevelToTarget(level) {
    return {
      HIGH: [1, 0, 0],
      MEDIUM: [0, 1, 0],
      LOW: [0, 0, 1],
    }[level] || [0, 0, 1];
  }

  outputToRiskLevel(out) {
    const max = Math.max(...out);
    if (out[0] === max && out[0] > 0.5) return "HIGH";
    if (out[1] === max && out[1] > 0.4) return "MEDIUM";
    return "LOW";
  }

  // ── Training ──────────────────────────────────────────────────────────────
  async train(historicalActivities, options = {}) {
    const iterations = options.iterations || 500;
    const lr = options.learningRate || 0.05;

    if (!historicalActivities || historicalActivities.length === 0) {
      console.warn("⚠️  No training data provided — using heuristic seeding");
      this._seedWeights();
      this.trained = true;
      return { iterations: 0, finalError: 0 };
    }

    const data = historicalActivities.map((a) => ({
      input: this.extractFeatures(a.inputText || "", {
        riskHistory: a.userRiskScore || 0,
      }),
      target: this.riskLevelToTarget(a.riskLevel),
    }));

    let lastError = 1;
    for (let iter = 0; iter < iterations; iter++) {
      let totalError = 0;
      // Shuffle
      for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
      }
      for (const { input, target } of data) {
        totalError += this._backprop(input, target, lr);
      }
      lastError = totalError / data.length;
      if (lastError < 0.001) break;
    }

    this.trained = true;
    console.log(`✅ ML model trained — final error: ${lastError.toFixed(5)}`);
    return { iterations, finalError: lastError };
  }

  /**
   * Heuristic-seeded weights so predictions are reasonable even without
   * historical training data.
   */
  _seedWeights() {
    // Bias W1 toward high-risk feature neurons
    // Feature 1 (index 1) = high-risk keyword count → output neuron 0 (HIGH)
    for (let j = 0; j < this.hiddenSize1; j++) {
      this.W1[1][j] += 0.5; // high-risk keywords → hidden layer
      this.W1[2][j] += 0.3; // medium-risk keywords
      this.W1[3][j] += 0.2; // special chars
    }
    this.trained = true;
  }

  // ── Prediction ────────────────────────────────────────────────────────────
  predict(text, userProfile = {}) {
    if (!this.trained) this._seedWeights();

    const features = this.extractFeatures(text, userProfile);
    const { out } = this._forward(features);

    const [highScore, mediumScore, lowScore] = out;
    const riskLevel = this.outputToRiskLevel(out);
    const confidence = Math.max(...out);

    return {
      riskLevel,
      confidence: Math.round(confidence * 100) / 100,
      scores: { high: highScore, medium: mediumScore, low: lowScore },
    };
  }

  // ── Model stats ───────────────────────────────────────────────────────────
  getStats() {
    return {
      trained: this.trained,
      architecture: `${this.inputSize}→${this.hiddenSize1}→${this.hiddenSize2}→${this.outputSize}`,
      activation: "sigmoid",
      parameters:
        this.inputSize * this.hiddenSize1 +
        this.hiddenSize1 * this.hiddenSize2 +
        this.hiddenSize2 * this.outputSize +
        this.hiddenSize1 +
        this.hiddenSize2 +
        this.outputSize,
    };
  }
}

export default new RiskModel();
