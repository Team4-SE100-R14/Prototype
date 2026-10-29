import { useEffect, useMemo, useState } from "react"
import {
  INTAKE_EVENT,
  INTAKE_STORAGE_KEY,
  readIntakeQueue,
  sortQueue,
} from "../lib/intakeQueue"

export default function useIntakeQueue() {
  const [items, setItems] = useState(readIntakeQueue)
  const [, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => setItems(readIntakeQueue())
    const storage = (event: StorageEvent) => {
      if (event.key === INTAKE_STORAGE_KEY || event.key === null) refresh()
    }
    window.addEventListener(INTAKE_EVENT, refresh)
    window.addEventListener("storage", storage)
    // Re-render periodically so relative waiting times stay current.
    const timer = window.setInterval(() => setTick((tick) => tick + 1), 30_000)
    return () => {
      window.removeEventListener(INTAKE_EVENT, refresh)
      window.removeEventListener("storage", storage)
      window.clearInterval(timer)
    }
  }, [])
  return useMemo(() => sortQueue(items), [items])
}
