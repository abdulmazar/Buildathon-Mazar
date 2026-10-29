import { useEffect, useState } from "react";
import { call, loadRole, loadSettings, saveRole, type Role } from "./api";
import Header from "./components/Header";
import ReferenceDrawer from "./components/ReferenceDrawer";
import Sidebar, { type StepId } from "./components/Sidebar";
import ChecksScreen from "./components/screens/ChecksScreen";
import ExportScreen from "./components/screens/ExportScreen";
import MapScreen from "./components/screens/MapScreen";
import SpecScreen from "./components/screens/SpecScreen";
import UploadScreen from "./components/screens/UploadScreen";
import WorkflowScreen from "./components/screens/WorkflowScreen";
import Settings from "./Settings";
import type { AuditLogEntry, CoPoPsoMap, CurrentSpecResponse, Defect, ParsedCourse, SpecForgeOutput } from "./types";
import poPsoConfig from "../config/po_pso.json";

export default function App() {
  const [activeStep, setActiveStep] = useState<StepId>("upload");
  const [role, setRole] = useState<Role>(loadRole());
  const [status, setStatus] = useState<string>("Draft");
  const [serverHealth, setServerHealth] = useState("checking...");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  // File Upload states
  const [specFile, setSpecFile] = useState<File | null>(null);
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Course & Spec state
  const [parsed, setParsed] = useState<ParsedCourse | null>(null);
  const [, setHasBlueprint] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Template State
  const [templateChoice, setTemplateChoice] = useState<"integrated" | "non_lab">("integrated");
  const [detectedTemplate, setDetectedTemplate] = useState<"integrated" | "non_lab">("integrated");
  const [signals, setSignals] = useState<string[]>([]);
  const [overrideReason, setOverrideReason] = useState("");

  // Map state
  const [mapData, setMapData] = useState<CoPoPsoMap>({});
  const [mappingBusy, setMappingBusy] = useState(false);

  // Defects state
  const [defects, setDefects] = useState<Defect[]>([]);
  const [auditBusy, setAuditBusy] = useState(false);

  // Workflow & Audit state
  const [history, setHistory] = useState<AuditLogEntry[]>([
    {
      id: "init",
      timestamp: new Date().toISOString(),
      user: "System",
      role: "Author",
      action: "Document Initialized",
      statusFrom: "Draft",
      statusTo: "Draft",
    },
  ]);
  const [workflowBusy, setWorkflowBusy] = useState(false);

  // Export HTML state
  const [specHtml, setSpecHtml] = useState<string | null>(null);

  const canEdit = role === "Author" && (status === "Draft" || status === "Returned");
  const currentKey = loadSettings().key;

  // Initial load
  useEffect(() => {
    call<{ status: string }>("/health")
      .then((d) => setServerHealth(d.status))
      .catch(() => setServerHealth("offline"));

    call<CurrentSpecResponse>("/current")
      .then((data) => {
        setStatus(data.status);
        if (data.history?.length) setHistory(data.history);
        if (data.parsed) {
          setParsed(data.parsed);
          setHasBlueprint(data.hasBlueprint);
          calculateTemplate(data.parsed);
        }
      })
      .catch(() => {});
  }, []);

  const calculateTemplate = (course: ParsedCourse) => {
    const parts = (course.credits_ltp || "3:0:0").split(":").map((n) => Number(n) || 0);
    const practicalCredit = parts[2] ?? 0;
    const isLabType = (course.course_type || "").toLowerCase().includes("laboratory") || (course.course_type || "").toLowerCase().includes("integrated");

    const sigs: string[] = [];
    let detected: "integrated" | "non_lab" = "non_lab";

    if (practicalCredit > 0) {
      sigs.push(`Non-zero Practical value in credit structure (P=${practicalCredit} in ${course.credits_ltp})`);
      detected = "integrated";
    }
    if (isLabType) {
      sigs.push(`Course type specified as "${course.course_type}"`);
      detected = "integrated";
    }
    if (sigs.length === 0) {
      sigs.push(`Zero practical credit (P=0 in ${course.credits_ltp}) and theory course type`);
    }

    setDetectedTemplate(detected);
    setSignals(sigs);
    if (!overrideReason) {
      setTemplateChoice(detected);
    }
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    saveRole(newRole);
  };

  const handleLoadSample = async (type: "both" | "spec-only") => {
    setParsing(true);
    setParseError(null);
    try {
      const specRes = await fetch("/api/v1/sample-files/sample_course_spec.docx");
      if (!specRes.ok) throw new Error("Could not load sample_course_spec.docx");
      const specBlob = await specRes.blob();
      const sFile = new File([specBlob], "sample_course_spec.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      setSpecFile(sFile);

      if (type === "both") {
        const bpRes = await fetch("/api/v1/sample-files/sample_blueprint.doc");
        if (!bpRes.ok) throw new Error("Could not load sample_blueprint.doc");
        const bpBlob = await bpRes.blob();
        const bFile = new File([bpBlob], "sample_blueprint.doc", { type: "application/msword" });
        setBlueprintFile(bFile);
      } else {
        setBlueprintFile(null);
      }
    } catch (err: unknown) {
      setParseError((err as Error).message);
    } finally {
      setParsing(false);
    }
  };

  const handleParse = async () => {
    if (!specFile) {
      setParseError("Please select a course specification file (.docx, .doc, .pdf, .html).");
      return;
    }

    setParsing(true);
    setParseError(null);
    const formData = new FormData();
    formData.append("spec", specFile);
    if (blueprintFile) formData.append("blueprint", blueprintFile);

    try {
      const result = await call<{
        parsed: ParsedCourse;
        hasBlueprint: boolean;
        status: string;
        defects?: Defect[];
        templateChoice?: "integrated" | "non_lab";
        html?: string;
      }>("/parse", {
        method: "POST",
        body: formData,
      });

      setParsed(result.parsed);
      setHasBlueprint(result.hasBlueprint);
      setStatus(result.status);
      if (result.templateChoice) {
        setTemplateChoice(result.templateChoice);
        setDetectedTemplate(result.templateChoice);
      }
      if (result.defects && result.defects.length > 0) {
        setDefects(result.defects);
      } else {
        runDeterministicAudit(result.parsed, result.templateChoice || templateChoice, mapData);
      }
      if (result.html) {
        setSpecHtml(result.html);
      }
      calculateTemplate(result.parsed);
      initializeMapping(result.parsed);
      setActiveStep("spec");
    } catch (err: unknown) {
      setParseError((err as Error).message);
    } finally {
      setParsing(false);
    }
  };

  const initializeMapping = (course: ParsedCourse) => {
    const nextMap: CoPoPsoMap = {};
    for (const co of course.course_outcomes) {
      nextMap[co.id] = {};
      const ceiling = Math.min(3, Math.max(1, Math.min(co.bloom_level, 3))) as 1 | 2 | 3;
      nextMap[co.id]["PO-1"] = {
        level: ceiling,
        justification: `Applies fundamental discipline concepts to address ${co.leading_verb.toLowerCase()} objectives.`,
      };
      if (co.bloom_level >= 3) {
        nextMap[co.id]["PO-2"] = {
          level: Math.min(2, ceiling) as 1 | 2 | 3,
          justification: `Analyzes technical domain requirements and formulates structured solutions.`,
        };
      }
      if (co.bloom_level >= 4) {
        nextMap[co.id]["PO-3"] = {
          level: Math.min(2, ceiling) as 1 | 2 | 3,
          justification: `Develops and evaluates modular components against system specifications.`,
        };
      }
      nextMap[co.id]["PSO-1"] = {
        level: ceiling,
        justification: `Demonstrates algorithmic problem-solving competency aligned with curriculum benchmarks.`,
      };
    }
    setMapData(nextMap);
  };

  const handleUpdateCell = (coId: string, targetId: string, level: 1 | 2 | 3 | null, justification: string) => {
    const next = { ...mapData };
    if (!next[coId]) next[coId] = {};
    if (level === null) {
      delete next[coId][targetId];
    } else {
      next[coId][targetId] = { level, justification };
    }
    setMapData(next);
  };

  const handleAutoMap = () => {
    if (!parsed) return;
    setMappingBusy(true);
    setTimeout(() => {
      initializeMapping(parsed);
      setMappingBusy(false);
    }, 600);
  };

  const runDeterministicAudit = (course: ParsedCourse, tmpl: "integrated" | "non_lab", currentMap: CoPoPsoMap) => {
    setAuditBusy(true);
    const issues: Defect[] = [];

    // V1: CO count consistency
    const coCount = course.course_outcomes.length;
    const mapCoCount = Object.keys(currentMap).length || coCount;
    if (coCount !== mapCoCount) {
      issues.push({
        code: "CO_MISSING_IN_TABLE",
        location: { source: "spec", section: 5, refs: [] },
        description: `CO count mismatch: Section 3 defines ${coCount} COs but mapping matrix has ${mapCoCount}.`,
        fix: "Synchronized mapping table rows to match defined Course Outcomes.",
        severity: "High",
      });
    }

    // V2: Every CO mapped to at least 1 PO
    for (const co of course.course_outcomes) {
      const targets = currentMap[co.id] || {};
      const hasPo = Object.keys(targets).some((k) => k.startsWith("PO-") && targets[k]?.level);
      if (!hasPo) {
        issues.push({
          code: "MAPPING_UNSUPPORTED",
          location: { source: "spec", section: 5, refs: [co.id] },
          description: `${co.id} has no valid mapping to any Program Outcome (PO).`,
          fix: `Mapped ${co.id} to PO-1 based on foundational cognitive level L${co.bloom_level}.`,
          severity: "High",
        });
      }
    }

    // V3: Every CO assessed in at least one component
    const assessedCos = new Set<string>();
    Object.entries(course.assessment.co_coverage || {}).forEach(([cId, comps]) => {
      if (comps?.length > 0) assessedCos.add(cId);
    });
    for (const co of course.course_outcomes) {
      if (!assessedCos.has(co.id) && Object.keys(course.assessment.co_coverage || {}).length > 0) {
        issues.push({
          code: "CO_ASSESSMENT_MISMATCH",
          location: { source: "spec", section: 7, refs: [co.id] },
          description: `${co.id} is not mapped to any assessment evaluation component.`,
          fix: `Added ${co.id} to Continuous Evaluation component coverage.`,
          severity: "Medium",
        });
      }
    }

    // V5: Teaching hours sum
    const statedTotal = course.teaching_hours.total;
    const calcTotal = course.teaching_hours.lectures + course.teaching_hours.lab + course.teaching_hours.tests_exams;
    if (statedTotal > 0 && statedTotal !== calcTotal) {
      issues.push({
        code: "HOURS_INCONSISTENT",
        location: { source: "spec", section: 2, refs: [] },
        description: `Teaching hours inconsistency: stated total is ${statedTotal} hrs, but sum of components is ${calcTotal} hrs.`,
        fix: `Recalculated total teaching hours to ${calcTotal} hrs to match component distribution.`,
        severity: "Medium",
      });
    }

    // V6: Assessment weightage sum = 100%
    const weightSum = course.assessment.components.reduce((sum, c) => sum + (c.weight_percent || 0), 0);
    if (weightSum > 0 && Math.abs(weightSum - 100) > 0.01) {
      issues.push({
        code: "WEIGHTAGE_INCONSISTENT",
        location: { source: "spec", section: 7, refs: [] },
        description: `Assessment weightages total ${weightSum}%, expected exactly 100%.`,
        fix: "Adjusted component weightages proportionally to sum to 100%.",
        severity: "High",
      });
    }

    // V7: Template choice rule
    const parts = (course.credits_ltp || "3:0:0").split(":").map((n) => Number(n) || 0);
    const hasPractical = (parts[2] ?? 0) > 0;
    if (hasPractical && tmpl === "non_lab" && !overrideReason) {
      issues.push({
        code: "WRONG_TEMPLATE",
        location: { source: "template", section: 2, refs: [] },
        description: "Course contains practical credits but Non-Lab template is selected without justification.",
        fix: "Recorded override requirement or switched to Integrated template.",
        severity: "Medium",
      });
    }

    setDefects(issues);
    setAuditBusy(false);
  };

  const handleSaveSpec = async () => {
    if (!parsed) return;
    try {
      await call<{ parsed: ParsedCourse }>("/current", {
        method: "PUT",
        body: JSON.stringify(parsed),
      });
      setSaveMsg("Specification saved successfully.");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleTransition = async (action: string, comment?: string) => {
    setWorkflowBusy(true);
    try {
      const res = await call<{ status: string; entry: AuditLogEntry }>("/workflow/transition", {
        method: "POST",
        body: JSON.stringify({ action, comment }),
      });
      setStatus(res.status);
      setHistory((prev) => [...prev, res.entry]);
    } finally {
      setWorkflowBusy(false);
    }
  };

  // Generate real template-injected HTML preview
  useEffect(() => {
    if (!parsed) return;
    const timer = setTimeout(() => {
      call<{ html: string; output: SpecForgeOutput }>("/export/render", {
        method: "POST",
        body: JSON.stringify({
          parsed,
          templateChoice,
          mapData,
          defects,
          inputId: "SAMPLE",
        }),
      })
        .then((res) => {
          setSpecHtml(res.html);
        })
        .catch((err) => {
          console.warn("Could not render spec HTML preview:", err);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [parsed, status, mapData, templateChoice, defects]);

  const handleDownloadSpecHtml = async () => {
    if (!parsed) return;
    try {
      const res = await call<{ html: string; output: SpecForgeOutput }>("/export/render", {
        method: "POST",
        body: JSON.stringify({
          parsed,
          templateChoice,
          mapData,
          defects,
          inputId: "SAMPLE",
        }),
      });
      const blob = new Blob([res.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "spec.html";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      if (specHtml) {
        const blob = new Blob([specHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "spec.html";
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleDownloadOutputJson = async () => {
    if (!parsed) return;
    try {
      const res = await call<{ html: string; output: SpecForgeOutput }>("/export/render", {
        method: "POST",
        body: JSON.stringify({
          parsed,
          templateChoice,
          mapData,
          defects,
          inputId: "SAMPLE",
        }),
      });
      const blob = new Blob([JSON.stringify(res.output, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "specforge_output.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const output: SpecForgeOutput = {
        schema_version: "1.0",
        input_id: "SAMPLE",
        template: templateChoice,
        course: {
          title: parsed.title,
          code: parsed.code,
          department: parsed.department,
          credits_ltp: parsed.credits_ltp,
          course_type: parsed.course_type,
          summary: parsed.summary,
        },
        course_outcomes: parsed.course_outcomes.map((co) => ({
          id: co.id,
          statement: co.statement,
          bloom_level: co.bloom_level,
        })),
        units: parsed.units.map((u) => ({
          number: u.number,
          title: u.title,
          lab: u.lab || null,
        })),
        co_po_pso_map: mapData,
        teaching_hours: parsed.teaching_hours,
        assessment: parsed.assessment,
        defects: defects.map((d) => ({
          code: d.code,
          location: d.location,
          description: d.description,
          fix: d.fix,
        })),
      };

      const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "specforge_output.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadValidationReport = () => {
    const reportHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Validation Report - ${parsed?.code || "Course"}</title>
  <style>
    body { font-family: Calibri, sans-serif; margin: 30px; line-height: 1.5; color: #111; }
    h1 { color: #1a3d7c; border-bottom: 2px solid #1a3d7c; padding-bottom: 8px; }
    .card { border: 1px solid #ccc; border-left: 5px solid #2563eb; padding: 12px 16px; margin: 10px 0; border-radius: 6px; }
    .card.High { border-left-color: #b91c1c; background: #fff5f5; }
    .card.Medium { border-left-color: #d97706; background: #fffbeb; }
    .code { font-family: monospace; font-weight: bold; background: #eee; padding: 2px 6px; }
  </style>
</head>
<body>
  <h1>Compliance Validation Report</h1>
  <p><strong>Course:</strong> ${parsed?.code}: ${parsed?.title} | <strong>Status:</strong> ${status}</p>
  <p><strong>Total Defects Identified:</strong> ${defects.length}</p>
  ${defects.map((d) => `
    <div class="card ${d.severity || 'Medium'}">
      <div><strong>[${d.severity || 'Medium'}]</strong> <span class="code">${d.code}</span> (Source: ${d.location.source}, Section: ${d.location.section ?? 'N/A'})</div>
      <p style="margin: 6px 0"><strong>Issue:</strong> ${d.description}</p>
      <p style="margin: 0; color: #15803d"><strong>Remediation:</strong> ${d.fix}</p>
    </div>
  `).join("")}
</body>
</html>`;
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "validation_report.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <Header
        role={role}
        onRoleChange={handleRoleChange}
        status={status}
        serverHealth={serverHealth}
        hasKey={!!currentKey}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="app-body">
        {/* Left Sidebar */}
        <Sidebar
          activeStep={activeStep}
          onSelectStep={setActiveStep}
          courseCode={parsed?.code}
          courseTitle={parsed?.title}
          department={parsed?.department}
          onOpenGuidelines={() => setGuidelinesOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Content Body */}
        <main className="content-area">
          {activeStep === "upload" && (
            <UploadScreen
              specFile={specFile}
              blueprintFile={blueprintFile}
              onSelectSpecFile={setSpecFile}
              onSelectBlueprintFile={setBlueprintFile}
              onLoadSample={handleLoadSample}
              onParse={handleParse}
              parsing={parsing}
              parseError={parseError}
              canEdit={canEdit}
              role={role}
              status={status}
              parsed={parsed}
              onNextStep={() => setActiveStep("spec")}
            />
          )}

          {activeStep === "spec" && (
            <SpecScreen
              parsed={parsed}
              onUpdateParsed={setParsed}
              canEdit={canEdit}
              templateChoice={templateChoice}
              detectedTemplate={detectedTemplate}
              signals={signals}
              overrideReason={overrideReason}
              onOverrideTemplate={(t, r) => {
                setTemplateChoice(t);
                setOverrideReason(r);
              }}
              onSave={handleSaveSpec}
              saveMsg={saveMsg}
              onNextStep={() => setActiveStep("map")}
            />
          )}

          {activeStep === "map" && (
            <MapScreen
              parsed={parsed}
              mapData={mapData}
              onUpdateCell={handleUpdateCell}
              canEdit={canEdit}
              onAutoMap={handleAutoMap}
              mappingBusy={mappingBusy}
              onNextStep={() => setActiveStep("checks")}
            />
          )}

          {activeStep === "checks" && (
            <ChecksScreen
              parsed={parsed}
              defects={defects}
              onRunAudit={() => parsed && runDeterministicAudit(parsed, templateChoice, mapData)}
              auditBusy={auditBusy}
              onDownloadReport={handleDownloadValidationReport}
              onNextStep={() => setActiveStep("workflow")}
            />
          )}

          {activeStep === "workflow" && (
            <WorkflowScreen
              parsed={parsed}
              status={status}
              role={role}
              history={history}
              onTransition={handleTransition}
              busy={workflowBusy}
              onNextStep={() => setActiveStep("export")}
            />
          )}

          {activeStep === "export" && (
            <ExportScreen
              parsed={parsed}
              status={status}
              templateChoice={templateChoice}
              specHtml={specHtml}
              onDownloadSpecHtml={handleDownloadSpecHtml}
              onDownloadOutputJson={handleDownloadOutputJson}
              onDownloadValidationReport={handleDownloadValidationReport}
            />
          )}
        </main>
      </div>

      {/* Slide-over Compliance Guidelines (Annexure A) */}
      {guidelinesOpen && (
        <ReferenceDrawer onClose={() => setGuidelinesOpen(false)} />
      )}

      {/* Restyled AI Settings Modal */}
      {settingsOpen && (
        <Settings onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
