export interface CourseOutcome {
  id: string;
  statement: string;
  leading_verb: string;
  bloom_level: number;
}

export interface Unit {
  number: number;
  title: string;
  content?: string;
  hours?: number;
  lab?: string | null;
}

export interface AssessmentComponent {
  name: string;
  weight_percent: number;
}

export interface ParsedCourse {
  title: string;
  code: string;
  department: string;
  credits_ltp: string;
  course_type: string;
  summary: string;
  course_outcomes: CourseOutcome[];
  units: Unit[];
  teaching_hours: {
    lectures: number;
    lab: number;
    tests_exams: number;
    total: number;
  };
  assessment: {
    components: AssessmentComponent[];
    co_coverage: Record<string, string[]>;
  };
  resources: string[];
  existing_co_po_map?: Record<string, Record<string, number | null>>;
  raw_notes?: string;
}

export interface CoPoMappingCell {
  level: 1 | 2 | 3;
  justification: string;
}

export type CoPoPsoMap = Record<string, Record<string, CoPoMappingCell | null>>;

export interface Defect {
  code: string;
  location: {
    source: "spec" | "blueprint" | "template";
    section: number | null;
    refs: string[];
  };
  description: string;
  fix: string;
  severity?: "High" | "Medium" | "Low";
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  comment?: string;
  statusFrom: string;
  statusTo: string;
}

export interface SpecForgeOutput {
  schema_version: "1.0";
  input_id: string;
  template: "integrated" | "non_lab";
  course: {
    title: string;
    code: string;
    department: string;
    credits_ltp: string;
    course_type: string;
    summary: string;
  };
  course_outcomes: Array<{
    id: string;
    statement: string;
    bloom_level: number;
  }>;
  units: Array<{
    number: number;
    title: string;
    lab?: string | null;
  }>;
  co_po_pso_map: CoPoPsoMap;
  teaching_hours: Record<string, number>;
  assessment: {
    components: Array<{ name: string; weight_percent: number }>;
    co_coverage: Record<string, string[]>;
  };
  defects: Defect[];
}

export interface CurrentSpecResponse {
  status: "Draft" | "Submitted" | "Under Review" | "Pending HOD" | "Approved" | "Returned";
  parsed: ParsedCourse | null;
  hasBlueprint: boolean;
  templateChoice?: "integrated" | "non_lab";
  templateSignals?: string[];
  templateOverrideReason?: string;
  co_po_pso_map?: CoPoPsoMap;
  defects?: Defect[];
  history: AuditLogEntry[];
  comments: Array<{
    section: number | string;
    user: string;
    role: string;
    text: string;
    timestamp: string;
  }>;
  updatedAt: string;
}
