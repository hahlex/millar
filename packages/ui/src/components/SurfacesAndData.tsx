import React, { useId, useRef } from "react";
import clsx from "clsx";
import { IconBox, IconClose, IconSearch, type MillarIconBoxTone } from "../icons.js";

/* --- Card (Single-elevation discipline: 1px border OR lifted shadow, never noisy ghost cards) --- */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: "base" | "inset" | "raised";
  padding?: "default" | "compact" | "none";
}

export function Card({ surface = "base", padding = "default", className, style, children, ...rest }: CardProps) {
  const pad =
    padding === "none" ? 0 : padding === "compact" ? "12px 14px" : "var(--card-padding-block, 16px) var(--card-padding-inline, 18px)";
  const surfaceStyle: React.CSSProperties =
    surface === "inset"
      ? { backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-default)", boxShadow: "none" }
      : surface === "raised"
        ? { backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-soft)", boxShadow: "var(--shadow-card)" }
        : { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", boxShadow: "none" };

  return (
    <div
      className={className}
      style={{
        borderRadius: "var(--radius-lg, 16px)",
        padding: pad,
        display: "flex",
        flexDirection: "column",
        gap: "var(--card-gap, 14px)",
        ...surfaceStyle,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* --- Badge (Zero plain-text tags; border + soft wash + dot/icon so color is never sole signal) --- */

export type BadgeTone = "neutral" | "brand" | "sand" | "sage" | "success" | "warning" | "error";

const BADGE_STYLES: Record<BadgeTone, React.CSSProperties> = {
  neutral: { backgroundColor: "var(--bg-surface-2)", borderColor: "var(--border-default)", color: "var(--fg-muted)" },
  brand: { backgroundColor: "var(--tone-brand-soft)", borderColor: "var(--tone-brand-border)", color: "var(--tone-brand-fg)" },
  sand: { backgroundColor: "var(--tone-sand-soft)", borderColor: "var(--tone-sand-border)", color: "var(--tone-sand-fg)" },
  sage: { backgroundColor: "var(--tone-sage-soft)", borderColor: "var(--tone-sage-border)", color: "var(--tone-sage-fg)" },
  success: { backgroundColor: "var(--status-success-soft)", borderColor: "var(--status-success-border)", color: "var(--status-success)" },
  warning: { backgroundColor: "var(--status-warning-soft)", borderColor: "var(--status-warning-border)", color: "var(--status-warning)" },
  error: { backgroundColor: "var(--status-error-soft)", borderColor: "var(--status-error-border)", color: "var(--status-error)" },
};

export interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", dot = true, icon, children, className }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: "var(--radius-pill, 9999px)",
        borderWidth: 1,
        borderStyle: "solid",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-meta, 0.8125rem)",
        fontWeight: 500,
        lineHeight: 1.38,
        whiteSpace: "nowrap",
        ...BADGE_STYLES[tone],
      }}
    >
      {icon ?? (dot ? <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "currentColor", flexShrink: 0 }} /> : null)}
      {children}
    </span>
  );
}

/* --- Stat KPI Tile (Full-box color mixing + --text-kpi tabular-nums; zero one-sided accent bar) --- */

export interface StatProps {
  label: string;
  value: string | number;
  delta?: string;
  tone?: MillarIconBoxTone;
  icon?: React.ReactNode;
  progressPercent?: number;
}

export function Stat({ label, value, delta, tone = "brand", icon, progressPercent }: StatProps) {
  return (
    <Card surface="base" padding="default">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: "var(--text-meta, 0.8125rem)", fontWeight: 500, color: "var(--fg-muted)" }}>{label}</span>
          <span
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-kpi, 1.5rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "var(--tracking-tight, -0.015em)",
              color: "var(--fg-default)",
            }}
          >
            {value}
          </span>
          {delta ? (
            <span style={{ fontSize: "var(--text-meta, 0.8125rem)", color: "var(--fg-subtle)" }}>{delta}</span>
          ) : null}
        </div>
        {icon ? (
          <IconBox tone={tone} size="md">
            {icon}
          </IconBox>
        ) : null}
      </div>
      {typeof progressPercent === "number" ? (
        <div
          role="progressbar"
          aria-valuenow={Math.max(0, Math.min(100, progressPercent))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          style={{
            height: 6,
            borderRadius: "var(--radius-pill, 9999px)",
            backgroundColor: "var(--bg-surface-2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, progressPercent))}%`,
              height: "100%",
              borderRadius: "var(--radius-pill, 9999px)",
              backgroundColor: tone === "sand" ? "var(--chart-neutral)" : "var(--chart-brand)",
            }}
          />
        </div>
      ) : null}
    </Card>
  );
}

/* --- Tabs (Full APG ArrowLeft/ArrowRight/Home/End keyboard contract) --- */

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}

export function Tabs({ items, activeId, onChange, ariaLabel }: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = items.length - 1;
    else return;
    e.preventDefault();
    const target = items[nextIndex];
    if (target) {
      onChange(target.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const activeItem = items.find((i) => i.id === activeId) ?? items[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          borderBottom: "1px solid var(--border-default)",
          flexWrap: "wrap",
        }}
      >
        {items.map((item, idx) => {
          const selected = item.id === activeItem?.id;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              id={`${baseId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="millar-focus"
              style={{
                padding: "10px 14px",
                marginBottom: -1,
                background: "transparent",
                border: "none",
                borderBottom: selected ? "2px solid var(--fg-accent)" : "2px solid transparent",
                color: selected ? "var(--fg-default)" : "var(--fg-muted)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-body-sm, 0.875rem)",
                fontWeight: selected ? 600 : 500,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {activeItem ? (
        <div
          id={`${baseId}-panel-${activeItem.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeItem.id}`}
          tabIndex={0}
          className="millar-focus"
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}

/* --- Segmented Control --- */

export interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: 3,
        gap: 2,
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-control, 10px)",
        backgroundColor: "transparent",
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className="millar-focus"
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              border: "1px solid",
              borderColor: active ? "var(--fg-accent)" : "transparent",
              backgroundColor: active ? "var(--tone-brand-soft)" : "transparent",
              color: active ? "var(--fg-default)" : "var(--fg-muted)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-meta, 0.8125rem)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* --- DataTable (Zero-scrollbar rule, '-' empty cell, mobileCard support) --- */

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  numeric?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  emptyLabel?: string;
  mobileCard?: (row: T) => React.ReactNode;
  forceMobileCards?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  caption,
  emptyLabel = "No records found.",
  mobileCard,
  forceMobileCards = false,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <Card surface="inset" padding="default">
        <p style={{ margin: 0, fontSize: "var(--text-body-sm, 0.875rem)", color: "var(--fg-muted)", textAlign: "center" }}>
          {emptyLabel}
        </p>
      </Card>
    );
  }

  if (forceMobileCards && mobileCard) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--row-gap, 10px)" }}>
        {rows.map((row) => (
          <Card key={rowKey(row)} surface="base" padding="compact">
            {mobileCard(row)}
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--bg-surface)",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        {caption ? (
          <caption
            style={{
              textAlign: "left",
              padding: "10px 14px",
              fontSize: "var(--text-meta, 0.8125rem)",
              color: "var(--fg-subtle)",
              borderBottom: "1px solid var(--border-soft)",
            }}
          >
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr style={{ backgroundColor: "var(--bg-surface-2)", borderBottom: "1px solid var(--border-default)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{
                  padding: "var(--row-padding-block, 11px) var(--row-padding-inline, 14px)",
                  textAlign: col.align ?? "left",
                  fontSize: "var(--text-meta, 0.8125rem)",
                  fontWeight: 600,
                  color: "var(--fg-muted)",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr
              key={rowKey(row)}
              style={{
                borderBottom: rIdx === rows.length - 1 ? "none" : "1px solid var(--border-soft)",
              }}
            >
              {columns.map((col) => {
                const rawVal = row[col.key];
                const rendered = col.render ? col.render(row) : rawVal === null || rawVal === undefined || rawVal === "" ? "-" : String(rawVal);
                return (
                  <td
                    key={col.key}
                    className={clsx(col.numeric && "tabular-nums")}
                    style={{
                      padding: "var(--row-padding-block, 11px) var(--row-padding-inline, 14px)",
                      textAlign: col.align ?? "left",
                      fontSize: "var(--text-body-sm, 0.875rem)",
                      color: "var(--fg-default)",
                      wordBreak: "break-word",
                    }}
                  >
                    {rendered}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --- FilterBar --- */

export interface ActiveFilterPill {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  activePills?: ActiveFilterPill[];
  onClearAll?: () => void;
  extra?: React.ReactNode;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  activePills = [],
  onClearAll,
  extra,
}: FilterBarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 280px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
            <span
              aria-hidden="true"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-subtle)", display: "inline-flex" }}
            >
              <IconSearch size="md" />
            </span>
            <input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="millar-focus"
              style={{
                width: "100%",
                height: 40,
                padding: "0 12px 0 36px",
                borderRadius: "var(--radius-control, 10px)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--fg-default)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-body-sm, 0.875rem)",
              }}
            />
          </div>
          {filters}
        </div>
        {extra}
      </div>
      {activePills.length > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {activePills.map((pill) => (
            <span
              key={pill.key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 8px 3px 10px",
                borderRadius: "var(--radius-pill, 9999px)",
                border: "1px solid var(--tone-brand-border)",
                backgroundColor: "var(--tone-brand-soft)",
                color: "var(--tone-brand-fg)",
                fontSize: "var(--text-meta, 0.8125rem)",
                fontWeight: 500,
              }}
            >
              {pill.label}
              <button
                type="button"
                aria-label={`Remove filter ${pill.label}`}
                onClick={pill.onRemove}
                className="millar-focus"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  padding: 0,
                  border: "none",
                  borderRadius: 9999,
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <IconClose size="sm" />
              </button>
            </span>
          ))}
          {onClearAll ? (
            <button
              type="button"
              onClick={onClearAll}
              className="millar-focus"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--fg-accent)",
                fontSize: "var(--text-meta, 0.8125rem)",
                fontWeight: 500,
                cursor: "pointer",
                padding: "4px 6px",
              }}
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
