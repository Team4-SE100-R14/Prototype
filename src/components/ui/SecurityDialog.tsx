import type { ReactNode } from "react"
import { AlertCircle, ShieldCheck, X } from "lucide-react"

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
        <ShieldCheck aria-hidden="true" strokeWidth={1.75} className="h-6 w-6" />
      </div>
      <h2
        id={titleId}
        className="min-w-0 flex-1 pt-1 font-heading text-lg font-semibold text-text-primary"
      >
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng hộp thoại"
        className="cursor-pointer rounded-md p-1.5 text-text-muted transition-colors hover:bg-subsurface hover:text-text-primary"
      >
        <X aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
      </button>
    </div>
  )
}

const tones = {
  info: "border-cpoe-minor-border/40 bg-cpoe-minor-bg text-cpoe-minor",
  warning: "border-sptt-yellow-border/50 bg-sptt-yellow-bg text-sptt-yellow",
  danger: "border-cpoe-block-border bg-cpoe-block-bg text-cpoe-block",
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
      <AlertCircle aria-hidden="true" strokeWidth={1.75} className="mt-0.5 h-5 w-5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
