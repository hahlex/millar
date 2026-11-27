import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMillarMcpServer } from "./server.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("@hahlex/millar-mcp: Resources, 13 Tools, 11 Prompts & 8 Millar Agent Skills Suite", () => {
  let closePair: (() => Promise<void>) | null = null;

  async function connectClient() {
    const server = createMillarMcpServer({ rootDir: REPO_ROOT });
    const client = new Client({ name: "millar-test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    closePair = async () => {
      await client.close();
      await server.close();
    };
    return client;
  }

  afterEach(async () => {
    if (closePair) {
      await closePair();
      closePair = null;
    }
  });

  it("exposes all 13 dedicated MCP tools with cross-client compatible flat object schemas and readOnlyHint", async () => {
    const client = await connectClient();
    const { tools } = await client.listTools();

    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "get_component",
      "get_design_guidelines",
      "get_design_tokens",
      "get_motion_presets",
      "get_section",
      "get_skill",
      "get_template",
      "get_visual_assets",
      "list_skills",
      "search_components",
      "search_sections",
      "search_templates",
      "validate_design",
    ]);

    // Cross-client compatibility check (Claude Code, Cursor, VS Code, Antigravity, Codex):
    // Every tool inputSchema must be a plain JSON Schema object with readOnlyHint annotation
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.destructiveHint).toBe(false);
    }
  });

  it("serves canonical MCP Resources (including millar://skills/*) and returns JSON-RPC -32602 for unknown IDs", async () => {
    const client = await connectClient();
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri);

    expect(uris).toContain("millar://guidelines/invariants");
    expect(uris).toContain("millar://brand/identity");
    expect(uris).toContain("millar://tokens/dtcg");
    expect(uris).toContain("millar://registry/index");
    expect(uris).toContain("millar://glossary");
    expect(uris).toContain("millar://skills");
    expect(uris).toContain("millar://skills/millar-design");
    expect(uris).toContain("millar://skills/millar-web-workflow");
    expect(uris).toContain("millar://skills/millar-build-web");
    expect(uris).toContain("millar://skills/millar-verify-web");
    expect(uris).toContain("millar://skills/millar-autonomous-qa");
    expect(uris).toContain("millar://skills/millar-autonomous-qa/references/qa-loop-and-modes.md");
    expect(uris).toContain("millar://skills/millar-autonomous-qa/references/safety-and-guardrails.md");
    expect(uris).toContain("millar://skills/millar-design/references/style-dna-contract.md");
    expect(uris).toContain("millar://skills/millar-web-workflow/references/creative-divergence-protocol.md");
    expect(uris).toContain("millar://skills/millar-verify-web/references/five-layer-qa-gate.md");
    expect(uris).toContain("millar://skills/millar-create-image/references/procedural-gallery-craft.md");
    expect(uris).toContain("millar://skills/millar-create-image/references/human-editorial-photography.md");

    const inv = await client.readResource({ uri: "millar://guidelines/invariants" });
    const invFirst = inv.contents[0];
    expect(invFirst && "text" in invFirst ? invFirst.text : "").toContain("approved-visual-assets-only");

    const btn = await client.readResource({ uri: "millar://components/button" });
    const btnFirst = btn.contents[0];
    expect(btnFirst && "text" in btnFirst ? btnFirst.text : "").toContain("invalidPropGuardrails");

    const regTok = await client.readResource({ uri: "millar://tokens/resolved/dark/marketing" });
    const regFirst = regTok.contents[0];
    expect(regFirst && "text" in regFirst ? regFirst.text : "").toContain("approved-visual-assets-only");

    const metricAsset = await client.readResource({ uri: "millar://visual-assets/metric-plate-card" });
    const metricFirst = metricAsset.contents[0];
    expect(metricFirst && "text" in metricFirst ? metricFirst.text : "").toContain("MetricPlateCard");

    const skillMd = await client.readResource({ uri: "millar://skills/millar-design" });
    const skillFirst = skillMd.contents[0];
    expect(skillFirst && "text" in skillFirst ? skillFirst.text : "").toContain("Cross-Page Continuity");

    const skillRef = await client.readResource({ uri: "millar://skills/millar-design/references/cross-page-sync-audit.md" });
    const refFirst = skillRef.contents[0];
    expect(refFirst && "text" in refFirst ? refFirst.text : "").toContain("The 6 Continuity Axes");

    await expect(client.readResource({ uri: "millar://components/nonexistent-widget" })).rejects.toThrow();
    await expect(client.readResource({ uri: "millar://skills/nonexistent-skill" })).rejects.toThrow();
    await expect(client.readResource({ uri: "millar://skills/millar-design/references/nope.md" })).rejects.toThrow();
  });

  it("executes all 13 tools end-to-end from the same SSoT registry & skills bundle with dual content + structuredContent", async () => {
    const client = await connectClient();

    const guidelines = await client.callTool({
      name: "get_design_guidelines",
      arguments: { register: "marketing", includeCompositionPatterns: true },
    });
    const gData = guidelines.structuredContent as { compositionPatterns: unknown[] };
    expect(gData.compositionPatterns).toHaveLength(6);

    const tokens = await client.callTool({
      name: "get_design_tokens",
      arguments: { theme: "dark", category: "color", query: "accent" },
    });
    const tData = tokens.structuredContent as { lifecycleStatus: string; dark: Array<{ cssVar: string }> };
    expect(tData.lifecycleStatus).toBe("draft");
    expect(tData.dark.some((t) => t.cssVar === "--fg-on-accent-soft")).toBe(true);

    const compSearch = await client.callTool({ name: "search_components", arguments: { query: "button" } });
    expect((compSearch.structuredContent as { count: number }).count).toBeGreaterThanOrEqual(1);

    const comp = await client.callTool({ name: "get_component", arguments: { id: "button", includeSource: true } });
    expect((comp.structuredContent as { sourceCode: string }).sourceCode).toContain("export const Button");

    const secSearch = await client.callTool({ name: "search_sections", arguments: { goal: "hero" } });
    expect((secSearch.structuredContent as { count: number }).count).toBe(2);

    const sec = await client.callTool({ name: "get_section", arguments: { id: "editorial-essay-split" } });
    expect((sec.structuredContent as { compositionPattern: string }).compositionPattern).toBe("editorial-split");

    const tplSearch = await client.callTool({ name: "search_templates", arguments: { register: "marketing" } });
    expect((tplSearch.structuredContent as { count: number }).count).toBe(2);

    const tpl = await client.callTool({ name: "get_template", arguments: { id: "product-launch-template" } });
    expect((tpl.structuredContent as { compositionPatternsUsed: string[] }).compositionPatternsUsed.length).toBeGreaterThanOrEqual(4);

    const assets = await client.callTool({ name: "get_visual_assets", arguments: { kind: "atmosphere" } });
    const aData = assets.structuredContent as { visualAssets: Array<{ id: string; gradientPolicy: string }> };
    expect(aData.visualAssets[0]?.id).toBe("warm-horizon-wash");
    expect(aData.visualAssets[0]?.gradientPolicy).toBe("approved-visual-asset");

    const motion = await client.callTool({ name: "get_motion_presets", arguments: { motionRegister: "expressive" } });
    expect((motion.structuredContent as { count: number }).count).toBe(2);

    const validation = await client.callTool({
      name: "validate_design",
      arguments: {
        register: "product",
        language: "tsx",
        code: '<Button variant="destructive" style={{ background: "linear-gradient(red, blue)" }} />',
      },
    });
    const vData = validation.structuredContent as {
      lifecycleStatus: string;
      automatedChecks: { passed: boolean; violations: Array<{ ruleId: string }> };
      humanReviewCriteria: { automated: boolean; criteria: unknown[] };
    };
    expect(vData.lifecycleStatus).toBe("draft");
    expect(vData.automatedChecks.passed).toBe(false);
    expect(vData.automatedChecks.violations.some((v) => v.ruleId === "millar/gradient-policy")).toBe(true);
    expect(vData.humanReviewCriteria.automated).toBe(false);
    expect(vData.humanReviewCriteria.criteria.length).toBeGreaterThanOrEqual(4);

    const skillList = await client.callTool({ name: "list_skills", arguments: {} });
    const sListData = skillList.structuredContent as { count: number; skills: Array<{ id: string }>; recipes: unknown[] };
    expect(sListData.count).toBe(8);
    expect(sListData.skills.map((s) => s.id).sort()).toEqual([
      "millar-animation",
      "millar-autonomous-qa",
      "millar-build-web",
      "millar-create-image",
      "millar-deep-research",
      "millar-design",
      "millar-verify-web",
      "millar-web-workflow",
    ]);
    expect(sListData.recipes.length).toBeGreaterThanOrEqual(5);

    const qaSkillDetail = await client.callTool({
      name: "get_skill",
      arguments: { name: "millar-autonomous-qa", includeAllReferences: true },
    });
    const qaSkillData = qaSkillDetail.structuredContent as {
      id: string;
      skillMarkdown: string;
      includedReferences: Array<{ file: string; content: string }>;
    };
    expect(qaSkillData.id).toBe("millar-autonomous-qa");
    expect(qaSkillData.skillMarkdown).toContain("Continuous 8-Stage QA Loop");
    expect(qaSkillData.includedReferences.map((r) => r.file).sort()).toEqual([
      "outcome-verification.md",
      "qa-loop-and-modes.md",
      "safety-and-guardrails.md",
      "self-validation-log.md",
      "tool-selection.md",
    ]);

    const skillDetail = await client.callTool({
      name: "get_skill",
      arguments: { name: "millar-design", includeAllReferences: true },
    });
    const sDetailData = skillDetail.structuredContent as {
      id: string;
      skillMarkdown: string;
      includedReferences: Array<{ file: string; content: string }>;
    };
    expect(sDetailData.id).toBe("millar-design");
    expect(sDetailData.skillMarkdown).toContain(".millar/style-dna.md");
    expect(sDetailData.includedReferences.map((r) => r.file).sort()).toEqual([
      "aesthetic-movements.md",
      "cross-page-sync-audit.md",
      "style-dna-contract.md",
    ]);

    const wfDetail = await client.callTool({
      name: "get_skill",
      arguments: { name: "millar-web-workflow", reference: "creative-divergence-protocol.md" },
    });
    const wfData = wfDetail.structuredContent as { includedReferences: Array<{ file: string; content: string }> };
    expect(wfData.includedReferences[0]?.file).toBe("creative-divergence-protocol.md");
    expect(wfData.includedReferences[0]?.content).toContain("Three-Family Cultural Derivation");
  });

  it("exposes all 11 user-controlled MCP Prompts (3 core workflows + 8 composable Millar Skills)", async () => {
    const client = await connectClient();
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name).sort()).toEqual([
      "millar-animation",
      "millar-audit-code",
      "millar-autonomous-qa",
      "millar-build-marketing",
      "millar-build-product",
      "millar-build-web",
      "millar-create-image",
      "millar-deep-research",
      "millar-design",
      "millar-verify-web",
      "millar-web-workflow",
    ]);

    const autoQaPrompt = await client.getPrompt({
      name: "millar-autonomous-qa",
      arguments: { targetUrl: "http://localhost:5173", modes: "exploratory,authorization", lang: "vi" },
    });
    expect(autoQaPrompt.messages.length).toBe(2);
    expect(JSON.stringify(autoQaPrompt.messages)).toContain("millar://skills/millar-autonomous-qa");
    expect(JSON.stringify(autoQaPrompt.messages)).toContain("http://localhost:5173");
    expect(JSON.stringify(autoQaPrompt.messages)).toContain("Vietnamese");

    const res = await client.getPrompt({
      name: "millar-build-marketing",
      arguments: { feature: "Hahlex Studio" },
    });
    expect(res.messages.length).toBe(2);
    expect(JSON.stringify(res.messages)).toContain("millar://guidelines/invariants");

    const designPrompt = await client.getPrompt({
      name: "millar-design",
      arguments: {
        brief: "Multi-page SaaS site synced to user hero visuals",
        existingAssets: "public/hero-stage.png and HeroCanvas.tsx",
      },
    });
    expect(designPrompt.messages.length).toBe(3);
    expect(JSON.stringify(designPrompt.messages)).toContain("millar://skills/millar-design");
    expect(JSON.stringify(designPrompt.messages)).toContain("public/hero-stage.png");

    const wfPrompt = await client.getPrompt({
      name: "millar-web-workflow",
      arguments: { request: "Build full Hahlex Studio marketing + app site", track: "L", lang: "vi" },
    });
    expect(wfPrompt.messages.length).toBe(3);
    expect(JSON.stringify(wfPrompt.messages)).toContain("millar://skills/millar-web-workflow");
    expect(JSON.stringify(wfPrompt.messages)).toContain("Vietnamese");
    expect(JSON.stringify(wfPrompt.messages)).toContain("Research any named brand first");
    expect(JSON.stringify(wfPrompt.messages)).toContain("Track L");

    const buildTrackS = await client.getPrompt({
      name: "millar-build-web",
      arguments: { scope: "Fix Button focus ring", minimalChange: "true", lang: "en" },
    });
    expect(JSON.stringify(buildTrackS.messages)).toContain("Minimal-Change Track S");

    const buildSlice = await client.getPrompt({
      name: "millar-build-web",
      arguments: { scope: "Analytics table", minimalChange: "false", lang: "vi" },
    });
    expect(JSON.stringify(buildSlice.messages)).toContain("Vertical-Slice Build");
    expect(JSON.stringify(buildSlice.messages)).toContain("Vietnamese");

    const procRef = await client.readResource({
      uri: "millar://skills/millar-create-image/references/procedural-gallery-craft.md",
    });
    const procFirst = procRef.contents[0];
    const procText = procFirst && "text" in procFirst ? procFirst.text : "";
    expect(procText).toContain("Zero-Addition Pass 2");
    expect(procText).toContain("Honest Medium Pivot Law");
    expect(procText).toContain("ctx.font");

    const humanRef = await client.readResource({
      uri: "millar://skills/millar-create-image/references/human-editorial-photography.md",
    });
    const humanFirst = humanRef.contents[0];
    expect(humanFirst && "text" in humanFirst ? humanFirst.text : "").toContain("Kinetic Micro-Action Law");

    const illusRef = await client.readResource({
      uri: "millar://skills/millar-create-image/references/natural-editorial-illustration.md",
    });
    const illusFirst = illusRef.contents[0];
    expect(illusFirst && "text" in illusFirst ? illusFirst.text : "").toContain("Variable Hand-Held Line Weight");

    const hybridRef = await client.readResource({
      uri: "millar://skills/millar-create-image/references/hybrid-plate-compositing.md",
    });
    const hybridFirst = hybridRef.contents[0];
    expect(hybridFirst && "text" in hybridFirst ? hybridFirst.text : "").toContain("Printed-on-Paper Organic Integration");

    const qaRef = await client.readResource({
      uri: "millar://skills/millar-verify-web/references/five-layer-qa-gate.md",
    });
    const qaFirst = qaRef.contents[0];
    const qaText = qaFirst && "text" in qaFirst ? qaFirst.text : "";
    expect(qaText).toContain("v0.3.0");
    expect(qaText).toContain("view-transition-name");

    const archRef = await client.readResource({
      uri: "millar://skills/millar-build-web/references/web-architecture-checklist.md",
    });
    const archFirst = archRef.contents[0];
    expect(archFirst && "text" in archFirst ? archFirst.text : "").toContain("Operate Mode");
  });
});
