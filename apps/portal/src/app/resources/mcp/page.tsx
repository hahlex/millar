"use client";

import React, { useState } from "react";
import { Alert, ChoiceToggle, DataTable } from "@hahlex/millar-ui";
import { CodeCopyBox } from "@/components/CodeCopyBox";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";
import { usePortalLocale } from "@/components/PortalShell";

const MCP_CONNECT_PROMPTS = {
  vi: `Hãy tự động cấu hình và kết nối Millar MCP Server (@hahlex/millar-mcp) vào cấu hình MCP của IDE/Agent hiện tại cho tôi:

1. Thêm MCP server tên "millar" dùng transport stdio:
   - Ưu tiên dùng npm: command "npx", args ["-y", "@hahlex/millar-mcp@draft"].
   - Nếu máy đã clone repo https://github.com/hahlex/millar ở local, hãy build (pnpm --filter @hahlex/millar-mcp run build) và trỏ args tới đường dẫn packages/mcp/dist/stdio.js.
2. Nếu tôi cần đồng bộ thêm 7 Millar Agent Skills local, chạy luôn: npx skills add https://github.com/hahlex/millar.
3. Kiểm tra kết nối thành công bằng cách gọi list_skills() và get_design_guidelines(register="shared"), rồi báo cáo lại số lượng tools, skills và prompts đang hoạt động.`,
  en: `Automatically configure and connect the Millar MCP Server (@hahlex/millar-mcp) in my current IDE / AI agent MCP settings:

1. Add an MCP server named "millar" using stdio transport:
   - Primary (npm): command "npx", args ["-y", "@hahlex/millar-mcp@draft"].
   - Local fallback: if https://github.com/hahlex/millar is cloned locally, run pnpm --filter @hahlex/millar-mcp run build and point node to packages/mcp/dist/stdio.js.
2. Also install the 7 Millar Agent Skills locally if supported: npx skills add https://github.com/hahlex/millar.
3. Verify the connection by calling list_skills() and get_design_guidelines(register="shared"), and report the active tools, skills, and prompts.`,
} as const;

const MCP_PROMPTS_CATALOG = [
  {
    name: "millar-web-workflow",
    args: "request, track?, lang?",
    vi: "Gọi MCP prompt millar-web-workflow (lang='vi', track='L') để điều phối trọn quy trình thiết kế, sáng tạo chống AI slop, code web Server-First và kiểm định 5 lớp.",
    en: "Invoke MCP prompt millar-web-workflow (lang='en', track='L') to orchestrate Creative Divergence, design, assets, animation, Server-First code, and 5-layer QA.",
  },
  {
    name: "millar-design",
    args: "brief, existingAssets?, lang?",
    vi: "Gọi MCP prompt millar-design (lang='vi') để khóa Style DNA 12 trục và đồng bộ toàn bộ trang phụ theo ảnh/animation trang chủ, tránh giao diện công nghiệp.",
    en: "Invoke MCP prompt millar-design (lang='en') to lock a 12-axis Style DNA Contract and synchronize all secondary pages to existing hero imagery or animations.",
  },
  {
    name: "millar-deep-research",
    args: "topic, existingAssets?, lang?",
    vi: "Gọi MCP prompt millar-deep-research (lang='vi') để giải phẫu Visual/Motion DNA từ ảnh hoặc animation người dùng gửi kèm và tra cứu chuẩn thiết kế quốc tế.",
    en: "Invoke MCP prompt millar-deep-research (lang='en') to extract Visual & Motion DNA from user-supplied assets and benchmark world-class design craft.",
  },
  {
    name: "millar-create-image",
    args: "subject, styleContext?, lang?",
    vi: "Gọi MCP prompt millar-create-image (lang='vi') để tạo bộ hình ảnh đồng bộ 80% Style Prefix cố định cho từng trang hoặc vẽ plate SVG/Canvas chuẩn canvas-design.",
    en: "Invoke MCP prompt millar-create-image (lang='en') to produce style-locked multi-page imagery (80% fixed Style DNA prefix) or code-native SVG/Canvas editorial plates.",
  },
  {
    name: "millar-animation",
    args: "target, motionFeel?, lang?",
    vi: "Gọi MCP prompt millar-animation (lang='vi') để nghiên cứu và biên đạo chuyển động khớp với Hero (spring physics, View Transitions, prefers-reduced-motion).",
    en: "Invoke MCP prompt millar-animation (lang='en') to research and choreograph compositor-safe springs, View Transitions, and static-first reduced-motion fallbacks.",
  },
  {
    name: "millar-build-web",
    args: "scope, minimalChange?, lang?",
    vi: "Gọi MCP prompt millar-build-web (lang='vi') để code trang/component theo chuẩn Deep Modules, Server Components by Default, 5 trạng thái UI và Core Web Vitals.",
    en: "Invoke MCP prompt millar-build-web (lang='en') to implement Server-First components, deep modules, 5 real interactive UI states, and Core Web Vitals / SEO hygiene.",
  },
  {
    name: "millar-verify-web",
    args: "target, lang?",
    vi: "Gọi MCP prompt millar-verify-web (lang='vi') để chạy cổng QA 5 lớp: validate_design, Playwright E2E, chụp 1440/768/375 Light & Dark, axe-core WCAG AA và review 2 trục.",
    en: "Invoke MCP prompt millar-verify-web (lang='en') to execute the 5-layer QA gate: validate_design, Playwright E2E, cross-viewport screenshots, axe-core WCAG AA, and two-axis review.",
  },
  {
    name: "millar-build-marketing",
    args: "feature, lang?",
    vi: "Gọi MCP prompt millar-build-marketing (lang='vi') để dựng trang Marketing Hahlex không cần ảnh bằng 6 Composition Patterns và 14 Visual Assets.",
    en: "Invoke MCP prompt millar-build-marketing (lang='en') to compose a photo-free Hahlex Marketing page using 6 Composition Patterns and 14 code-native Visual Assets.",
  },
  {
    name: "millar-build-product",
    args: "screen, lang?",
    vi: "Gọi MCP prompt millar-build-product (lang='vi') để dựng màn hình Product/App Zero Gradients, chuẩn WCAG 2.1 AA và tối đa 1 nút chính trên PageHeader.",
    en: "Invoke MCP prompt millar-build-product (lang='en') to build a crisp, zero-gradient, WCAG 2.1/2.2 AA Hahlex Product workspace using @hahlex/millar-ui primitives.",
  },
  {
    name: "millar-audit-code",
    args: "register, lang?",
    vi: "Gọi MCP prompt millar-audit-code (lang='vi') để kiểm tra code UI qua validate_design, tách bạch lỗi tự động và tiêu chí thẩm mỹ cần con người duyệt.",
    en: "Invoke MCP prompt millar-audit-code (lang='en') to audit UI code via validate_design, separating deterministic automatedChecks from humanReviewCriteria.",
  },
] as const;

const MCP_TOOLS = [
  { name: "get_design_guidelines", kind: "Guidelines", desc: "Retrieve Shared, Marketing, or Product guidelines, invariants, and Do/Don't." },
  { name: "get_design_tokens", kind: "Tokens", desc: "Query resolved W3C DTCG 2025.10 tokens by category, theme, and register." },
  { name: "search_components", kind: "Product UI", desc: "Compact search across accessible UI primitives with lifecycle status." },
  { name: "get_component", kind: "Product UI", desc: "Full props API, invalid-prop guardrails, ARIA/keyboard contract, and source code." },
  { name: "search_sections", kind: "Marketing", desc: "Find photo-free Marketing sections by narrative goal and composition pattern." },
  { name: "get_section", kind: "Marketing", desc: "Full section anatomy, visual assets used, responsive rules, and React code." },
  { name: "search_templates", kind: "Templates", desc: "Search Marketing Page Templates and Product Application Templates." },
  { name: "get_template", kind: "Templates", desc: "Retrieve complete multi-section template structure and starter code." },
  { name: "get_visual_assets", kind: "Visual System", desc: "Retrieve CSS/SVG/Canvas/React visual assets with gradientPolicy & props." },
  { name: "get_motion_presets", kind: "Motion", desc: "Retrieve Productive & Expressive curves, durations, and reduced-motion fallbacks." },
  { name: "validate_design", kind: "Compliance", desc: "Splits deterministic automatedChecks from advisory humanReviewCriteria." },
  { name: "list_skills", kind: "Agent Skills", desc: "Lists all 7 composable Millar web & design skills (millar-web-workflow through millar-verify-web) and Track S/M/L recipes." },
  { name: "get_skill", kind: "Agent Skills", desc: "Retrieves full SKILL.md instructions and progressive-disclosure reference playbooks for any of the 7 Millar Skills." },
];

const MCP_RESOURCES = [
  { uri: "millar://guidelines/invariants", mime: "text/markdown", purpose: "Hard invariants (typography, gradient boundary, em-dash scope, lifecycle)." },
  { uri: "millar://guidelines/{register}", mime: "text/markdown", purpose: "Canonical rules for shared, marketing, or product registers." },
  { uri: "millar://brand/identity", mime: "application/json", purpose: "Canonical Vector SVG marks + Geist 600 wordmark spec." },
  { uri: "millar://tokens/dtcg", mime: "application/design-tokens+json", purpose: "Raw W3C DTCG 2025.10 token tree." },
  { uri: "millar://tokens/resolved/{theme}", mime: "application/json", purpose: "Resolved light or dark tokens with WCAG contrast checks." },
  { uri: "millar://tokens/resolved/{theme}/{register}", mime: "application/json", purpose: "Resolved tokens scoped by theme and register (shared|product|marketing)." },
  { uri: "millar://registry/index", mime: "application/json", purpose: "Lightweight catalog index of all components, patterns, assets, sections, templates." },
  { uri: "millar://components/{id}", mime: "application/json", purpose: "Individual Product/Shared component contract." },
  { uri: "millar://composition-patterns/{id}", mime: "application/json", purpose: "Individual Marketing Composition Pattern spatial grammar." },
  { uri: "millar://visual-assets/{id}", mime: "application/json", purpose: "Individual code-native Visual Asset spec & gradientPolicy." },
  { uri: "millar://sections/{id}", mime: "application/json", purpose: "Individual Marketing section spec & reduced-motion fallback." },
  { uri: "millar://templates/{id}", mime: "application/json", purpose: "Individual Page or Application Template spec." },
  { uri: "millar://motion-presets/{id}", mime: "application/json", purpose: "Individual Productive or Expressive motion curve." },
  { uri: "millar://skills", mime: "application/json", purpose: "Index of all 7 composable Millar Agent Skills and Track S/M/L combination recipes." },
  { uri: "millar://skills/{name}", mime: "text/markdown", purpose: "Full SKILL.md playbook for any of the 7 Millar skills." },
  { uri: "millar://skills/{name}/references/{ref}", mime: "text/markdown", purpose: "15 progressive-disclosure reference playbooks bundled inside Millar skills." },
  { uri: "millar://glossary", mime: "text/markdown", purpose: "Canonical Millar domain terminology." },
  { uri: "millar://changelog", mime: "text/markdown", purpose: "Millar versioning and release changelog." },
];

export default function McpResourcePage() {
  const { locale, setLocale } = usePortalLocale();
  const [selectedPromptName, setSelectedPromptName] = useState<(typeof MCP_PROMPTS_CATALOG)[number]["name"]>("millar-web-workflow");

  const selectedPrompt = MCP_PROMPTS_CATALOG.find((p) => p.name === selectedPromptName) ?? MCP_PROMPTS_CATALOG[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Resources"
        title="Millar MCP Server & AI Agents"
        description="Served from the exact same compiled SSoT registry as this Portal, with all 7 Millar Agent Skills and 15 playbooks bundled offline. Supports bilingual VI/EN prompts and both stdio and Streamable HTTP transports."
        badges={[
          { label: "MCP 2026-07-28", tone: "neutral" },
          { label: "13 Tools · 7 Skills · 10 VI/EN Prompts", tone: "brand" },
        ]}
        importPath="@hahlex/millar-mcp"
      />

      <SpecimenFrame
        title="Auto-Connect Prompt for AI Agents (Copy & Send)"
        description="Send this prompt directly to Antigravity, Claude Code, Codex, or Cursor so the agent configures Millar MCP and verifies tools automatically without hand-editing JSON."
        toolbar={
          <ChoiceToggle
            label="MCP prompt language"
            value={locale}
            onChange={setLocale}
            options={[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" },
            ]}
          />
        }
        code={MCP_CONNECT_PROMPTS[locale]}
        codeTitle={`Auto-Install & Connect Millar MCP Prompt (${locale.toUpperCase()})`}
        wrapCode
      >
        <Alert
          tone="info"
          title={locale === "vi" ? "Tương thích Antigravity, Claude Code, Codex và Cursor" : "Works across Antigravity, Claude Code, Codex, and Cursor"}
          message={
            locale === "vi"
              ? "Dán prompt này vào khung chat: agent sẽ tự đăng ký @hahlex/millar-mcp, cài 7 skills local (nếu cần) và kiểm tra đủ 13 Tools + 10 Prompts hỗ trợ lang='vi'|'en'."
              : "Paste this prompt into chat; your agent registers @hahlex/millar-mcp, optionally installs the 7 local skills, and confirms all 13 Tools + 10 bilingual VI/EN Prompts."
          }
        />
      </SpecimenFrame>

      {/* Bilingual 10 MCP Prompts Inspector */}
      <SpecimenFrame
        title="10 Bilingual MCP Prompts (Tiếng Việt / English)"
        description="Every Millar MCP Prompt accepts lang: 'vi' | 'en' so agents respond and write deliverables in Vietnamese or English natively."
        toolbar={
          <ChoiceToggle
            label="MCP prompt catalog language"
            value={locale}
            onChange={setLocale}
            options={[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" },
            ]}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MCP_PROMPTS_CATALOG.map((item) => (
              <button
                key={item.name}
                type="button"
                aria-pressed={item.name === selectedPrompt.name}
                onClick={() => setSelectedPromptName(item.name)}
                className="millar-focus"
                style={{
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${item.name === selectedPrompt.name ? "var(--tone-brand-border)" : "var(--border-default)"}`,
                  backgroundColor: item.name === selectedPrompt.name ? "var(--tone-brand-soft)" : "var(--bg-surface)",
                  color: item.name === selectedPrompt.name ? "var(--tone-brand-fg)" : "var(--fg-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-micro)",
                  fontWeight: item.name === selectedPrompt.name ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                {item.name}
              </button>
            ))}
          </div>

          <CodeCopyBox
            title={`${selectedPrompt.name} (${selectedPrompt.args}) · ${locale === "vi" ? "Tiếng Việt" : "English"}`}
            code={selectedPrompt[locale]}
            wrap
          />
        </div>
      </SpecimenFrame>

      <SpecimenFrame
        title="Manual Client Configuration (stdio & Streamable HTTP)"
        description="Or paste this JSON directly into your IDE MCP settings."
        code={JSON.stringify(
          {
            mcpServers: {
              millar: {
                command: "npx",
                args: ["-y", "@hahlex/millar-mcp@draft"],
              },
            },
          },
          null,
          2,
        )}
        codeTitle="mcp-config.json (Claude Code · Cursor · VS Code · Antigravity · Codex)"
      >
        <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.6 }}>
          For local monorepo usage without npm, set <code>command: &quot;node&quot;</code> and <code>args: [&quot;d:/projects/millar/packages/mcp/dist/stdio.js&quot;]</code>. For shared team deployments over HTTP, run <code>PORT=3105 node packages/mcp/dist/http.js</code> and point clients to <code>http://127.0.0.1:3105/mcp</code>.
        </p>
      </SpecimenFrame>

      <DataTable
        caption="13 Read-Only MCP Tools (11 Design System SSoT tools + 2 Millar Agent Skills tools)"
        columns={[
          { key: "name", header: "Tool Name" },
          { key: "kind", header: "Scope" },
          { key: "desc", header: "Capability" },
        ]}
        rows={MCP_TOOLS.map((t) => ({ ...t, id: t.name }))}
        rowKey={(r) => r.id}
      />

      <DataTable
        caption="Canonical MCP Resources (millar:// URI scheme)"
        columns={[
          { key: "uri", header: "Resource URI" },
          { key: "mime", header: "MIME Type" },
          { key: "purpose", header: "Purpose" },
        ]}
        rows={MCP_RESOURCES.map((r) => ({ ...r, id: r.uri }))}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
