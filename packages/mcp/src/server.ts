import fs from "node:fs";
import path from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { MillarRegistryBundle, ResolvedToken } from "@hahlex/millar-core";
import rawRegistry from "@hahlex/millar-tokens/registry";
import dtcgRaw from "@hahlex/millar-tokens/dtcg";
import { validateDesign } from "@hahlex/millar-validator";
import { loadMillarSkills, SKILL_COMBINATION_RECIPES } from "./skills-loader.js";

const registry = rawRegistry as unknown as MillarRegistryBundle;

export interface MillarMcpServerOptions {
  rootDir?: string;
}

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

function readRepoDoc(rootDir: string, relPath: string, fallback: string): string {
  const full = path.join(rootDir, relPath);
  if (fs.existsSync(full)) {
    return fs.readFileSync(full, "utf8");
  }
  const bundled = path.join(import.meta.dirname, "docs", relPath);
  if (fs.existsSync(bundled)) {
    return fs.readFileSync(bundled, "utf8");
  }
  return fallback;
}

function readSourceSnippet(rootDir: string, sourcePath?: string): string | undefined {
  if (!sourcePath) return undefined;
  const full = path.join(rootDir, sourcePath);
  if (!fs.existsSync(full)) return undefined;
  return fs.readFileSync(full, "utf8");
}

function toolJsonResult(payload: Record<string, unknown>, resourceLinks: Array<{ uri: string; name: string; mimeType?: string }> = []) {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "resource_link"; uri: string; name: string; mimeType?: string }
  > = [
    {
      type: "text",
      text: JSON.stringify(payload, null, 2),
    },
  ];
  for (const link of resourceLinks) {
    content.push({
      type: "resource_link",
      uri: link.uri,
      name: link.name,
      mimeType: link.mimeType ?? "application/json",
    });
  }
  return {
    content,
    structuredContent: payload,
  };
}

function formatGuidelinesMarkdown(register: string): string {
  const matched =
    register === "all"
      ? registry.guidelines
      : registry.guidelines.filter((g) => g.register === register || g.register === "shared");
  return matched
    .map((g) =>
      [
        `# ${g.title} [${g.status.toUpperCase()} · v${g.sinceVersion}]`,
        "",
        g.summary,
        "",
        "## Rules",
        ...g.rules.map((r) => `- ${r}`),
        "",
        "## Do",
        ...g.doItems.map((d) => `- ${d}`),
        "",
        "## Don't",
        ...g.dontItems.map((d) => `- ${d}`),
      ].join("\n"),
    )
    .join("\n\n---\n\n");
}

export function createMillarMcpServer(options: MillarMcpServerOptions = {}): McpServer {
  const rootDir = options.rootDir ?? path.resolve(import.meta.dirname, "../../..");
  const skills = loadMillarSkills(rootDir);

  const server = new McpServer(
    {
      name: "millar-mcp",
      version: registry.version,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    },
  );

  /* ==========================================================================
   * 1. MCP RESOURCES (millar:// RFC 3986 URIs & RFC 6570 Templates)
   * ========================================================================== */

  const invariantsMarkdown = [
    "# Millar Non-Negotiable Invariants",
    "",
    `- **Typography**: ${registry.invariants.typography}`,
    `- **Product & Foundation Gradients**: ${registry.invariants.gradientPolicy.productAndFoundations}`,
    `- **Marketing Gradients**: ${registry.invariants.gradientPolicy.marketing}`,
    `- **Zero Em-Dash (U+2014) Scope**: ${registry.invariants.zeroEmDashScope}`,
    `- **Accessibility Target**: ${registry.invariants.accessibilityTarget}`,
    `- **Governance Lifecycle Rule**: ${registry.invariants.lifecycleRule}`,
  ].join("\n");

  server.registerResource(
    "millar-invariants",
    "millar://guidelines/invariants",
    {
      title: "Millar Non-Negotiable Invariants",
      description: "Core design system invariants, gradient boundaries, em-dash scope, WCAG target, and Draft/Approved governance rules.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: invariantsMarkdown }],
    }),
  );

  server.registerResource(
    "millar-guidelines-by-register",
    new ResourceTemplate("millar://guidelines/{register}", {
      list: async () => ({
        resources: [
          { uri: "millar://guidelines/shared", name: "Shared Foundations Guidelines", mimeType: "text/markdown" },
          { uri: "millar://guidelines/marketing", name: "Marketing Design Guidelines", mimeType: "text/markdown" },
          { uri: "millar://guidelines/product", name: "Product/App Design Guidelines", mimeType: "text/markdown" },
        ],
      }),
    }),
    {
      title: "Millar Register Guidelines",
      description: "Design rules and Do/Don't guidelines for shared, marketing, or product registers.",
      mimeType: "text/markdown",
    },
    async (uri, vars) => {
      const register = String(vars.register ?? "");
      if (!["shared", "marketing", "product"].includes(register)) {
        throw new McpError(ErrorCode.InvalidParams, `Unknown Millar register "${register}". Expected shared, marketing, or product.`);
      }
      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text: formatGuidelinesMarkdown(register) }],
      };
    },
  );

  server.registerResource(
    "millar-brand-identity",
    "millar://brand/identity",
    {
      title: "Hahlex Brand Identity & Vector Marks",
      description: "Canonical Title Case Geist 600 wordmark spec and all 4 normalized Arch + 3 Pillars Vector SVG marks.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(registry.brand, null, 2) }],
    }),
  );

  server.registerResource(
    "millar-tokens-dtcg",
    "millar://tokens/dtcg",
    {
      title: "Millar Raw W3C DTCG 2025.10 Tokens",
      description: "Complete raw W3C DTCG 2025.10 token source and resolver manifest.",
      mimeType: "application/design-tokens+json",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/design-tokens+json", text: JSON.stringify(dtcgRaw, null, 2) }],
    }),
  );

  server.registerResource(
    "millar-tokens-resolved",
    new ResourceTemplate("millar://tokens/resolved/{theme}", {
      list: async () => ({
        resources: [
          { uri: "millar://tokens/resolved/light", name: "Resolved Light Tokens", mimeType: "application/json" },
          { uri: "millar://tokens/resolved/dark", name: "Resolved Dark Tokens", mimeType: "application/json" },
        ],
      }),
    }),
    {
      title: "Resolved Millar Tokens by Theme",
      description: "Resolved CSS variables, hex/OKLCH values, and verified WCAG contrast checks for light or dark theme.",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const theme = String(vars.theme ?? "");
      if (theme !== "light" && theme !== "dark") {
        throw new McpError(ErrorCode.InvalidParams, `Unknown theme "${theme}". Expected "light" or "dark".`);
      }
      const payload = {
        theme,
        base: registry.tokens.base,
        semantic: theme === "dark" ? registry.tokens.dark : registry.tokens.light,
        localeVi: registry.tokens.localeVi,
      };
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(payload, null, 2) }],
      };
    },
  );

  server.registerResource(
    "millar-tokens-resolved-register",
    new ResourceTemplate("millar://tokens/resolved/{theme}/{register}", {
      list: async () => ({
        resources: [
          { uri: "millar://tokens/resolved/light/shared", name: "Resolved Light Tokens (Shared)", mimeType: "application/json" },
          { uri: "millar://tokens/resolved/dark/shared", name: "Resolved Dark Tokens (Shared)", mimeType: "application/json" },
          { uri: "millar://tokens/resolved/light/product", name: "Resolved Light Tokens (Product)", mimeType: "application/json" },
          { uri: "millar://tokens/resolved/dark/product", name: "Resolved Dark Tokens (Product)", mimeType: "application/json" },
          { uri: "millar://tokens/resolved/light/marketing", name: "Resolved Light Tokens (Marketing)", mimeType: "application/json" },
          { uri: "millar://tokens/resolved/dark/marketing", name: "Resolved Dark Tokens (Marketing)", mimeType: "application/json" },
        ],
      }),
    }),
    {
      title: "Resolved Millar Tokens by Theme & Register",
      description: "Resolved CSS variables, WCAG contrast checks, and register-specific overrides for light/dark + shared/product/marketing.",
      mimeType: "application/json",
    },
    async (uri, vars) => {
      const theme = String(vars.theme ?? "");
      const register = String(vars.register ?? "");
      if (theme !== "light" && theme !== "dark") {
        throw new McpError(ErrorCode.InvalidParams, `Unknown theme "${theme}". Expected "light" or "dark".`);
      }
      if (register !== "shared" && register !== "product" && register !== "marketing") {
        throw new McpError(ErrorCode.InvalidParams, `Unknown register "${register}". Expected "shared", "product", or "marketing".`);
      }
      const payload = {
        theme,
        register,
        lifecycleStatus: "draft",
        base: registry.tokens.base,
        semantic: theme === "dark" ? registry.tokens.dark : registry.tokens.light,
        registerMeta:
          register === "product"
            ? registry.tokens.registers.product
            : register === "marketing"
              ? registry.tokens.registers.marketing
              : [],
        localeVi: registry.tokens.localeVi,
      };
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(payload, null, 2) }],
      };
    },
  );

  server.registerResource(
    "millar-registry-index",
    "millar://registry/index",
    {
      title: "Millar Compact Catalog Index",
      description: "Lightweight index of every component, composition pattern, visual asset, section, template, and motion preset with lifecycle status.",
      mimeType: "application/json",
    },
    async (uri) => {
      const index = {
        version: registry.version,
        dtcgSpecVersion: registry.dtcgSpecVersion,
        components: registry.components.map((c) => ({ id: c.id, name: c.name, category: c.category, status: c.status, uri: `millar://components/${c.id}` })),
        compositionPatterns: registry.compositionPatterns.map((p) => ({ id: p.id, name: p.name, status: p.status, uri: `millar://composition-patterns/${p.id}` })),
        visualAssets: registry.visualAssets.map((v) => ({ id: v.id, name: v.name, kind: v.kind, gradientPolicy: v.gradientPolicy, status: v.status, uri: `millar://visual-assets/${v.id}` })),
        sections: registry.sections.map((s) => ({ id: s.id, name: s.name, goal: s.goal, compositionPattern: s.compositionPattern, status: s.status, uri: `millar://sections/${s.id}` })),
        templates: registry.templates.map((t) => ({ id: t.id, name: t.name, register: t.register, status: t.status, uri: `millar://templates/${t.id}` })),
        motionPresets: registry.motionPresets.map((m) => ({ id: m.id, name: m.name, motionRegister: m.motionRegister, durationMs: m.durationMs, status: m.status, uri: `millar://motion-presets/${m.id}` })),
      };
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(index, null, 2) }],
      };
    },
  );

  // Template resources for individual catalog items (return JSON-RPC -32602 on unknown ID)
  server.registerResource(
    "millar-component-by-id",
    new ResourceTemplate("millar://components/{id}", {
      list: async () => ({
        resources: registry.components.map((c) => ({ uri: `millar://components/${c.id}`, name: c.name, mimeType: "application/json" })),
      }),
    }),
    { title: "Millar Component Spec", description: "Individual Product/Shared UI component specification.", mimeType: "application/json" },
    async (uri, vars) => {
      const id = String(vars.id ?? "");
      const found = registry.components.find((c) => c.id === id);
      if (!found) throw new McpError(ErrorCode.InvalidParams, `Component "${id}" not found in Millar registry.`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(found, null, 2) }] };
    },
  );

  server.registerResource(
    "millar-composition-pattern-by-id",
    new ResourceTemplate("millar://composition-patterns/{id}", {
      list: async () => ({
        resources: registry.compositionPatterns.map((p) => ({ uri: `millar://composition-patterns/${p.id}`, name: p.name, mimeType: "application/json" })),
      }),
    }),
    { title: "Millar Marketing Composition Pattern", description: "Individual Marketing composition pattern.", mimeType: "application/json" },
    async (uri, vars) => {
      const id = String(vars.id ?? "");
      const found = registry.compositionPatterns.find((p) => p.id === id);
      if (!found) throw new McpError(ErrorCode.InvalidParams, `Composition pattern "${id}" not found.`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(found, null, 2) }] };
    },
  );

  server.registerResource(
    "millar-visual-asset-by-id",
    new ResourceTemplate("millar://visual-assets/{id}", {
      list: async () => ({
        resources: registry.visualAssets.map((v) => ({ uri: `millar://visual-assets/${v.id}`, name: v.name, mimeType: "application/json" })),
      }),
    }),
    { title: "Millar Code-Native Visual Asset", description: "Individual CSS/SVG/Canvas/React visual asset specification.", mimeType: "application/json" },
    async (uri, vars) => {
      const id = String(vars.id ?? "");
      const found = registry.visualAssets.find((v) => v.id === id);
      if (!found) throw new McpError(ErrorCode.InvalidParams, `Visual asset "${id}" not found.`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(found, null, 2) }] };
    },
  );

  server.registerResource(
    "millar-section-by-id",
    new ResourceTemplate("millar://sections/{id}", {
      list: async () => ({
        resources: registry.sections.map((s) => ({ uri: `millar://sections/${s.id}`, name: s.name, mimeType: "application/json" })),
      }),
    }),
    { title: "Millar Marketing Section Spec", description: "Individual photo-free Marketing section specification.", mimeType: "application/json" },
    async (uri, vars) => {
      const id = String(vars.id ?? "");
      const found = registry.sections.find((s) => s.id === id);
      if (!found) throw new McpError(ErrorCode.InvalidParams, `Section "${id}" not found.`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(found, null, 2) }] };
    },
  );

  server.registerResource(
    "millar-template-by-id",
    new ResourceTemplate("millar://templates/{id}", {
      list: async () => ({
        resources: registry.templates.map((t) => ({ uri: `millar://templates/${t.id}`, name: t.name, mimeType: "application/json" })),
      }),
    }),
    { title: "Millar Page/Application Template Spec", description: "Individual Marketing or Product template specification.", mimeType: "application/json" },
    async (uri, vars) => {
      const id = String(vars.id ?? "");
      const found = registry.templates.find((t) => t.id === id);
      if (!found) throw new McpError(ErrorCode.InvalidParams, `Template "${id}" not found.`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(found, null, 2) }] };
    },
  );

  server.registerResource(
    "millar-motion-preset-by-id",
    new ResourceTemplate("millar://motion-presets/{id}", {
      list: async () => ({
        resources: registry.motionPresets.map((m) => ({ uri: `millar://motion-presets/${m.id}`, name: m.name, mimeType: "application/json" })),
      }),
    }),
    { title: "Millar Motion Preset", description: "Productive or Expressive motion preset with reduced-motion contract.", mimeType: "application/json" },
    async (uri, vars) => {
      const id = String(vars.id ?? "");
      const found = registry.motionPresets.find((m) => m.id === id);
      if (!found) throw new McpError(ErrorCode.InvalidParams, `Motion preset "${id}" not found.`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(found, null, 2) }] };
    },
  );

  server.registerResource(
    "millar-glossary",
    "millar://glossary",
    { title: "Millar Canonical Domain Glossary", description: "Canonical Millar terminology (GLOSSARY.md).", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: readRepoDoc(rootDir, "GLOSSARY.md", "# Millar Glossary\n") }],
    }),
  );

  server.registerResource(
    "millar-changelog",
    "millar://changelog",
    { title: "Millar Changelog", description: "Semantic versioning changelog and deprecation runway log.", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: readRepoDoc(rootDir, "CHANGELOG.md", "# Changelog\n") }],
    }),
  );

  server.registerResource(
    "millar-skills-index",
    "millar://skills",
    {
      title: "Millar Agent Skills Suite Index",
      description:
        "Catalog of all 7 composable Millar web & design agent skills (millar-web-workflow, millar-deep-research, millar-design, millar-create-image, millar-animation, millar-build-web, millar-verify-web) with 17 progressive-disclosure references and standalone Zero-MCP audit CLI.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              lifecycleStatus: "draft",
              installCommand: "npx millar install",
              skills: skills.map((s) => ({
                id: s.id,
                name: s.name,
                version: s.version,
                description: s.description,
                solves: s.solves,
                roleLens: s.roleLens,
                recommendedWith: s.recommendedWith,
                mcpToolsUsed: s.mcpToolsUsed,
                uri: s.uri,
                references: s.references.map((r) => ({ file: r.file, title: r.title, uri: r.uri })),
              })),
              recipes: SKILL_COMBINATION_RECIPES,
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.registerResource(
    "millar-skill-by-name",
    new ResourceTemplate("millar://skills/{name}", {
      list: async () => ({
        resources: skills.map((s) => ({
          uri: s.uri,
          name: `Skill: ${s.name}`,
          mimeType: "text/markdown",
        })),
      }),
    }),
    {
      title: "Millar Agent Skill Definition (SKILL.md)",
      description: "Full SKILL.md playbook for millar-design, millar-deep-research, millar-create-image, or millar-animation.",
      mimeType: "text/markdown",
    },
    async (uri, vars) => {
      const name = String(vars.name ?? "");
      const found = skills.find((s) => s.id === name);
      if (!found) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Unknown Millar skill "${name}". Expected one of: ${skills.map((s) => s.id).join(", ")}.`,
        );
      }
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: found.skillMarkdown }] };
    },
  );

  server.registerResource(
    "millar-skill-reference",
    new ResourceTemplate("millar://skills/{name}/references/{ref}", {
      list: async () => ({
        resources: skills.flatMap((s) =>
          s.references.map((r) => ({
            uri: r.uri,
            name: `${s.name} / ${r.title}`,
            mimeType: "text/markdown",
          })),
        ),
      }),
    }),
    {
      title: "Millar Agent Skill Reference Playbook",
      description: "Progressive-disclosure reference document bundled inside a Millar skill.",
      mimeType: "text/markdown",
    },
    async (uri, vars) => {
      const name = String(vars.name ?? "");
      const ref = String(vars.ref ?? "");
      const skill = skills.find((s) => s.id === name);
      if (!skill) {
        throw new McpError(ErrorCode.InvalidParams, `Unknown Millar skill "${name}".`);
      }
      const foundRef = skill.references.find((r) => r.file === ref || r.file === `${ref}.md`);
      if (!foundRef) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Reference "${ref}" not found in skill "${name}". Available: ${skill.references.map((r) => r.file).join(", ")}.`,
        );
      }
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: foundRef.content }] };
    },
  );

  /* ==========================================================================
   * 2. ALL 13 DEDICATED MCP TOOLS (Read-Only, Idempotent, Cross-Client Schemas)
   * ========================================================================== */

  // Tool 1: get_design_guidelines
  server.registerTool(
    "get_design_guidelines",
    {
      title: "Get Millar Design Guidelines",
      description: "Retrieve Millar brand principles, invariants, composition patterns, and register-specific rules (shared, marketing, or product).",
      inputSchema: {
        register: z.enum(["shared", "marketing", "product", "all"]).optional().describe("Target register (defaults to 'all')."),
        topic: z.string().optional().describe("Optional keyword filter (e.g. 'typography', 'art-direction', 'components', 'principles')."),
        includeCompositionPatterns: z.boolean().optional().describe("Include the 6 diverse Marketing Composition Patterns summary."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ register = "all", topic, includeCompositionPatterns = true }) => {
      const q = topic?.trim().toLowerCase();
      const guidelines = registry.guidelines.filter((g) => {
        const regOk = register === "all" || g.register === register || g.register === "shared";
        const topicOk = !q || g.topic.toLowerCase().includes(q) || g.title.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q);
        return regOk && topicOk;
      });
      const payload: Record<string, unknown> = {
        version: registry.version,
        invariants: registry.invariants,
        guidelines,
      };
      if (includeCompositionPatterns && (register === "all" || register === "marketing")) {
        payload.compositionPatterns = registry.compositionPatterns.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          summary: p.summary,
          bestFor: p.bestFor,
        }));
      }
      const links = [
        { uri: "millar://guidelines/invariants", name: "Millar Invariants", mimeType: "text/markdown" },
        ...(register !== "all"
          ? [{ uri: `millar://guidelines/${register}`, name: `${register} guidelines`, mimeType: "text/markdown" }]
          : []),
      ];
      return toolJsonResult(payload, links);
    },
  );

  // Tool 2: get_design_tokens
  server.registerTool(
    "get_design_tokens",
    {
      title: "Get Millar Design Tokens",
      description: "Retrieve resolved W3C DTCG 2025.10 design tokens filtered by category, theme, or search query, including WCAG contrast metadata.",
      inputSchema: {
        theme: z.enum(["light", "dark", "all"]).optional().describe("Theme polarity (defaults to 'light')."),
        category: z.enum(["color", "typography", "spacing", "breakpoint", "radius", "zIndex", "motion", "shadow", "all"]).optional().describe("Token category filter."),
        query: z.string().optional().describe("Optional substring match on CSS var, path, or description."),
        includeEducationExtension: z.boolean().optional().describe("Include optional @hahlex/millar-domain-education skill tokens."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ theme = "light", category = "all", query, includeEducationExtension = false }) => {
      const q = query?.trim().toLowerCase();
      const filterList = (list: ResolvedToken[]) =>
        list.filter((t) => {
          const catOk = category === "all" || t.category === category;
          const qOk = !q || t.cssVar.toLowerCase().includes(q) || t.path.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
          return catOk && qOk;
        });

      const payload: Record<string, unknown> = {
        version: registry.version,
        lifecycleStatus: "draft",
        dtcgSpecVersion: registry.dtcgSpecVersion,
        contrastSummary: registry.contrastSummary,
        base: filterList(registry.tokens.base),
        registers: registry.tokens.registers,
      };
      if (theme === "light" || theme === "all") payload.light = filterList(registry.tokens.light);
      if (theme === "dark" || theme === "all") payload.dark = filterList(registry.tokens.dark);
      if (category === "all" || category === "typography") payload.localeVi = registry.tokens.localeVi;
      if (includeEducationExtension) payload.educationExtension = registry.tokens.educationExtension;

      return toolJsonResult(payload, [
        { uri: `millar://tokens/resolved/${theme === "dark" ? "dark" : "light"}`, name: "Resolved Tokens" },
        { uri: "millar://tokens/dtcg", name: "Raw DTCG 2025.10 Tokens", mimeType: "application/design-tokens+json" },
      ]);
    },
  );

  // Tool 3: search_components
  server.registerTool(
    "search_components",
    {
      title: "Search Product/Shared UI Components",
      description: "Search Millar's accessible UI component catalog with compact results (2-step progressive disclosure).",
      inputSchema: {
        query: z.string().optional().describe("Search term matching name, summary, or props."),
        category: z.enum(["actions", "forms", "navigation", "data-display", "feedback", "layout", "all"]).optional().describe("Component category."),
        status: z.enum(["draft", "approved", "deprecated", "all"]).optional().describe("Lifecycle status filter."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ query, category = "all", status = "all" }) => {
      const q = query?.trim().toLowerCase();
      const matches = registry.components.filter((c) => {
        const catOk = category === "all" || c.category === category;
        const statusOk = status === "all" || c.status === status;
        const qOk = !q || c.id.includes(q) || c.name.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q);
        return catOk && statusOk && qOk;
      });
      return toolJsonResult(
        {
          count: matches.length,
          components: matches.map((c) => ({
            id: c.id,
            name: c.name,
            category: c.category,
            status: c.status,
            summary: c.summary,
            importPath: c.importPath,
            uri: `millar://components/${c.id}`,
          })),
        },
        matches.slice(0, 5).map((c) => ({ uri: `millar://components/${c.id}`, name: c.name })),
      );
    },
  );

  // Tool 4: get_component
  server.registerTool(
    "get_component",
    {
      title: "Get Component Specification & Source",
      description: "Fetch complete props API, invalid-prop guardrails, ARIA/keyboard contract, usage guidelines, and optional source code for one component.",
      inputSchema: {
        id: z.string().describe("Component ID (e.g. 'button', 'input', 'choice-toggle', 'data-table', 'dialog')."),
        includeSource: z.boolean().optional().describe("Include full React/TypeScript source implementation."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id, includeSource = false }) => {
      const found = registry.components.find((c) => c.id === id);
      if (!found) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Component "${id}" not found. Available IDs: ${registry.components.map((c) => c.id).join(", ")}`,
        );
      }
      const payload: Record<string, unknown> = { ...found };
      if (includeSource) {
        payload.sourceCode = readSourceSnippet(rootDir, found.sourcePath);
      }
      return toolJsonResult(payload, [{ uri: `millar://components/${found.id}`, name: found.name }]);
    },
  );

  // Tool 5: search_sections
  server.registerTool(
    "search_sections",
    {
      title: "Search Photo-Free Marketing Sections",
      description: "Search Millar's Marketing Section Library by narrative goal, composition pattern, or keyword.",
      inputSchema: {
        query: z.string().optional().describe("Search term matching name, summary, or assets."),
        goal: z.enum(["hero", "proof", "features", "editorial", "product-showcase", "workflow", "architecture", "metrics", "pricing", "faq", "cta", "all"]).optional().describe("Narrative section goal."),
        compositionPattern: z.string().optional().describe("Filter by composition pattern ID (e.g. 'editorial-split', 'spatial-product-stage', 'bento-mosaic')."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ query, goal = "all", compositionPattern }) => {
      const q = query?.trim().toLowerCase();
      const matches = registry.sections.filter((s) => {
        const goalOk = goal === "all" || s.goal === goal;
        const patOk = !compositionPattern || s.compositionPattern === compositionPattern;
        const qOk = !q || s.id.includes(q) || s.name.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q);
        return goalOk && patOk && qOk;
      });
      return toolJsonResult(
        {
          count: matches.length,
          sections: matches.map((s) => ({
            id: s.id,
            name: s.name,
            goal: s.goal,
            compositionPattern: s.compositionPattern,
            photoFree: s.photoFree,
            staticFirst: s.staticFirst,
            status: s.status,
            summary: s.summary,
            uri: `millar://sections/${s.id}`,
          })),
        },
        matches.slice(0, 5).map((s) => ({ uri: `millar://sections/${s.id}`, name: s.name })),
      );
    },
  );

  // Tool 6: get_section
  server.registerTool(
    "get_section",
    {
      title: "Get Marketing Section Spec & Code",
      description: "Fetch complete anatomy, paired Visual Assets, responsive rules, accessibility notes, and copyable React code for one Marketing section.",
      inputSchema: {
        id: z.string().describe("Section ID (e.g. 'hero-spatial-stage', 'editorial-essay-split', 'bento-narrative-mosaic')."),
        includeSource: z.boolean().optional().describe("Include full source file."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id, includeSource = false }) => {
      const found = registry.sections.find((s) => s.id === id);
      if (!found) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Section "${id}" not found. Available IDs: ${registry.sections.map((s) => s.id).join(", ")}`,
        );
      }
      const payload: Record<string, unknown> = { ...found };
      if (includeSource) payload.sourceCode = readSourceSnippet(rootDir, found.sourcePath);
      return toolJsonResult(payload, [{ uri: `millar://sections/${found.id}`, name: found.name }]);
    },
  );

  // Tool 7: search_templates
  server.registerTool(
    "search_templates",
    {
      title: "Search Marketing & Product Templates",
      description: "Search complete multi-section Marketing Page Templates and Product Application Templates.",
      inputSchema: {
        query: z.string().optional().describe("Search term."),
        register: z.enum(["marketing", "product", "all"]).optional().describe("Filter by marketing or product register."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ query, register = "all" }) => {
      const q = query?.trim().toLowerCase();
      const matches = registry.templates.filter((t) => {
        const regOk = register === "all" || t.register === register;
        const qOk = !q || t.id.includes(q) || t.name.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q);
        return regOk && qOk;
      });
      return toolJsonResult(
        {
          count: matches.length,
          templates: matches.map((t) => ({
            id: t.id,
            name: t.name,
            register: t.register,
            compositionPatternsUsed: t.compositionPatternsUsed,
            status: t.status,
            summary: t.summary,
            uri: `millar://templates/${t.id}`,
          })),
        },
        matches.map((t) => ({ uri: `millar://templates/${t.id}`, name: t.name })),
      );
    },
  );

  // Tool 8: get_template
  server.registerTool(
    "get_template",
    {
      title: "Get Complete Page or Application Template",
      description: "Fetch full section/region layout, composition patterns used, responsive behavior, and runnable code for one template.",
      inputSchema: {
        id: z.string().describe("Template ID (e.g. 'product-launch-template', 'directory-workspace-template')."),
        includeSource: z.boolean().optional().describe("Include full React source."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ id, includeSource = false }) => {
      const found = registry.templates.find((t) => t.id === id);
      if (!found) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Template "${id}" not found. Available IDs: ${registry.templates.map((t) => t.id).join(", ")}`,
        );
      }
      const payload: Record<string, unknown> = { ...found };
      if (includeSource) payload.sourceCode = readSourceSnippet(rootDir, found.sourcePath);
      return toolJsonResult(payload, [{ uri: `millar://templates/${found.id}`, name: found.name }]);
    },
  );

  // Tool 9: get_visual_assets
  server.registerTool(
    "get_visual_assets",
    {
      title: "Get Code-Native Visual Assets",
      description: "Retrieve reusable SVG, CSS, Canvas, and React visual assets engineered for photo-free editorial quality, including gradientPolicy metadata.",
      inputSchema: {
        kind: z.enum(["brand", "grid", "pattern", "texture", "atmosphere", "diagram", "product-viz", "all"]).optional().describe("Visual asset category."),
        query: z.string().optional().describe("Optional keyword filter."),
        includeSource: z.boolean().optional().describe("Include source file content."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ kind = "all", query, includeSource = false }) => {
      const q = query?.trim().toLowerCase();
      const matches = registry.visualAssets.filter((v) => {
        const kindOk = kind === "all" || v.kind === kind;
        const qOk = !q || v.id.includes(q) || v.name.toLowerCase().includes(q) || v.summary.toLowerCase().includes(q);
        return kindOk && qOk;
      });
      const assets = matches.map((v) => ({
        ...v,
        ...(includeSource ? { sourceCode: readSourceSnippet(rootDir, v.sourcePath) } : {}),
      }));
      return toolJsonResult(
        { count: assets.length, visualAssets: assets },
        matches.slice(0, 5).map((v) => ({ uri: `millar://visual-assets/${v.id}`, name: v.name })),
      );
    },
  );

  // Tool 10: get_motion_presets
  server.registerTool(
    "get_motion_presets",
    {
      title: "Get Motion Presets (Productive & Expressive)",
      description: "Retrieve calibrated Productive (Product UI) and Expressive (Marketing) durations, cubic-bezier curves, CSS/React snippets, and mandatory reduced-motion fallbacks.",
      inputSchema: {
        motionRegister: z.enum(["productive", "expressive", "all"]).optional().describe("Filter by productive or expressive motion register."),
        id: z.string().optional().describe("Optional specific preset ID."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ motionRegister = "all", id }) => {
      const matches = registry.motionPresets.filter((m) => {
        const regOk = motionRegister === "all" || m.motionRegister === motionRegister;
        const idOk = !id || m.id === id;
        return regOk && idOk;
      });
      return toolJsonResult(
        { count: matches.length, motionPresets: matches },
        matches.map((m) => ({ uri: `millar://motion-presets/${m.id}`, name: m.name })),
      );
    },
  );

  // Tool 11: validate_design (Q7: Explicitly separates automated checks vs human aesthetic review!)
  server.registerTool(
    "validate_design",
    {
      title: "Validate UI Against Millar Design System",
      description:
        "Audits JSX/TSX/HTML/CSS code against verifiable Millar invariants and returns two strictly separated sections: deterministic automatedChecks (pass/fail rules) and advisory humanReviewCriteria (aesthetic/editorial judgment).",
      inputSchema: {
        code: z.string().describe("Source code snippet (TSX, JSX, HTML, or CSS) to audit."),
        language: z.enum(["tsx", "jsx", "html", "css"]).optional().describe("Code language (defaults to 'tsx')."),
        register: z.enum(["shared", "marketing", "product"]).describe("Target Millar register determining gradient & control rules."),
        sourceKind: z
          .enum(["hahlex-ui", "user-data", "quoted-content", "third-party"])
          .optional()
          .describe("Content provenance; zero em-dash applies strictly to 'hahlex-ui' and never alters user/quoted/third-party content."),
        colorPairs: z
          .array(
            z.object({
              label: z.string().optional(),
              fg: z.string(),
              bg: z.string(),
              isLargeText: z.boolean().optional(),
            }),
          )
          .optional()
          .describe("Optional explicit foreground/background hex pairs to verify mathematically against WCAG 2.1 AA."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (args) => {
      const report = validateDesign(args);
      return toolJsonResult(report as unknown as Record<string, unknown>, [
        { uri: "millar://guidelines/invariants", name: "Millar Invariants", mimeType: "text/markdown" },
        { uri: `millar://guidelines/${args.register}`, name: `${args.register} Guidelines`, mimeType: "text/markdown" },
      ]);
    },
  );

  // Tool 12: list_skills
  server.registerTool(
    "list_skills",
    {
      title: "List Millar Agent Skills Suite",
      description:
        "Lists all 7 composable Hahlex/Millar web engineering & design skills (millar-web-workflow, millar-deep-research, millar-design, millar-create-image, millar-animation, millar-build-web, millar-verify-web), bundled reference playbooks, and Track S/M/L recipes.",
      inputSchema: {
        query: z.string().optional().describe("Optional search keyword (e.g. 'workflow', 'build', 'verify', 'animation', 'image', 'sync', 'research')."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ query }) => {
      const q = query?.trim().toLowerCase();
      const matched = skills.filter(
        (s) =>
          !q ||
          s.id.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.solves.toLowerCase().includes(q) ||
          s.roleLens.some((r) => r.toLowerCase().includes(q)),
      );
      return toolJsonResult(
        {
          lifecycleStatus: "draft",
          count: matched.length,
          installCommand: "npx millar install",
          skills: matched.map((s) => ({
            id: s.id,
            name: s.name,
            version: s.version,
            description: s.description,
            solves: s.solves,
            roleLens: s.roleLens,
            recommendedWith: s.recommendedWith,
            mcpToolsUsed: s.mcpToolsUsed,
            uri: s.uri,
            references: s.references.map((r) => ({ file: r.file, title: r.title, uri: r.uri })),
          })),
          recipes: SKILL_COMBINATION_RECIPES,
        },
        matched.map((s) => ({ uri: s.uri, name: `Skill: ${s.name}`, mimeType: "text/markdown" })),
      );
    },
  );

  // Tool 13: get_skill
  server.registerTool(
    "get_skill",
    {
      title: "Get Millar Agent Skill Playbook & References",
      description:
        "Fetches the complete SKILL.md instructions and optional progressive-disclosure reference playbooks for any of the 7 Millar skills (millar-web-workflow, millar-deep-research, millar-design, millar-create-image, millar-animation, millar-build-web, millar-verify-web).",
      inputSchema: {
        name: z
          .enum([
            "millar-web-workflow",
            "millar-design",
            "millar-deep-research",
            "millar-create-image",
            "millar-animation",
            "millar-build-web",
            "millar-verify-web",
          ])
          .describe("Skill identifier to retrieve."),
        reference: z
          .string()
          .optional()
          .describe("Optional specific reference filename (e.g. 'style-dna-contract.md' or 'motion-choreography.md')."),
        includeAllReferences: z
          .boolean()
          .optional()
          .describe("Set true to inline every reference playbook bundled with this skill."),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ name, reference, includeAllReferences }) => {
      const skill = skills.find((s) => s.id === name);
      if (!skill) {
        throw new McpError(ErrorCode.InvalidParams, `Millar skill "${name}" not found.`);
      }
      let selectedRefs = includeAllReferences ? skill.references : [];
      if (reference) {
        const hit = skill.references.find((r) => r.file === reference || r.file === `${reference}.md`);
        if (!hit) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Reference "${reference}" not found in "${name}". Available: ${skill.references.map((r) => r.file).join(", ")}.`,
          );
        }
        selectedRefs = [hit];
      }
      return toolJsonResult(
        {
          lifecycleStatus: "draft",
          id: skill.id,
          name: skill.name,
          version: skill.version,
          description: skill.description,
          solves: skill.solves,
          roleLens: skill.roleLens,
          recommendedWith: skill.recommendedWith,
          mcpToolsUsed: skill.mcpToolsUsed,
          uri: skill.uri,
          skillMarkdown: skill.skillMarkdown,
          availableReferences: skill.references.map((r) => ({ file: r.file, title: r.title, uri: r.uri })),
          includedReferences: selectedRefs.map((r) => ({ file: r.file, title: r.title, uri: r.uri, content: r.content })),
        },
        [
          { uri: skill.uri, name: `Skill: ${skill.name}`, mimeType: "text/markdown" },
          ...skill.references.map((r) => ({ uri: r.uri, name: r.title, mimeType: "text/markdown" })),
        ],
      );
    },
  );

  /* ==========================================================================
   * 3. TEN USER-CONTROLLED MCP PROMPTS (English Prompts · 3 Core + 7 Skills)
   * ========================================================================== */

  const langArg = z
    .enum(["vi", "en"])
    .optional()
    .describe("Optional output locale for user-facing explanations & visible UI/artwork copy ('en' default, 'vi' for Vietnamese). All agent and image-generation prompts remain in crisp English.");

  const localeLine = (lang?: "vi" | "en") =>
    lang === "vi"
      ? "Locale: Write user-facing replies and visible UI/artwork copy in Vietnamese (full UTF-8 diacritics, :lang(vi) headroom); keep ALL internal image-generation prompts, art specs, and technical briefs in English."
      : "";

  server.registerPrompt(
    "millar-build-marketing",
    {
      title: "Build Photo-Free Marketing Surface with Millar",
      description: "Compose a high-craft Hahlex marketing page using diverse Composition Patterns and code-native Visual Assets, then validate via validate_design.",
      argsSchema: {
        feature: z.string().describe("Product, launch, or campaign topic to design."),
        lang: langArg,
      },
    },
    async ({ feature, lang }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "resource",
            resource: {
              uri: "millar://guidelines/invariants",
              mimeType: "text/markdown",
              text: invariantsMarkdown,
            },
          },
        },
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Build a photo-free Hahlex Marketing surface for: "${feature}".`,
              "1. Query live get_design_guidelines(register='marketing', includeCompositionPatterns=true), get_design_tokens(), get_visual_assets(), and search_sections() (never hardcode tokens).",
              "2. Combine >= 3 distinct Composition Patterns (no repeated equal 3-column card grids), static-first 0% scroll visibility, and top-level <footer> outside <main>.",
              "3. Run validate_design(register='marketing') until automatedChecks.passed === true and report humanReviewCriteria separately.",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-build-product",
    {
      title: "Build Operational Product Screen with Millar",
      description: "Implement a crisp, WCAG 2.1/2.2 AA Hahlex Product screen using zero-gradient primitives from @hahlex/millar-ui.",
      argsSchema: {
        screen: z.string().describe("Product screen or workflow to build."),
        lang: langArg,
      },
    },
    async ({ screen, lang }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "resource",
            resource: {
              uri: "millar://guidelines/invariants",
              mimeType: "text/markdown",
              text: invariantsMarkdown,
            },
          },
        },
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Implement the Hahlex Product screen: "${screen}".`,
              "1. Query get_design_guidelines(register='product') and search_components() -> get_component() for exact props and invalid-prop guardrails.",
              "2. Enforce zero CSS gradients, zero raw <button>/<input>, 2px .millar-focus rings, role='alert' errors, and --fg-on-accent-soft on --accent-soft chips.",
              "3. Run validate_design(register='product') until automatedChecks.passed === true.",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-audit-code",
    {
      title: "Audit UI Code Against Millar",
      description: "Run deterministic automated compliance checks and separate human aesthetic review criteria.",
      argsSchema: {
        register: z.enum(["shared", "marketing", "product"]).describe("Target Millar register."),
        lang: langArg,
      },
    },
    async ({ register, lang }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Audit the provided UI code with validate_design(register="${register}") and millar-audit.mjs.`,
              "Report (1) deterministic automatedChecks violations with exact fixes and docUris, and (2) advisory humanReviewCriteria separately.",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  const embedSkillMessage = (skillId: string) => {
    const found = skills.find((s) => s.id === skillId);
    return {
      role: "user" as const,
      content: {
        type: "resource" as const,
        resource: {
          uri: found?.uri ?? `millar://skills/${skillId}`,
          mimeType: "text/markdown",
          text: found?.skillMarkdown ?? `# ${skillId}\n`,
        },
      },
    };
  };

  server.registerPrompt(
    "millar-design",
    {
      title: "Millar Design Director & Cross-Page Continuity",
      description:
        "Activates millar-design v0.2 (5-role studio, Brand-First Research, Impeccable craft floor, 12-axis .millar/style-dna.md) to keep secondary pages visually cohesive.",
      argsSchema: {
        brief: z.string().describe("Website, app, or multi-page redesign brief."),
        existingAssets: z
          .string()
          .optional()
          .describe("Optional paths or notes describing user-supplied images, animations, or an existing hero page to sync."),
        lang: langArg,
      },
    },
    async ({ brief, existingAssets, lang }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "resource",
            resource: { uri: "millar://guidelines/invariants", mimeType: "text/markdown", text: invariantsMarkdown },
          },
        },
        embedSkillMessage("millar-design"),
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Execute millar-design v0.2 for: "${brief}".`,
              existingAssets ? `User-supplied hero assets to extract & sync across ALL routes: ${existingAssets}` : "",
              "Research any named brand first (local DESIGN.md, live MCP tokens, or web research; never hardcode another brand's palette), lock .millar/style-dna.md, produce >= 9.0/10 visuals, and verify every secondary route >= 4/5 continuity.",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-deep-research",
    {
      title: "Millar Brand-First Research & Visual DNA Extraction",
      description:
        "Activates millar-deep-research v0.2 to research any named brand, extract Visual/Motion DNA from supplied assets, and emit an English .millar/research-dossier.md.",
      argsSchema: {
        topic: z.string().describe("Brand, product, visual style, or multi-page aesthetic brief to research."),
        existingAssets: z.string().optional().describe("Optional supplied images, animations, or reference URLs to inspect."),
        lang: langArg,
      },
    },
    async ({ topic, existingAssets, lang }) => ({
      messages: [
        embedSkillMessage("millar-deep-research"),
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Run millar-deep-research v0.2 for: "${topic}".`,
              existingAssets ? `Inspect and extract Visual & Motion DNA from: ${existingAssets}` : "",
              "Research any named brand from primary sources (local DESIGN.md, live MCP tokens, or official web references) before picking any palette or motif, then save .millar/research-dossier.md in English.",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-create-image",
    {
      title: "Millar Gallery-Grade Image & Procedural Art Direction",
      description:
        "Activates millar-create-image v0.2 (English-only prompts, Human Editorial Photography, 4-Layer Procedural Craft on 503/offline, Zero-Addition Pass 2 polish).",
      argsSchema: {
        subject: z.string().describe("Page, section, or visual asset series to produce."),
        styleContext: z.string().optional().describe("Optional path to .millar/style-dna.md or existing hero reference image."),
        lang: langArg,
      },
    },
    async ({ subject, styleContext, lang }) => ({
      messages: [
        embedSkillMessage("millar-create-image"),
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Run millar-create-image v0.2 for: "${subject}".`,
              styleContext ? `Style anchor context: ${styleContext}` : "",
              "Author ALL image prompts in concise English (150-250 words), research brand palette/polarity first (never hardcode hexes), load human-editorial-photography.md for real people or procedural-gallery-craft.md on 503/code-native plates, save .prompt.json provenance, and run Zero-Addition Pass 2 polish until >= 9.0/10.",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-animation",
    {
      title: "Millar Motion Research & Cross-Page Choreography",
      description:
        "Activates millar-animation v0.2 to lock a 4-line Motion Thesis and ship compositor-safe, static-first, reduced-motion-compliant choreography.",
      argsSchema: {
        target: z.string().describe("Component, page, or multi-page flow to choreograph."),
        motionFeel: z.string().optional().describe("Optional motion feel or existing hero animation reference to match."),
        lang: langArg,
      },
    },
    async ({ target, motionFeel, lang }) => ({
      messages: [
        embedSkillMessage("millar-animation"),
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Run millar-animation v0.2 for: "${target}".`,
              motionFeel ? `Target motion feel / reference: ${motionFeel}` : "",
              "Query get_motion_presets() if applicable, lock a 4-line Motion Thesis, ship GPU compositor animations with static-first visibility and prefers-reduced-motion in the same edit, and verify both modes.",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-web-workflow",
    {
      title: "Millar End-to-End Web Engineering & Creative Workflow",
      description:
        "Activates millar-web-workflow v0.2 to run Brand-First Research, classify Track S/M/L, run Creative Divergence, orchestrate all 7 skills, and gate on independent verification.",
      argsSchema: {
        request: z.string().describe("Website, multi-page app, redesign, or UI feature request."),
        track: z.enum(["auto", "S", "M", "L"]).optional().describe("Optional explicit Track override (defaults to auto)."),
        lang: langArg,
      },
    },
    async ({ request, track, lang }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "resource",
            resource: { uri: "millar://guidelines/invariants", mimeType: "text/markdown", text: invariantsMarkdown },
          },
        },
        embedSkillMessage("millar-web-workflow"),
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Execute millar-web-workflow v0.2 for: "${request}".`,
              track && track !== "auto" ? `Track override: Track ${track}.` : "Classify Track S, M, or L before editing any code.",
              "Research any named brand first (never hardcode another brand's tokens), run Creative Divergence on Track M/L, author all prompts in English, and gate completion on millar-verify-web (millar-audit.mjs + Fresh-Context Independent Finish Reviewer).",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-build-web",
    {
      title: "Millar Frontend Architecture & Production Web Build",
      description:
        "Activates millar-build-web v0.2 for Server-First components, deep modules, 5 real interactive UI states, browser surface theming, CWV & SEO.",
      argsSchema: {
        scope: z.string().describe("Pages, components, or vertical slices to implement."),
        minimalChange: z.boolean().optional().describe("Set true for Track S surgical fixes with zero unrelated refactors."),
        lang: langArg,
      },
    },
    async ({ scope, minimalChange, lang }) => ({
      messages: [
        embedSkillMessage("millar-build-web"),
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Run millar-build-web v0.2 for: "${scope}".`,
              minimalChange ? "Mode: Minimal-Change Track S (strictly scoped diff)." : "Mode: Vertical-Slice Build (deep modules, Server-First leaves, 5 UI states, browser surface theming, CWV/SEO).",
              "Load references via get_skill(name='millar-build-web', includeAllReferences=true) and ground tokens dynamically in .millar/style-dna.md or live MCP.",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-verify-web",
    {
      title: "Millar 5-Layer QA, Zero-MCP Audit & Independent Finish Review",
      description:
        "Activates millar-verify-web v0.2: standalone scripts/millar-audit.mjs, Playwright E2E, 1440/768/375 Light/Dark visual & anti-clip-art check, axe-core WCAG AA, and fresh-context finish review.",
      argsSchema: {
        target: z.string().describe("Routes, PR diff, or website build to verify before shipping."),
        lang: langArg,
      },
    },
    async ({ target, lang }) => ({
      messages: [
        embedSkillMessage("millar-verify-web"),
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Execute millar-verify-web v0.2 5-layer QA gate on: "${target}".`,
              "Run standalone scripts/millar-audit.mjs (+ validate_design if Millar MCP is active), verify interactive Playwright flows & axe-core WCAG AA, inspect 1440/768/375 Light & Dark visuals against clip-art/wax-skin bans, and delegate final Layer 3B + Layer 5 review to a fresh-context subagent.",
              localeLine(lang),
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );

  return server;
}
