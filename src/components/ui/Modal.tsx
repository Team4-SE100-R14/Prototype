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
  widthClass = "max-w-2xl",
}: {
  children: ReactNode
  titleId: string
  descriptionId?: string
  onClose: () => void
  dismissible?: boolean
  backdrop?: "default" | "workstation"
  widthClass?: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusable = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
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
      className={`fixed inset-0 flex items-center justify-center p-4 ${
        backdrop === "workstation"
          ? "z-[70] bg-slate-950/92 backdrop-blur-xl"
          : "z-[60] bg-slate-900/55 backdrop-blur-[2px]"
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
        className={`animate-fade-in max-h-full w-full ${widthClass} overflow-y-auto rounded-2xl border border-border-subtle bg-surface shadow-clinical-xl`}
        role="dialog"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
