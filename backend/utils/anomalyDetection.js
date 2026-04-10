/**
 * Anomaly Detection Engine
 * Tracks user behavior over time and detects unusual patterns
 */
import User from "../models/User.js";
import Log from "../models/Log.js";

/**
 * Update user behavior profile after each action
 */
export const updateBehaviorProfile = async (userId, riskLevel) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const profile = user.behaviorProfile || {
      avgActionsPerDay: 0,
      avgRiskScore: 0,
      totalActions: 0,
      highRiskCount: 0,
      recentRiskLevels: [],
    };

    // Update counters
    profile.totalActions += 1;
    if (riskLevel === "HIGH") profile.highRiskCount += 1;

    // Update recent risk levels (keep last 20)
    const recentLevels = [...(profile.recentRiskLevels || []), riskLevel].slice(-20);
    profile.recentRiskLevels = recentLevels;

    // Calculate average risk score
    const riskScores = { LOW: 0.1, MEDIUM: 0.5, HIGH: 1.0 };
    const avgScore =
      recentLevels.reduce((sum, l) => sum + (riskScores[l] || 0), 0) /
      (recentLevels.length || 1);
    profile.avgRiskScore = parseFloat(avgScore.toFixed(3));

    // Calculate avg actions per day
    const daysSinceCreation = Math.max(
      1,
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    profile.avgActionsPerDay = parseFloat(
      (profile.totalActions / daysSinceCreation).toFixed(2)
    );

    profile.lastActivityAt = new Date();

    user.behaviorProfile = profile;
    await user.save();
  } catch (err) {
    console.error("Error updating behavior profile:", err.message);
  }
};

/**
 * Detect anomalies in user behavior
 * Returns { isAnomaly, anomalyReason } 
 */
export const detectAnomaly = async (userId, currentRiskLevel) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { isAnomaly: false, anomalyReason: "" };

    const profile = user.behaviorProfile || {};
    const anomalies = [];

    // 1. Sudden high-risk action from normally safe user
    if (
      currentRiskLevel === "HIGH" &&
      profile.avgRiskScore < 0.3 &&
      profile.totalActions > 5
    ) {
      anomalies.push(
        "Sudden high-risk action from a normally low-risk user (avg risk score: " +
          profile.avgRiskScore + ")"
      );
    }

    // 2. Rapid burst of actions (rate anomaly)
    const recentLogs = await Log.find({
      userId,
      timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // last 5 minutes
    }).countDocuments();

    if (recentLogs > 10) {
      anomalies.push(
        `Unusual activity burst: ${recentLogs} actions in the last 5 minutes`
      );
    }

    // 3. Multiple high-risk actions in short period
    const recentHighRisk = await Log.find({
      userId,
      riskLevel: "HIGH",
      timestamp: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // last 30 min
    }).countDocuments();

    if (recentHighRisk >= 3) {
      anomalies.push(
        `Pattern of high-risk actions: ${recentHighRisk} high-risk actions in the last 30 minutes`
      );
    }

    // 4. Activity outside normal hours (if user typically active 9-6)
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      anomalies.push(`Action performed at unusual hour: ${currentHour}:00`);
    }

    // 5. Sudden spike compared to average daily activity
    if (
      profile.avgActionsPerDay > 0 &&
      profile.totalActions > 10
    ) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayActions = await Log.find({
        userId,
        timestamp: { $gte: todayStart },
      }).countDocuments();

      if (todayActions > profile.avgActionsPerDay * 3) {
        anomalies.push(
          `Activity spike: ${todayActions} actions today vs. avg ${profile.avgActionsPerDay}/day`
        );
      }
    }

    return {
      isAnomaly: anomalies.length > 0,
      anomalyReason: anomalies.join("; "),
    };
  } catch (err) {
    console.error("Error detecting anomaly:", err.message);
    return { isAnomaly: false, anomalyReason: "" };
  }
};
