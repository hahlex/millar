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
  "millar-design": {
    roleLens: ["Brand Guardian", "UI Designer", "UX Architect", "Visual Storyteller", "Motion Choreographer"],
    recommendedWith: ["millar-deep-research", "millar-create-image", "millar-animation"],
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
    recommendedWith: ["millar-design", "millar-create-image", "millar-animation"],
    mcpToolsUsed: ["get_design_guidelines", "get_design_tokens", "get_visual_assets", "get_motion_presets"],
    solves:
      "Extracts concrete Visual & Motion DNA from user-supplied images, animations, or live references and benchmarks world-class design craft before writing code or prompts.",
  },
  "millar-create-image": {
    roleLens: ["Visual Storyteller", "Brand Guardian", "UI Designer"],
    recommendedWith: ["millar-deep-research", "millar-design"],
    mcpToolsUsed: ["get_design_guidelines", "get_design_tokens", "get_visual_assets"],
    solves:
      "Produces style-locked photography, illustrations, and code-native SVG/Canvas editorial plates across every route using an 80% fixed Style DNA prefix so multi-page imagery looks authored by one studio.",
  },
  "millar-animation": {
    roleLens: ["Motion Choreographer", "Whimsy Injector", "UI Designer"],
    recommendedWith: ["millar-deep-research", "millar-design"],
    mcpToolsUsed: ["get_motion_presets", "get_design_guidelines", "validate_design"],
    solves:
      "Researches user-aligned motion patterns and implements compositor-safe, interruptible springs, View Transitions, and static-first prefers-reduced-motion choreography matching existing hero animations.",
  },
};

export const SKILL_COMBINATION_RECIPES = [
  {
    id: "sync-existing-hero-assets",
    title: "Existing Hero Images/Animations -> Sync Entire Multi-Page Site",
    when: "You already supplied images or custom animations for Page 1 and need Features, Pricing, About, Docs, or App pages to feel equally bespoke (never industrial).",
    chain: ["millar-deep-research", "millar-design", "millar-create-image", "millar-animation"],
    mcpCalls: ["get_skill", "get_design_tokens", "validate_design"],
  },
  {
    id: "photo-free-hahlex-launch",
    title: "Photo-Free Hahlex Marketing Launch",
    when: "Building a high-craft Hahlex marketing site with zero external photos or videos.",
    chain: ["millar-design", "millar-animation"],
    mcpCalls: ["get_design_guidelines", "get_visual_assets", "search_sections", "get_motion_presets", "validate_design"],
  },
  {
    id: "greenfield-bespoke-brand",
    title: "Greenfield Custom Brand Website + Custom Visual Series",
    when: "Starting a new brand direction needing researched aesthetics, cohesive AI-generated visual series, and signature motion.",
    chain: ["millar-deep-research", "millar-design", "millar-create-image", "millar-animation"],
    mcpCalls: ["list_skills", "get_skill", "validate_design"],
  },
  {
    id: "product-app-workspace",
    title: "Operational Product / App Interface (Zero Gradients)",
    when: "Building dense, calm, WCAG 2.1 AA dashboards, tables, forms, or settings.",
    chain: ["millar-design", "millar-animation"],
    mcpCalls: ["get_design_guidelines", "search_components", "get_component", "get_motion_presets", "validate_design"],
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
