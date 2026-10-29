import fs from "node:fs";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { ApiError, fail, ok } from "./envelope.js";
import { configFromRequest, generateJson } from "./llm.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

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

// Your routes go here (Level 1 onward).

// The scorer runs your app and calls this route with the sample files, exactly like `npm run verify` does.
// Contract: multipart fields "spec" (required) and "blueprint" (optional), AI key in the x-llm-* headers.
// Reply: { success: true, data: { output: <specforge_output object>, html: "<the filled spec document>" } }
// Level 3 builds it. Until then it answers 501.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
api.post("/generate", upload.fields([{ name: "spec", maxCount: 1 }, { name: "blueprint", maxCount: 1 }]), (_req, res) => {
  fail(res, 501, "NOT_BUILT", "POST /api/v1/generate is not built yet (Level 3).");
});

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
  console.error("Unhandled:", err instanceof Error ? err.message : "unknown error"); // never log headers or keys
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
