import { useState, useRef, type ReactNode } from "react"

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: "top" | "bottom" | "left" | "right"
  className?: string
  delayMs?: number
  maxWidth?: string
}

export default function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  delayMs = 120,
  maxWidth = "max-w-xs",
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | null>(null)

  const show = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVisible(true), delayMs)
  }

  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setVisible(false)
  }

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent",
  }

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`pointer-events-none absolute z-[60] ${positionClasses[position]} ${maxWidth} animate-fade-in w-max rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-relaxed text-slate-100 shadow-clinical-lg transition-all`}
        >
          <div className="relative z-10">{content}</div>
          <span
            className={`absolute h-0 w-0 border-4 ${arrowClasses[position]}`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}

