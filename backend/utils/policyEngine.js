/**
 * Policy Engine — Evaluates actions against custom policies
 * Supports: keyword blocking, time restrictions, role constraints, rate limiting
 */
import Policy from "../models/Policy.js";
import Log from "../models/Log.js";

/**
 * Evaluate all active policies against a user action
 * Returns { allowed, violations[], requiresApproval }
 */
export const evaluatePolicies = async (action, user) => {
  const violations = [];
  let requiresApproval = false;
  let shouldBlock = false;

  try {
    const policies = await Policy.find({ isActive: true }).sort({ priority: -1 });

    for (const policy of policies) {
      switch (policy.type) {
        case "block_keywords": {
          const lower = action.toLowerCase();
          for (const keyword of policy.blockedKeywords || []) {
            if (lower.includes(keyword.toLowerCase())) {
              violations.push({
                policyName: policy.name,
                reason: `Blocked keyword "${keyword}" detected`,
                severity: "block",
              });
              shouldBlock = true;
            }
          }
          break;
        }

        case "time_restriction": {
          if (policy.timeRestriction?.enabled) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentDay = now.getDay();
            const { allowedStartHour, allowedEndHour, allowedDays } = policy.timeRestriction;

            const dayAllowed = !allowedDays?.length || allowedDays.includes(currentDay);
            const hourAllowed = currentHour >= allowedStartHour && currentHour < allowedEndHour;

            if (!dayAllowed || !hourAllowed) {
              violations.push({
                policyName: policy.name,
                reason: `Action outside allowed time window (${allowedStartHour}:00–${allowedEndHour}:00, ${
                  allowedDays?.length ? "restricted days" : "all days"
                })`,
                severity: "block",
              });
              shouldBlock = true;
            }
          }
          break;
        }

        case "role_restriction": {
          if (policy.roleRestriction?.enabled && user?.role) {
            const blockedRoles = policy.roleRestriction.blockedRoles || [];
            const actionPattern = policy.roleRestriction.action || "";

            if (
              blockedRoles.includes(user.role) &&
              (!actionPattern || action.toLowerCase().includes(actionPattern.toLowerCase()))
            ) {
              violations.push({
                policyName: policy.name,
                reason: `Role "${user.role}" is restricted from this type of action`,
                severity: "block",
              });
              shouldBlock = true;
            }
          }
          break;
        }

        case "rate_limit": {
          if (policy.rateLimit?.enabled && user?._id) {
            const windowMs = (policy.rateLimit.windowMinutes || 60) * 60 * 1000;
            const since = new Date(Date.now() - windowMs);
            const count = await Log.countDocuments({
              userId: user._id,
              timestamp: { $gte: since },
            });

            if (count >= (policy.rateLimit.maxActions || 50)) {
              violations.push({
                policyName: policy.name,
                reason: `Rate limit exceeded: ${count}/${policy.rateLimit.maxActions} actions in ${policy.rateLimit.windowMinutes} minutes`,
                severity: "block",
              });
              shouldBlock = true;
            }
          }
          break;
        }

        default:
          break;
      }

      // Check global high-risk controls
      if (policy.requireApprovalForHigh) {
        requiresApproval = true;
      }
      if (policy.blockHighRisk) {
        // This will be checked in actionController based on riskLevel
      }
    }
  } catch (err) {
    console.error("Policy engine error:", err.message);
  }

  return {
    allowed: !shouldBlock,
    violations,
    requiresApproval,
    shouldBlock,
  };
};
