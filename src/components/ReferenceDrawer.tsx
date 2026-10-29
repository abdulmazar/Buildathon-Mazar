import poPsoConfig from "../../config/po_pso.json";

interface ReferenceDrawerProps {
  onClose: () => void;
}

export default function ReferenceDrawer({ onClose }: ReferenceDrawerProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--primary)" }}>
            Academic Compliance Reference
          </h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close drawer">
            ✕
          </button>
        </div>

        <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "var(--secondary)" }}>
          Official reference definitions from Annexure A (config/po_pso.json).
        </p>

        {/* Scale Legend */}
        <div style={{ background: "var(--surface-container)", padding: 12, borderRadius: 8, marginBottom: 20 }}>
          <strong style={{ fontSize: "0.85rem", color: "var(--primary)" }}>Mapping Scale:</strong>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem" }}>{poPsoConfig.scale}</p>
        </div>

        {/* Bloom's Levels */}
        <h3 style={{ fontSize: "1rem", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: 6 }}>
          Bloom's Taxonomy Levels
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {poPsoConfig.blooms.map((b) => (
            <div key={b.level} style={{ background: "var(--surface-low)", padding: 10, borderRadius: 6 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <span className="bloom-badge" style={{ background: "var(--secondary-container)", color: "var(--primary)" }}>
                  {b.level}: {b.name}
                </span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--secondary)" }}>
                <strong>Key Verbs:</strong> {b.verbs}
              </div>
            </div>
          ))}
        </div>

        {/* Program Outcomes (POs) */}
        <h3 style={{ fontSize: "1rem", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: 6 }}>
          Program Outcomes (PO-1 to PO-11)
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {poPsoConfig.pos.map((po) => (
            <div key={po.id} style={{ border: "1px solid var(--outline-variant)", padding: 10, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>
                {po.id}: {po.title}
              </div>
              <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem", lineHeight: 1.45 }}>
                {po.statement}
              </p>
            </div>
          ))}
        </div>

        {/* Program Specific Outcomes (PSOs) */}
        <h3 style={{ fontSize: "1rem", color: "var(--primary)", borderBottom: "1px solid var(--outline-variant)", paddingBottom: 6 }}>
          Program Specific Outcomes (PSOs)
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {poPsoConfig.psos.map((pso) => (
            <div key={pso.id} style={{ border: "1px solid var(--outline-variant)", padding: 10, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>
                {pso.id}
              </div>
              <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem", lineHeight: 1.45 }}>
                {pso.statement}
              </p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
