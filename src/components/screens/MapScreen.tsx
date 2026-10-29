import { useState } from "react";
import poPsoConfig from "../../../config/po_pso.json";
import type { CoPoPsoMap, ParsedCourse } from "../../types";

interface MapScreenProps {
  parsed: ParsedCourse | null;
  mapData: CoPoPsoMap;
  onUpdateCell: (coId: string, targetId: string, level: 1 | 2 | 3 | null, justification: string) => void;
  canEdit: boolean;
  onAutoMap: () => void;
  mappingBusy: boolean;
  onNextStep: () => void;
}

export default function MapScreen({
  parsed,
  mapData,
  onUpdateCell,
  canEdit,
  onAutoMap,
  mappingBusy,
  onNextStep,
}: MapScreenProps) {
  const [activeCell, setActiveCell] = useState<{
    coId: string;
    targetId: string;
    level: 1 | 2 | 3 | null;
    justification: string;
  } | null>(null);

  if (!parsed) {
    return (
      <div className="page-container">
        <div className="stitch-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: 12 }}>📊</div>
          <h2 style={{ margin: 0, color: "var(--primary)" }}>No Specification Loaded</h2>
          <p style={{ color: "var(--secondary)", marginTop: 6 }}>
            Upload and parse a specification first to inspect the outcome matrix.
          </p>
        </div>
      </div>
    );
  }

  const pos = poPsoConfig.pos;
  const psos = poPsoConfig.psos;
  const allColumns = [...pos.map((p) => p.id), ...psos.map((p) => p.id)];

  const getDef = (targetId: string) => {
    const foundPo = pos.find((p) => p.id === targetId);
    if (foundPo) return { title: foundPo.title, text: foundPo.statement };
    const foundPso = psos.find((p) => p.id === targetId);
    if (foundPso) return { title: targetId, text: foundPso.statement };
    return { title: targetId, text: "" };
  };

  const handleCellClick = (coId: string, targetId: string) => {
    const cell = mapData[coId]?.[targetId];
    setActiveCell({
      coId,
      targetId,
      level: cell?.level || null,
      justification: cell?.justification || "",
    });
  };

  const handleLevelChange = (lvl: 1 | 2 | 3 | null) => {
    if (!activeCell) return;
    const nextJust = lvl ? (activeCell.justification || "Contributes to outcome through syllabus units and lab exercises.") : "";
    onUpdateCell(activeCell.coId, activeCell.targetId, lvl, nextJust);
    setActiveCell({ ...activeCell, level: lvl, justification: nextJust });
  };

  const handleJustificationChange = (just: string) => {
    if (!activeCell || !activeCell.level) return;
    onUpdateCell(activeCell.coId, activeCell.targetId, activeCell.level, just);
    setActiveCell({ ...activeCell, justification: just });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: 500, marginBottom: 4 }}>
            Course Specifications → CO-PO-PSO Articulation Matrix
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "var(--primary)", fontWeight: 700 }}>
            Outcome Mapping Matrix
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "var(--on-surface-variant)", maxWidth: 680, fontSize: "13px" }}>
            Matrix articulating course outcome attainment strengths (3 = Very Strong, 2 = Strong, 1 = Moderate, Blank = None).
            Target outcome descriptions are pulled directly from Annexure A.
          </p>
        </div>

        <div className="row">
          {canEdit && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onAutoMap}
              disabled={mappingBusy}
            >
              {mappingBusy ? "Generating Matrix with AI..." : "⚡ Auto-Generate Map (AI)"}
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onNextStep}>
            Proceed to Checks →
          </button>
        </div>
      </div>

      {/* Legend Card */}
      <div className="stitch-card" style={{ padding: "12px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="row" style={{ fontSize: "12px" }}>
            <span style={{ fontWeight: 600, color: "var(--secondary)", marginRight: 6 }}>Scale:</span>
            <span className="row">
              <span style={{ width: 14, height: 14, background: "#1e3a8a", borderRadius: 3, display: "inline-block" }}></span>
              <strong>3</strong> Very Strong
            </span>
            <span className="row" style={{ marginLeft: 12 }}>
              <span style={{ width: 14, height: 14, background: "#60a5fa", borderRadius: 3, display: "inline-block" }}></span>
              <strong>2</strong> Strong
            </span>
            <span className="row" style={{ marginLeft: 12 }}>
              <span style={{ width: 14, height: 14, background: "#dbeafe", borderRadius: 3, display: "inline-block" }}></span>
              <strong>1</strong> Moderate
            </span>
            <span className="row" style={{ marginLeft: 12 }}>
              <span style={{ width: 14, height: 14, background: "#ffffff", border: "1px solid #ccc", borderRadius: 3, display: "inline-block" }}></span>
              Blank None
            </span>
          </div>

          <span style={{ fontSize: "12px", color: "var(--secondary)" }}>
            Click any cell to inspect or edit justification
          </span>
        </div>
      </div>

      {/* Matrix Table & Inspection Side-by-Side */}
      <div style={{ display: "grid", gridTemplateColumns: activeCell ? "1fr 340px" : "1fr", gap: 16 }}>
        {/* Table Container */}
        <div className="matrix-container">
          <table className="matrix-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>CO / PO</th>
                {pos.map((p) => (
                  <th key={p.id} title={`${p.id}: ${p.title}\n${p.statement}`}>
                    {p.id}
                  </th>
                ))}
                {psos.map((p) => (
                  <th key={p.id} style={{ background: "var(--secondary-container)" }} title={`${p.id}\n${p.statement}`}>
                    {p.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.course_outcomes.map((co) => {
                const rowData = mapData[co.id] || {};
                return (
                  <tr key={co.id}>
                    <td style={{ fontWeight: 700, background: "var(--surface-container)" }}>
                      {co.id}
                    </td>
                    {allColumns.map((colId) => {
                      const cell = rowData[colId];
                      const lvl = cell?.level || null;
                      const isSelected = activeCell?.coId === co.id && activeCell?.targetId === colId;
                      const strengthClass = lvl === 3 ? "strength-3" : lvl === 2 ? "strength-2" : lvl === 1 ? "strength-1" : "strength-empty";

                      return (
                        <td
                          key={colId}
                          className={`matrix-cell ${strengthClass}`}
                          style={{
                            outline: isSelected ? "2px solid #000" : undefined,
                            cursor: "pointer",
                          }}
                          onClick={() => handleCellClick(co.id, colId)}
                          title={cell?.justification ? `${colId}: ${lvl} - ${cell.justification}` : `${colId}: Blank`}
                        >
                          {lvl || ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Cell Detail Panel */}
        {activeCell && (
          <div className="stitch-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary)" }}>
                {activeCell.coId} → {activeCell.targetId}
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setActiveCell(null)}
                style={{ padding: "2px 6px" }}
              >
                ✕
              </button>
            </div>

            {/* Target Outcome Text */}
            <div style={{ background: "var(--surface-low)", padding: 10, borderRadius: 6, fontSize: "12px" }}>
              <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
                {getDef(activeCell.targetId).title}
              </div>
              <p style={{ margin: 0, color: "var(--on-surface-variant)", lineHeight: 1.45 }}>
                {getDef(activeCell.targetId).text}
              </p>
            </div>

            {/* Strength Switcher */}
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: 6 }}>
                Mapping Strength:
              </div>
              <div className="row" style={{ gap: 6 }}>
                {([3, 2, 1] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleLevelChange(s)}
                    className="btn"
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      background: activeCell.level === s ? "var(--primary)" : "var(--surface-low)",
                      color: activeCell.level === s ? "#fff" : "var(--on-surface)",
                      border: "1px solid var(--outline-variant)",
                    }}
                  >
                    Level {s}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleLevelChange(null)}
                  className="btn btn-ghost"
                  style={{ padding: "6px 10px", fontSize: "11px" }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Justification Input */}
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: 4 }}>
                One-Line Justification:
              </div>
              {canEdit ? (
                <textarea
                  rows={3}
                  value={activeCell.justification}
                  placeholder="Explain how course units, lab work, or assessments support this mapping..."
                  onChange={(e) => handleJustificationChange(e.target.value)}
                  style={{ width: "100%", fontSize: "12px" }}
                />
              ) : (
                <div style={{ fontSize: "12px", background: "var(--surface-low)", padding: 8, borderRadius: 6 }}>
                  {activeCell.justification || "No justification recorded."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
