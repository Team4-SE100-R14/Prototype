import { useEffect, useState } from "react"
import type { AuthUser } from "../../App"
import {
  INTAKE_EVENT,
  INTAKE_STORAGE_KEY,
  destinationLabel,
  readIntakeQueue,
  type IntakeEncounter,
} from "../../lib/intakeQueue"
import { AlertTriangle, X } from "lucide-react"

interface Arrival {
  encounter: IntakeEncounter
  latencyMs: number
}

// Simulates the SSE arrival notification (<= 1.0 s) shown on emergency consoles.
export default function EmergencyArrivalBanner({ user }: { user: AuthUser }) {
  const [arrivals, setArrivals] = useState<Arrival[]>([])

  useEffect(() => {
    const push = (encounter: IntakeEncounter | undefined) => {
      if (!encounter || encounter.acuity !== "EMERGENCY") return
      const arrival = { encounter, latencyMs: Math.max(0, Date.now() - encounter.createdAt) }
      setArrivals((current) =>
        current.some((item) => item.encounter.id === encounter.id)
          ? current
          : [arrival, ...current].slice(0, 3),
      )
    }
    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.type !== "emergency-arrival") return
      const encounter = readIntakeQueue().find((item) => item.id === detail.encounterId)
      if (encounter?.createdBy !== user.name) push(encounter)
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== INTAKE_STORAGE_KEY || !event.newValue) return
      try {
        const known = new Set<string>(
          (JSON.parse(event.oldValue || "{}").items || []).map((item: IntakeEncounter) => item.id),
        )
        const next: IntakeEncounter[] = JSON.parse(event.newValue).items || []
        next.filter((item) => !known.has(item.id)).forEach(push)
      } catch {
        /* Ignore malformed storage payloads. */
      }
    }
    window.addEventListener(INTAKE_EVENT, onEvent)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(INTAKE_EVENT, onEvent)
      window.removeEventListener("storage", onStorage)
    }
  }, [user.name])

  if (!arrivals.length) return null
  return (
    <div className="pointer-events-none fixed right-4 top-16 z-50 flex w-full max-w-sm flex-col gap-2">
      {arrivals.map(({ encounter, latencyMs }) => (
        <div
          key={encounter.id}
          role="alert"
          className="animate-fade-in pointer-events-auto rounded-2xl border-2 border-sptt-red-border bg-sptt-red-bg p-4 shadow-clinical-lg"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-critical text-surface">
              <AlertTriangle aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-bold text-sptt-red">
                Bệnh nhân CẤP CỨU mới (Ưu tiên 1)
              </p>
              <p className="mt-1 font-heading text-sm font-semibold text-text-primary">
                {encounter.hoTen} · <span className="font-mono">{encounter.maBenhNhan}</span>
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">{encounter.lyDoKham}</p>
              <p className="mt-1.5 font-mono text-xs tabular-nums text-text-muted">
                {destinationLabel(encounter)} · Tiếp nhận tức thì
              </p>
            </div>
            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() =>
                setArrivals((current) =>
                  current.filter((item) => item.encounter.id !== encounter.id),
                )
              }
              className="cursor-pointer rounded-md p-1 text-text-muted transition-colors hover:bg-critical/10 hover:text-sptt-red"
            >
              <X aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
