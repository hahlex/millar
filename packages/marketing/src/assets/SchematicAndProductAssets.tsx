import React from "react";
import { Badge, IconCheck } from "@hahlex/millar-ui";

/* ============================================================================
 * 3. Technical Schematic Diagrams (Parametric SVG, Collision-Free, Mobile-Safe)
 * ============================================================================ */

export interface OrbitNode {
  id: string;
  label: string;
}

export interface UnifiedOrbitDiagramProps {
  centerLabel?: string;
  nodes?: OrbitNode[];
  tone?: "light" | "dark";
}

const DEFAULT_ORBIT_NODES: OrbitNode[] = [
  { id: "tokens", label: "DTCG Tokens" },
  { id: "foundations", label: "Foundations" },
  { id: "marketing", label: "Marketing" },
  { id: "product", label: "Product UI" },
  { id: "mcp", label: "AI MCP" },
  { id: "a11y", label: "WCAG AA" },
];

export function UnifiedOrbitDiagram({
  centerLabel = "Millar SSoT",
  nodes = DEFAULT_ORBIT_NODES,
  tone = "light",
}: UnifiedOrbitDiagramProps) {
  const isDark = tone === "dark";
  const bg = isDark ? "var(--bg-stage-dark)" : "var(--bg-editorial)";
  const border = isDark ? "var(--border-stage-dark)" : "var(--border-default)";
  const ringStroke = isDark ? "rgba(214, 180, 138, 0.34)" : "#D6B48A";
  const nodeBg = isDark ? "var(--bg-stage-dark-card)" : "var(--bg-surface)";
  const nodeFg = isDark ? "var(--fg-on-stage-dark)" : "var(--fg-default)";

  const cx = 260;
  const cy = 170;
  const rx = 180;
  const ry = 114;

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg, 16px)",
        border: `1px solid ${border}`,
        backgroundColor: bg,
        padding: 20,
      }}
    >
      <svg
        viewBox="0 0 520 340"
        role="img"
        aria-label={`${centerLabel} connecting ${nodes.map((n) => n.label).join(", ")}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={ringStroke} strokeWidth="1.25" strokeDasharray="4 4" />
        <ellipse cx={cx} cy={cy} rx={rx * 0.62} ry={ry * 0.62} fill="none" stroke={ringStroke} strokeWidth="1" opacity="0.6" />

        {nodes.map((node, idx) => {
          const angle = (idx / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const nx = cx + Math.cos(angle) * rx;
          const ny = cy + Math.sin(angle) * ry;
          return (
            <g key={node.id}>
              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={ringStroke} strokeWidth="1" opacity="0.7" />
              <rect x={nx - 56} y={ny - 16} width="112" height="32" rx="16" fill={nodeBg} stroke={ringStroke} strokeWidth="1" />
              <text
                x={nx}
                y={ny + 4}
                textAnchor="middle"
                fill={nodeFg}
                style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500 }}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        <rect x={cx - 66} y={cy - 22} width="132" height="44" rx="22" fill={isDark ? "#6B4D35" : "#4A3022"} />
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fill="#FFFFFF"
          style={{ fontFamily: "var(--font-display)", fontSize: 13.5, fontWeight: 600 }}
        >
          {centerLabel}
        </text>
      </svg>
    </div>
  );
}

export interface LoopStep {
  id: string;
  label: string;
  detail: string;
}

export interface ClosedLoopSchematicProps {
  steps?: LoopStep[];
  activeStepId?: string;
  onSelectStep?: (id: string) => void;
  tone?: "light" | "dark";
}

const DEFAULT_LOOP_STEPS: LoopStep[] = [
  { id: "author", label: "Author", detail: "Define DTCG 2025.10 tokens and component specs in one source." },
  { id: "compile", label: "Compile", detail: "Generate CSS, Tailwind v4, literal AntD mirrors, and JSON registry." },
  { id: "compose", label: "Compose", detail: "Build Product and Marketing screens from verified primitives." },
  { id: "validate", label: "Validate", detail: "Run automated WCAG, token, and invariant checks via CLI or MCP." },
  { id: "review", label: "Review", detail: "Apply human aesthetic judgment before promoting Draft to Approved." },
  { id: "ship", label: "Ship", detail: "Publish versioned updates with deprecation runways and changelogs." },
];

/**
 * Collision-free N-step schematic: places every node in dedicated non-overlapping cells
 * connected by crisp directional rails, never letting labels overlap SVG curves.
 */
export function ClosedLoopSchematic({
  steps = DEFAULT_LOOP_STEPS,
  activeStepId,
  onSelectStep,
  tone = "dark",
}: ClosedLoopSchematicProps) {
  const isDark = tone === "dark";
  const bg = isDark ? "var(--bg-stage-dark)" : "var(--bg-editorial)";
  const border = isDark ? "var(--border-stage-dark)" : "var(--border-default)";
  const cardBg = isDark ? "var(--bg-stage-dark-card)" : "var(--bg-surface)";
  const fg = isDark ? "var(--fg-on-stage-dark)" : "var(--fg-default)";
  const muted = isDark ? "var(--fg-muted-on-stage-dark)" : "var(--fg-muted)";
  const accent = isDark ? "var(--fg-accent-on-stage-dark)" : "var(--fg-accent)";

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg, 16px)",
        border: `1px solid ${border}`,
        backgroundColor: bg,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
          gap: 12,
        }}
      >
        {steps.map((step, idx) => {
          const isActive = activeStepId ? activeStepId === step.id : idx === 0;
          const Tag = onSelectStep ? "button" : "div";
          return (
            <li key={step.id} style={{ display: "flex" }}>
              <Tag
                type={onSelectStep ? "button" : undefined}
                onClick={onSelectStep ? () => onSelectStep(step.id) : undefined}
                aria-pressed={onSelectStep ? isActive : undefined}
                className={onSelectStep ? "millar-focus" : undefined}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md, 12px)",
                  border: `1px solid ${isActive ? accent : border}`,
                  backgroundColor: cardBg,
                  color: fg,
                  cursor: onSelectStep ? "pointer" : "default",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: accent }}>
                    Step {idx + 1} / {steps.length}
                  </span>
                  <span aria-hidden="true" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: muted }}>
                    {idx === steps.length - 1 ? "loop" : "->"}
                  </span>
                </div>
                <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-card-title, 1rem)", fontWeight: 600 }}>
                  {step.label}
                </strong>
                <span style={{ fontSize: "var(--text-meta, 0.8125rem)", color: muted, lineHeight: 1.45 }}>{step.detail}</span>
              </Tag>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export interface LayerItem {
  name: string;
  scope: string;
  outputs: string;
}

export interface LayerStackDiagramProps {
  layers?: LayerItem[];
}

const DEFAULT_LAYERS: LayerItem[] = [
  { name: "Tier 3: Product & Marketing Registers", scope: "UI Primitives, 6 Composition Patterns, Sections, Templates", outputs: "@hahlex/millar-ui · @hahlex/millar-marketing" },
  { name: "Tier 2: Distribution & Agent Adapters", scope: "Portal UI, MCP Server (Resources + 11 Tools + 3 Prompts), Validator", outputs: "hahlex.com/millar · @hahlex/millar-mcp" },
  { name: "Tier 1: Shared Foundations SSoT", scope: "W3C DTCG 2025.10 OKLCH Tokens, Vector Brand Marks, Geist/Inter/Mono", outputs: "@hahlex/millar-tokens · @hahlex/millar-core" },
];

export function LayerStackDiagram({ layers = DEFAULT_LAYERS }: LayerStackDiagramProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {layers.map((layer, idx) => (
        <div
          key={layer.name}
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-md, 12px)",
            border: `1px solid ${idx === layers.length - 1 ? "var(--tone-brand-border)" : "var(--border-default)"}`,
            backgroundColor: idx === layers.length - 1 ? "var(--tone-brand-soft)" : "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-card-title, 1rem)", fontWeight: 600, color: "var(--fg-default)" }}>
              {layer.name}
            </strong>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-accent)" }}>
              {layer.outputs}
            </code>
          </div>
          <span style={{ fontSize: "var(--text-body-sm, 0.875rem)", color: "var(--fg-muted)" }}>{layer.scope}</span>
        </div>
      ))}
    </div>
  );
}

export interface LedgerRow {
  criterion: string;
  before: string;
  after: string;
}

export interface BeforeAfterLedgerProps {
  beforeHeading?: string;
  afterHeading?: string;
  rows: LedgerRow[];
}

export function BeforeAfterLedger({
  beforeHeading = "Unstructured default",
  afterHeading = "With Millar SSoT",
  rows,
}: BeforeAfterLedgerProps) {
  return (
    <div style={{ borderRadius: "var(--radius-lg, 16px)", border: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)", overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(120px, 0.8fr) 1fr 1fr",
          gap: 12,
          padding: "12px 16px",
          backgroundColor: "var(--bg-surface-2)",
          borderBottom: "1px solid var(--border-default)",
          fontSize: "var(--text-meta, 0.8125rem)",
          fontWeight: 600,
        }}
      >
        <span style={{ color: "var(--fg-muted)" }}>Dimension</span>
        <span style={{ color: "var(--status-error)" }}>{beforeHeading}</span>
        <span style={{ color: "var(--status-success)" }}>{afterHeading}</span>
      </div>
      {rows.map((row, idx) => (
        <div
          key={row.criterion}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(120px, 0.8fr) 1fr 1fr",
            gap: 12,
            padding: "12px 16px",
            borderBottom: idx === rows.length - 1 ? "none" : "1px solid var(--border-soft)",
            fontSize: "var(--text-body-sm, 0.875rem)",
          }}
        >
          <strong style={{ fontWeight: 600, color: "var(--fg-default)" }}>{row.criterion}</strong>
          <span style={{ color: "var(--fg-muted)" }}>{row.before}</span>
          <span style={{ color: "var(--fg-default)" }}>{row.after}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
 * 4. Stylized Product Visualization Frames (Static-First Real Chrome)
 * ============================================================================ */

export interface ProductWindowFrameProps {
  title: string;
  badge?: string;
  tone?: "light" | "dark";
  children: React.ReactNode;
}

export function ProductWindowFrame({ title, badge, tone = "light", children }: ProductWindowFrameProps) {
  const isDark = tone === "dark";
  return (
    <div
      style={{
        borderRadius: "var(--radius-lg, 16px)",
        border: `1px solid ${isDark ? "var(--border-stage-dark)" : "var(--border-default)"}`,
        backgroundColor: isDark ? "var(--bg-stage-dark-card)" : "var(--bg-surface)",
        color: isDark ? "var(--fg-on-stage-dark)" : "var(--fg-default)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 16px",
          borderBottom: `1px solid ${isDark ? "var(--border-stage-dark)" : "var(--border-soft)"}`,
          backgroundColor: isDark ? "var(--bg-stage-dark)" : "var(--bg-surface-2)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden="true" style={{ display: "inline-flex", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: isDark ? "#3E3128" : "#D6B48A" }} />
            <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: isDark ? "#543A28" : "#E4CBAF" }} />
            <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: isDark ? "#6B4D35" : "#EBE3D7" }} />
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: isDark ? "var(--fg-muted-on-stage-dark)" : "var(--fg-muted)" }}>
            {title}
          </span>
        </div>
        {badge ? <Badge tone="brand">{badge}</Badge> : null}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

export interface DataTableSpecimenRow {
  id: string;
  name: string;
  register: string;
  status: "Approved" | "Draft";
  contrast: string;
}

export function DataTableSpecimenFrame({ rows }: { rows?: DataTableSpecimenRow[] }) {
  const data = rows ?? [
    { id: "1", name: "--accent / --fg-on-accent", register: "Shared", status: "Approved", contrast: "12.09:1" },
    { id: "2", name: "--fg-on-accent-soft", register: "Product", status: "Approved", contrast: "7.69:1" },
    { id: "3", name: "--accent-editorial", register: "Marketing", status: "Draft", contrast: "7.17:1" },
  ];

  return (
    <ProductWindowFrame title="millar / token-audit" badge="80 / 80 AA">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((row) => (
          <div
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.6fr) auto auto",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: "var(--radius-sm, 8px)",
              backgroundColor: "var(--bg-surface-2)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-default)" }}>
              {row.name}
            </code>
            <Badge tone={row.status === "Approved" ? "success" : "brand"}>{row.status}</Badge>
            <span className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", fontWeight: 600, color: "var(--fg-accent)" }}>
              {row.contrast}
            </span>
          </div>
        ))}
      </div>
    </ProductWindowFrame>
  );
}

export function AssistantThreadPreview({
  prompt = "Build a photo-free launch section for Hahlex Analytics.",
  reply = "Selected Spatial Product Stage + WarmHorizonWash (approved visual asset) + DataTableSpecimenFrame. Automated validator passed 11/11 checks.",
}: {
  prompt?: string;
  reply?: string;
}) {
  return (
    <ProductWindowFrame title="millar-mcp / validate_design" badge="Live Spec">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            alignSelf: "flex-end",
            maxWidth: "85%",
            padding: "10px 14px",
            borderRadius: "var(--radius-lg, 16px)",
            backgroundColor: "var(--tone-brand-soft)",
            border: "1px solid var(--tone-brand-border)",
            color: "var(--fg-default)",
            fontSize: "var(--text-body-sm, 0.875rem)",
          }}
        >
          {prompt}
        </div>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-md, 12px)",
            backgroundColor: "var(--bg-surface-2)",
            border: "1px solid var(--border-default)",
            color: "var(--fg-default)",
            fontSize: "var(--text-body-sm, 0.875rem)",
            lineHeight: 1.6,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span>{reply}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-micro, 0.75rem)", color: "var(--status-success)", fontWeight: 500 }}>
            <IconCheck size="sm" />
            <span>0 automated violations · 4 human aesthetic review criteria attached</span>
          </span>
        </div>
      </div>
    </ProductWindowFrame>
  );
}

export interface MetricPlateCardProps {
  value: string;
  label: string;
  detail?: string;
  tone?: "brand" | "espresso" | "error";
}

export function MetricPlateCard({ value, label, detail, tone = "brand" }: MetricPlateCardProps) {
  const isDark = tone === "espresso";
  const isError = tone === "error";
  return (
    <div
      style={{
        padding: "20px 22px",
        borderRadius: "var(--radius-lg, 16px)",
        border: `1px solid ${isDark ? "var(--border-stage-dark)" : isError ? "var(--status-error-border)" : "var(--border-default)"}`,
        backgroundColor: isDark ? "var(--bg-stage-dark)" : isError ? "var(--status-error-soft)" : "var(--bg-editorial-card)",
        color: isDark ? "var(--fg-on-stage-dark)" : "var(--fg-default)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
          fontWeight: 300,
          lineHeight: 1.1,
          letterSpacing: "var(--tracking-display, -0.02em)",
          color: isError ? "var(--status-error)" : isDark ? "var(--fg-accent-on-stage-dark)" : "var(--fg-accent)",
        }}
      >
        {value}
      </span>
      <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-card-title, 1rem)", fontWeight: 600 }}>{label}</strong>
      {detail ? (
        <span style={{ fontSize: "var(--text-meta, 0.8125rem)", color: isDark ? "var(--fg-muted-on-stage-dark)" : "var(--fg-muted)" }}>{detail}</span>
      ) : null}
    </div>
  );
}
