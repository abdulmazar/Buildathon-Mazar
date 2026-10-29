import { z } from "zod";

export const CourseOutcomeSchema = z.object({
  id: z.string().describe("e.g. CO-1, CO-2"),
  statement: z.string().describe("Full outcome statement"),
  leading_verb: z.string().describe("Leading action verb, e.g. Apply, Explain, Design"),
  bloom_level: z.preprocess((val) => {
    if (typeof val === "number") return Math.min(6, Math.max(1, Math.round(val)));
    if (typeof val === "string") {
      const m = val.match(/\d+/);
      if (m) {
        const n = parseInt(m[0], 10);
        if (n >= 1 && n <= 6) return n;
      }
    }
    return 3;
  }, z.number().int().min(1).max(6).default(3)).describe("Bloom taxonomy cognitive level 1-6"),
});

export const UnitSchema = z.object({
  number: z.preprocess((val) => {
    if (typeof val === "number") return Math.round(val);
    if (typeof val === "string") {
      const m = val.match(/\d+/);
      if (m) return parseInt(m[0], 10);
    }
    return 1;
  }, z.number().int().default(1)).describe("1, 2, 3, etc."),
  title: z.string().describe("Unit title"),
  content: z.string().optional().default(""),
  hours: z.preprocess((val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const m = val.match(/\d+/);
      if (m) return parseInt(m[0], 10);
    }
    return 0;
  }, z.number().default(0)),
  lab: z.string().nullable().optional().default(null),
});

export const AssessmentComponentSchema = z.object({
  name: z.string(),
  weight_percent: z.preprocess((val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const m = val.match(/\d+(?:\.\d+)?/);
      if (m) return parseFloat(m[0]);
    }
    return 0;
  }, z.number().default(0)),
});

export const ParsedCourseSchema = z.object({
  title: z.string().describe("Course title"),
  code: z.string().describe("Course code e.g. CS101"),
  department: z.string().describe("Offering department"),
  credits_ltp: z.string().describe("Credits in L:T:P format, e.g. 3:0:1 or 3:1:0"),
  course_type: z.string().describe("e.g. Integrated, Theory, Laboratory, Professional Core"),
  summary: z.string().describe("Course summary / description"),
  course_outcomes: z.array(CourseOutcomeSchema).min(1),
  units: z.array(UnitSchema).min(1),
  teaching_hours: z.object({
    lectures: z.preprocess((v) => (typeof v === "string" ? parseInt(v.match(/\d+/)?.[0] || "0", 10) : Number(v) || 0), z.number().default(0)),
    lab: z.preprocess((v) => (typeof v === "string" ? parseInt(v.match(/\d+/)?.[0] || "0", 10) : Number(v) || 0), z.number().default(0)),
    tests_exams: z.preprocess((v) => (typeof v === "string" ? parseInt(v.match(/\d+/)?.[0] || "0", 10) : Number(v) || 0), z.number().default(0)),
    total: z.preprocess((v) => (typeof v === "string" ? parseInt(v.match(/\d+/)?.[0] || "0", 10) : Number(v) || 0), z.number().default(0)),
  }).default({ lectures: 0, lab: 0, tests_exams: 0, total: 0 }),
  assessment: z.object({
    components: z.array(AssessmentComponentSchema).default([]),
    co_coverage: z.record(z.array(z.string())).default({}),
  }).default({ components: [], co_coverage: {} }),
  resources: z.array(z.string()).default([]),
  existing_co_po_map: z.record(z.record(z.union([z.number(), z.null()]))).optional().default({}),
  raw_notes: z.string().optional().default(""),
});

export type ParsedCourse = z.infer<typeof ParsedCourseSchema>;
export type CourseOutcome = z.infer<typeof CourseOutcomeSchema>;
export type Unit = z.infer<typeof UnitSchema>;
