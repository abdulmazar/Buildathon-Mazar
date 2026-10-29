export type StepId = "upload" | "spec" | "map" | "checks" | "workflow" | "export";

interface SidebarProps {
  activeStep: StepId;
  onSelectStep: (step: StepId) => void;
  courseCode?: string;
  courseTitle?: string;
  department?: string;
  onOpenGuidelines: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  activeStep,
  onSelectStep,
  courseCode,
  courseTitle,
  department,
  onOpenGuidelines,
  onOpenSettings,
}: SidebarProps) {
  const steps: Array<{ id: StepId; label: string; icon: string }> = [
    { id: "upload", label: "1. Upload", icon: "📁" },
    { id: "spec", label: "2. Spec", icon: "📄" },
    { id: "map", label: "3. CO-PO-PSO Map", icon: "📊" },
    { id: "checks", label: "4. Checks", icon: "🔍" },
    { id: "workflow", label: "5. Workflow", icon: "⚡" },
    { id: "export", label: "6. Export", icon: "💾" },
  ];

  return (
    <aside className="sidebar">
      <div>
        {/* Active Course Card */}
        <div className="sidebar-active-course">
          <div className="sidebar-course-label">Active Course</div>
          <div
            className="sidebar-course-code"
            title={courseCode ? `${courseCode}: ${courseTitle || ""}` : "No course loaded"}
          >
            {courseCode ? `${courseCode}: ${courseTitle || ""}` : "No course loaded"}
          </div>
          <div className="sidebar-course-dept">
            {department || "Upload syllabus to begin"}
          </div>
        </div>

        {/* Step Navigation */}
        <nav className="sidebar-nav">
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => onSelectStep(step.id)}
              >
                <span className="nav-icon">{step.icon}</span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="sidebar-footer">
        <button type="button" onClick={onOpenGuidelines}>
          <span>📖</span>
          <span>Compliance Guidelines</span>
        </button>
        <button type="button" onClick={onOpenSettings}>
          <span>⚙</span>
          <span>AI Settings</span>
        </button>
      </div>
    </aside>
  );
}
