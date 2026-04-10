/**
 * Report Service — generates CSV and PDF activity reports.
 * Uses built-in Node.js streams + pdfkit for PDF, manual CSV building for CSV.
 */
import PDFDocument from "pdfkit";
import { Readable } from "stream";

// ─── CSV ────────────────────────────────────────────────────────────────────

/**
 * Convert activities array to CSV string.
 */
export function exportToCSV(activities, stats) {
  const escape = (v) => {
    const s = String(v ?? "").replace(/"/g, '""');
    return /[,"\n\r]/.test(s) ? `"${s}"` : s;
  };

  const header = ["Username", "Role", "Activity Text", "Risk Level", "Status", "Confidence (%)", "Reason", "Timestamp"];

  const rows = activities.map((a) => [
    a.userId?.username || "Unknown",
    a.userId?.role || "Unknown",
    a.inputText || "",
    a.riskLevel || "",
    a.status || "",
    a.confidence != null ? Math.round(a.confidence * 100) : "",
    a.reason || "",
    a.timestamp ? new Date(a.timestamp).toISOString() : "",
  ]);

  // Summary section at top
  const summary = [
    ["AI Governance System — Activity Report"],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ["=== SUMMARY ==="],
    [`Total Activities,${stats?.total ?? rows.length}`],
    [`High Risk,${stats?.highRisk ?? ""}`],
    [`Medium Risk,${stats?.mediumRisk ?? ""}`],
    [`Low Risk,${stats?.lowRisk ?? ""}`],
    [`Flagged,${stats?.flagged ?? ""}`],
    [`Blocked,${stats?.blocked ?? ""}`],
    [],
    ["=== ACTIVITIES ==="],
    header.join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ];

  return summary.map((l) => (Array.isArray(l) ? l.join(",") : l)).join("\n");
}

// ─── PDF ────────────────────────────────────────────────────────────────────

const RISK_COLORS = { HIGH: "#dc2626", MEDIUM: "#d97706", LOW: "#16a34a" };
const STATUS_COLORS = { BLOCKED: "#dc2626", FLAGGED: "#d97706", APPROVED: "#16a34a", PENDING: "#6b7280" };

/**
 * Generate a PDF buffer for the activity report.
 * @returns {Promise<Buffer>}
 */
export function exportToPDF(activities, stats, filters = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 100; // margins

    // ── Header ────────────────────────────────────────────────────────────
    doc
      .rect(0, 0, doc.page.width, 80)
      .fill("#1d4ed8");

    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("AI Governance System", 50, 22);

    doc
      .fontSize(12)
      .font("Helvetica")
      .text("Activity Report", 50, 50);

    // ── Meta ──────────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.fillColor("#374151").fontSize(11).font("Helvetica");

    const dateStr = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });
    doc.text(`Generated: ${dateStr}`, { align: "right" });

    if (filters.startDate || filters.endDate) {
      const range = [
        filters.startDate ? `From: ${filters.startDate}` : null,
        filters.endDate ? `To: ${filters.endDate}` : null,
      ]
        .filter(Boolean)
        .join("  |  ");
      doc.text(`Date Range: ${range}`, { align: "right" });
    }

    if (filters.riskLevel && filters.riskLevel !== "all") {
      doc.text(`Risk Filter: ${filters.riskLevel.toUpperCase()}`, { align: "right" });
    }

    doc.moveDown(1);

    // ── Summary Cards ──────────────────────────────────────────────────────
    doc
      .rect(50, doc.y, pageWidth, 1)
      .fill("#e5e7eb");

    doc.moveDown(0.5);

    const summaryY = doc.y;
    const cardW = pageWidth / 6 - 6;
    const summaryItems = [
      { label: "Total", value: stats?.total ?? 0, color: "#1d4ed8" },
      { label: "High Risk", value: stats?.highRisk ?? 0, color: "#dc2626" },
      { label: "Medium Risk", value: stats?.mediumRisk ?? 0, color: "#d97706" },
      { label: "Low Risk", value: stats?.lowRisk ?? 0, color: "#16a34a" },
      { label: "Flagged", value: stats?.flagged ?? 0, color: "#f59e0b" },
      { label: "Blocked", value: stats?.blocked ?? 0, color: "#7c3aed" },
    ];

    summaryItems.forEach((item, i) => {
      const x = 50 + i * (cardW + 6);
      doc.rect(x, summaryY, cardW, 52).fill("#f9fafb").stroke("#e5e7eb");
      doc
        .fillColor(item.color)
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(String(item.value), x, summaryY + 8, { width: cardW, align: "center" });
      doc
        .fillColor("#6b7280")
        .fontSize(8)
        .font("Helvetica")
        .text(item.label, x, summaryY + 32, { width: cardW, align: "center" });
    });

    doc.y = summaryY + 62;
    doc.moveDown(0.5);

    // ── Table Header ──────────────────────────────────────────────────────
    doc
      .rect(50, doc.y, pageWidth, 1)
      .fill("#e5e7eb");
    doc.moveDown(0.5);

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#111827")
      .text("Activities", 50);
    doc.moveDown(0.5);

    const cols = [
      { label: "User", width: 90 },
      { label: "Activity", width: 200 },
      { label: "Risk", width: 55 },
      { label: "Status", width: 65 },
      { label: "Confidence", width: 70 },
      { label: "Timestamp", width: pageWidth - 90 - 200 - 55 - 65 - 70 },
    ];

    const tableHeaderY = doc.y;
    doc.rect(50, tableHeaderY, pageWidth, 22).fill("#f3f4f6");

    let colX = 50;
    cols.forEach((c) => {
      doc
        .fillColor("#374151")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(c.label, colX + 4, tableHeaderY + 7, { width: c.width - 8 });
      colX += c.width;
    });
    doc.y = tableHeaderY + 22;

    // ── Table Rows ─────────────────────────────────────────────────────────
    const maxRows = Math.min(activities.length, 100);

    for (let i = 0; i < maxRows; i++) {
      const a = activities[i];
      const rowY = doc.y;
      const rowH = 24;

      // Alternating rows
      if (i % 2 === 0) {
        doc.rect(50, rowY, pageWidth, rowH).fill("#fafafa");
      }

      const username = a.userId?.username || "Unknown";
      const text = (a.inputText || "").slice(0, 80) + (a.inputText?.length > 80 ? "…" : "");
      const risk = a.riskLevel || "";
      const status = a.status || "";
      const conf = a.confidence != null ? `${Math.round(a.confidence * 100)}%` : "—";
      const ts = a.timestamp ? new Date(a.timestamp).toLocaleDateString() : "";

      const cellData = [username, text, risk, status, conf, ts];
      colX = 50;

      cellData.forEach((val, ci) => {
        const col = cols[ci];
        if (ci === 2) {
          doc.fillColor(RISK_COLORS[val] || "#6b7280");
        } else if (ci === 3) {
          doc.fillColor(STATUS_COLORS[val] || "#6b7280");
        } else {
          doc.fillColor("#374151");
        }
        doc
          .fontSize(8)
          .font(ci === 2 || ci === 3 ? "Helvetica-Bold" : "Helvetica")
          .text(val, colX + 4, rowY + 8, { width: col.width - 8, lineBreak: false });
        colX += col.width;
      });

      doc.y = rowY + rowH;

      // Page break if needed
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }
    }

    if (activities.length > 100) {
      doc.moveDown(0.5).fillColor("#9ca3af").fontSize(9).font("Helvetica")
        .text(`… and ${activities.length - 100} more activities (showing first 100)`, 50);
    }

    // ── Footer ─────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 50;
    doc
      .rect(0, footerY - 10, doc.page.width, 60)
      .fill("#f9fafb");

    doc
      .fillColor("#9ca3af")
      .fontSize(9)
      .font("Helvetica")
      .text(
        `CONFIDENTIAL — AI Governance System — Generated ${new Date().toLocaleString()}`,
        50,
        footerY,
        { align: "center", width: doc.page.width - 100 }
      );

    doc.end();
  });
}

/**
 * generateActivityReport — main entry point called by the route controller.
 * @param {object[]} activities
 * @param {object}   stats
 * @param {object}   filters
 * @param {"csv"|"pdf"} format
 * @returns {Promise<{ buffer: Buffer|string, contentType: string, filename: string }>}
 */
export async function generateActivityReport(activities, stats, filters, format) {
  const ts = new Date().toISOString().slice(0, 10);
  if (format === "pdf") {
    const buffer = await exportToPDF(activities, stats, filters);
    return {
      buffer,
      contentType: "application/pdf",
      filename: `activity-report-${ts}.pdf`,
    };
  }
  // default: csv
  const csv = exportToCSV(activities, stats);
  return {
    buffer: Buffer.from(csv, "utf-8"),
    contentType: "text/csv",
    filename: `activity-report-${ts}.csv`,
  };
}
