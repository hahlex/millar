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
        "Catalog of composable Hahlex/Millar agent skills (millar-design, millar-deep-research, millar-create-image, millar-animation) with progressive-disclosure reference URIs and multi-skill recipes.",
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
              installCommand: "npx skills add https://github.com/hahlex/millar",
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
          installCommand: "npx skills add https://github.com/hahlex/millar",
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
   * 3. TEN USER-CONTROLLED MCP PROMPTS (Bilingual VI / EN · 3 Core + 7 Skills)
   * ========================================================================== */

  const langArg = z
    .enum(["vi", "en"])
    .optional()
    .describe("Prompt language mode: 'vi' (Tiếng Việt) or 'en' (English, default).");

  server.registerPrompt(
    "millar-build-marketing",
    {
      title: "Build Photo-Free Marketing Surface with Millar",
      description: "Guides an AI agent to compose a high-craft Hahlex marketing page using diverse Composition Patterns and code-native Visual Assets, then self-audit via validate_design (supports VI / EN).",
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
            text:
              lang === "vi"
                ? [
                    `Thiết kế và lập trình giao diện Marketing Hahlex không cần ảnh cho: "${feature}" (trao đổi và xuất nội dung bằng Tiếng Việt, tôn trọng :lang(vi) và Zero Em-Dash).`,
                    "1. Gọi get_design_guidelines(register='marketing', includeCompositionPatterns=true) để chọn ít nhất 3 Composition Patterns khác nhau (không lặp lại lưới 3 cột card giống nhau).",
                    "2. Gọi get_visual_assets() và search_sections() để tái sử dụng bộ Visual Assets viết bằng SVG/CSS/Canvas/React (chỉ dùng gradient bên trong asset được phê duyệt như WarmHorizonWash).",
                    "3. Bảo đảm hiển thị hoàn chỉnh ngay ở 0% scroll, thẻ <footer> nằm ngoài <main>, và tối ưu responsive di động.",
                    "4. Chạy validate_design(register='marketing') đến khi automatedChecks.passed === true và trình bày trung thực danh sách humanReviewCriteria cho con người duyệt.",
                  ].join("\n")
                : [
                    `Design and implement a photo-free Hahlex Marketing surface for: "${feature}".`,
                    "1. Call get_design_guidelines(register='marketing', includeCompositionPatterns=true) to select at least 3 distinct Composition Patterns (do NOT repeat identical architectural grids or equal 3-column card grids).",
                    "2. Call get_visual_assets() and search_sections() to reuse canonical SVG/CSS/Canvas/React visual assets (gradients are allowed ONLY inside explicitly approved visual assets like WarmHorizonWash).",
                    "3. Ensure static-first visual polish at 0% scroll, top-level <footer> outside <main>, and full mobile responsiveness.",
                    "4. Run validate_design(register='marketing') until automatedChecks.passed === true, and report the humanReviewCriteria checklist honestly for human sign-off.",
                  ].join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-build-product",
    {
      title: "Build Operational Product Screen with Millar",
      description: "Guides an AI agent to implement a crisp, WCAG 2.1/2.2 AA Hahlex Product screen using zero-gradient primitives from @hahlex/millar-ui (supports VI / EN).",
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
            text:
              lang === "vi"
                ? [
                    `Lập trình màn hình Product/App Hahlex: "${screen}" (trao đổi và viết UI/copy bằng Tiếng Việt, tôn trọng Zero Em-Dash).`,
                    "1. Gọi get_design_guidelines(register='product') và search_components() -> get_component() để lấy đúng props và guardrail chống bịa prop.",
                    "2. Tuân thủ Zero CSS Gradients, không dùng <button>/<input> thô, giữ focus ring .millar-focus 2px, lỗi form role='alert' và --fg-on-accent-soft trên chip --accent-soft.",
                    "3. Tách riêng các token chuyên ngành (như Education 4-skill) vào gói extension tùy chọn.",
                    "4. Chạy validate_design(register='product') đến khi automatedChecks.passed === true.",
                  ].join("\n")
                : [
                    `Implement the Hahlex Product screen: "${screen}".`,
                    "1. Call get_design_guidelines(register='product') and search_components() -> get_component() for exact props and invalid-prop guardrails.",
                    "2. Enforce zero CSS gradients, zero raw <button>/<input>, 2px .millar-focus rings, role='alert' validation errors, and --fg-on-accent-soft on --accent-soft chips.",
                    "3. Keep vertical-specific tokens (like Education 4-skill tones) inside optional domain extensions.",
                    "4. Run validate_design(register='product') until automatedChecks.passed === true.",
                  ].join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-audit-code",
    {
      title: "Audit UI Code Against Millar",
      description: "Runs deterministic automated compliance checks and structures human aesthetic review criteria separately (supports VI / EN).",
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
            text:
              lang === "vi"
                ? `Kiểm định đoạn mã UI được cung cấp bằng cách gọi validate_design(register="${register}"). Trình bày bằng Tiếng Việt theo 2 phần tách biệt: (1) các lỗi tự động trong automatedChecks kèm cách sửa chính xác và docUris, và (2) danh sách humanReviewCriteria cần con người đánh giá thẩm mỹ.`
                : `Audit the provided UI code by calling validate_design(register="${register}"). Present (1) automatedChecks violations with exact fixes and docUris, and (2) humanReviewCriteria clearly separated as advisory review questions that require human judgment.`,
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
        "Activates the millar-design flagship skill to lock a 12-axis Style DNA Contract and keep all secondary pages visually cohesive with existing hero imagery, custom animations, or Hahlex Measured Warmth (supports VI / EN).",
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
            text: (lang === "vi"
              ? [
                  `Thực thi quy trình millar-design cho yêu cầu: "${brief}" (trao đổi và giải thích bằng Tiếng Việt).`,
                  existingAssets ? `Tài sản / ảnh / animation người dùng cung cấp cần trích xuất và đồng bộ toàn site: ${existingAssets}` : "",
                  "Thực hiện nghiêm ngặt đủ các bước của millar-design: phân nhánh -> chạy millar-deep-research nếu có tài sản sẵn -> khóa .millar/style-dna.md 12 trục -> gọi get_skill cho millar-create-image / millar-animation khi cần -> kiểm định mọi trang phụ đạt >= 4/5 theo 6 trục đồng bộ thẩm mỹ và chạy validate_design.",
                ]
              : [
                  `Execute the millar-design workflow for: "${brief}".`,
                  existingAssets ? `User-supplied assets/hero context to extract and sync across ALL pages: ${existingAssets}` : "",
                  "Follow every step in millar-design strictly: classify branch -> run millar-deep-research if assets exist -> lock .millar/style-dna.md -> call get_skill for millar-create-image / millar-animation as needed -> audit every secondary page against the 6-axis Cross-Page Visual Continuity rubric and validate_design.",
                ]
            )
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
      title: "Millar Visual DNA Extraction & Craft Research",
      description:
        "Activates millar-deep-research to decode user intent, extract visual and motion DNA from supplied images/animations, and benchmark world-class styles before building (supports VI / EN).",
      argsSchema: {
        topic: z.string().describe("Target product, visual style, or multi-page aesthetic challenge to research."),
        existingAssets: z.string().optional().describe("Optional supplied images, animations, or reference URLs to dissect."),
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
            text: (lang === "vi"
              ? [
                  `Chạy millar-deep-research cho chủ đề: "${topic}" (trình bày báo cáo bằng Tiếng Việt).`,
                  existingAssets ? `Giải phẫu Visual DNA và Motion DNA từ các tài sản: ${existingAssets}` : "",
                  "Nạp đầy đủ tài liệu tham chiếu qua get_skill(name='millar-deep-research', includeAllReferences=true) và xuất .millar/research-dossier.md.",
                ]
              : [
                  `Run millar-deep-research for: "${topic}".`,
                  existingAssets ? `Inspect and extract Visual & Motion DNA from: ${existingAssets}` : "",
                  "Load reference playbooks via get_skill(name='millar-deep-research', includeAllReferences=true) and emit an actionable .millar/research-dossier.md.",
                ]
            )
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
      title: "Millar Style-Locked Visual Asset & Image Direction",
      description:
        "Activates millar-create-image to produce style-locked photography, illustrations, or code-native SVG/Canvas editorial plates across every page (supports VI / EN).",
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
            text: (lang === "vi"
              ? [
                  `Chạy millar-create-image cho nội dung: "${subject}" (báo cáo và hướng dẫn bằng Tiếng Việt; giữ prompt sinh ảnh tiếng Anh chuẩn xác cho model ảnh).`,
                  styleContext ? `Ngữ cảnh neo phong cách: ${styleContext}` : "",
                  "Áp dụng kiến trúc Master Prompt 80% cố định / 20% biến thiên và lộ trình đa agent; đọc get_skill(name='millar-create-image', includeAllReferences=true) trước khi tạo ảnh hoặc vẽ SVG/Canvas.",
                ]
              : [
                  `Run millar-create-image for: "${subject}".`,
                  styleContext ? `Style anchor context: ${styleContext}` : "",
                  "Follow the 80% Fixed / 20% Variable Master Prompt architecture and Cross-Agent Capability Routing Ladder, reading get_skill(name='millar-create-image', includeAllReferences=true) first.",
                ]
            )
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
        "Activates millar-animation to research matching animation physics, lock a 4-line Motion Thesis, and implement compositor-safe, reduced-motion-compliant choreography (supports VI / EN).",
      argsSchema: {
        target: z.string().describe("Component, page, or multi-page flow to choreograph."),
        motionFeel: z.string().optional().describe("Optional user motion feel or existing hero animation reference to match."),
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
            text: (lang === "vi"
              ? [
                  `Chạy millar-animation cho: "${target}" (giải thích Motion Thesis và kết quả bằng Tiếng Việt).`,
                  motionFeel ? `Cảm giác chuyển động / tham chiếu cần đồng bộ: ${motionFeel}` : "",
                  "Gọi get_motion_presets() và get_skill(name='millar-animation', includeAllReferences=true), viết Motion Thesis 4 dòng, triển khai animation trên GPU compositor kèm nhánh prefers-reduced-motion và kiểm chứng cả 2 chế độ.",
                ]
              : [
                  `Run millar-animation for: "${target}".`,
                  motionFeel ? `Target motion feel / reference: ${motionFeel}` : "",
                  "Call get_motion_presets() and get_skill(name='millar-animation', includeAllReferences=true), write a 4-line Motion Thesis, ship compositor-only animations with prefers-reduced-motion, and verify both normal and reduced motion.",
                ]
            )
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
        "Activates the master millar-web-workflow conductor to classify Track S/M/L, execute Creative Divergence, orchestrate design/assets/animation/build, and enforce the 5-layer QA gate (supports VI / EN).",
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
            text: (lang === "vi"
              ? [
                  `Thực thi quy trình tổng thể millar-web-workflow cho yêu cầu: "${request}" (trao đổi và báo cáo bằng Tiếng Việt).`,
                  track && track !== "auto" ? `Track chỉ định: Track ${track}.` : "Phân loại rõ Track S, M hoặc L trước khi sửa code.",
                  "Nạp tài liệu qua get_skill(name='millar-web-workflow', includeAllReferences=true), chạy Creative Divergence trên Track M/L, điều phối các skill Millar liên quan và chỉ kết thúc sau khi vượt qua cổng QA 5 lớp millar-verify-web.",
                ]
              : [
                  `Execute millar-web-workflow for: "${request}".`,
                  track && track !== "auto" ? `Requested Track override: Track ${track}.` : "Classify into Track S, M, or L before editing any code.",
                  "Load progressive-disclosure references via get_skill(name='millar-web-workflow', includeAllReferences=true), run Creative Divergence on Track M/L, orchestrate companion Millar skills, and gate completion on millar-verify-web.",
                ]
            ).join("\n"),
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
        "Activates millar-build-web to implement Server-First components, deep modules, 5 real interactive UI states, Core Web Vitals hygiene, and semantic SEO (supports VI / EN).",
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
            text: (lang === "vi"
              ? [
                  `Chạy millar-build-web cho phạm vi: "${scope}" (trao đổi và báo cáo bằng Tiếng Việt).`,
                  minimalChange
                    ? "Chế độ: Minimal-Change Track S (chỉ sửa đúng phần yêu cầu, không refactor lan)."
                    : "Chế độ: Vertical-Slice Build (Deep Modules + Server-First + đủ 5 trạng thái UI thật + Core Web Vitals/SEO).",
                  "Nạp tài liệu qua get_skill(name='millar-build-web', includeAllReferences=true) và dùng đúng token/component từ Millar MCP.",
                ]
              : [
                  `Run millar-build-web for: "${scope}".`,
                  minimalChange ? "Mode: Minimal-Change Track S (touch strictly required files)." : "Mode: Vertical-Slice Build (deep modules + Server-First leaves + 5 UI states + CWV/SEO).",
                  "Load references via get_skill(name='millar-build-web', includeAllReferences=true) and ground Hahlex UI in Millar MCP tokens/components.",
                ]
            ).join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "millar-verify-web",
    {
      title: "Millar 5-Layer Real-Browser QA & Two-Axis Review Gate",
      description:
        "Activates millar-verify-web to verify build/MCP compliance, Playwright interactive flows, 1440/768/375 Light & Dark screenshots, axe-core WCAG AA, reduced motion, and two-axis Spec-vs-Standards review (supports VI / EN).",
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
            text: (lang === "vi"
              ? [
                  `Chạy cổng kiểm định 5 lớp millar-verify-web cho: "${target}" (trình bày báo cáo bằng Tiếng Việt).`,
                  "Nạp get_skill(name='millar-verify-web', includeAllReferences=true), thực thi đầy đủ các lớp kiểm chứng trên trình duyệt thật kèm bằng chứng và tách riêng báo cáo 2 trục Spec vs Standards.",
                ]
              : [
                  `Execute millar-verify-web 5-layer QA gate on: "${target}".`,
                  "Load get_skill(name='millar-verify-web', includeAllReferences=true), execute all applicable layers with real observed evidence, and report Spec vs Standards axes separately.",
                ]
            ).join("\n"),
          },
        },
      ],
    }),
  );

  return server;
}
