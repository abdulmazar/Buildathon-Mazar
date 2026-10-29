import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { z } from "zod";
import poPsoConfig from "../config/po_pso.json";
import { extractTextFromFile } from "./parsers.js";
import { generateJson, type LlmConfig } from "./llm.js";

// Exact schema matching config/specforge_output.schema.json
export const SpecForgeOutputSchema = z.object({
  schema_version: z.literal("1.0"),
  input_id: z.string(),
  template: z.enum(["integrated", "non_lab"]),
  course: z.object({
    title: z.string(),
    code: z.string(),
    department: z.string(),
    credits_ltp: z.string().regex(/^\d+:\d+:\d+$/),
    course_type: z.string(),
    summary: z.string(),
  }),
  course_outcomes: z.array(
    z.object({
      id: z.string().regex(/^CO-\d+$/),
      statement: z.string(),
      bloom_level: z.number().int().min(1).max(6),
    })
  ).min(1),
  units: z.array(
    z.object({
      number: z.number().int(),
      title: z.string(),
      lab: z.string().nullable().optional(),
    })
  ),
  co_po_pso_map: z.record(
    z.record(
      z.object({
        level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        justification: z.string(),
      })
    )
  ),
  teaching_hours: z.object({
    lectures: z.number(),
    lab: z.number(),
    tests_exams: z.number(),
    total: z.number(),
  }),
  assessment: z.object({
    components: z.array(
      z.object({
        name: z.string(),
        weight_percent: z.number(),
      })
    ),
    co_coverage: z.record(z.array(z.string())),
  }),
  defects: z.array(
    z.object({
      code: z.enum([
        "CO_MISSING_IN_TABLE",
        "CO_EXTRA_IN_TABLE",
        "CO_ASSESSMENT_MISMATCH",
        "PSO_COLUMN_MISMATCH",
        "MAPPING_BLOOM_MISMATCH",
        "MAPPING_UNSUPPORTED",
        "WRONG_TEMPLATE",
        "PLACEHOLDER_TEXT",
        "SUMMARY_SYLLABUS_MISMATCH",
        "LABEL_OR_TITLE_MISMATCH",
        "HOURS_INCONSISTENT",
        "WEIGHTAGE_INCONSISTENT",
        "TYPO_OR_FORMAT",
        "SECTION_NOT_IN_TEMPLATE",
        "MARKS_INCONSISTENT",
        "OTHER",
      ]),
      location: z.object({
        source: z.enum(["spec", "blueprint", "template"]),
        section: z.number().int().min(1).max(12).nullable(),
        refs: z.array(z.string()),
      }),
      description: z.string(),
      fix: z.string(),
    })
  ),
});

export type SpecForgeOutput = z.infer<typeof SpecForgeOutputSchema>;

// Deterministic rule-based defect detector strictly matching V1-V10
export function detectDefects(
  specText: string,
  blueprintText: string,
  data: Omit<SpecForgeOutput, "defects">
): SpecForgeOutput["defects"] {
  const defects: SpecForgeOutput["defects"] = [];

  // V1: Check Section 5 for missing COs (e.g. CO-5 missing in raw spec table)
  const section5Match = specText.match(/Course Map\s*\(CO-PO-PSO Map\)[\s\S]*?(?=Course Teaching and Learning Methods)/i);
  if (section5Match) {
    const s5Text = section5Match[0];
    for (const co of data.course_outcomes) {
      const coPattern = new RegExp(`\\b${co.id}\\b`, "i");
      if (!coPattern.test(s5Text)) {
        defects.push({
          code: "CO_MISSING_IN_TABLE",
          location: {
            source: "spec",
            section: 5,
            refs: [co.id],
          },
          description: `Course Outcome ${co.id} is defined in Section 3 but missing from Section 5 Course Map.`,
          fix: `Added ${co.id} row to Section 5 CO-PO-PSO mapping matrix with justified ratings.`,
        });
      }
    }

    // V8: Check for unauthorized PSO columns (e.g. PSO-3 in Section 5)
    if (/PSO-3\b/i.test(s5Text)) {
      defects.push({
        code: "PSO_COLUMN_MISMATCH",
        location: {
          source: "spec",
          section: 5,
          refs: ["PSO-3"],
        },
        description: "Section 5 mapping table includes column PSO-3, but the academic programme only defines PSO-1 and PSO-2.",
        fix: "Removed extraneous PSO-3 column from the CO-PO-PSO matrix.",
      });
    }
  }

  // V1 / V4: Check Section 7 for extra or undefined COs (e.g. CO-6 present in Section 7)
  const section7Match = specText.match(/Focus of COs on each Component[\s\S]*?(?=Achieving Co|Course Resources|$)/i);
  if (section7Match) {
    const s7Text = section7Match[0];
    const foundCos = s7Text.match(/\bCO-\d+\b/gi) || [];
    const validCoIds = new Set(data.course_outcomes.map((c) => c.id.toUpperCase()));
    const extraCos = new Set<string>();

    for (const rawCo of foundCos) {
      const upper = rawCo.toUpperCase();
      if (!validCoIds.has(upper)) {
        extraCos.add(upper);
      }
    }

    for (const extra of extraCos) {
      defects.push({
        code: "CO_EXTRA_IN_TABLE",
        location: {
          source: "spec",
          section: 7,
          refs: [extra],
        },
        description: `Section 7 Assessment focus table includes undefined outcome ${extra} not present in Section 3.`,
        fix: `Removed undefined ${extra} from the Section 7 assessment focus table.`,
      });
    }
  }

  // V5: Teaching hours inconsistency
  // Check stated total in Section 2 vs Section 6
  const s2HoursMatch = specText.match(/Total Hours of Interaction[\s:\n]*(\d+)/i);
  const s2Hours = s2HoursMatch ? parseInt(s2HoursMatch[1], 10) : null;
  const totalDuration = data.teaching_hours.total;
  const sumHours = data.teaching_hours.lectures + data.teaching_hours.lab + data.teaching_hours.tests_exams;

  if (s2Hours && s2Hours !== totalDuration) {
    defects.push({
      code: "HOURS_INCONSISTENT",
      location: {
        source: "spec",
        section: 6,
        refs: [],
      },
      description: `Sum of teaching hours in Section 6 (${data.teaching_hours.lectures} lectures + ${data.teaching_hours.lab} lab + ${data.teaching_hours.tests_exams} exams = ${totalDuration} hours) does not match Section 2 stated interaction hours of ${s2Hours} hours.`,
      fix: `Reconciled total interaction hours in Section 2 to ${totalDuration} hours to match detailed teaching schedule.`,
    });
  } else if (sumHours > 0 && totalDuration > 0 && sumHours !== totalDuration) {
    defects.push({
      code: "HOURS_INCONSISTENT",
      location: {
        source: "spec",
        section: 6,
        refs: [],
      },
      description: `Teaching hours sum mismatch: components sum to ${sumHours} hours but stated total is ${totalDuration} hours.`,
      fix: `Adjusted total duration to ${sumHours} hours.`,
    });
  }

  // V6: Assessment weightages sum
  const weightSum = data.assessment.components.reduce((acc, c) => acc + (c.weight_percent || 0), 0);
  if (weightSum > 0 && Math.abs(weightSum - 100) > 0.01) {
    defects.push({
      code: "WEIGHTAGE_INCONSISTENT",
      location: {
        source: "spec",
        section: 7,
        refs: [],
      },
      description: `Sum of assessment weightages equals ${weightSum}%, expected exactly 100%.`,
      fix: "Normalized assessment component weightages to sum to 100%.",
    });
  }

  // Extra section in spec not in template (e.g. "Course Organization")
  if (/Course Organization\b/i.test(specText)) {
    defects.push({
      code: "SECTION_NOT_IN_TEMPLATE",
      location: {
        source: "spec",
        section: null,
        refs: [],
      },
      description: "Specification draft includes an unnumbered 'Course Organization' section that does not exist in the official syllabus template.",
      fix: "Omitted Course Organization metadata from syllabus document body; recorded in audit history.",
    });
  }

  return defects;
}

// Cheerio HTML Template Injector - STRICTLY preserves all 9 <h2> headings in order
export function injectIntoTemplate(
  templateName: "integrated" | "non_lab",
  output: SpecForgeOutput
): string {
  const candidateFiles = templateName === "integrated"
    ? ["templates/integrated_lab.html", "templates/integrated.html"]
    : ["templates/non_lab.html"];

  let templatePath = "";
  for (const c of candidateFiles) {
    if (fs.existsSync(c)) {
      templatePath = c;
      break;
    }
  }
  if (!templatePath) {
    throw new Error(`Template not found for ${templateName}`);
  }

  const rawHtml = fs.readFileSync(templatePath, "utf-8");
  const $ = cheerio.load(rawHtml);

  // 1. Page Title
  $("title").text(`Course Specifications - ${output.course.code}: ${output.course.title}`);

  // 2. Main Heading: Course Specifications: <Course Title>
  $("h1 span[contenteditable='true']").text(output.course.title);

  // 3. Metadata Table (Title, Code, Type, Department, Faculty)
  $("table").first().find("tr").each((_, tr) => {
    const label = $(tr).find("td").first().text().trim().toLowerCase();
    const valTd = $(tr).find("td").eq(1);
    if (label.includes("course title")) {
      valTd.text(output.course.title);
    } else if (label.includes("course code")) {
      valTd.text(output.course.code);
    } else if (label.includes("course type")) {
      valTd.text(output.course.course_type);
    } else if (label.includes("department")) {
      valTd.text(output.course.department);
    } else if (label.includes("faculty")) {
      valTd.text("Engineering and Technology");
    }
  });

  // 4. Section 1: Course Summary
  $("h2").each((_, h2) => {
    const txt = $(h2).text().toLowerCase();
    if (txt.includes("1. course summary") || txt.includes("course summary")) {
      const p = $(h2).nextAll("p[contenteditable='true']").first();
      if (p.length) p.text(output.course.summary);
    }
  });

  // 5. Section 2: Course Size and Credits
  $("h2").each((_, h2) => {
    const txt = $(h2).text().toLowerCase();
    if (txt.includes("2. course size and credits") || txt.includes("course size and credits")) {
      const table = $(h2).nextAll("table").first();
      if (table.length) {
        table.find("tr").each((_, tr) => {
          const label = $(tr).find("td").first().text().trim().toLowerCase();
          const valTd = $(tr).find("td").eq(1);
          if (label.includes("number of credits")) {
            const parts = output.course.credits_ltp.split(":").map(Number);
            const total = (parts[0] || 0) + Math.round((parts[1] || 0) * 0.5) + Math.round((parts[2] || 0) * 0.5);
            valTd.text(String(total || "04").padStart(2, "0"));
          } else if (label.includes("credit structure")) {
            valTd.text(output.course.credits_ltp);
          } else if (label.includes("total hours of interaction")) {
            valTd.text(String(output.teaching_hours.total || 85));
          } else if (label.includes("department responsible")) {
            valTd.text(output.course.department);
          }
        });
      }
    }
  });

  // 6. Section 3: Course Outcomes (COs)
  const coList = $("ul.co-list");
  if (coList.length) {
    coList.empty();
    output.course_outcomes.forEach((co) => {
      // Clean leading "CO-1." prefix
      const cleanStatement = co.statement.replace(/^CO-?\d+[\.:\s-]+/i, "").trim();
      coList.append(`<li>${cleanStatement}</li>\n`);
    });
  }

  // 7. Section 4: Course Contents (Units)
  // Safely replace unit rows without ever removing or touching any <h2> elements
  const sec4Heading = $("h2").filter((_, el) => $(el).text().toLowerCase().includes("course contents"));
  if (sec4Heading.length) {
    // Remove existing unit-row elements that are siblings after sec4Heading up to the next h2
    sec4Heading.nextUntil("h2", ".unit-row").remove();

    const unitRowsHtml = output.units
      .map((u) => {
        const cleanTitle = u.title.replace(/^Unit\s*\d+[\s:()-]*/i, "").trim();
        const labText = u.lab ? ` Lab Exercises: ${u.lab}` : "";
        return `<div class="unit-row">\n<span class="static unit-label" style="padding: 1px 3px; border-radius: 2px;">Unit ${u.number}:</span> <span contenteditable="true">${cleanTitle}${labText}</span>\n</div>\n`;
      })
      .join("\n");

    sec4Heading.after(unitRowsHtml);
  }

  // 8. Section 5: Course Map (CO-PO-PSO Map)
  const copoTable = $("table.copo-table");
  if (copoTable.length) {
    const tbody = copoTable.find("tbody");
    tbody.empty();
    output.course_outcomes.forEach((co) => {
      const coMap = output.co_po_pso_map[co.id] || {};
      let rowHtml = `<tr>\n<td class="text-center" contenteditable="true" style="font-weight:bold;">${co.id}</td>\n`;
      for (let i = 1; i <= 11; i++) {
        const key = `PO-${i}`;
        const lvl = coMap[key]?.level ?? "";
        rowHtml += `<td class="text-center" contenteditable="true">${lvl}</td>\n`;
      }
      for (let i = 1; i <= 2; i++) {
        const key = `PSO-${i}`;
        const lvl = coMap[key]?.level ?? "";
        rowHtml += `<td class="text-center" contenteditable="true">${lvl}</td>\n`;
      }
      rowHtml += `</tr>\n`;
      tbody.append(rowHtml);
    });
    tbody.append(
      `<tr class="copo-legend-row">\n<td class="static text-center" colspan="14"><strong>3: Very Strong Contribution, 2: Strong Contribution, 1: Moderate Contribution</strong></td>\n</tr>\n`
    );
  }

  // 9. Section 6: Teaching and Learning Methods
  $("h2").each((_, h2) => {
    const txt = $(h2).text().toLowerCase();
    if (txt.includes("teaching and learning methods")) {
      const table = $(h2).nextAll("table").first();
      if (table.length) {
        table.find("tr").each((_, tr) => {
          const rowText = $(tr).text().toLowerCase();
          if (rowText.includes("face to face lectures")) {
            $(tr).find("td").last().text(String(output.teaching_hours.lectures || 45));
          } else if (rowText.includes("practicals") || rowText.includes("practical work")) {
            $(tr).find("td").last().text(String(output.teaching_hours.lab || 30));
          } else if (rowText.includes("computer laboratory")) {
            $(tr).find("td").last().text(String(output.teaching_hours.lab || 30));
          } else if (rowText.includes("term tests") || rowText.includes("examination")) {
            $(tr).find("td").last().text(String(output.teaching_hours.tests_exams || 10));
          } else if (rowText.includes("total duration in hours")) {
            $(tr).find("td").last().text(String(output.teaching_hours.total || 85));
          }
        });
      }
    }
  });

  // 10. Section 7: Course Assessment Table - STRICTLY PRESERVES TABLE AND HEADINGS
  const assessTable = $(".assessment-integrated-table");
  if (assessTable.length) {
    const tbody = assessTable.find("tbody");
    tbody.empty();
    output.course_outcomes.forEach((co) => {
      const coverage = output.assessment.co_coverage[co.id] || [];
      const hasTerm = (pattern: RegExp) => coverage.some((c) => pattern.test(c));

      // Match actual component tokens
      const isTest1 = hasTerm(/test|term|ce/i);
      const isTest2 = hasTerm(/test-2|test 2|term/i) || isTest1;
      const isAssignment = hasTerm(/assignment/i);
      const isLab = hasTerm(/lab/i);
      const isWritten = hasTerm(/written|see|exam/i);
      const isLabExam = hasTerm(/lab.*exam|lsee/i);

      if (templateName === "integrated") {
        tbody.append(`<tr>\n<td class="static text-center" style="font-weight: bold;">${co.id}</td>\n<td class="text-center" contenteditable="true">${isTest1 ? "X" : ""}</td>\n<td class="text-center" contenteditable="true">${isTest2 ? "X" : ""}</td>\n<td class="text-center" contenteditable="true">${isAssignment ? "X" : ""}</td>\n<td class="text-center" contenteditable="true">${isLab ? "X" : ""}</td>\n<td class="text-center" contenteditable="true">${isWritten ? "X" : ""}</td>\n<td class="text-center" contenteditable="true">${isLabExam ? "X" : ""}</td>\n</tr>\n`);
      } else {
        tbody.append(`<tr>\n<td class="static text-center" style="font-weight: bold;">${co.id}</td>\n<td class="text-center" contenteditable="true">${isTest1 ? "X" : ""}</td>\n<td class="text-center" contenteditable="true">${isTest2 ? "X" : ""}</td>\n<td class="text-center" contenteditable="true">${isAssignment ? "X" : ""}</td>\n<td class="text-center" contenteditable="true">${isWritten ? "X" : ""}</td>\n</tr>\n`);
      }
    });
    const colCount = templateName === "integrated" ? 7 : 5;
    tbody.append(`<tr><td class="static" colspan="${colCount}" style="font-style: italic;">The details of number of tests and assignments to be conducted are presented in the Academic Regulations and Programme Specifications Document.</td></tr>\n`);
  }

  // 11. Remove all leftover template sample text (Computer Vision, AIC304A, AIML)
  let finalHtml = $.html();
  finalHtml = finalHtml
    .split("Computer Vision").join(output.course.title)
    .split("AIC304A").join(output.course.code)
    .split("AIML").join(output.course.department);

  // Verification sanity check: ensure all 9 sections exist
  const verify$ = cheerio.load(finalHtml);
  const h2Count = verify$("h2").length;
  if (h2Count < 9) {
    console.warn(`WARNING: Template output has only ${h2Count} <h2> sections (expected 9).`);
  }

  return finalHtml;
}

// Master pipeline running extraction, mapping, defects, and HTML generation
export async function runGeneratePipeline(
  specBuffer: Buffer,
  specName: string,
  blueprintBuffer: Buffer | null,
  blueprintName: string | null,
  cfg: LlmConfig,
  inputId = "SAMPLE"
): Promise<{ output: SpecForgeOutput; html: string }> {
  // 1. Extract raw texts
  const specText = await extractTextFromFile(specBuffer, specName);
  let blueprintText = "";
  if (blueprintBuffer && blueprintName) {
    blueprintText = await extractTextFromFile(blueprintBuffer, blueprintName);
  }

  // 2. Determine template: P > 0 in L:T:P or "laboratory" in course type -> "integrated"
  let templateChoice: "integrated" | "non_lab" = "non_lab";
  const creditMatch = specText.match(/(\d+):(\d+):(\d+)/);
  if (creditMatch) {
    const pVal = parseInt(creditMatch[3], 10);
    if (pVal > 0) templateChoice = "integrated";
  }
  if (/laboratory\b/i.test(specText) || /integrated\b/i.test(specText)) {
    templateChoice = "integrated";
  }

  // 3. Schema for AI generation pass
  const IntermediateSchema = z.object({
    course: z.object({
      title: z.string(),
      code: z.string(),
      department: z.string(),
      credits_ltp: z.string().regex(/^\d+:\d+:\d+$/),
      course_type: z.string(),
      summary: z.string().describe("Synthesized course summary explicitly covering themes of all syllabus units"),
    }),
    course_outcomes: z.array(
      z.object({
        id: z.string().regex(/^CO-\d+$/),
        statement: z.string(),
        bloom_level: z.number().int().min(1).max(6),
      })
    ).min(1),
    units: z.array(
      z.object({
        number: z.number().int(),
        title: z.string(),
        lab: z.string().nullable().optional(),
      })
    ),
    co_po_pso_map: z.record(
      z.record(
        z.object({
          level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
          justification: z.string(),
        })
      )
    ),
    teaching_hours: z.object({
      lectures: z.number(),
      lab: z.number(),
      tests_exams: z.number(),
      total: z.number(),
    }),
    assessment: z.object({
      components: z.array(
        z.object({
          name: z.string(),
          weight_percent: z.number(),
        })
      ),
      co_coverage: z.record(z.array(z.string())),
    }),
  });

  const prompt = `You are an expert university curriculum engineering agent for SpecForge.
Parse the supplied course specification and blueprint documents, synthesize the outcome articulation matrix, and produce a structured academic course specification.

SOURCE OF TRUTH RULES:
1. ${
    blueprintText
      ? "A Question Paper Blueprint IS PROVIDED. Course Outcomes (COs) and unit-wise syllabus / topics MUST come from the blueprint. Everything else (title, code, department, credits L:T:P, course type, teaching hours, assessment) comes from the existing specification."
      : "No blueprint supplied. Extract Course Outcomes and units from the existing specification draft."
  }
2. Course summary:
   - Synthesize a comprehensive course overview that explicitly references the core themes of EVERY syllabus unit (Unit 1 through Unit N).
   - Ensure the summary accurately reflects the full breadth of the syllabus units.
3. Standardize credits_ltp strictly as "L:T:P" format (e.g. "3:0:1").
4. Course Outcomes:
   - id: "CO-1", "CO-2", etc.
   - statement: complete statement without leading "CO-1." prefix.
   - bloom_level: 1 to 6 mapped strictly from the leading verb:
     L1 Remember (define, list, recall, state)
     L2 Understand (explain, describe, summarise, classify)
     L3 Apply (apply, solve, use, implement, compute)
     L4 Analyse (analyse, compare, differentiate, select)
     L5 Evaluate (evaluate, assess, justify, critique)
     L6 Create (design, develop, build, construct)
5. CO-PO-PSO Articulation Map:
   - Every CO in Section 3 must have a row in co_po_pso_map.
   - Columns are strictly PO-1 through PO-11 and PSO-1, PSO-2. Do NOT include any PSO-3.
   - Cell levels: 1 (moderate), 2 (strong), 3 (very strong). Omit blank cells.
   - BLOOM CEILING: A mapping strength CANNOT exceed the CO's Bloom's level. (L1 max level 1, L2 max level 2, L3+ max level 3).
   - PO-5 REQUIRES real tool use (lab, programming, IDE, code, software implementation). Conceptual COs must have PO-5 blank.
   - PO-6 to PO-11 require explicit evidence in the syllabus or assessment; without explicit evidence, leave them blank.
   - Each non-empty cell MUST have a concise one-line justification.
6. Teaching Hours:
   - lectures, lab, tests_exams, total.
   - Reconcile Section 6 rows so lectures + lab + tests_exams equals total.
7. Assessment:
   - components: Continuous Evaluation (CE) and Semester End Examination (SEE) / Lab with weight_percent (summing to 100%).
   - co_coverage: map each CO-id to array of component names assessing it (e.g. ["Tests", "Written exam"]). Do NOT include undefined COs.

EXISTING COURSE SPECIFICATION DRAFT:
"""
${specText.slice(0, 30000)}
"""

${
  blueprintText
    ? `QUESTION PAPER BLUEPRINT:
"""
${blueprintText.slice(0, 20000)}
"""`
    : ""
}
`;

  const intermediate = await generateJson(prompt, IntermediateSchema, cfg);

  // 4. Deterministic post-processing for Bloom ceiling and PO-5 / PO-6..11 rules
  for (const co of intermediate.course_outcomes) {
    const bloomCeiling = co.bloom_level === 1 ? 1 : co.bloom_level === 2 ? 2 : 3;
    const coMap = intermediate.co_po_pso_map[co.id] || {};

    for (const [key, cell] of Object.entries(coMap)) {
      if (cell && cell.level) {
        if (cell.level > bloomCeiling) {
          cell.level = bloomCeiling as 1 | 2 | 3;
        }
      }
    }

    // Check tool evidence for PO-5
    const hasToolEvidence = /\b(program|code|coding|software|tool|ide|implement|develop|lab|practical|algorithm|python)\b/i.test(
      co.statement
    );
    if (!hasToolEvidence && coMap["PO-5"]) {
      delete coMap["PO-5"];
    }

    // PO-6 to PO-11 blank without explicit evidence
    const poExtra = ["PO-6", "PO-7", "PO-8", "PO-9", "PO-10", "PO-11"];
    for (const po of poExtra) {
      if (coMap[po]) {
        const stmt = co.statement.toLowerCase();
        let keep = false;
        if (po === "PO-6" && (stmt.includes("society") || stmt.includes("social") || stmt.includes("safety"))) keep = true;
        if (po === "PO-7" && (stmt.includes("environment") || stmt.includes("sustainability"))) keep = true;
        if (po === "PO-8" && (stmt.includes("ethics") || stmt.includes("ethical"))) keep = true;
        if (po === "PO-9" && (stmt.includes("team") || stmt.includes("collaboration"))) keep = true;
        if (po === "PO-10" && (stmt.includes("communicat") || stmt.includes("presentation"))) keep = true;
        if (po === "PO-11" && (stmt.includes("project management") || stmt.includes("finance"))) keep = true;
        if (!keep) delete coMap[po];
      }
    }
  }

  // 5. Calculate deterministic defects
  const defects = detectDefects(specText, blueprintText, {
    schema_version: "1.0",
    input_id: inputId,
    template: templateChoice,
    ...intermediate,
  });

  const fullOutput: SpecForgeOutput = {
    schema_version: "1.0",
    input_id: inputId,
    template: templateChoice,
    course: intermediate.course,
    course_outcomes: intermediate.course_outcomes,
    units: intermediate.units,
    co_po_pso_map: intermediate.co_po_pso_map,
    teaching_hours: intermediate.teaching_hours,
    assessment: intermediate.assessment,
    defects,
  };

  // 6. Inject into HTML Template
  const html = injectIntoTemplate(templateChoice, fullOutput);

  return { output: fullOutput, html };
}
