import fs from "node:fs";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { ApiError, fail, ok } from "./envelope.js";
import { configFromRequest, generateJson } from "./llm.js";
import { extractTextFromFile } from "./parsers.js";
import { ParsedCourseSchema } from "./schema.js";
import { canEditContent, currentSpec, logTransition, type Role, type WorkflowStatus } from "./store.js";

const app = express();
app.use(express.json({ limit: "15mb" }));

const api = express.Router();

api.get("/health", (_req, res) => ok(res, { status: "up" }));

// "Test key" button in Settings. Proves the key and model work, nothing more.
api.get("/llm-check", async (req, res, next) => {
  try {
    const cfg = configFromRequest(req);
    const out = await generateJson('Return exactly {"pong": true}', z.object({ pong: z.boolean() }), cfg);
    ok(res, { provider: cfg.provider, model: cfg.model, reply: out });
  } catch (e) {
    next(e);
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// GET current spec state
api.get("/current", (_req, res) => {
  ok(res, {
    status: currentSpec.status,
    parsed: currentSpec.parsedCourse,
    hasBlueprint: currentSpec.hasBlueprint,
    history: currentSpec.history,
    comments: currentSpec.comments,
    updatedAt: currentSpec.updatedAt,
  });
});

api.get("/sample-files/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join("sample-inputs", filename);
  if (!fs.existsSync(filePath)) {
    return fail(res, 404, "NOT_FOUND", "Sample file not found");
  }
  res.sendFile(path.resolve(filePath));
});


// PUT update parsed course (Author only in Draft/Returned)
api.put("/current", (req, res, next) => {
  try {
    const role = (req.header("x-user-role") as Role) || "Author";
    if (!canEditContent(role, currentSpec.status)) {
      throw new ApiError(403, "FORBIDDEN", `Only the Author can edit content, and only in Draft or Returned status.`);
    }
    const validated = ParsedCourseSchema.parse(req.body);
    currentSpec.parsedCourse = validated;
    currentSpec.updatedAt = new Date().toISOString();
    ok(res, { parsed: currentSpec.parsedCourse });
  } catch (e) {
    next(e);
  }
});

// POST /api/v1/parse: Parse spec (.docx, .doc, .pdf, .html) and optional blueprint
api.post(
  "/parse",
  upload.fields([
    { name: "spec", maxCount: 1 },
    { name: "blueprint", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const role = (req.header("x-user-role") as Role) || "Author";
      if (!canEditContent(role, currentSpec.status)) {
        throw new ApiError(
          403,
          "FORBIDDEN",
          `Only the Author can upload or edit specs in Draft or Returned status (current status: ${currentSpec.status}).`
        );
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const specFile = files?.spec?.[0];
      const blueprintFile = files?.blueprint?.[0];

      if (!specFile) {
        throw new ApiError(400, "MISSING_SPEC", "Course specification file ('spec') is required.");
      }

      const specText = await extractTextFromFile(specFile.buffer, specFile.originalname, specFile.mimetype);
      let blueprintText = "";
      if (blueprintFile) {
        blueprintText = await extractTextFromFile(blueprintFile.buffer, blueprintFile.originalname, blueprintFile.mimetype);
      }

      if (!specText || specText.trim().length === 0) {
        throw new ApiError(400, "EMPTY_SPEC", "The course specification file contains no readable text.");
      }

      const cfg = configFromRequest(req);

      const prompt = `You are an expert academic curriculum parser and analyst.
Extract and structure the university course specification from the provided text.

CRITICAL EXTRACTION RULES:
1. Source of Truth:
${
  blueprintText
    ? "- A question-paper blueprint is supplied! Course Outcomes (COs) and unit-wise syllabus/topics MUST come from the blueprint. All other metadata (course title, code, department, credits L:T:P, course type, teaching hours, assessment breakdown, resources) comes from the existing specification."
    : "- No blueprint supplied. Extract Course Outcomes (COs) and units from the existing specification document."
}
2. Course Details:
   - title: Course title
   - code: Course code (e.g. CS101, AIML301)
   - department: Offering department
   - credits_ltp: Standardized strictly as "L:T:P" format (e.g. "3:0:1" or "3:1:0" or "4:0:0")
   - course_type: Course type (e.g. Integrated, Theory, Laboratory, Professional Core)
   - summary: Complete summary/overview of the course
3. Course Outcomes (COs):
   - id: sequential id, e.g. "CO-1", "CO-2", "CO-3", etc.
   - statement: complete outcome statement
   - leading_verb: the first active verb of the statement (e.g. Explain, Apply, Design, Analyze)
   - bloom_level: integer from 1 to 6 mapped from the leading verb:
     1 = Remember (define, list, recall, state, name, identify)
     2 = Understand (explain, describe, summarise, classify, discuss, interpret)
     3 = Apply (apply, solve, use, implement, compute, demonstrate)
     4 = Analyse (analyse, compare, differentiate, examine, distinguish, select)
     5 = Evaluate (evaluate, assess, justify, critique, judge, recommend)
     6 = Create (design, develop, build, construct, formulate, propose)
4. Units:
   - number: 1, 2, 3, etc.
   - title: Unit title
   - content: Detailed unit topics / contents
   - hours: estimated teaching hours (number)
   - lab: practical/lab exercises description if present, else null
5. Teaching hours:
   - lectures, lab, tests_exams, total
6. Assessment:
   - components: list of components with name and weight_percent (e.g. Continuous Assessment, Mid-term, End-semester exam)
   - co_coverage: map of CO id (e.g. "CO-1") to array of component names assessing that CO
7. Resources:
   - List of textbooks, reference books, and online sources.

COURSE SPECIFICATION TEXT:
"""
${specText.slice(0, 30000)}
"""

${
  blueprintText
    ? `QUESTION PAPER BLUEPRINT TEXT:
"""
${blueprintText.slice(0, 20000)}
"""`
    : ""
}
`;

      const parsedData = await generateJson(prompt, ParsedCourseSchema, cfg);

      currentSpec.parsedCourse = parsedData;
      currentSpec.rawSpecText = specText;
      currentSpec.rawBlueprintText = blueprintText;
      currentSpec.hasBlueprint = !!blueprintFile;
      currentSpec.updatedAt = new Date().toISOString();

      logTransition(
        "Author",
        "Author",
        "Uploaded & Parsed",
        currentSpec.status,
        `Parsed ${parsedData.code}: ${parsedData.course_outcomes.length} COs, ${parsedData.units.length} units.`
      );

      ok(res, {
        parsed: parsedData,
        hasBlueprint: !!blueprintFile,
        status: currentSpec.status,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Workflow state transition
api.post("/workflow/transition", (req, res, next) => {
  try {
    const role = (req.header("x-user-role") as Role) || "Author";
    const { action, comment } = req.body as { action: string; comment?: string };

    let nextStatus: WorkflowStatus = currentSpec.status;

    if (action === "submit") {
      if (role !== "Author") throw new ApiError(403, "FORBIDDEN", "Only Author can submit.");
      if (currentSpec.status !== "Draft" && currentSpec.status !== "Returned") {
        throw new ApiError(400, "BAD_STATE", `Cannot submit from status ${currentSpec.status}`);
      }
      nextStatus = "Submitted";
    } else if (action === "review_open") {
      if (role !== "Reviewer") throw new ApiError(403, "FORBIDDEN", "Only Reviewer can start review.");
      nextStatus = "Under Review";
    } else if (action === "review_forward") {
      if (role !== "Reviewer") throw new ApiError(403, "FORBIDDEN", "Only Reviewer can forward to HOD.");
      nextStatus = "Pending HOD";
    } else if (action === "review_return") {
      if (role !== "Reviewer") throw new ApiError(403, "FORBIDDEN", "Only Reviewer can return spec.");
      if (!comment?.trim()) throw new ApiError(400, "MISSING_COMMENT", "Reviewer must provide a comment when returning.");
      nextStatus = "Returned";
    } else if (action === "hod_approve") {
      if (role !== "HOD") throw new ApiError(403, "FORBIDDEN", "Only HOD can approve.");
      nextStatus = "Approved";
    } else if (action === "hod_return") {
      if (role !== "HOD") throw new ApiError(403, "FORBIDDEN", "Only HOD can return spec.");
      if (!comment?.trim()) throw new ApiError(400, "MISSING_COMMENT", "HOD must provide a comment when returning.");
      nextStatus = "Returned";
    } else {
      throw new ApiError(400, "UNKNOWN_ACTION", `Unknown action: ${action}`);
    }

    const entry = logTransition(role, role, action, nextStatus, comment);
    ok(res, { status: currentSpec.status, entry });
  } catch (e) {
    next(e);
  }
});

// The scorer runs your app and calls this route with the sample files, exactly like `npm run verify` does.
api.post(
  "/generate",
  upload.fields([
    { name: "spec", maxCount: 1 },
    { name: "blueprint", maxCount: 1 },
  ]),
  (_req, res) => {
    fail(res, 501, "NOT_BUILT", "POST /api/v1/generate is not built yet (Level 3).");
  }
);

app.use("/api/v1", api);
app.use("/api", (_req, res) => fail(res, 404, "NOT_FOUND", "No such route"));

// Mount Vite middleware for dev or static dist for prod
const isDev = process.env.NODE_ENV !== "production";
if (isDev) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true, host: "0.0.0.0" },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else if (fs.existsSync("dist")) {
  const distPath = path.resolve("dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) return fail(res, err.status, err.code, err.message);
  console.error("Unhandled:", err instanceof Error ? err.message : "unknown error");
  fail(res, 500, "SERVER_ERROR", "Something went wrong on the server.");
});

const port = Number(process.env.PORT ?? 3000);
const host = "0.0.0.0";
app.listen(port, host, () => {
  console.log(`SpecForge running on http://${host}:${port}`);
});

// Also bind mirror port 3001 if different, for scorer and verification scripts
const mirrorPort = 3001;
if (port !== mirrorPort) {
  const mirrorApp = express();
  mirrorApp.use(app);
  mirrorApp.listen(mirrorPort, host, () => {
    console.log(`Scorer API mirror listening on http://${host}:${mirrorPort}/api/v1`);
  }).on("error", () => {
    // Port 3001 already in use or unavailable
  });
}
