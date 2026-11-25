import React, { useId, useState } from "react";
import clsx from "clsx";
import { IconCheck, IconHelp } from "../icons.js";

export interface HelpTooltipProps {
  hint: string;
  label?: string;
}

/**
 * Click + hover + focus accessible help button (>= 24x24px WCAG 2.5.8 target).
 * Decoupled from <label> so it never pollutes the associated form control's accessible name.
 */
export function HelpTooltip({ hint, label = "More information" }: HelpTooltipProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const panelId = useId();
  const open = hovered || pinned;

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? panelId : undefined}
        onClick={() => setPinned((prev) => !prev)}
        onBlur={() => {
          setPinned(false);
          setHovered(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setPinned(false);
            setHovered(false);
          }
        }}
        className="millar-focus"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          padding: 0,
          borderRadius: "var(--radius-pill, 9999px)",
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-surface-2)",
          color: "var(--fg-subtle)",
          cursor: "pointer",
        }}
      >
        <IconHelp size="sm" />
      </button>
      {open ? (
        <span
          id={panelId}
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "var(--z-popover, 11000)" as unknown as number,
            width: 240,
            padding: "8px 10px",
            borderRadius: "var(--radius-sm, 8px)",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-popover)",
            color: "var(--fg-default)",
            fontSize: "var(--text-meta, 0.8125rem)",
            lineHeight: 1.45,
            fontWeight: 400,
          }}
        >
          {hint}
        </span>
      ) : null}
    </span>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, style, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {label ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <label
            htmlFor={inputId}
            style={{
              fontSize: "var(--text-meta, 0.8125rem)",
              fontWeight: 500,
              color: "var(--fg-muted)",
              letterSpacing: 0,
            }}
          >
            {label}
          </label>
          {hint ? <HelpTooltip hint={hint} label={`Help for ${label}`} /> : null}
        </div>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className={clsx("millar-focus", className)}
        style={{
          width: "100%",
          height: 40,
          padding: "0 12px",
          borderRadius: "var(--radius-control, 10px)",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: hasError ? "var(--status-error)" : "var(--border-default)",
          backgroundColor: "var(--bg-surface)",
          color: "var(--fg-default)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-body-sm, 0.875rem)",
          letterSpacing: 0,
          transition: "border-color var(--motion-productive-fast, 140ms) var(--ease-productive-standard, cubic-bezier(0.2, 0, 0, 1))",
          ...style,
        }}
        {...rest}
      />
      {hasError ? (
        <p
          id={errorId}
          role="alert"
          style={{
            margin: 0,
            fontSize: "var(--text-meta, 0.8125rem)",
            color: "var(--status-error)",
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
});

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, id, rows = 3, className, style, ...rest },
  ref,
) {
  const autoId = useId();
  const areaId = id ?? autoId;
  const errorId = `${areaId}-error`;
  const hasError = Boolean(error);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {label ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <label
            htmlFor={areaId}
            style={{
              fontSize: "var(--text-meta, 0.8125rem)",
              fontWeight: 500,
              color: "var(--fg-muted)",
            }}
          >
            {label}
          </label>
          {hint ? <HelpTooltip hint={hint} label={`Help for ${label}`} /> : null}
        </div>
      ) : null}
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className={clsx("millar-focus", className)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "var(--radius-control, 10px)",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: hasError ? "var(--status-error)" : "var(--border-default)",
          backgroundColor: "var(--bg-surface)",
          color: "var(--fg-default)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-body-sm, 0.875rem)",
          lineHeight: 1.5,
          resize: "vertical",
          ...style,
        }}
        {...rest}
      />
      {hasError ? (
        <p
          id={errorId}
          role="alert"
          style={{
            margin: 0,
            fontSize: "var(--text-meta, 0.8125rem)",
            color: "var(--status-error)",
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
});

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, id, className, style, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;
  const hasError = Boolean(error);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {label ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <label
            htmlFor={selectId}
            style={{ fontSize: "var(--text-meta, 0.8125rem)", fontWeight: 500, color: "var(--fg-muted)" }}
          >
            {label}
          </label>
          {hint ? <HelpTooltip hint={hint} label={`Help for ${label}`} /> : null}
        </div>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className={clsx("millar-focus", className)}
        style={{
          width: "100%",
          height: 40,
          padding: "0 12px",
          borderRadius: "var(--radius-control, 10px)",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: hasError ? "var(--status-error)" : "var(--border-default)",
          backgroundColor: "var(--bg-surface)",
          color: "var(--fg-default)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-body-sm, 0.875rem)",
          ...style,
        }}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasError ? (
        <p id={errorId} role="alert" style={{ margin: 0, fontSize: "var(--text-meta, 0.8125rem)", color: "var(--status-error)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
});

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  const labelId = useId();
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="millar-focus"
        style={{
          position: "relative",
          width: 44,
          height: 24,
          padding: 2,
          borderRadius: "var(--radius-pill, 9999px)",
          border: "1px solid",
          borderColor: checked ? "var(--accent)" : "var(--border-strong)",
          backgroundColor: checked ? "var(--accent)" : "var(--bg-surface-2)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "background-color var(--motion-productive-fast, 140ms) var(--ease-productive-standard, cubic-bezier(0.2, 0, 0, 1))",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "block",
            width: 18,
            height: 18,
            borderRadius: "var(--radius-pill, 9999px)",
            backgroundColor: checked ? "var(--fg-on-accent)" : "var(--fg-muted)",
            transform: checked ? "translateX(20px)" : "translateX(0px)",
            transition: "transform var(--motion-productive-fast, 140ms) var(--ease-productive-standard, cubic-bezier(0.2, 0, 0, 1))",
          }}
        />
      </button>
      <span id={labelId} style={{ fontSize: "var(--text-body-sm, 0.875rem)", color: "var(--fg-default)" }}>
        {label}
      </span>
    </div>
  );
}

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled = false }: CheckboxProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontSize: "var(--text-body-sm, 0.875rem)",
        color: "var(--fg-default)",
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="millar-checkbox-input"
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
      <span
        aria-hidden="true"
        className="millar-checkbox-box"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: 6,
          border: "1px solid",
          borderColor: checked ? "var(--accent)" : "var(--border-strong)",
          backgroundColor: checked ? "var(--accent)" : "var(--bg-surface)",
          color: "var(--fg-on-accent)",
        }}
      >
        {checked ? <IconCheck size="sm" /> : null}
      </span>
      <span>{label}</span>
    </label>
  );
}

export interface ChoiceToggleOption<T extends string> {
  value: T;
  label: string;
}

export interface ChoiceToggleProps<T extends string> {
  label: string;
  value: T;
  onChange: (next: T) => void;
  options: Array<ChoiceToggleOption<T>>;
}

/**
 * High-contrast theme/locale choice row.
 * Explicitly pairs --accent-soft fill with --fg-on-accent-soft (#362218, 7.69:1 AAA)
 * in BOTH light and dark themes, preventing the 1.00:1 invisible dark-mode toggle bug.
 */
export function ChoiceToggle<T extends string>({ label, value, onChange, options }: ChoiceToggleProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: 3,
        borderRadius: "var(--radius-control, 10px)",
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--bg-surface-2)",
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
              height: 30,
              padding: "0 10px",
              borderRadius: 7,
              border: "1px solid",
              borderColor: active ? "var(--accent-soft)" : "transparent",
              backgroundColor: active ? "var(--accent-soft)" : "transparent",
              color: active ? "var(--fg-on-accent-soft)" : "var(--fg-muted)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-meta, 0.8125rem)",
              fontWeight: active ? 600 : 500,
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
