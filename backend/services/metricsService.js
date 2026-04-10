import { httpRequestDuration, httpRequestTotal, promClient } from "../middleware/metricsMiddleware.js";

class MetricsService {
  /**
   * Basic system health metrics from Node.js process.
   */
  getSystemHealth() {
    const mem = process.memoryUsage();
    return {
      uptime: process.uptime(),
      uptimeFormatted: this._formatUptime(process.uptime()),
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date(),
    };
  }

  /**
   * Compute average response time from Prometheus histogram.
   */
  async getAvgResponseTime() {
    try {
      const metrics = await httpRequestDuration.get();
      let totalCount = 0;
      let totalSum = 0;
      for (const { value, metricName } of metrics.values) {
        if (metricName === "http_request_duration_seconds_sum") totalSum += value;
        if (metricName === "http_request_duration_seconds_count") totalCount += value;
      }
      if (totalCount === 0) return 0;
      return Math.round((totalSum / totalCount) * 1000); // ms
    } catch {
      return 0;
    }
  }

  /**
   * Total requests processed.
   */
  async getTotalRequests() {
    try {
      const metrics = await httpRequestTotal.get();
      return metrics.values.reduce((sum, v) => sum + v.value, 0);
    } catch {
      return 0;
    }
  }

  /**
   * Error rate percentage (4xx + 5xx / total).
   */
  async getErrorRate() {
    try {
      const metrics = await httpRequestTotal.get();
      const total = metrics.values.reduce((s, v) => s + v.value, 0);
      const errors = metrics.values
        .filter((v) => {
          const code = v.labels?.status_code || "";
          return code.startsWith("4") || code.startsWith("5");
        })
        .reduce((s, v) => s + v.value, 0);
      if (total === 0) return 0;
      return Math.round((errors / total) * 100 * 100) / 100;
    } catch {
      return 0;
    }
  }

  /**
   * SLA compliance based on average response time vs target.
   */
  async getSLAStatus() {
    const avgMs = await this.getAvgResponseTime();
    const target = parseFloat(process.env.SLA_TARGET_MS || "200");
    const complianceTarget = parseFloat(
      process.env.SLA_COMPLIANCE_TARGET || "99.5"
    );

    const compliance =
      avgMs <= target
        ? 100
        : Math.max(0, 100 - ((avgMs - target) / target) * 50);

    return {
      avgResponseTimeMs: avgMs,
      targetMs: target,
      complianceTarget,
      compliance: Math.min(100, Math.round(compliance * 100) / 100),
      status: compliance >= complianceTarget ? "GOOD" : "WARNING",
    };
  }

  _formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  async getAllMetrics() {
    const [health, avgResponseTime, totalRequests, errorRate, sla] =
      await Promise.all([
        this.getSystemHealth(),
        this.getAvgResponseTime(),
        this.getTotalRequests(),
        this.getErrorRate(),
        this.getSLAStatus(),
      ]);

    return { health, api: { avgResponseTime, totalRequests, errorRate }, sla };
  }
}

export default new MetricsService();
