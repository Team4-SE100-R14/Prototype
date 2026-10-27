import type { ReactNode } from "react"
import Icon from "./Icon"

export function SecurityDialogHeader({
  title,
  titleId,
  onClose,
}: {
  title: string
  titleId: string
  onClose: () => void
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border-subtle px-6 py-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-deep">
        <Icon className="h-6 w-6">
          <path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3z" />
          <path d="M9.5 12l1.5 1.5 3.5-4" />
        </Icon>
      </div>
      <h2
        id={titleId}
        className="min-w-0 flex-1 pt-1 font-display text-lg font-semibold text-text-primary"
      >
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng hộp thoại"
        className="rounded-md p-1.5 text-text-muted hover:bg-subsurface"
      >
        <Icon className="h-4 w-4">
          <path d="M6 6l12 12M18 6L6 18" />
        </Icon>
      </button>
    </div>
  )
}

const tones = {
  info: "border-info/20 bg-info-bg text-info",
  warning: "border-warning/30 bg-warning-bg text-warning",
  danger: "border-critical-border bg-critical-bg text-critical",
}

export function SecurityAlert({
  children,
  tone = "info",
  id,
}: {
  children: ReactNode
  tone?: keyof typeof tones
  id?: string
}) {
  return (
    <div
      id={id}
      role={tone === "danger" ? "alert" : undefined}
      className={`flex items-start gap-3 rounded-lg border p-4 text-sm leading-relaxed ${tones[tone]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4m0 4h.01" />
      </Icon>
      <div>{children}</div>
    </div>
  )
}
