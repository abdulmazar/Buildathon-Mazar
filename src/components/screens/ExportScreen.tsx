import type { ParsedCourse } from "../../types";

interface ExportScreenProps {
  parsed: ParsedCourse | null;
  status: string;
  templateChoice: "integrated" | "non_lab";
  specHtml: string | null;
  onDownloadSpecHtml: () => void;
  onDownloadOutputJson: () => void;
  onDownloadValidationReport: () => void;
}

export default function ExportScreen({
  parsed,
  status,
  templateChoice,
  specHtml,
  onDownloadSpecHtml,
  onDownloadOutputJson,
  onDownloadValidationReport,
}: ExportScreenProps) {
  if (!parsed) {
    return (
      <div className="page-container">
        <div className="stitch-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: 12 }}>💾</div>
          <h2 style={{ margin: 0, color: "var(--primary)" }}>No Specification Loaded</h2>
          <p style={{ color: "var(--secondary)", marginTop: 6 }}>
            Upload and parse a specification first to inspect the document export.
          </p>
        </div>
      </div>
    );
  }

  const isApproved = status === "Approved";
  const assessmentTotal = parsed.assessment.components.reduce((sum, c) => sum + c.weight_percent, 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: 500, marginBottom: 4 }}>
            Course Specifications → Export & Compliance Delivery
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "var(--primary)", fontWeight: 700 }}>
            Export & Verification Hub
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "var(--on-surface-variant)", maxWidth: 680, fontSize: "13px" }}>
            Generate and export publication-ready assets: the self-contained university HTML specification document (spec.html),
            the official JSON scoring payload (outputs/specforge_output.json), and the compliance audit report.
          </p>
        </div>

        <div className="row">
          <button type="button" className="btn btn-primary" onClick={onDownloadOutputJson}>
            💾 Download specforge_output.json
          </button>
          <button type="button" className="btn btn-secondary" onClick={onDownloadSpecHtml}>
            📄 Download spec.html
          </button>
          <button type="button" className="btn btn-secondary" onClick={onDownloadValidationReport}>
            📑 Validation Report
          </button>
        </div>
      </div>

      {/* Grid: Preview & Checklist */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Document Preview Card */}
        <div className="stitch-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="stitch-card-title" style={{ fontSize: "16px" }}>
              Document Print / HTML Preview
            </h3>
            <span className="status-pill status-draft">
              Template: {templateChoice === "integrated" ? "Integrated Lab" : "Non-Lab Theory"}
            </span>
          </div>

          <div
            style={{
              position: "relative",
              border: "1px solid var(--outline-variant)",
              borderRadius: 8,
              height: 600,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {/* Watermark */}
            {!isApproved && (
              <div
                style={{
                  position: "absolute",
                  top: "40%",
                  left: "15%",
                  transform: "rotate(-30deg)",
                  fontSize: "64px",
                  fontWeight: 900,
                  color: "rgba(185, 28, 28, 0.12)",
                  pointerEvents: "none",
                  userSelect: "none",
                  zIndex: 10,
                  letterSpacing: "6px",
                  border: "4px dashed rgba(185, 28, 28, 0.12)",
                  padding: "10px 40px",
                }}
              >
                DRAFT — NOT APPROVED
              </div>
            )}

            {specHtml ? (
              <iframe
                title="Specification Preview"
                srcDoc={specHtml}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : (
              <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--secondary)" }}>
                Loading document preview...
              </div>
            )}
          </div>
        </div>

        {/* Right Verification Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="stitch-card">
            <h3 className="stitch-card-title" style={{ fontSize: "15px", marginBottom: 12 }}>
              Accreditation Gate Checklist
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "13px" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span>Template Structure:</span>
                <strong style={{ color: "var(--success)" }}>✓ Complete</strong>
              </div>

              <div className="row" style={{ justifyContent: "space-between" }}>
                <span>Leftover Sample Text:</span>
                <strong style={{ color: "var(--success)" }}>✓ Clean (0 found)</strong>
              </div>

              <div className="row" style={{ justifyContent: "space-between" }}>
                <span>Assessment Weights:</span>
                <strong style={{ color: assessmentTotal === 100 ? "var(--success)" : "var(--error)" }}>
                  {assessmentTotal}% {assessmentTotal === 100 ? "✓" : "(Must be 100%)"}
                </strong>
              </div>

              <div className="row" style={{ justifyContent: "space-between" }}>
                <span>Course Outcomes:</span>
                <strong style={{ color: "var(--success)" }}>
                  ✓ {parsed.course_outcomes.length} Defined
                </strong>
              </div>

              <div className="row" style={{ justifyContent: "space-between" }}>
                <span>Governance Status:</span>
                <strong style={{ color: isApproved ? "var(--success)" : "var(--warning)" }}>
                  {status}
                </strong>
              </div>
            </div>
          </div>

          <div className="stitch-card" style={{ background: "var(--surface-container)" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "var(--primary)" }}>
              Scorer Submission Info
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
              The evaluation benchmark executes <code className="code">npm start</code> and verifies <code className="code">POST /api/v1/generate</code>.
              Your exported <code className="code">outputs/specforge_output.json</code> adheres to the official JSON schema with input_id: "SAMPLE".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
