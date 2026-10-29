import { useState } from "react";
import type { AuditLogEntry, ParsedCourse } from "../../types";

interface WorkflowScreenProps {
  parsed: ParsedCourse | null;
  status: string;
  role: string;
  history: AuditLogEntry[];
  onTransition: (action: string, comment?: string) => Promise<void>;
  busy: boolean;
  onNextStep: () => void;
}

const WORKFLOW_STEPS = ["Draft", "Submitted", "Under Review", "Pending HOD", "Approved"];

export default function WorkflowScreen({
  parsed,
  status,
  role,
  history,
  onTransition,
  busy,
  onNextStep,
}: WorkflowScreenProps) {
  const [commentText, setCommentText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!parsed) {
    return (
      <div className="page-container">
        <div className="stitch-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: 12 }}>⚡</div>
          <h2 style={{ margin: 0, color: "var(--primary)" }}>No Specification Loaded</h2>
          <p style={{ color: "var(--secondary)", marginTop: 6 }}>
            Upload and parse a specification first to interact with the approval lifecycle.
          </p>
        </div>
      </div>
    );
  }

  const handleAction = async (action: string, needComment = false) => {
    setErrorMsg(null);
    if (needComment && !commentText.trim()) {
      setErrorMsg("Please provide a comment explaining the reason for returning.");
      return;
    }
    try {
      await onTransition(action, commentText.trim() || undefined);
      setCommentText("");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    }
  };

  const isReturned = status === "Returned";
  const currentStepIndex = WORKFLOW_STEPS.indexOf(status);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: 500, marginBottom: 4 }}>
            Course Specifications → Institutional Approval Pipeline
          </div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "var(--primary)", fontWeight: 700 }}>
            Workflow & Governance
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "var(--on-surface-variant)", maxWidth: 680, fontSize: "13px" }}>
            Multi-stage governance workflow enforcing Author submission, Department Reviewer vetting, and Head of Department (HOD) final ratification.
          </p>
        </div>

        <button type="button" className="btn btn-secondary" onClick={onNextStep}>
          Export Spec →
        </button>
      </div>

      {errorMsg && (
        <div style={{ background: "var(--error-container)", color: "var(--error)", padding: "10px 14px", borderRadius: 8, fontSize: "13px" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Visual Workflow Pipeline Tracker */}
      <div className="stitch-card">
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--secondary)", textTransform: "uppercase", marginBottom: 16 }}>
          Pipeline Status
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          {WORKFLOW_STEPS.map((st, idx) => {
            const isCompleted = currentStepIndex > idx || status === "Approved";
            const isCurrent = status === st;
            const isPastOrCurrent = currentStepIndex >= idx || status === "Approved";

            return (
              <div key={st} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, zIndex: 2 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: isCompleted ? "var(--success)" : isCurrent ? "var(--primary)" : "var(--surface-container)",
                    color: isPastOrCurrent ? "#fff" : "var(--secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "12px",
                    boxShadow: isCurrent ? "0 0 0 4px var(--secondary-container)" : "none",
                  }}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <div style={{ marginTop: 8, fontSize: "12px", fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "var(--primary)" : "var(--on-surface-variant)" }}>
                  {st}
                </div>
              </div>
            );
          })}
        </div>

        {isReturned && (
          <div style={{ marginTop: 16, background: "var(--error-container)", color: "var(--error)", padding: "10px 16px", borderRadius: 8, textAlign: "center", fontSize: "13px", fontWeight: 600 }}>
            ⚠️ Specification has been Returned for Revision. Author must revise and resubmit.
          </div>
        )}
      </div>

      {/* Role Actions Control Card */}
      <div className="stitch-card">
        <h3 className="stitch-card-title" style={{ fontSize: "16px", marginBottom: 12 }}>
          Actions Available for Role: {role}
        </h3>

        {/* Action buttons based on Role & Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {role === "Author" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--secondary)" }}>
                As an <strong>Author</strong>, you can edit specification details in Draft or Returned status and submit for department review.
              </p>
              <div className="row">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || (status !== "Draft" && status !== "Returned")}
                  onClick={() => handleAction("submit")}
                >
                  🚀 Submit for Department Review
                </button>
              </div>
            </div>
          )}

          {role === "Reviewer" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--secondary)" }}>
                As a <strong>Reviewer</strong>, examine outcomes and mapping before forwarding to HOD or returning to Author.
              </p>
              <div className="row">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || status !== "Submitted"}
                  onClick={() => handleAction("review_open")}
                >
                  🔎 Open Review
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || (status !== "Under Review" && status !== "Submitted")}
                  onClick={() => handleAction("review_forward")}
                >
                  Forward to HOD →
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busy || (status !== "Under Review" && status !== "Submitted")}
                  onClick={() => handleAction("review_return", true)}
                >
                  ↩ Return with Comment
                </button>
              </div>
            </div>
          )}

          {role === "HOD" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--secondary)" }}>
                As the <strong>Head of Department (HOD)</strong>, review final outcomes and grant official institutional approval.
              </p>
              <div className="row">
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: "var(--success)" }}
                  disabled={busy || status !== "Pending HOD"}
                  onClick={() => handleAction("hod_approve")}
                >
                  ✓ Approve Specification
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busy || status !== "Pending HOD"}
                  onClick={() => handleAction("hod_return", true)}
                >
                  ↩ Return to Author
                </button>
              </div>
            </div>
          )}

          {/* Comment input box */}
          <div style={{ marginTop: 8 }}>
            <label>
              Add Feedback / Return Comment:
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Optional feedback notes for author or reviewers (required when returning)..."
              />
            </label>
          </div>
        </div>
      </div>

      {/* Audit History Log */}
      <div className="stitch-card">
        <h3 className="stitch-card-title" style={{ fontSize: "16px", marginBottom: 14 }}>
          Governance Audit Trail & Transition Log
        </h3>

        <div className="timeline">
          {history.map((entry) => (
            <div key={entry.id} className="timeline-item">
              <div className="timeline-dot" />
              <div style={{ flex: 1, borderBottom: "1px solid var(--outline-variant)", paddingBottom: 10 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <strong>{entry.action}</strong> by <strong>{entry.user}</strong> ({entry.role})
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--secondary)" }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--secondary)", marginTop: 2 }}>
                  Transition: <span className="code">{entry.statusFrom}</span> → <span className="code">{entry.statusTo}</span>
                </div>
                {entry.comment && (
                  <div style={{ marginTop: 6, fontSize: "12px", background: "var(--surface-low)", padding: "6px 10px", borderRadius: 4, fontStyle: "italic" }}>
                    "{entry.comment}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
