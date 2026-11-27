import fs from "node:fs";
import path from "node:path";

export interface MillarSkillReference {
  file: string;
  title: string;
  uri: string;
  content: string;
}

export interface MillarSkillRecord {
  id: string;
  name: string;
  description: string;
  version: string;
  license: string;
  roleLens: string[];
  recommendedWith: string[];
  mcpToolsUsed: string[];
  solves: string;
  uri: string;
  skillMarkdown: string;
  references: MillarSkillReference[];
}

interface SkillCuratedMeta {
  roleLens: string[];
  recommendedWith: string[];
  mcpToolsUsed: string[];
  solves: string;
}

const SKILL_META: Record<string, SkillCuratedMeta> = {
  "millar-web-workflow": {
    roleLens: ["Engineering Conductor", "Creative Director", "UX Architect", "QA Lead"],
    recommendedWith: [
      "millar-deep-research",
      "millar-design",
      "millar-create-image",
      "millar-animation",
      "millar-build-web",
      "millar-verify-web",
      "millar-autonomous-qa",
    ],
    mcpToolsUsed: ["list_skills", "get_skill", "get_design_guidelines", "validate_design"],
    solves:
      "End-to-end web engineering conductor routing Track S (surgical fix), Track M (syncing secondary pages to hero assets), and Track L (full greenfield site) with Creative Divergence anti-slop gates and Matt Pocock / Agency Agents handoffs.",
  },
  "millar-design": {
    roleLens: ["Brand Guardian", "UI Designer", "UX Architect", "Visual Storyteller", "Motion Choreographer"],
    recommendedWith: ["millar-web-workflow", "millar-deep-research", "millar-create-image", "millar-animation", "millar-build-web"],
    mcpToolsUsed: [
      "get_design_guidelines",
      "get_design_tokens",
      "search_components",
      "get_component",
      "search_sections",
      "get_visual_assets",
      "validate_design",
    ],
    solves:
      "Flagship multi-page design director solving cross-page style drift so secondary pages inherit full visual materiality, framing, composition rhythm, and motion from hero assets instead of collapsing into generic industrial cards.",
  },
  "millar-deep-research": {
    roleLens: ["UX Architect", "Visual Storyteller", "Brand Guardian"],
    recommendedWith: ["millar-web-workflow", "millar-design", "millar-create-image", "millar-animation"],
    mcpToolsUsed: ["get_design_guidelines", "get_design_tokens", "get_visual_assets", "get_motion_presets"],
    solves:
      "Extracts concrete Visual & Motion DNA from user-supplied images, animations, or live references and benchmarks world-class design craft before writing code or prompts.",
  },
  "millar-create-image": {
    roleLens: ["Visual Storyteller", "Brand Guardian", "Master Illustrator"],
    recommendedWith: ["millar-deep-research", "millar-design", "millar-build-web"],
    mcpToolsUsed: ["get_design_guidelines", "get_design_tokens", "get_visual_assets"],
    solves:
      "English-only style-locked art direction (80% prefix / 20% subject), authentic human editorial photography (anti-wax-skin, cross-shot film roll continuity), and 4-layer museum-grade procedural gallery craft + Zero-Addition Pass 2 polish on 503/offline.",
  },
  "millar-animation": {
    roleLens: ["Motion Choreographer", "Whimsy Injector", "UI Designer"],
    recommendedWith: ["millar-deep-research", "millar-design", "millar-build-web", "millar-verify-web"],
    mcpToolsUsed: ["get_motion_presets", "get_design_guidelines", "validate_design"],
    solves:
      "Researches user-aligned motion patterns and implements compositor-safe, interruptible springs, View Transitions, and static-first prefers-reduced-motion choreography matching existing hero animations.",
  },
  "millar-build-web": {
    roleLens: ["Frontend Developer", "Software Architect", "Minimal Change Engineer"],
    recommendedWith: ["millar-web-workflow", "millar-design", "millar-animation", "millar-verify-web"],
    mcpToolsUsed: [
      "get_design_tokens",
      "search_components",
      "get_component",
      "search_sections",
      "get_section",
      "search_templates",
      "get_template",
      "validate_design",
    ],
    solves:
      "Production frontend engineering combining deep modules, TDD vertical slices, Server-First React/Next.js boundaries, 5 mandatory interactive UI states, Core Web Vitals (LCP/INP/CLS), semantic SEO, and minimal-change restraint.",
  },
  "millar-verify-web": {
    roleLens: ["QA Engineer", "Harsh Art Critic", "Section 508 Accessibility Specialist", "Code Reviewer"],
    recommendedWith: ["millar-web-workflow", "millar-build-web", "millar-design", "millar-animation", "millar-autonomous-qa"],
    mcpToolsUsed: ["validate_design", "get_design_guidelines"],
    solves:
      "Five-layer ship-readiness QA gate with bundled Zero-MCP standalone CLI (scripts/millar-audit.mjs), Playwright interactive E2E, anti-clip-art/anti-wax-skin Layer 3B critique, axe-core WCAG 2.1 AA, and Fresh-Context Independent Finish Reviewer.",
  },
  "millar-autonomous-qa": {
    roleLens: ["Autonomous QA Engineer", "Security & RBAC Tester", "Resilience Engineer", "AI Evaluator"],
    recommendedWith: ["millar-verify-web", "millar-web-workflow", "millar-build-web"],
    mcpToolsUsed: ["list_skills", "get_skill"],
    solves:
      "Continuous 8-stage autonomous QA loop (discover -> plan -> execute -> observe -> verify -> reproduce -> report -> explore further) across multi-role/multi-tenant sessions and 9 testing modes (exploratory, stateful, property, negative, concurrency, authorization, resilience, AI eval, multi-channel outcome verification) with non-production safety guards, budget caps, persistent memory, regression script generation, and self-contained HTML reports.",
  },
};

export const SKILL_COMBINATION_RECIPES = [
  {
    id: "track-m-sync-hero-assets",
    title: "Track M: Existing Hero Images/Animations -> Sync Entire Multi-Page Site",
    when: "You already supplied images or custom animations for Page 1 and need Features, Pricing, About, Docs, or App pages to feel equally bespoke (never industrial).",
    chain: [
      "millar-web-workflow",
      "millar-deep-research",
      "millar-design",
      "millar-create-image",
      "millar-animation",
      "millar-build-web",
      "millar-verify-web",
    ],
    mcpCalls: ["get_skill", "get_design_tokens", "get_component", "validate_design"],
  },
  {
    id: "track-l-greenfield-creative",
    title: "Track L: Greenfield Website / Creative Redesign (Anti-Slop Full Pipeline)",
    when: "Starting a new brand direction or full multi-page web app needing creative divergence, custom visual series, signature motion, clean RSC architecture, and 5-layer QA.",
    chain: [
      "millar-web-workflow",
      "millar-deep-research",
      "millar-design",
      "millar-create-image",
      "millar-animation",
      "millar-build-web",
      "millar-verify-web",
    ],
    mcpCalls: ["list_skills", "get_skill", "get_design_guidelines", "validate_design"],
  },
  {
    id: "photo-free-hahlex-launch",
    title: "Photo-Free Hahlex Marketing Launch (Measured Warmth)",
    when: "Building a high-craft Hahlex marketing site with zero external photos or videos using Millar's 14 code-native assets and 6 composition patterns.",
    chain: ["millar-web-workflow", "millar-design", "millar-animation", "millar-build-web", "millar-verify-web"],
    mcpCalls: ["get_design_guidelines", "get_visual_assets", "search_sections", "get_motion_presets", "validate_design"],
  },
  {
    id: "track-s-surgical-feature",
    title: "Track S: Surgical Fix, Single Component or Product Screen",
    when: "Fixing a UI bug, refining one component, or shipping a dense zero-gradient Product/App screen with minimal diff and strict WCAG/E2E verification.",
    chain: ["millar-web-workflow", "millar-build-web", "millar-verify-web"],
    mcpCalls: ["get_design_guidelines", "search_components", "get_component", "validate_design"],
  },
  {
    id: "autonomous-qa-live-verification",
    title: "Autonomous Full-Stack QA: Multi-Role Live App Exploration & Outcome Verification",
    when: "Testing a running non-production web app across roles, tenants, APIs, databases, queues, email, fault injection, concurrency, and AI endpoints with reproducible evidence and an HTML report.",
    chain: ["millar-autonomous-qa", "millar-verify-web"],
    mcpCalls: ["list_skills", "get_skill"],
  },
] as const;

function parseFrontmatter(markdown: string): {
  name?: string;
  description?: string;
  version?: string;
  license?: string;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
    if (!kv?.[1] || !kv[2]) continue;
    result[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
  return result;
}

function extractFirstHeading(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? fallback;
}

function resolveSkillsRoot(rootDir: string): string | null {
  const candidates = [
    path.join(rootDir, "skills"),
    path.join(import.meta.dirname, "skills"),
    path.resolve(import.meta.dirname, "../dist/skills"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }
  return null;
}

export function loadMillarSkills(rootDir: string): MillarSkillRecord[] {
  const skillsRoot = resolveSkillsRoot(rootDir);
  if (!skillsRoot) return [];

  const entries = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const records: MillarSkillRecord[] = [];
  for (const dirName of entries) {
    const skillPath = path.join(skillsRoot, dirName, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    const skillMarkdown = fs.readFileSync(skillPath, "utf8");
    const fm = parseFrontmatter(skillMarkdown);
    const id = fm.name ?? dirName;
    const curated = SKILL_META[id] ?? {
      roleLens: ["UI Designer"],
      recommendedWith: ["millar-design"],
      mcpToolsUsed: ["validate_design"],
      solves: fm.description ?? "",
    };

    const refDir = path.join(skillsRoot, dirName, "references");
    const references: MillarSkillReference[] = [];
    if (fs.existsSync(refDir) && fs.statSync(refDir).isDirectory()) {
      const refFiles = fs
        .readdirSync(refDir)
        .filter((f) => f.endsWith(".md"))
        .sort();
      for (const file of refFiles) {
        const content = fs.readFileSync(path.join(refDir, file), "utf8");
        references.push({
          file,
          title: extractFirstHeading(content, file),
          uri: `millar://skills/${id}/references/${file}`,
          content,
        });
      }
    }

    records.push({
      id,
      name: id,
      description: fm.description ?? "",
      version: fm.version ?? "0.1.0-draft.1",
      license: fm.license ?? "MIT",
      roleLens: curated.roleLens,
      recommendedWith: curated.recommendedWith,
      mcpToolsUsed: curated.mcpToolsUsed,
      solves: curated.solves,
      uri: `millar://skills/${id}`,
      skillMarkdown,
      references,
    });
  }

  return records;
}
