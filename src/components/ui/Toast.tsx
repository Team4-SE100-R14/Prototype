import { useCallback, useEffect, useState } from "react"
import NamedIcon from "./NamedIcon"

export type ToastTone = "success" | "error"

export function Toast({
  message,
  tone,
  onClose,
}: {
  message: string
  tone: ToastTone
  onClose: () => void
}) {
  return (
    <div
      className={`animate-fade-in fixed bottom-6 right-6 z-[70] flex max-w-md items-start gap-3 rounded-lg border bg-surface p-4 shadow-clinical-lg ${
        tone === "success" ? "border-sptt-stable-border" : "border-sptt-red-border"
      }`}
      role="status"
    >
      <div
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
          tone === "success"
            ? "bg-sptt-stable-bg text-sptt-stable"
            : "bg-sptt-red-bg text-sptt-red"
        }`}
      >
        {tone === "success" ? (
          <NamedIcon name="check" className="size-4" />
        ) : (
          <NamedIcon name="alert" className="size-4" />
        )}
      </div>
      <div className="flex-1">
        <div
          className={`font-heading text-xs font-bold uppercase tracking-wide ${
            tone === "success" ? "text-sptt-stable" : "text-sptt-red"
          }`}
        >
          {tone === "success" ? "Thành công" : "Không thể thực hiện"}
        </div>
        <div className="mt-1 text-sm leading-5 text-text-secondary">
          {message}
        </div>
      </div>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={onClose}
        className="cursor-pointer rounded-md p-1 text-text-muted transition-colors hover:bg-subsurface hover:text-text-primary"
      >
        <NamedIcon name="close" className="size-4" />
      </button>
    </div>
  )
}

/** Local toast state; render `node` once at the end of the host component. */
export function useToast(timeoutMs = 8000) {
  const [toast, setToast] = useState<{
    message: string
    tone: ToastTone
  } | null>(null)
  const show = useCallback(
    (message: string, tone: ToastTone = "success") =>
      setToast({ message, tone }),
    [],
  )
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), timeoutMs)
    return () => window.clearTimeout(timer)
  }, [toast, timeoutMs])
  const node = toast ? (
    <Toast
      message={toast.message}
      tone={toast.tone}
      onClose={() => setToast(null)}
    />
  ) : null
  return { show, node }
}
