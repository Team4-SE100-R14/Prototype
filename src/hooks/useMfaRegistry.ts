import { useEffect, useState } from "react"
import {
  MFA_CHANGED_EVENT,
  MFA_STORAGE_KEY,
  readMfaRegistry,
} from "../lib/mfaLifecycle"

export default function useMfaRegistry() {
  const [registry, setRegistry] = useState(readMfaRegistry)
  useEffect(() => {
    const refresh = () => setRegistry(readMfaRegistry())
    const storage = (event: StorageEvent) => {
      if (event.key === MFA_STORAGE_KEY || event.key === null) refresh()
    }
    window.addEventListener(MFA_CHANGED_EVENT, refresh)
    window.addEventListener("storage", storage)
    return () => {
      window.removeEventListener(MFA_CHANGED_EVENT, refresh)
      window.removeEventListener("storage", storage)
    }
  }, [])
  return registry
}
