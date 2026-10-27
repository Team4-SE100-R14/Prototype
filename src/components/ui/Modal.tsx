import { useEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"

// Shared shell extracted from the existing account-creation dialog.
export default function Modal({
  children,
  titleId,
  descriptionId,
  onClose,
  dismissible = true,
  backdrop = "default",
}: {
  children: ReactNode
  titleId: string
  descriptionId?: string
  onClose: () => void
  dismissible?: boolean
  backdrop?: "default" | "workstation"
}) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusable = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
        ) || [],
      )
    const initial =
      panel.current?.querySelector<HTMLElement>("[data-initial-focus]") ||
      focusable()[0]
    initial?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) {
        event.preventDefault()
        onClose()
      }
      if (event.key !== "Tab") return
      const items = focusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (!first) {
        event.preventDefault()
        return
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !panel.current?.contains(document.activeElement))
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !panel.current?.contains(document.activeElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose, titleId, dismissible])

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        backdrop === "workstation"
          ? "bg-text-primary/95 backdrop-blur-2xl"
          : "bg-slate-950/40 backdrop-blur-[1px]"
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panel}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-modal="true"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl border border-border-subtle bg-surface shadow-2xl"
        role="dialog"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
