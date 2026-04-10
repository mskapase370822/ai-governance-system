/**
 * Pure-JS Neural Network Risk Model
 * Implements a simple 2-layer feed-forward neural network without external ML dependencies.
 * Trained on historical activity data; persists weights to a JSON file.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.join(__dirname, "riskModelWeights.json");

// ─── Activation functions ──────────────────────────────────────────────────

const sigmoid = (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
const sigmoidDeriv = (y) => y * (1 - y);
const softmax = (arr) => {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
};

// ─── Network dimensions ────────────────────────────────────────────────────
// Inputs: 9 features  →  Hidden: 12 neurons  →  Output: 3 classes (HIGH, MEDIUM, LOW)
const IN = 9;
const HIDDEN = 12;
const OUT = 3;
const LABELS = ["HIGH", "MEDIUM", "LOW"];

// ─── Weight initialisation ─────────────────────────────────────────────────

function randomWeight() {
  return (Math.random() * 2 - 1) * Math.sqrt(2 / IN);
}

function initWeights() {
  return {
    W1: Array.from({ length: HIDDEN }, () => Array.from({ length: IN }, randomWeight)),
    b1: Array(HIDDEN).fill(0),
    W2: Array.from({ length: OUT }, () => Array.from({ length: HIDDEN }, randomWeight)),
    b2: Array(OUT).fill(0),
  };
}

let weights = null;

function loadWeights() {
  if (weights) return weights;
  try {
    if (fs.existsSync(MODEL_PATH)) {
      weights = JSON.parse(fs.readFileSync(MODEL_PATH, "utf8"));
      console.log("🧠 ML model weights loaded from disk");
      return weights;
    }
  } catch (e) {
    console.warn("⚠️  Could not load model weights:", e.message);
  }
  weights = initWeights();
  return weights;
}

function saveWeights(w) {
  try {
    fs.writeFileSync(MODEL_PATH, JSON.stringify(w), "utf8");
  } catch (e) {
    console.error("Failed to save model weights:", e.message);
  }
}

// ─── Feature extraction ────────────────────────────────────────────────────

const HIGH_KEYWORDS = [
  /delete|drop|truncate|destroy/i,
  /password|secret|token|credential/i,
  /hack|exploit|injection|attack/i,
  /root|admin|sudo|privilege/i,
  /exfiltrate|steal|breach|bypass/i,
];

const MED_KEYWORDS = [
  /access|permission|grant|revoke/i,
  /download|export|transfer|copy/i,
  /execute|run|script|command/i,
  /sensitive|confidential|private/i,
];

/**
 * Extract normalised feature vector from activity text + user context.
 * @returns {number[]} length-IN array in [0, 1]
 */
export function extractFeatures(text, userContext = {}) {
  const t = typeof text === "string" ? text : "";
  const lower = t.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);

  const highKeyCount = HIGH_KEYWORDS.filter((r) => r.test(lower)).length;
  const medKeyCount = MED_KEYWORDS.filter((r) => r.test(lower)).length;
  const wordCount = Math.min(words.length / 200, 1);                   // norm to [0,1]
  const charCount = Math.min(t.length / 1000, 1);
  const specialDensity = Math.min((t.match(/[^a-z0-9\s]/gi) || []).length / Math.max(t.length, 1), 1);
  const capsRatio = Math.min((t.match(/[A-Z]/g) || []).length / Math.max(t.length, 1), 1);
  const hasNumbers = /\d/.test(t) ? 1 : 0;
  const roleScore =
    userContext.role === "Admin" ? 0.2 :
    userContext.role === "Manager" ? 0.5 : 1.0;  // employees are higher baseline
  const highKeyNorm = Math.min(highKeyCount / HIGH_KEYWORDS.length, 1);

  return [
    highKeyNorm,
    Math.min(medKeyCount / MED_KEYWORDS.length, 1),
    wordCount,
    charCount,
    specialDensity,
    capsRatio,
    hasNumbers,
    roleScore,
    highKeyCount > 0 ? 1 : 0,
  ];
}

// ─── Forward pass ──────────────────────────────────────────────────────────

function forward(features, W) {
  // Layer 1
  const h = W.W1.map((row, i) => {
    const z = row.reduce((sum, w, j) => sum + w * features[j], 0) + W.b1[i];
    return sigmoid(z);
  });
  // Layer 2 (logits)
  const logits = W.W2.map((row, i) =>
    row.reduce((sum, w, j) => sum + w * h[j], 0) + W.b2[i]
  );
  const probs = softmax(logits);
  return { h, probs };
}

// ─── Training ──────────────────────────────────────────────────────────────

/**
 * Encode label to one-hot vector.
 */
function oneHot(label) {
  const idx = LABELS.indexOf(label.toUpperCase());
  return LABELS.map((_, i) => (i === idx ? 1 : 0));
}

/**
 * Train model on historical activities.
 * @param {Array<{ inputText: string, riskLevel: string, userId: { role: string } }>} activities
 * @returns {{ accuracy: number, loss: number, epochs: number, samples: number }}
 */
export function trainModel(activities) {
  const validActivities = activities.filter(
    (a) => a.inputText && a.riskLevel && LABELS.includes(a.riskLevel.toUpperCase())
  );

  if (validActivities.length < 5) {
    console.warn("⚠️  Not enough training samples (need ≥ 5)");
    return { accuracy: 0, loss: 0, epochs: 0, samples: validActivities.length };
  }

  // Build dataset
  const dataset = validActivities.map((a) => ({
    x: extractFeatures(a.inputText, { role: a.userId?.role }),
    y: oneHot(a.riskLevel),
  }));

  const W = initWeights();
  const lr = 0.05;
  const epochs = 200;
  let lastLoss = 0;

  for (let e = 0; e < epochs; e++) {
    // Shuffle
    for (let i = dataset.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dataset[i], dataset[j]] = [dataset[j], dataset[i]];
    }

    let epochLoss = 0;

    for (const { x, y } of dataset) {
      const { h, probs } = forward(x, W);

      // Cross-entropy loss
      epochLoss -= y.reduce((s, yi, i) => s + yi * Math.log(Math.max(probs[i], 1e-8)), 0);

      // Output delta
      const dOut = probs.map((p, i) => p - y[i]);

      // Backprop W2, b2
      for (let i = 0; i < OUT; i++) {
        for (let j = 0; j < HIDDEN; j++) {
          W.W2[i][j] -= lr * dOut[i] * h[j];
        }
        W.b2[i] -= lr * dOut[i];
      }

      // Hidden delta
      const dHidden = h.map((hv, j) => {
        const grad = W.W2.reduce((s, row, i) => s + row[j] * dOut[i], 0);
        return grad * sigmoidDeriv(hv);
      });

      // Backprop W1, b1
      for (let i = 0; i < HIDDEN; i++) {
        for (let j = 0; j < IN; j++) {
          W.W1[i][j] -= lr * dHidden[i] * x[j];
        }
        W.b1[i] -= lr * dHidden[i];
      }
    }

    lastLoss = epochLoss / dataset.length;
  }

  // Compute training accuracy
  let correct = 0;
  for (const { x, y } of dataset) {
    const { probs } = forward(x, W);
    const pred = probs.indexOf(Math.max(...probs));
    const actual = y.indexOf(1);
    if (pred === actual) correct++;
  }

  weights = W;
  saveWeights(W);

  const accuracy = correct / dataset.length;
  console.log(`🧠 Model trained: ${dataset.length} samples, accuracy=${(accuracy * 100).toFixed(1)}%, loss=${lastLoss.toFixed(4)}`);
  return { accuracy, loss: lastLoss, epochs, samples: dataset.length };
}

// ─── Prediction ────────────────────────────────────────────────────────────

/**
 * Predict risk level for activity text.
 * @param {string} activityText
 * @param {object} userProfile - { role, username }
 * @returns {{ riskLevel: string, confidence: number, probabilities: object }}
 */
export function predictRisk(activityText, userProfile = {}) {
  const W = loadWeights();
  const features = extractFeatures(activityText, userProfile);
  const { probs } = forward(features, W);

  const maxIdx = probs.indexOf(Math.max(...probs));
  const riskLevel = LABELS[maxIdx];
  const confidence = probs[maxIdx];

  return {
    riskLevel,
    confidence,
    probabilities: {
      HIGH: probs[0],
      MEDIUM: probs[1],
      LOW: probs[2],
    },
  };
}

/**
 * Get model stats (weights dimensions, saved status).
 */
export function getModelStats() {
  const W = loadWeights();
  const isTrained = fs.existsSync(MODEL_PATH);
  return {
    architecture: `${IN} → ${HIDDEN} → ${OUT}`,
    labels: LABELS,
    weightsLoaded: !!W,
    trainedModelOnDisk: isTrained,
    parameters: IN * HIDDEN + HIDDEN + HIDDEN * OUT + OUT,
  };
}
