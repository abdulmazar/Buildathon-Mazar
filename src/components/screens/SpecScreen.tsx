import { useState } from "react";
import type { ParsedCourse } from "../../types";

interface SpecScreenProps {
  parsed: ParsedCourse | null;
  onUpdateParsed: (p: ParsedCourse) => void;
  canEdit: boolean;
  templateChoice: "integrated" | "non_lab";
  detectedTemplate: "integrated" | "non_lab";
  signals: string[];
  overrideReason: string;
  onOverrideTemplate: (t: "integrated" | "non_lab", reason: string) => void;
  onSave: () => void;
  saveMsg: string | null;
  onNextStep: () => void;
}

const BLOOM_COLORS: Record<number, { name: string; cls: string }> = {
  1: { name: "L1 Remember", cls: "bloom-1" },
  2: { name: "L2 Understand", cls: "bloom-2" },
  3: { name: "L3 Apply", cls: "bloom-3" },
  4: { name: "L4 Analyse", cls: "bloom-4" },
  5: { name: "L5 Evaluate", cls: "bloom-5" },
  6: { name: "L6 Create", cls: "bloom-6" },
};

export default function SpecScreen({
  parsed,
  onUpdateParsed,
  canEdit,
  templateChoice,
  detectedTemplate,
  signals,
  overrideReason,
  onOverrideTemplate,
  onSave,
  saveMsg,
  onNextStep,
}: SpecScreenProps) {
  const [showOverride, setShowOverride] = useState(templateChoice !== detectedTemplate || !!overrideReason);
  const [reasonInput, setReasonInput] = useState(overrideReason);
  const [selectedTemplate, setSelectedTemplate] = useState<"integrated" | "non_lab">(templateChoice);

  if (!parsed) {
    return (
      <div className="page-container">
        <div className="stitch-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: 12 }}>📄</div>
          <h2 style={{ margin: 0, color: "var(--primary)" }}>No Specification Loaded</h2>
          <p style={{ color: "var(--secondary)", marginTop: 6 }}>
            Please upload and parse course materials in Step 1 (Upload) to inspect the corrected specification.
          </p>
        </div>
      </div>
    );
  }

  const handleApplyOverride = () => {
    onOverrideTemplate(selectedTemplate, reasonInput);
  };

  return (
    <div className="page-container">
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: 500, marginBottom: 4 }}>
            Course Specifications → Corrected Specification
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "var(--primary)", fontWeight: 700 }}>
            {parsed.code}: {parsed.title}
          </h1>
          <div className="row" style={{ marginTop: 6, color: "var(--secondary)", fontSize: "13px" }}>
            <span>Dept: <strong>{parsed.department}</strong></span>
            <span>•</span>
            <span>Credits (L:T:P): <strong style={{ color: "var(--primary)" }}>{parsed.credits_ltp}</strong></span>
            <span>•</span>
            <span>Type: <strong>{parsed.course_type}</strong></span>
          </div>
        </div>

        <div className="row">
          {canEdit && (
            <button type="button" className="btn btn-secondary" onClick={onSave}>
              💾 Save Changes
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onNextStep}>
            Proceed to Mapping →
          </button>
        </div>
      </div>

      {saveMsg && (
        <div style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: 8, fontSize: "13px" }}>
          ✓ {saveMsg}
        </div>
      )}

      {/* Template Selection & Signals Card */}
      <div className="stitch-card" style={{ borderLeft: "4px solid var(--primary-container)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--secondary)", fontWeight: 700 }}>
              Template Engine Selection
            </div>
            <div className="row" style={{ marginTop: 4 }}>
              <span className="status-pill status-draft" style={{ fontSize: "13px" }}>
                Detected: {detectedTemplate === "integrated" ? "Integrated Lab Template" : "Non-Lab Theory Template"}
              </span>
              {templateChoice !== detectedTemplate && (
                <span className="status-pill" style={{ background: "#fef3c7", color: "#b45309", fontSize: "12px" }}>
                  Override Active: {templateChoice}
                </span>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "var(--on-surface-variant)", marginTop: 6 }}>
              <strong>Signals used:</strong> {signals.length ? signals.join(" • ") : "Default analysis based on practical credit structure"}
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowOverride(!showOverride)}
              style={{ fontSize: "12px" }}
            >
              ⚙ Manual Override
            </button>
          )}
        </div>

        {/* Override Form */}
        {showOverride && canEdit && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--outline-variant)", display: "grid", gap: 10 }}>
            <div className="row" style={{ gap: 12 }}>
              <label style={{ flex: 1 }}>
                Override Template Choice:
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as "integrated" | "non_lab")}
                >
                  <option value="integrated">Integrated (with Lab / Practical)</option>
                  <option value="non_lab">Non-Lab (Theory Only)</option>
                </select>
              </label>

              <label style={{ flex: 2 }}>
                Reason for Override (required):
                <input
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="e.g. Department mandated separate practical module"
                />
              </label>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApplyOverride}
                disabled={!reasonInput.trim()}
                style={{ alignSelf: "flex-end" }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editable Course Metadata */}
      <div className="stitch-card">
        <h3 className="stitch-card-title" style={{ fontSize: "16px", marginBottom: 14 }}>
          1. Course Information
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <label>
            Course Title
            <input
              value={parsed.title}
              disabled={!canEdit}
              onChange={(e) => onUpdateParsed({ ...parsed, title: e.target.value })}
            />
          </label>
          <label>
            Course Code
            <input
              value={parsed.code}
              disabled={!canEdit}
              onChange={(e) => onUpdateParsed({ ...parsed, code: e.target.value })}
            />
          </label>
          <label>
            Credits (L:T:P)
            <input
              value={parsed.credits_ltp}
              disabled={!canEdit}
              onChange={(e) => onUpdateParsed({ ...parsed, credits_ltp: e.target.value })}
            />
          </label>
          <label>
            Department
            <input
              value={parsed.department}
              disabled={!canEdit}
              onChange={(e) => onUpdateParsed({ ...parsed, department: e.target.value })}
            />
          </label>
        </div>

        <div style={{ marginTop: 14 }}>
          <label>
            Course Summary
            <textarea
              rows={3}
              value={parsed.summary}
              disabled={!canEdit}
              onChange={(e) => onUpdateParsed({ ...parsed, summary: e.target.value })}
            />
          </label>
        </div>
      </div>

      {/* Course Outcomes Section */}
      <div className="stitch-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 className="stitch-card-title" style={{ fontSize: "16px" }}>
              2. Course Outcomes ({parsed.course_outcomes.length})
            </h3>
            <p className="stitch-card-subtitle">
              Sourced from question-paper blueprint (or spec draft when blueprint omitted)
            </p>
          </div>
          <div className="row" style={{ fontSize: "11px" }}>
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <span key={l} className={`bloom-badge ${BLOOM_COLORS[l].cls}`}>
                {BLOOM_COLORS[l].name}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {parsed.course_outcomes.map((co, index) => {
            const bInfo = BLOOM_COLORS[co.bloom_level] || { name: `L${co.bloom_level}`, cls: "bloom-2" };
            return (
              <div
                key={co.id || index}
                style={{
                  border: "1px solid var(--outline-variant)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  background: "var(--surface-lowest)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div className="row">
                    <strong style={{ color: "var(--primary)", fontSize: "13px" }}>{co.id}</strong>
                    <span className={`bloom-badge ${bInfo.cls}`}>{bInfo.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--secondary)" }}>
                      Leading Verb: <strong>{co.leading_verb}</strong>
                    </span>
                  </div>

                  {canEdit && (
                    <label style={{ flexDirection: "row", alignItems: "center", gap: 4, margin: 0, fontSize: "11px" }}>
                      Bloom:
                      <select
                        value={co.bloom_level}
                        onChange={(e) => {
                          const updated = [...parsed.course_outcomes];
                          updated[index] = { ...co, bloom_level: Number(e.target.value) };
                          onUpdateParsed({ ...parsed, course_outcomes: updated });
                        }}
                        style={{ padding: "2px 6px", fontSize: "12px" }}
                      >
                        {[1, 2, 3, 4, 5, 6].map((lvl) => (
                          <option key={lvl} value={lvl}>L{lvl}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                {canEdit ? (
                  <textarea
                    rows={2}
                    value={co.statement}
                    onChange={(e) => {
                      const updated = [...parsed.course_outcomes];
                      updated[index] = { ...co, statement: e.target.value };
                      onUpdateParsed({ ...parsed, course_outcomes: updated });
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "13px", lineHeight: 1.5 }}>{co.statement}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Units Section */}
      <div className="stitch-card">
        <h3 className="stitch-card-title" style={{ fontSize: "16px", marginBottom: 14 }}>
          3. Syllabus Units ({parsed.units.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {parsed.units.map((u, i) => (
            <div
              key={u.number || i}
              style={{
                border: "1px solid var(--outline-variant)",
                borderRadius: 8,
                padding: "12px 16px",
                background: "var(--surface-lowest)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "var(--primary)" }}>
                  Unit {u.number}: {u.title}
                </strong>
                {u.hours ? <span className="status-pill status-draft">{u.hours} Hours</span> : null}
              </div>
              {u.content && (
                <p style={{ margin: "6px 0 0 0", fontSize: "12.5px", color: "var(--on-surface-variant)" }}>
                  {u.content}
                </p>
              )}
              {u.lab && (
                <div style={{ marginTop: 6, fontSize: "12px", color: "var(--tertiary-container)" }}>
                  🧪 <em>Practical/Lab:</em> {u.lab}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Teaching Hours & Assessment Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="stitch-card">
          <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--primary)" }}>
            Teaching Hours Distribution
          </h4>
          <div style={{ display: "grid", gap: 8, fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Lectures:</span>
              <strong>{parsed.teaching_hours.lectures} hrs</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Laboratory / Practical:</span>
              <strong>{parsed.teaching_hours.lab} hrs</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Examinations / Tests:</span>
              <strong>{parsed.teaching_hours.tests_exams} hrs</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--outline-variant)", paddingTop: 6 }}>
              <span>Total Hours:</span>
              <strong style={{ color: "var(--primary)" }}>{parsed.teaching_hours.total} hrs</strong>
            </div>
          </div>
        </div>

        <div className="stitch-card">
          <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--primary)" }}>
            Assessment Components
          </h4>
          <div style={{ display: "grid", gap: 8, fontSize: "13px" }}>
            {parsed.assessment.components.map((c, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{c.name}:</span>
                <strong>{c.weight_percent}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
