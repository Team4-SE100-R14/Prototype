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
      className={`fixed bottom-6 right-6 z-[70] flex max-w-md items-start gap-3 rounded-xl border bg-surface p-4 shadow-2xl ${
        tone === "success" ? "border-normal/30" : "border-critical-border"
      }`}
      role="status"
    >
      <div
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
          tone === "success"
            ? "bg-normal-bg text-normal"
            : "bg-critical-bg text-critical"
        }`}
      >
        {tone === "success" ? (
          <span className="text-sm font-black">✓</span>
        ) : (
          <NamedIcon name="alert" className="size-4" />
        )}
      </div>
      <div className="flex-1">
        <div
          className={`text-xs font-bold uppercase tracking-wide ${
            tone === "success" ? "text-normal" : "text-critical"
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
        className="rounded-md p-1 text-text-muted hover:bg-subsurface"
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
