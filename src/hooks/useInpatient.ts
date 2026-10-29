import { useEffect, useState } from "react"
import {
  INPATIENT_EVENT,
  INPATIENT_STORAGE_KEY,
  readInpatientState,
} from "../lib/inpatient"

export default function useInpatient() {
  const [state, setState] = useState(readInpatientState)
  useEffect(() => {
    const refresh = () => setState(readInpatientState())
    const storage = (event: StorageEvent) => {
      if (event.key === INPATIENT_STORAGE_KEY || event.key === null) refresh()
    }
    window.addEventListener(INPATIENT_EVENT, refresh)
    window.addEventListener("storage", storage)
    return () => {
      window.removeEventListener(INPATIENT_EVENT, refresh)
      window.removeEventListener("storage", storage)
    }
  }, [])
  return state
}
