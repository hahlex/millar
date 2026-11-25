"use client";

import React, { useState } from "react";
import { Alert, Badge, Card, ChoiceToggle, DataTable, Tabs } from "@hahlex/millar-ui";
import { CodeCopyBox } from "@/components/CodeCopyBox";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";
import { usePortalLocale } from "@/components/PortalShell";

interface SkillDocItem {
  id: string;
  name: string;
  headline: string;
  summary: string;
  roles: string[];
  uri: string;
  references: Array<{ file: string; purpose: string }>;
  mcpCalls: string[];
  promptExample: {
    vi: string;
    en: string;
  };
}

const BOOTSTRAP_PROMPTS = {
  "all-in-one": {
    label: "All-in-One (7 Skills + MCP)",
    vi: `Hãy tự động cài đặt trọn bộ Millar Design System (Hahlex) vào môi trường AI của tôi gồm cả 7 Agent Skills và Millar MCP Server:

1. Cài 7 Millar Skills (millar-web-workflow, millar-deep-research, millar-design, millar-create-image, millar-animation, millar-build-web, millar-verify-web):
   - Chạy lệnh: npx skills add https://github.com/hahlex/millar
   - Nếu máy chưa có quyền git private repo hoặc lệnh CLI không hỗ trợ IDE hiện tại, hãy clone/pull thư mục skills/ từ https://github.com/hahlex/millar và sao chép vào thư mục skills của IDE đang dùng (~/.gemini/config/skills/, ~/.claude/skills/, ~/.codex/skills/, hoặc .cursor/skills/).
2. Cấu hình và kết nối Millar MCP Server (@hahlex/millar-mcp):
   - Thêm MCP server tên "millar" dùng command "npx" với args ["-y", "@hahlex/millar-mcp@draft"] (hoặc trỏ tới dist/stdio.js nếu đã clone repo millar về local).
3. Kiểm tra lại bằng cách gọi tool list_skills() và get_design_guidelines(register="shared") rồi báo cáo xác nhận đã sẵn sàng đủ 7 skills và 13 MCP tools.`,
    en: `Automatically install the complete Millar Design System (Hahlex) suite into my AI coding environment, including all 7 Agent Skills and the Millar MCP Server:

1. Install all 7 Millar Skills (millar-web-workflow, millar-deep-research, millar-design, millar-create-image, millar-animation, millar-build-web, millar-verify-web):
   - Run: npx skills add https://github.com/hahlex/millar
   - If the CLI is unavailable in this IDE, clone https://github.com/hahlex/millar and copy the skills/ directories into this agent's skills root (~/.gemini/config/skills/, ~/.claude/skills/, ~/.codex/skills/, or .cursor/skills/).
2. Configure and connect the Millar MCP Server (@hahlex/millar-mcp):
   - Register an MCP server named "millar" running command "npx" with args ["-y", "@hahlex/millar-mcp@draft"] (or point to local packages/mcp/dist/stdio.js if cloned locally).
3. Verify installation by calling list_skills() and get_design_guidelines(register="shared"), then confirm all 7 skills and 13 MCP tools are active.`,
  },
  "skills-only": {
    label: "Skills Only (7 Skills)",
    vi: `Hãy tải và cài đặt trọn bộ 7 Millar Agent Skills từ https://github.com/hahlex/millar vào thư mục skills hiện tại của bạn bằng lệnh:
npx skills add https://github.com/hahlex/millar

Đảm bảo đủ 7 skill (kèm thư mục references/ của mỗi skill):
- millar-web-workflow
- millar-deep-research
- millar-design
- millar-create-image
- millar-animation
- millar-build-web
- millar-verify-web

Sau khi cài xong, hãy đọc nhanh mô tả từng skill và xác nhận sẵn sàng áp dụng cho dự án web tiếp theo.`,
    en: `Download and install all 7 Millar Agent Skills from https://github.com/hahlex/millar into your active skills directory by running:
npx skills add https://github.com/hahlex/millar

Verify all 7 skills (with their bundled references/ playbooks) are installed:
- millar-web-workflow
- millar-deep-research
- millar-design
- millar-create-image
- millar-animation
- millar-build-web
- millar-verify-web

Confirm when all 7 skills are loaded and ready for web design and implementation tasks.`,
  },
  "sync-hero": {
    label: "Install + Sync Multi-Page Site",
    vi: `Hãy cài bộ 7 Millar Skills (npx skills add https://github.com/hahlex/millar) hoặc nạp trực tiếp qua Millar MCP (list_skills / get_skill), sau đó chạy quy trình millar-web-workflow ở chế độ Track M cho dự án hiện tại:

1. Chạy millar-deep-research để trích xuất Visual DNA và Motion DNA từ trang chủ / hình ảnh / animation tôi đã cung cấp sẵn.
2. Chạy millar-design để khóa hợp đồng 12 trục vào .millar/style-dna.md, đảm bảo các trang phụ thừa hưởng trọn vẹn chất liệu bề mặt, ánh sáng, framing và nhịp điệu bố cục (không bị đơn giản hóa kiểu công nghiệp hay chỉ đồng bộ mỗi font).
3. Dùng millar-create-image và millar-animation để đồng bộ visual và chuyển động cho các trang còn lại.
4. Code sạch bằng millar-build-web và nghiệm thu đủ 5 lớp bằng millar-verify-web trước khi bàn giao.`,
    en: `Install the 7 Millar Skills (npx skills add https://github.com/hahlex/millar) or load them via Millar MCP (list_skills / get_skill), then execute millar-web-workflow (Track M) on this project:

1. Run millar-deep-research to extract Visual DNA and Motion DNA from my existing homepage, images, and animations.
2. Run millar-design to lock the 12-axis .millar/style-dna.md contract so every secondary page inherits full surface materiality, lighting, framing, and layout variety (never dropping to plain industrial cards or font-only sync).
3. Use millar-create-image and millar-animation to create cohesive visuals and matching motion across all secondary routes.
4. Implement with millar-build-web and pass all 5 QA layers in millar-verify-web before handoff.`,
  },
} as const;

const SKILLS: SkillDocItem[] = [
  {
    id: "millar-web-workflow",
    name: "millar-web-workflow",
    headline: "Master Web Engineering Conductor & Creative Divergence Router",
    summary:
      "Single entry-point orchestrator routing Track S (surgical fix), Track M (syncing secondary pages to hero imagery/animations), and Track L (full greenfield build/redesign). Enforces the Anti-Slop Creative Divergence Protocol and coordinates Matt Pocock skills, Agency Agents specialists, and Millar MCP.",
    roles: ["Engineering Conductor", "Creative Director", "UX Architect", "QA Lead"],
    uri: "millar://skills/millar-web-workflow",
    references: [
      { file: "track-routing-and-gates.md", purpose: "Track S/M/L decision matrix, .millar/ phase-gate artifacts, and backend specialist escalation." },
      { file: "creative-divergence-protocol.md", purpose: "Rut-Naming, 3-Family Cultural Derivation, and One Authored Signature Moment per surface." },
    ],
    mcpCalls: ["list_skills", "get_skill", "get_design_guidelines", "validate_design"],
    promptExample: {
      vi: "Hãy dùng millar-web-workflow (Track L) để thiết kế và lập trình trọn bộ website giới thiệu sản phẩm cùng trang ứng dụng, chạy Creative Divergence trước để tránh khuôn mẫu AI sáo mòn và bắt buộc nghiệm thu đủ 5 lớp qua millar-verify-web trước khi bàn giao.",
      en: "Run millar-web-workflow (Track L) to design and build our multi-page launch website + workspace app, running Creative Divergence first and gating completion on millar-verify-web.",
    },
  },
  {
    id: "millar-deep-research",
    name: "millar-deep-research",
    headline: "Visual DNA Extraction & World-Class Craft Research",
    summary:
      "Decodes user intent, dissects supplied hero images, animations, or live references into concrete Visual & Motion DNA, and benchmarks world-class web design and animation systems before code or prompts are written.",
    roles: ["UX Architect", "Visual Storyteller", "Brand Guardian"],
    uri: "millar://skills/millar-deep-research",
    references: [
      { file: "visual-extraction-protocol.md", purpose: "8-point visual artifact & 5-point animation extraction checklist." },
      { file: "world-class-benchmarks.md", purpose: "Curated benchmarks (Vercel Geist, Linear, Stripe, Anthropic, Emil Kowalski, Rauno Freiberg)." },
    ],
    mcpCalls: ["get_design_guidelines", "get_design_tokens", "get_visual_assets", "get_motion_presets"],
    promptExample: {
      vi: "Hãy chạy millar-deep-research trên ảnh assets/hero-stage.png và file animation src/components/HeroMotion.tsx để trích xuất ánh sáng, bảng màu, chất liệu bề mặt, framing và vật lý chuyển động vào .millar/research-dossier.md trước khi thiết kế các trang phụ.",
      en: "Run millar-deep-research on assets/hero-stage.png and src/components/HeroMotion.tsx to extract exact lighting, palette language, framing, and spring physics into .millar/research-dossier.md.",
    },
  },
  {
    id: "millar-design",
    name: "millar-design",
    headline: "Flagship Design Director & Cross-Page Continuity",
    summary:
      "Solves multi-page style drift so secondary pages (Features, Pricing, About, Docs, App) inherit the exact materiality, lighting temperature, framing geometry, composition variety, and motion physics of hero visuals instead of collapsing into generic industrial cards.",
    roles: ["Brand Guardian", "UI Designer", "UX Architect", "Visual Storyteller", "Motion Choreographer"],
    uri: "millar://skills/millar-design",
    references: [
      { file: "style-dna-contract.md", purpose: "12-axis .millar/style-dna.md contract including Secondary-Page Richness rules." },
      { file: "aesthetic-movements.md", purpose: "World-class movement taxonomy & translating vague user taste into dials." },
      { file: "cross-page-sync-audit.md", purpose: "6-axis screenshot continuity rubric (requires >= 4/5 across every secondary route)." },
    ],
    mcpCalls: ["get_design_guidelines", "get_design_tokens", "get_component", "get_visual_assets", "validate_design"],
    promptExample: {
      vi: "Hãy dùng millar-design để dựng các trang /features, /pricing và /about đồng bộ hoàn toàn với hình ảnh và animation ở trang chủ hiện có. Khóa hợp đồng 12 trục .millar/style-dna.md trước và kiểm định từng trang phụ đạt >= 4/5 theo 6 trục đồng bộ thẩm mỹ.",
      en: "Use millar-design to build /features, /pricing, and /about fully synced to our existing homepage hero image and animation physics. Lock .millar/style-dna.md first and audit every route for cross-page continuity.",
    },
  },
  {
    id: "millar-create-image",
    name: "millar-create-image",
    headline: "Style-Locked Visual Asset & AI Image Art Direction",
    summary:
      "Turns image generation into a repeatable studio pipeline using an 80% fixed Style DNA prompt prefix + 20% subject variable, HEX-to-material translation, and dual support for native AI image generators (Antigravity, Codex, Claude, Imagen/Flux) and code-native SVG/Canvas editorial plates.",
    roles: ["Visual Storyteller", "Brand Guardian", "UI Designer"],
    uri: "millar://skills/millar-create-image",
    references: [
      { file: "image-art-direction.md", purpose: "5-block Master Style Prefix formula, HEX-to-Visual-Language bridge, canvas-design plate rules." },
      { file: "multi-page-asset-map.md", purpose: "Multi-page scale variation blueprint (Home, Features, Pricing, About, Docs, Empty States)." },
    ],
    mcpCalls: ["get_design_guidelines", "get_design_tokens", "get_visual_assets"],
    promptExample: {
      vi: "Hãy chạy millar-create-image dựa trên .millar/style-dna.md để tạo bộ ảnh 4:3 cho trang /features và ảnh studio biên tập 3:2 cho trang /about cùng một hướng ánh sáng, chất liệu giấy ấm và hệ màu như ảnh Hero trang chủ.",
      en: "Run millar-create-image using .millar/style-dna.md to generate matching 4:3 feature plates and a 3:2 editorial studio scene for /features and /about with identical lighting and matte sand temperature.",
    },
  },
  {
    id: "millar-animation",
    name: "millar-animation",
    headline: "Motion Research, Physics & Cross-Page Choreography",
    summary:
      "Researches user-aligned animation references, locks a 4-line Motion Thesis, and implements compositor-safe, interruptible springs, CSS View Transitions, scroll-driven reveals, and mandatory prefers-reduced-motion alternatives matching existing hero animations.",
    roles: ["Motion Choreographer", "Whimsy Injector", "UI Designer"],
    uri: "millar://skills/millar-animation",
    references: [
      { file: "motion-choreography.md", purpose: "Productive vs Expressive timing matrix, spring vs cubic-bezier rules, hover stability, View Transitions." },
      { file: "animation-research-patterns.md", purpose: "Translating subjective motion intent into exact curves and rejecting blank scroll traps." },
    ],
    mcpCalls: ["get_motion_presets", "get_design_guidelines", "validate_design"],
    promptExample: {
      vi: "Hãy chạy millar-animation để đồng bộ đường cong spring, micro-interaction và CSS View Transitions giữa tất cả các trang khớp với nhịp chuyển động của Hero, bảo đảm 60fps trên GPU và có fallback prefers-reduced-motion đầy đủ.",
      en: "Run millar-animation to unify spring timing and View Transitions across all routes matching our hero reveal physics, with static-first prefers-reduced-motion fallbacks.",
    },
  },
  {
    id: "millar-build-web",
    name: "millar-build-web",
    headline: "Production Frontend Architecture & Vertical-Slice Execution",
    summary:
      "Synthesizes Matt Pocock deep modules & TDD vertical slices, Agency Agents frontend-developer & minimal-change restraint, Server-First React/Next.js boundaries, 5 mandatory UI states, Core Web Vitals (LCP/INP/CLS), and semantic SEO.",
    roles: ["Frontend Developer", "Software Architect", "Minimal Change Engineer"],
    uri: "millar://skills/millar-build-web",
    references: [
      { file: "web-architecture-checklist.md", purpose: "Feature modules, RSC Server-First leaves, Slot Pattern, forms/tables/dialogs, responsive floor." },
      { file: "seo-cwv-and-copy.md", purpose: "LCP < 2.5s, INP < 200ms, CLS < 0.1, semantic landmarks, JSON-LD, Zero Em-Dash & :lang(vi) safety." },
    ],
    mcpCalls: ["get_design_tokens", "search_components", "get_component", "search_sections", "validate_design"],
    promptExample: {
      vi: "Hãy chạy millar-build-web để lập trình trang /pricing và /dashboard theo kiến trúc Server-First (chỉ đẩy 'use client' xuống lá tương tác), đủ 5 trạng thái default/loading/empty/error/disabled, tối ưu Core Web Vitals và dùng đúng token Millar.",
      en: "Run millar-build-web to implement /pricing and /dashboard as Server-First vertical slices with lean client leaves, full loading/empty/error states, and zero hardcoded hex values.",
    },
  },
  {
    id: "millar-verify-web",
    name: "millar-verify-web",
    headline: "5-Layer Real-Browser QA, A11y & Two-Axis Review Gate",
    summary:
      "Eliminates premature 'build passed' handoffs by enforcing 5 verification layers: static/MCP compliance, Playwright interactive E2E, 1440/768/375 Light & Dark visual continuity screenshots, dynamic axe-core WCAG 2.1 AA + reduced-motion testing, and two-axis Spec-vs-Standards review.",
    roles: ["QA Engineer", "Section 508 Accessibility Specialist", "Code Reviewer"],
    uri: "millar://skills/millar-verify-web",
    references: [
      { file: "five-layer-qa-gate.md", purpose: "Executable Playwright zero-error, overflow, dynamic axe-core, keyboard, and reduced-motion scripts." },
      { file: "two-axis-review-rubric.md", purpose: "Unmerged Spec Fidelity vs Engineering Standards review + Fowler code-smell baseline." },
    ],
    mcpCalls: ["validate_design", "get_design_guidelines"],
    promptExample: {
      vi: "Hãy chạy cổng kiểm định 5 lớp millar-verify-web trên toàn bộ trang vừa dựng ở 3 kích thước 1440px/768px/375px (Light & Dark), bấm kiểm tra mọi nút/bộ lọc/dialog, chấm đồng bộ giao diện >= 4/5 và xuất báo cáo review 2 trục Spec vs Standards.",
      en: "Run millar-verify-web across all built routes at 1440px/768px/375px (Light & Dark), verify every interactive control, check cross-page continuity >= 4/5, and output a two-axis Spec vs Standards report.",
    },
  },
];

const RECIPES = [
  {
    id: "track-m",
    label: "Track M: Sync Hero Assets",
    title: "Track M: Existing Hero Images / Animations -> Sync All Secondary Pages",
    problem: "Homepage looks bespoke thanks to user-supplied images or animations, but /features, /pricing, and /about drop into plain industrial cards that only copy fonts.",
    chain: [
      "millar-web-workflow",
      "millar-deep-research",
      "millar-design",
      "millar-create-image",
      "millar-animation",
      "millar-build-web",
      "millar-verify-web",
    ],
    outcome: "Extracts lighting, materiality, framing, and motion physics from Page 1 into .millar/style-dna.md, builds clean Server-First secondary routes, and passes the 5-layer QA gate (>= 4/5 continuity).",
  },
  {
    id: "track-l",
    label: "Track L: Greenfield Creative",
    title: "Track L: Full Website / Creative Redesign (Anti-Slop Pipeline)",
    problem: "Building a multi-page website or app from scratch without falling into generic AI purple-glow SaaS templates.",
    chain: [
      "millar-web-workflow",
      "millar-deep-research",
      "millar-design",
      "millar-create-image",
      "millar-animation",
      "millar-build-web",
      "millar-verify-web",
    ],
    outcome: "Names and bans the category rut, derives authentic visual craft, ships one authored signature moment per surface, builds vertical slices with CWV/SEO hygiene, and verifies all 5 QA layers.",
  },
  {
    id: "photo-free",
    label: "Photo-Free Hahlex Launch",
    title: "Photo-Free Marketing Launch (Zero Photos / Videos)",
    problem: "Need an editorial, finished Marketing website with zero photography supplied.",
    chain: ["millar-web-workflow", "millar-design", "millar-animation", "millar-build-web", "millar-verify-web"],
    outcome: "Combines Millar's 6 Composition Patterns, 14 code-native SVG/CSS/Canvas visual assets, App-rooted Warm Sand + Espresso + < 1.5% Crimson palette, clean RSC builds, and 5-layer Playwright QA.",
  },
  {
    id: "track-s",
    label: "Track S: Surgical Fix / App UI",
    title: "Track S: Surgical Bug Fix, Component Update, or Product Screen",
    problem: "Small focused UI change or dense zero-gradient Product screen that needs zero scope creep and strict WCAG/interactive verification.",
    chain: ["millar-web-workflow", "millar-build-web", "millar-verify-web"],
    outcome: "Enforces minimal-change diff restraint, solid zero-gradient Millar primitives, real interactive states, and fast Layer 1-2 + Two-Axis QA sign-off.",
  },
] as const;

export default function SkillsResourcePage() {
  const { locale, setLocale } = usePortalLocale();
  const [promptPreset, setPromptPreset] = useState<keyof typeof BOOTSTRAP_PROMPTS>("all-in-one");
  const [recipeId, setRecipeId] = useState<(typeof RECIPES)[number]["id"]>("track-m");
  const [activeSkillTab, setActiveSkillTab] = useState<string>("millar-web-workflow");

  const activePrompt = BOOTSTRAP_PROMPTS[promptPreset];
  const activeRecipe = RECIPES.find((r) => r.id === recipeId) ?? RECIPES[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Resources"
        title="Millar Agent Skills Suite"
        description="Seven composable end-to-end web engineering & design studio skills synthesizing Anthropic canvas-design, Impeccable, Matt Pocock engineering skills, and Agency Agents roles. Bundled directly inside Millar MCP and installable in Antigravity, Claude Code, Codex, and Cursor."
        badges={[
          { label: "7 Composable Skills", tone: "brand" },
          { label: "15 Bundled Playbooks", tone: "sage" },
          { label: "Track S · M · L Workflow", tone: "neutral" },
        ]}
        importPath="millar://skills"
      />

      {/* Ready-to-Send AI Agent Bootstrap Prompts */}
      <SpecimenFrame
        title="One-Click AI Agent Bootstrap Prompts (Auto-Install Skills & MCP)"
        description="Prefer zero manual setup? Switch between Tiếng Việt and English (synced with the topbar EN/VI switch), click Copy, and paste straight into Antigravity, Claude Code, Codex, or Cursor."
        toolbar={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ChoiceToggle
              label="Bootstrap prompt preset"
              value={promptPreset}
              onChange={setPromptPreset}
              options={[
                { value: "all-in-one", label: "All-in-One (Skills + MCP)" },
                { value: "skills-only", label: "7 Skills Only" },
                { value: "sync-hero", label: "Install + Sync Site" },
              ]}
            />
            <ChoiceToggle
              label="Prompt language"
              value={locale}
              onChange={setLocale}
              options={[
                { value: "vi", label: "Tiếng Việt" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
        }
        code={activePrompt[locale]}
        codeTitle={`Send to Antigravity / Claude Code / Codex / Cursor · ${activePrompt.label} (${locale.toUpperCase()})`}
        wrapCode
      >
        <Alert
          tone="info"
          title={locale === "vi" ? "Tự động cài đặt chỉ bằng 1 prompt gửi AI" : "Zero-friction onboarding for any coding agent"}
          message={
            locale === "vi"
              ? "Bấm Copy ở khung prompt bên dưới rồi dán vào khung chat của Antigravity, Claude Code, Codex hoặc Cursor. Agent sẽ tự chạy npx skills add, kết nối @hahlex/millar-mcp và kiểm tra list_skills()."
              : "Click Copy on the prompt box below and paste directly into chat. Your agent will run npx skills add, wire @hahlex/millar-mcp, and verify list_skills() automatically."
          }
        />
      </SpecimenFrame>

      {/* Interactive Scenario & Track Planner */}
      <SpecimenFrame
        title="Interactive Track & Skill Combination Planner"
        description="Select your project track or scenario to see the exact gated pipeline from Creative Divergence through 5-layer real-browser QA."
        toolbar={
          <ChoiceToggle
            label="Project scenario"
            value={recipeId}
            onChange={setRecipeId}
            options={RECIPES.map((r) => ({ value: r.id, label: r.label }))}
          />
        }
        code={`# 1. Install all 7 Millar skills into any compatible agent (Antigravity / Claude / Codex / Cursor)
npx skills add https://github.com/hahlex/millar

# 2. Or invoke directly via Millar MCP tools / prompts (zero local skill install required)
list_skills()
${activeRecipe.chain.map((s) => `get_skill({ name: "${s}", includeAllReferences: true })`).join("\n")}`}
        codeTitle={`Recommended CLI & MCP Pipeline · ${activeRecipe.label}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-card-title)" }}>{activeRecipe.title}</strong>
            <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.55 }}>{activeRecipe.problem}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {activeRecipe.chain.map((step, idx) => (
              <React.Fragment key={step}>
                <Badge tone={step === "millar-web-workflow" || step === "millar-design" ? "brand" : step === "millar-verify-web" ? "success" : "sand"}>
                  {idx + 1}. {step}
                </Badge>
                {idx < activeRecipe.chain.length - 1 ? (
                  <span aria-hidden="true" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-subtle)" }}>
                    -&gt;
                  </span>
                ) : null}
              </React.Fragment>
            ))}
          </div>

          <Alert tone="success" title="Guaranteed outcome" message={activeRecipe.outcome} />
        </div>
      </SpecimenFrame>

      {/* Interactive Skill Inspector */}
      <section aria-labelledby="skill-inspector-heading" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 id="skill-inspector-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
            Inspect All 7 Skills &amp; Bundled Playbooks
          </h2>
          <ChoiceToggle
            label="Skill example prompt language"
            value={locale}
            onChange={setLocale}
            options={[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" },
            ]}
          />
        </div>
        <Tabs
          ariaLabel="Millar Agent Skills"
          activeId={activeSkillTab}
          onChange={setActiveSkillTab}
          items={SKILLS.map((skill) => ({
            id: skill.id,
            label: skill.name,
            content: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card surface="inset" padding="default">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-card-title)" }}>{skill.headline}</strong>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-accent)" }}>{skill.uri}</code>
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.6 }}>{skill.summary}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {skill.roles.map((role) => (
                      <Badge key={role} tone="sage" dot={false}>
                        {role}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <DataTable
                  caption={`${skill.name} progressive-disclosure references`}
                  columns={[
                    { key: "file", header: "Reference File" },
                    { key: "purpose", header: "Loaded When" },
                  ]}
                  rows={skill.references.map((r) => ({ id: r.file, ...r }))}
                  rowKey={(r) => r.id}
                />

                <CodeCopyBox
                  title={`${skill.name} · ${locale === "vi" ? "Prompt mẫu (Tiếng Việt)" : "Example Prompt (English)"}`}
                  code={skill.promptExample[locale]}
                  wrap
                />
              </div>
            ),
          }))}
        />
      </section>

      {/* Cross-Agent Compatibility Table */}
      <section aria-labelledby="agent-compat-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="agent-compat-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Cross-Agent Compatibility (Agy · Claude · Codex · Cursor)
        </h2>
        <DataTable
          caption="How each coding agent consumes Millar Skills and MCP"
          columns={[
            { key: "agent", header: "Agent / Client" },
            { key: "skills", header: "Skill Discovery" },
            { key: "images", header: "Image & QA Path" },
            { key: "mcp", header: "MCP Access" },
          ]}
          rows={[
            {
              id: "agy",
              agent: "Antigravity (Agy)",
              skills: "Native SKILL.md in ~/.gemini/config/skills/ or MCP get_skill",
              images: "image-generator + Playwright E2E + code-native Millar Visual Assets",
              mcp: "13 Tools · 10 Prompts · millar://skills/*",
            },
            {
              id: "claude",
              agent: "Claude Code",
              skills: "npx skills add / .claude/skills/ or MCP Prompts",
              images: "MCP image tools + SVG/Canvas/Python plates + Playwright 5-layer QA",
              mcp: "stdio / Streamable HTTP (full Resources + Prompts)",
            },
            {
              id: "codex",
              agent: "OpenAI Codex",
              skills: ".codex/skills/ or MCP list_skills / get_skill tools",
              images: "Native image generation + style-locked plates + Playwright E2E",
              mcp: "Flat JSON Schema Tools (13 read-only tools)",
            },
            {
              id: "cursor",
              agent: "Cursor / VS Code",
              skills: ".cursor/skills/ or MCP Resources + Tools",
              images: "Code-native Visual Assets + Master Prompt Packet + Playwright QA",
              mcp: "stdio / HTTP MCP server",
            },
          ]}
          rowKey={(r) => r.id}
        />
      </section>
    </div>
  );
}
