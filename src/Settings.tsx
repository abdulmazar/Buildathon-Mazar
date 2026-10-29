import { useState } from "react";
import { call, clearKey, DEFAULT_MODELS, loadSettings, saveSettings, type Provider } from "./api";

export default function Settings({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState(loadSettings());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<typeof s>) => {
    const n = { ...s, ...patch };
    setS(n);
    saveSettings(n);
    setMsg(null);
  };

  async function test() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await call<{ model: string }>("/llm-check");
      setMsg({ ok: true, text: `Key verified successfully with model: ${r.model}` });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Settings" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--primary)" }}>AI Provider Settings</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--secondary)", lineHeight: 1.45 }}>
          Bring your own API key. The key remains stored strictly in your browser (localStorage) and is transmitted via request headers on each AI call. It is never logged, stored, or returned by the server.
        </p>

        <label>
          AI Provider
          <select
            value={s.provider}
            onChange={(e) => update({ provider: e.target.value as Provider, model: "" })}
          >
            <option value="gemini">Google Gemini (Recommended)</option>
            <option value="openrouter">OpenRouter</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </label>

        <label>
          API Key
          <input
            type="password"
            autoComplete="off"
            value={s.key}
            onChange={(e) => update({ key: e.target.value })}
            placeholder="Paste your API key here"
          />
        </label>

        <label>
          Model Identifier
          <input
            value={s.model}
            onChange={(e) => update({ model: e.target.value })}
            placeholder={DEFAULT_MODELS[s.provider]}
          />
        </label>

        <div className="row" style={{ marginTop: 6, justifyContent: "space-between" }}>
          <div className="row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={test}
              disabled={busy || !s.key}
            >
              {busy ? "Testing Connection..." : "⚡ Test Key"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                clearKey();
                setS(loadSettings());
                setMsg(null);
              }}
            >
              Clear Key
            </button>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        {msg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: "12.5px",
              background: msg.ok ? "var(--success-bg)" : "var(--error-container)",
              color: msg.ok ? "var(--success)" : "var(--error)",
              border: `1px solid ${msg.ok ? "#bbf7d0" : "#fca5a5"}`,
            }}
          >
            {msg.ok ? "✓ " : "⚠️ "}
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
