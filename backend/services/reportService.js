import PDFDocument from "pdfkit";
import UserActivity from "../models/UserActivity.js";

class ReportService {
  /**
   * Convert activities array to CSV string.
   */
  exportToCSV(activities, stats = {}) {
    const header = [
      "Employee",
      "Activity",
      "Risk Level",
      "Status",
      "Date",
      "Confidence",
      "Reason",
    ].join(",");

    const summary = [
      `# Summary: Total=${stats.total || activities.length}, HIGH=${stats.highRisk || 0}, MEDIUM=${stats.mediumRisk || 0}, LOW=${stats.lowRisk || 0}`,
      `# Generated: ${new Date().toISOString()}`,
      header,
    ];

    const rows = activities.map((a) => {
      const escape = (v) => `"${String(v || "").replace(/"/g, '""')}"`;
      return [
        escape(a.userId?.username || a.userId || ""),
        escape(a.inputText || ""),
        escape(a.riskLevel || ""),
        escape(a.status || ""),
        escape(a.timestamp ? new Date(a.timestamp).toISOString() : ""),
        escape(a.confidence != null ? `${Math.round(a.confidence * 100)}%` : ""),
        escape(a.reason || ""),
      ].join(",");
    });

    return [...summary, ...rows].join("\n");
  }

  /**
   * Generate a PDF report buffer.
   */
  async exportToPDF(activities, stats = {}) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Header ──
      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .fillColor("#1e40af")
        .text("AI Governance System", { align: "center" });
      doc
        .fontSize(14)
        .font("Helvetica")
        .fillColor("#374151")
        .text("Activity Risk Report", { align: "center" });
      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(1.5);

      // ── Summary Stats ──
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text("Summary Statistics");
      doc.moveDown(0.5);

      const statRows = [
        ["Total Activities", stats.total || activities.length],
        ["High Risk", stats.highRisk || 0],
        ["Medium Risk", stats.mediumRisk || 0],
        ["Low Risk", stats.lowRisk || 0],
        ["Flagged", stats.flagged || 0],
        ["Blocked", stats.blocked || 0],
      ];

      statRows.forEach(([label, value]) => {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#374151")
          .text(`${label}:  `, { continued: true })
          .font("Helvetica")
          .fillColor("#1e40af")
          .text(String(value));
      });

      doc.moveDown(1.5);

      // ── Activity Table ──
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text("Top 50 Activities");
      doc.moveDown(0.5);

      const cols = { employee: 80, activity: 180, risk: 60, status: 65, date: 90 };
      const tableTop = doc.y;
      const startX = doc.page.margins.left;

      // Table header
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#fff");
      doc
        .rect(startX, tableTop, doc.page.width - 100, 18)
        .fill("#1e40af");

      let x = startX + 4;
      doc.fillColor("#fff");
      doc.text("Employee", x, tableTop + 5, { width: cols.employee });
      x += cols.employee;
      doc.text("Activity", x, tableTop + 5, { width: cols.activity });
      x += cols.activity;
      doc.text("Risk", x, tableTop + 5, { width: cols.risk });
      x += cols.risk;
      doc.text("Status", x, tableTop + 5, { width: cols.status });
      x += cols.status;
      doc.text("Date", x, tableTop + 5, { width: cols.date });

      const top50 = activities.slice(0, 50);
      let rowY = tableTop + 20;

      top50.forEach((a, i) => {
        if (rowY > doc.page.height - 80) {
          doc.addPage();
          rowY = doc.page.margins.top;
        }
        const bg = i % 2 === 0 ? "#f9fafb" : "#fff";
        doc.rect(startX, rowY, doc.page.width - 100, 16).fill(bg);

        const riskColor =
          a.riskLevel === "HIGH"
            ? "#dc2626"
            : a.riskLevel === "MEDIUM"
            ? "#d97706"
            : "#16a34a";

        doc.fontSize(8).font("Helvetica").fillColor("#374151");
        x = startX + 4;
        doc.text(String(a.userId?.username || "").substring(0, 14), x, rowY + 4, { width: cols.employee - 4 });
        x += cols.employee;
        doc.text(String(a.inputText || "").substring(0, 40), x, rowY + 4, { width: cols.activity - 4 });
        x += cols.activity;
        doc.fillColor(riskColor).font("Helvetica-Bold");
        doc.text(String(a.riskLevel || ""), x, rowY + 4, { width: cols.risk - 4 });
        x += cols.risk;
        doc.fillColor("#374151").font("Helvetica");
        doc.text(String(a.status || ""), x, rowY + 4, { width: cols.status - 4 });
        x += cols.status;
        const dateStr = a.timestamp
          ? new Date(a.timestamp).toLocaleDateString()
          : "";
        doc.text(dateStr, x, rowY + 4, { width: cols.date - 4 });
        rowY += 16;
      });

      doc.moveDown(2);

      // ── Footer ──
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#9ca3af")
        .text(
          `CONFIDENTIAL — AI Governance System Report — ${new Date().toLocaleString()}`,
          { align: "center" }
        );

      doc.end();
    });
  }

  /**
   * Fetch activities from the DB and generate a report.
   */
  async generateReport(filters = {}, format = "csv") {
    const query = {};
    if (filters.riskLevel && filters.riskLevel !== "all") {
      query.riskLevel = filters.riskLevel.toUpperCase();
    }
    if (filters.status && filters.status !== "all") {
      query.status = filters.status.toUpperCase();
    }
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const activities = await UserActivity.find(query)
      .populate("userId", "username role")
      .sort({ timestamp: -1 })
      .limit(500);

    const [total, highRisk, mediumRisk, lowRisk, flagged, blocked] =
      await Promise.all([
        UserActivity.countDocuments(query),
        UserActivity.countDocuments({ ...query, riskLevel: "HIGH" }),
        UserActivity.countDocuments({ ...query, riskLevel: "MEDIUM" }),
        UserActivity.countDocuments({ ...query, riskLevel: "LOW" }),
        UserActivity.countDocuments({ ...query, status: "FLAGGED" }),
        UserActivity.countDocuments({ ...query, status: "BLOCKED" }),
      ]);

    const stats = { total, highRisk, mediumRisk, lowRisk, flagged, blocked };

    if (format === "pdf") {
      return { data: await this.exportToPDF(activities, stats), stats };
    }
    return { data: this.exportToCSV(activities, stats), stats };
  }
}

export default new ReportService();
