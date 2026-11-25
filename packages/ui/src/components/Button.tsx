import React, { useCallback, useState } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "white" | "ghost" | "danger" | "success" | "row";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--accent)",
    color: "var(--fg-on-accent)",
    borderColor: "var(--accent)",
    fontWeight: 500,
  },
  secondary: {
    backgroundColor: "var(--bg-elevated-hover)",
    color: "var(--fg-default)",
    borderColor: "var(--border-default)",
    fontWeight: 500,
  },
  white: {
    backgroundColor: "var(--bg-surface)",
    color: "var(--fg-default)",
    borderColor: "var(--border-default)",
    fontWeight: 500,
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--fg-muted)",
    borderColor: "transparent",
    fontWeight: 500,
  },
  danger: {
    // Outlined AA in both light (6.96:1) and dark (6.97:1) themes; never solid crimson with white in dark mode
    backgroundColor: "var(--bg-surface)",
    color: "var(--status-error)",
    borderColor: "var(--status-error)",
    fontWeight: 500,
  },
  success: {
    backgroundColor: "var(--status-success-solid)",
    color: "var(--status-success-on-solid)",
    borderColor: "var(--status-success-solid)",
    fontWeight: 500,
  },
  row: {
    backgroundColor: "transparent",
    color: "var(--fg-default)",
    borderColor: "transparent",
    fontWeight: 400,
    justifyContent: "flex-start",
  },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: 32, padding: "0 10px", fontSize: "var(--text-meta, 0.8125rem)", borderRadius: "var(--radius-sm, 8px)" },
  md: { height: 40, padding: "0 14px", fontSize: "var(--text-body-sm, 0.875rem)", borderRadius: "var(--radius-control, 10px)" },
  lg: { height: 44, padding: "0 18px", fontSize: "var(--text-body, 0.9375rem)", borderRadius: "var(--radius-control, 10px)" },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "white",
    size = "md",
    pill = false,
    iconOnly = false,
    loading = false,
    disabled = false,
    icon,
    type = "button",
    onClick,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const [pending, setPending] = useState(false);
  const isBusy = loading || pending;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isBusy || !onClick) return;
      const result = onClick(e);
      if (result && typeof (result as Promise<unknown>).then === "function") {
        setPending(true);
        (result as Promise<unknown>).finally(() => setPending(false));
      }
    },
    [disabled, isBusy, onClick],
  );

  const sizeStyle = SIZE_STYLES[size];
  const iconOnlyStyle: React.CSSProperties = iconOnly
    ? {
        width: Math.max(32, Number(sizeStyle.height)),
        padding: 0,
      }
    : {};

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-busy={isBusy || undefined}
      aria-disabled={disabled || isBusy || undefined}
      onClick={handleClick}
      className={clsx("millar-focus", className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "var(--font-sans)",
        lineHeight: 1.4,
        letterSpacing: 0,
        borderWidth: 1,
        borderStyle: "solid",
        boxShadow: "none",
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : isBusy ? "wait" : "pointer",
        opacity: disabled ? 0.48 : 1,
        transition:
          "background-color var(--motion-productive-fast, 140ms) var(--ease-productive-standard, cubic-bezier(0.2, 0, 0, 1)), border-color var(--motion-productive-fast, 140ms) var(--ease-productive-standard, cubic-bezier(0.2, 0, 0, 1)), color var(--motion-productive-fast, 140ms) var(--ease-productive-standard, cubic-bezier(0.2, 0, 0, 1))",
        ...VARIANT_STYLES[variant],
        ...sizeStyle,
        ...iconOnlyStyle,
        ...(pill ? { borderRadius: "var(--radius-pill, 9999px)" } : {}),
        ...style,
      }}
      {...rest}
    >
      {isBusy ? (
        <span
          aria-hidden="true"
          style={{
            width: 14,
            height: 14,
            borderRadius: 9999,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            display: "inline-block",
          }}
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
});
