import { useRef } from "react";
import type { ParsedCourse } from "../../types";

interface UploadScreenProps {
  specFile: File | null;
  blueprintFile: File | null;
  onSelectSpecFile: (file: File | null) => void;
  onSelectBlueprintFile: (file: File | null) => void;
  onLoadSample: (type: "both" | "spec-only") => void;
  onParse: () => void;
  parsing: boolean;
  parseError: string | null;
  canEdit: boolean;
  role: string;
  status: string;
  parsed: ParsedCourse | null;
  onNextStep: () => void;
}

export default function UploadScreen({
  specFile,
  blueprintFile,
  onSelectSpecFile,
  onSelectBlueprintFile,
  onLoadSample,
  onParse,
  parsing,
  parseError,
  canEdit,
  role,
  status,
  parsed,
  onNextStep,
}: UploadScreenProps) {
  const specRef = useRef<HTMLInputElement>(null);
  const bpRef = useRef<HTMLInputElement>(null);

  return (
    <div className="page-container">
      {/* Page Title & Context */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: 500, marginBottom: 4 }}>
            Course Specifications → Initial Ingestion
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "var(--primary)", fontWeight: 700 }}>
            Upload Course Materials
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "var(--on-surface-variant)", maxWidth: 680, fontSize: "13px" }}>
            Upload the syllabus specification draft (.docx, .doc, .pdf, .html) and an optional question-paper blueprint.
            SpecForge extracts Course Outcomes (COs), calculates Bloom levels, and prepares accreditation mapping.
          </p>
        </div>

        <div className="row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onLoadSample("both")}
            disabled={parsing}
            title="Load sample_course_spec.docx and sample_blueprint.doc"
          >
            📋 Load Sample Spec + Blueprint
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onLoadSample("spec-only")}
            disabled={parsing}
            title="Load sample_course_spec.docx only"
          >
            📄 Load Spec Only
          </button>
        </div>
      </div>

      {/* Dual Dropzone Cards */}
      <div className="upload-grid">
        {/* Spec Box */}
        <div
          className={`upload-box ${specFile ? "has-file" : ""}`}
          onClick={() => specRef.current?.click()}
        >
          <input
            ref={specRef}
            type="file"
            accept=".docx,.doc,.pdf,.html,.htm"
            style={{ display: "none" }}
            onChange={(e) => onSelectSpecFile(e.target.files?.[0] || null)}
          />
          <div className="upload-icon">📄</div>
          <div>
            <div className="row" style={{ justifyContent: "center", marginBottom: 2 }}>
              <strong style={{ fontSize: "15px" }}>Course Specification</strong>
              <span style={{ fontSize: "10px", background: "var(--error)", color: "#fff", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                REQUIRED
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--secondary)", fontFamily: "JetBrains Mono, monospace" }}>
              DOCX, PDF, HTML, DOC
            </div>
          </div>

          {specFile ? (
            <div style={{ background: "#fff", border: "1px solid var(--outline-variant)", borderRadius: 8, padding: 10, width: "100%", marginTop: 4 }}>
              <div style={{ fontWeight: 600, color: "var(--primary)", fontSize: "13px", wordBreak: "break-all" }}>
                ✓ {specFile.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--secondary)", marginTop: 2 }}>
                {(specFile.size / 1024).toFixed(1)} KB • Attached
              </div>
              <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "11px", padding: "3px 8px", color: "var(--error)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSpecFile(null);
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--secondary)" }}>
              Drag & drop file here, or click to browse
            </div>
          )}
        </div>

        {/* Blueprint Box */}
        <div
          className={`upload-box ${blueprintFile ? "has-file" : ""}`}
          onClick={() => bpRef.current?.click()}
        >
          <input
            ref={bpRef}
            type="file"
            accept=".docx,.doc,.pdf,.html,.htm"
            style={{ display: "none" }}
            onChange={(e) => onSelectBlueprintFile(e.target.files?.[0] || null)}
          />
          <div className="upload-icon">📋</div>
          <div>
            <div className="row" style={{ justifyContent: "center", marginBottom: 2 }}>
              <strong style={{ fontSize: "15px" }}>Question-Paper Blueprint</strong>
              <span style={{ fontSize: "10px", background: "var(--secondary-container)", color: "var(--primary)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                OPTIONAL
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--secondary)", fontFamily: "JetBrains Mono, monospace" }}>
              Source of truth for COs & Units
            </div>
          </div>

          {blueprintFile ? (
            <div style={{ background: "#fff", border: "1px solid var(--outline-variant)", borderRadius: 8, padding: 10, width: "100%", marginTop: 4 }}>
              <div style={{ fontWeight: 600, color: "var(--primary)", fontSize: "13px", wordBreak: "break-all" }}>
                ✓ {blueprintFile.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--secondary)", marginTop: 2 }}>
                {(blueprintFile.size / 1024).toFixed(1)} KB • Attached
              </div>
              <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: "11px", padding: "3px 8px", color: "var(--error)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBlueprintFile(null);
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--secondary)" }}>
              Drag & drop file here, or click to browse
            </div>
          )}
        </div>
      </div>

      {/* Parse Error Alert */}
      {parseError && (
        <div style={{ background: "var(--error-container)", color: "var(--error)", border: "1px solid #fca5a5", padding: "12px 16px", borderRadius: 8, fontSize: "13px" }}>
          ⚠️ <strong>Extraction Error:</strong> {parseError}
        </div>
      )}

      {/* Action Bar */}
      <div className="stitch-card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: "12px", color: "var(--secondary)" }}>
            {canEdit ? (
              <span>Role <strong>{role}</strong> is authorized to upload and parse documents in {status}.</span>
            ) : (
              <span style={{ color: "var(--warning)" }}>Role <strong>{role}</strong> is view-only for status {status}.</span>
            )}
          </div>

          <div className="row">
            {parsed && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onNextStep}
              >
                View Parsed Spec →
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={!specFile || parsing || !canEdit}
              onClick={onParse}
              style={{ minWidth: 160 }}
            >
              {parsing ? "Parsing Materials..." : "⚡ Parse Specification"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
