import type { Role } from "../api";

interface HeaderProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  status: string;
  serverHealth: string;
  hasKey: boolean;
  onOpenSettings: () => void;
}

export default function Header({
  role,
  onRoleChange,
  status,
  serverHealth,
  hasKey,
  onOpenSettings,
}: HeaderProps) {
  const statusSlug = `status-${status.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <header className="top-header">
      <div className="brand-section">
        <div className="brand-icon">SF</div>
        <div className="brand-titles">
          <span className="brand-name">SpecForge</span>
          <span className="brand-tagline">Course Specification & Compliance Studio</span>
        </div>
      </div>

      <div className="header-right">
        {/* Role Switcher */}
        <div className="role-badge">
          <span style={{ color: "var(--secondary)", fontWeight: 500 }}>Role:</span>
          <select
            className="role-select"
            value={role}
            onChange={(e) => onRoleChange(e.target.value as Role)}
            aria-label="Current Role"
          >
            <option value="Author">Author</option>
            <option value="Reviewer">Reviewer</option>
            <option value="HOD">HOD / Dept Head</option>
          </select>
        </div>

        {/* Workflow Status Badge */}
        <span className={`status-pill ${statusSlug}`}>
          ● {status}
        </span>

        {/* Server & AI Indicators */}
        <span
          className="status-pill"
          style={{
            background: serverHealth === "up" ? "#dcfce7" : "#fee2e2",
            color: serverHealth === "up" ? "#15803d" : "#b91c1c",
          }}
          title={`Server status: ${serverHealth}`}
        >
          Server: {serverHealth}
        </span>

        <span
          className="status-pill"
          style={{
            background: hasKey ? "var(--secondary-container)" : "#fee2e2",
            color: hasKey ? "var(--primary)" : "#b91c1c",
          }}
          title={hasKey ? "AI key configured" : "No AI key provided yet"}
        >
          {hasKey ? "AI: Ready" : "AI: No Key"}
        </span>

        {/* Settings button */}
        <button
          className="btn btn-secondary"
          onClick={onOpenSettings}
          title="Open AI Provider & Model Settings"
          style={{ padding: "6px 12px", fontSize: "12px" }}
        >
          ⚙ Settings
        </button>
      </div>
    </header>
  );
}
