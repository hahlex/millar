import React, { useEffect, useId, useRef } from "react";
import { IconBox, IconClose, IconError, IconInfo, IconRefresh, IconSuccess, IconWarning } from "../icons.js";
import { Button } from "./Button.js";

/* --- Dialog (Escape close, focus management, dirty-form backdrop lock, accessible modal) --- */

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  dirty?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, dirty = false, footer, children }: DialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !dirty) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--z-modal-backdrop, 9000)" as unknown as number,
        backgroundColor: "rgba(43, 31, 22, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="millar-focus"
        style={{
          position: "relative",
          zIndex: "var(--z-dialog, 10001)" as unknown as number,
          width: "100%",
          maxWidth: 520,
          maxHeight: "85dvh",
          overflowY: "auto",
          borderRadius: "var(--radius-lg, 16px)",
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-popover)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-section-title, 1.125rem)",
              fontWeight: 600,
              color: "var(--fg-default)",
            }}
          >
            {title}
          </h2>
          <Button variant="ghost" size="sm" iconOnly aria-label="Close dialog" onClick={onClose} icon={<IconClose size="md" />} />
        </div>
        <div>{children}</div>
        {footer ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border-soft)" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* --- ConfirmDialog (Mandatory confirmation for destructive actions) --- */

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<unknown>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="white" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: "var(--text-body-sm, 0.875rem)", color: "var(--fg-muted)", lineHeight: 1.55 }}>
        {message}
      </p>
    </Dialog>
  );
}

/* --- Alert (Semantic feedback; never color alone, pairs icon + bordered soft wash + live role) --- */

export type AlertTone = "info" | "success" | "warning" | "error";

const ALERT_MAP: Record<AlertTone, { bg: string; border: string; fg: string; icon: React.ReactNode; role: "status" | "alert" }> = {
  info: { bg: "var(--tone-brand-soft)", border: "var(--tone-brand-border)", fg: "var(--tone-brand-fg)", icon: <IconInfo size="md" />, role: "status" },
  success: { bg: "var(--status-success-soft)", border: "var(--status-success-border)", fg: "var(--status-success)", icon: <IconSuccess size="md" />, role: "status" },
  warning: { bg: "var(--status-warning-soft)", border: "var(--status-warning-border)", fg: "var(--status-warning)", icon: <IconWarning size="md" />, role: "status" },
  error: { bg: "var(--status-error-soft)", border: "var(--status-error-border)", fg: "var(--status-error)", icon: <IconError size="md" />, role: "alert" },
};

export interface AlertProps {
  tone?: AlertTone;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function Alert({ tone = "info", title, message, action }: AlertProps) {
  const cfg = ALERT_MAP[tone];
  return (
    <div
      role={cfg.role}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 14px",
        borderRadius: "var(--radius-md, 12px)",
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.fg,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ display: "inline-flex", marginTop: 2, flexShrink: 0 }}>{cfg.icon}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <strong style={{ fontSize: "var(--text-body-sm, 0.875rem)", fontWeight: 600 }}>{title}</strong>
          {message ? <span style={{ fontSize: "var(--text-meta, 0.8125rem)", color: "var(--fg-default)" }}>{message}</span> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

/* --- Skeleton (Strictly solid fill, zero CSS gradients per ADR-0002) --- */

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: "sm" | "md" | "lg" | "pill";
}

export function Skeleton({ width = "100%", height = 16, radius = "sm" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: `var(--radius-${radius}, 8px)`,
        backgroundColor: "var(--bg-surface-2)",
        border: "1px solid var(--border-soft)",
      }}
    />
  );
}

/* --- EmptyState & LoadFailed --- */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 12,
        padding: "32px 24px",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      {icon ? <IconBox tone="brand" size="lg">{icon}</IconBox> : null}
      <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-card-title, 1rem)", fontWeight: 600, color: "var(--fg-default)" }}>
        {title}
      </h3>
      {description ? (
        <p style={{ margin: 0, maxWidth: 420, fontSize: "var(--text-body-sm, 0.875rem)", color: "var(--fg-muted)" }}>{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export interface LoadFailedProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function LoadFailed({
  title = "Unable to load data",
  message = "Check your connection and try again.",
  onRetry,
}: LoadFailedProps) {
  return (
    <Alert
      tone="error"
      title={title}
      message={message}
      action={
        onRetry ? (
          <Button variant="white" size="sm" onClick={onRetry} icon={<IconRefresh size="sm" />}>
            Retry
          </Button>
        ) : undefined
      }
    />
  );
}
