// Every call to the backend goes through call(). It adds the AI headers from Settings.
export type Provider = "gemini" | "openrouter" | "anthropic";
export type LlmSettings = { provider: Provider; key: string; model: string };
export type Role = "Author" | "Reviewer" | "HOD";

const STORE = "specforge.llm";
const ROLE_STORE = "specforge.role";
export const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: "gemini-3.5-flash-lite",
  openrouter: "google/gemini-3.5-flash-lite",
  anthropic: "claude-sonnet-5-5",
};

export function loadSettings(): LlmSettings {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return { provider: "gemini", key: "", model: "", ...JSON.parse(raw) };
  } catch {
    /* storage can be blocked */
  }
  return { provider: "gemini", key: "", model: "" };
}

export function saveSettings(s: LlmSettings) {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function clearKey() {
  const s = loadSettings();
  saveSettings({ ...s, key: "" });
}

export function loadRole(): Role {
  try {
    const r = localStorage.getItem(ROLE_STORE);
    if (r === "Author" || r === "Reviewer" || r === "HOD") return r;
  } catch {
    /* ignore */
  }
  return "Author";
}

export function saveRole(role: Role) {
  try {
    localStorage.setItem(ROLE_STORE, role);
  } catch {
    /* ignore */
  }
}

export async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const s = loadSettings();
  const currentRole = loadRole();
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };

  if (init.body && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  headers["x-user-role"] = headers["x-user-role"] || currentRole;

  if (s.key) {
    headers["x-llm-provider"] = s.provider;
    headers["x-llm-key"] = s.key;
    headers["x-llm-model"] = s.model || DEFAULT_MODELS[s.provider];
  }

  const res = await fetch(`/api/v1${path}`, { ...init, headers });
  const json = await res.json().catch(() => null);
  if (!json?.success) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data as T;
}
