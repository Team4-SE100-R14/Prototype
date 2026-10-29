import type { ReactNode } from "react"
import Modal from "../ui/Modal"
import NamedIcon from "../ui/NamedIcon"

export default function DialogShell({
  id,
  title,
  eyebrow,
  onClose,
  children,
  footer,
  wide = false,
}: {
  id: string
  title: string
  eyebrow: string
  onClose: () => void
  children: ReactNode
  footer: ReactNode
  wide?: boolean
}) {
  return (
    <Modal
      titleId={`${id}-title`}
      onClose={onClose}
      widthClass={wide ? "max-w-3xl" : "max-w-xl"}
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-deep">
            {eyebrow}
          </div>
          <h2
            id={`${id}-title`}
            className="text-xl font-extrabold text-text-primary"
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="rounded-lg p-2 text-text-muted hover:bg-subsurface hover:text-text-primary"
        >
          <NamedIcon name="close" />
        </button>
      </div>
      <div className="p-6">{children}</div>
      <div className="flex justify-end gap-3 border-t border-border-subtle bg-canvas px-6 py-4">
        {footer}
      </div>
    </Modal>
  )
}

export function ErrorBanner({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-xl border border-critical-border bg-critical-bg p-4 text-sm leading-6 text-critical"
    >
      <NamedIcon name="alert" className="mt-0.5 size-5 shrink-0" />
      <div>
        <strong className="block">{title}</strong>
        {children}
      </div>
    </div>
  )
}
