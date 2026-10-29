import { useState } from "react";
import type { Defect, ParsedCourse } from "../../types";

interface ChecksScreenProps {
  parsed: ParsedCourse | null;
  defects: Defect[];
  onRunAudit: () => void;
  auditBusy: boolean;
  onDownloadReport: () => void;
  onNextStep: () => void;
}

export default function ChecksScreen({
  parsed,
  defects,
  onRunAudit,
  auditBusy,
  onDownloadReport,
  onNextStep,
}: ChecksScreenProps) {
  const [filterSeverity, setFilterSeverity] = useState<"All" | "High" | "Medium" | "Low">("All");

  if (!parsed) {
    return (
      <div className="page-container">
        <div className="stitch-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: 12 }}>🔍</div>
          <h2 style={{ margin: 0, color: "var(--primary)" }}>No Specification Loaded</h2>
          <p style={{ color: "var(--secondary)", marginTop: 6 }}>
            Upload and parse a specification first to inspect compliance rules and defects.
          </p>
        </div>
      </div>
    );
  }

  const highCount = defects.filter((d) => d.severity === "High").length;
  const mediumCount = defects.filter((d) => d.severity === "Medium").length;
  const lowCount = defects.filter((d) => d.severity === "Low").length;
  const passedRulesCount = Math.max(0, 10 - defects.length);

  const filtered = defects.filter((d) => {
    if (filterSeverity === "All") return true;
    return d.severity === filterSeverity;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: 500, marginBottom: 4 }}>
            Course Specifications → Automated Compliance Audit
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "var(--primary)", fontWeight: 700 }}>
            Audit Checks & Defects
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "var(--on-surface-variant)", maxWidth: 680, fontSize: "13px" }}>
            Deterministic evaluation of rules V1–V10 (CO counts, Bloom ceilings, teaching hours sum, assessment 100%, template consistency).
          </p>
        </div>

        <div className="row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRunAudit}
            disabled={auditBusy}
          >
            {auditBusy ? "Running Rules V1–V10..." : "🔍 Re-run Compliance Audit"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onDownloadReport}
          >
            📄 Download validation_report.html
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNextStep}
          >
            Workflow →
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <div className="stitch-card" style={{ padding: "14px 18px", borderLeft: "4px solid var(--error)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--error)", textTransform: "uppercase" }}>
            Critical Errors
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--primary)", marginTop: 2 }}>
            {highCount}
          </div>
          <div style={{ fontSize: "11px", color: "var(--secondary)" }}>High Severity Issues</div>
        </div>

        <div className="stitch-card" style={{ padding: "14px 18px", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>
            Warnings
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--primary)", marginTop: 2 }}>
            {mediumCount}
          </div>
          <div style={{ fontSize: "11px", color: "var(--secondary)" }}>Medium Discrepancies</div>
        </div>

        <div className="stitch-card" style={{ padding: "14px 18px", borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
            Notices
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--primary)", marginTop: 2 }}>
            {lowCount}
          </div>
          <div style={{ fontSize: "11px", color: "var(--secondary)" }}>Formatting & Typo Warnings</div>
        </div>

        <div className="stitch-card" style={{ padding: "14px 18px", borderLeft: "4px solid var(--success)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--success)", textTransform: "uppercase" }}>
            Passed Checks
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--success)", marginTop: 2 }}>
            {passedRulesCount} / 10
          </div>
          <div style={{ fontSize: "11px", color: "var(--secondary)" }}>Rules Fully Compliant</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="row" style={{ gap: 8 }}>
        {(["All", "High", "Medium", "Low"] as const).map((sev) => (
          <button
            key={sev}
            type="button"
            className={`btn ${filterSeverity === sev ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilterSeverity(sev)}
            style={{ padding: "5px 14px", fontSize: "12px" }}
          >
            {sev} ({sev === "All" ? defects.length : defects.filter((d) => d.severity === sev).length})
          </button>
        ))}
      </div>

      {/* Defect Cards List */}
      <div className="stitch-card">
        <h3 className="stitch-card-title" style={{ fontSize: "16px", marginBottom: 16 }}>
          Identified Defects & Remediation Log
        </h3>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--secondary)" }}>
            ✓ No defects found under "{filterSeverity}" severity filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((d, index) => {
              const borderCls = d.severity === "High" ? "defect-high" : d.severity === "Medium" ? "defect-medium" : "defect-low";
              return (
                <div key={index} className={`defect-card ${borderCls}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div className="row">
                      <span className="code" style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", background: "var(--surface-container)", padding: "2px 8px", borderRadius: 4 }}>
                        {d.code}
                      </span>
                      <span className="status-pill status-draft" style={{ fontSize: "10px" }}>
                        Source: {d.location.source}
                      </span>
                      {d.location.section && (
                        <span className="status-pill status-draft" style={{ fontSize: "10px" }}>
                          Section {d.location.section}
                        </span>
                      )}
                      {d.location.refs?.length > 0 && (
                        <span className="code" style={{ fontSize: "11px", color: "var(--secondary)" }}>
                          Refs: {d.location.refs.join(", ")}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: d.severity === "High" ? "var(--error-container)" : d.severity === "Medium" ? "#fef3c7" : "#dbeafe",
                        color: d.severity === "High" ? "var(--error)" : d.severity === "Medium" ? "#b45309" : "#1e40af",
                      }}
                    >
                      {d.severity || "Medium"} Severity
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", color: "var(--on-surface)", marginTop: 4 }}>
                    <strong>Problem:</strong> {d.description}
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--success)", background: "var(--success-bg)", padding: "6px 10px", borderRadius: 6, marginTop: 4 }}>
                    <strong>Fix Applied:</strong> {d.fix}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
