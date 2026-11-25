import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMillarMcpServer } from "./server.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("@hahlex/millar-mcp: Resources, 11 Tools, 3 Prompts & Cross-Client Compatibility", () => {
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

  it("exposes all 11 dedicated MCP tools with cross-client compatible flat object schemas and readOnlyHint", async () => {
    const client = await connectClient();
    const { tools } = await client.listTools();

    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "get_component",
      "get_design_guidelines",
      "get_design_tokens",
      "get_motion_presets",
      "get_section",
      "get_template",
      "get_visual_assets",
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

  it("serves canonical MCP Resources (millar://) and returns JSON-RPC -32602 for unknown IDs", async () => {
    const client = await connectClient();
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri);

    expect(uris).toContain("millar://guidelines/invariants");
    expect(uris).toContain("millar://brand/identity");
    expect(uris).toContain("millar://tokens/dtcg");
    expect(uris).toContain("millar://registry/index");
    expect(uris).toContain("millar://glossary");

    const inv = await client.readResource({ uri: "millar://guidelines/invariants" });
    const invFirst = inv.contents[0];
    expect(invFirst && "text" in invFirst ? invFirst.text : "").toContain("approved-visual-assets-only");

    const btn = await client.readResource({ uri: "millar://components/button" });
    const btnFirst = btn.contents[0];
    expect(btnFirst && "text" in btnFirst ? btnFirst.text : "").toContain("invalidPropGuardrails");

    const regTok = await client.readResource({ uri: "millar://tokens/resolved/dark/marketing" });
    const regFirst = regTok.contents[0];
    expect(regFirst && "text" in regFirst ? regFirst.text : "").toContain("approved-visual-assets-only");

    // Verify previously merged asset IDs resolve cleanly without -32602
    const metricAsset = await client.readResource({ uri: "millar://visual-assets/metric-plate-card" });
    const metricFirst = metricAsset.contents[0];
    expect(metricFirst && "text" in metricFirst ? metricFirst.text : "").toContain("MetricPlateCard");

    await expect(client.readResource({ uri: "millar://components/nonexistent-widget" })).rejects.toThrow();
  });

  it("executes all 11 tools end-to-end from the same SSoT registry with dual content + structuredContent", async () => {
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
  });

  it("exposes all 3 user-controlled MCP Prompts embedding millar://guidelines/invariants", async () => {
    const client = await connectClient();
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name).sort()).toEqual([
      "millar-audit-code",
      "millar-build-marketing",
      "millar-build-product",
    ]);

    const res = await client.getPrompt({
      name: "millar-build-marketing",
      arguments: { feature: "Hahlex Studio" },
    });
    expect(res.messages.length).toBe(2);
    expect(JSON.stringify(res.messages)).toContain("millar://guidelines/invariants");
  });
});
