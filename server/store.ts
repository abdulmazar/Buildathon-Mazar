import type { ParsedCourse } from "./schema.js";

export type Role = "Author" | "Reviewer" | "HOD";
export type WorkflowStatus = "Draft" | "Submitted" | "Under Review" | "Pending HOD" | "Approved" | "Returned";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  comment?: string;
  statusFrom: WorkflowStatus;
  statusTo: WorkflowStatus;
}

export interface SpecState {
  id: string;
  status: WorkflowStatus;
  parsedCourse: ParsedCourse | null;
  rawSpecText?: string;
  rawBlueprintText?: string;
  hasBlueprint: boolean;
  templateChoice?: "integrated" | "non_lab";
  templateOverrideReason?: string;
  history: AuditLogEntry[];
  comments: Array<{ section: number | string; user: string; role: Role; text: string; timestamp: string }>;
  updatedAt: string;
}

// In-memory single active spec state (can also store a map of specs)
export const currentSpec: SpecState = {
  id: "current",
  status: "Draft",
  parsedCourse: null,
  hasBlueprint: false,
  history: [
    {
      id: "init",
      timestamp: new Date().toISOString(),
      user: "System",
      role: "Author",
      action: "Initialized",
      statusFrom: "Draft",
      statusTo: "Draft",
      comment: "Document initialized",
    },
  ],
  comments: [],
  updatedAt: new Date().toISOString(),
};

export function canEditContent(role: Role, status: WorkflowStatus): boolean {
  if (role !== "Author") return false;
  return status === "Draft" || status === "Returned";
}

export function logTransition(user: string, role: Role, action: string, statusTo: WorkflowStatus, comment?: string) {
  const entry: AuditLogEntry = {
    id: Math.random().toString(36).slice(2, 9),
    timestamp: new Date().toISOString(),
    user,
    role,
    action,
    comment,
    statusFrom: currentSpec.status,
    statusTo,
  };
  currentSpec.status = statusTo;
  currentSpec.updatedAt = entry.timestamp;
  currentSpec.history.push(entry);
  return entry;
}
