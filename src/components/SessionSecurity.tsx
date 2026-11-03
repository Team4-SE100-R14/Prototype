import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { AuthUser } from "../App"
import {
  canAccessTreatment,
  inactivityMinutes,
  readExpiry,
  recordDeniedAccess,
  saveExpiry,
  IDLE_WARNING_MS,
  IDLE_GRACE_MS,
  refreshPrototypeSession,
} from "../lib/sessionSecurity"
import ForbiddenPage from "./ForbiddenPage"
import SessionExpiryModal from "./SessionExpiryModal"
import WorkstationLock from "./WorkstationLock"
import AccountSecurityPage from "./AccountSecurityPage"
import StaffMfaManagementPage from "./StaffMfaManagementPage"
import type { StaffAccount } from "../lib/mfaLifecycle"

interface SecurityControls {
  inactivity: number | null
  simulateLock: () => void
  simulateExpiry: () => void
  checkAccess: () => void
  openAccountSecurity: () => void
  openStaffDirectory?: () => void
}

const SecurityContext = createContext<SecurityControls | null>(null)
export const useSessionSecurity = () => useContext(SecurityContext)

export default function SessionSecurity({
  user,
  username,
  children,
  onLogout,
  validatePassword,
  staff,
}: {
  user: AuthUser
  username: string
  children: ReactNode
  onLogout: () => void
  validatePassword: (password: string) => Promise<boolean>
  staff: StaffAccount[]
}) {
  const minutes = inactivityMinutes(user.role)
  const activityKey = `hpms-last-activity-${user.id}`
  const lastActivity = useRef(
    (() => {
      try {
        return Number(sessionStorage.getItem(activityKey)) || Date.now()
      } catch {
        return Date.now()
      }
    })(),
  )
  const [expiresAt, setExpiresAt] = useState(readExpiry)
  const [now, setNow] = useState(Date.now)
  const [locked, setLocked] = useState(false)
  const [denied, setDenied] = useState(false)
  const [page, setPage] = useState<"home" | "account" | "staff">("home")
  const [auditSaved, setAuditSaved] = useState(true)
  const [accessNotice, setAccessNotice] = useState(false)
  const seconds = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  const idleDeadline = lastActivity.current + IDLE_WARNING_MS + IDLE_GRACE_MS
  const idleWarning = now >= lastActivity.current + IDLE_WARNING_MS
  const warning = idleWarning || seconds <= 30
  const warningSeconds = Math.max(
    0,
    Math.ceil((Math.min(expiresAt, idleDeadline) - now) / 1000),
  )
  const [renewing, setRenewing] = useState(false)
  const renewingRef = useRef(false)
  const ended = useRef(false)

  const markActivity = useCallback(() => {
    lastActivity.current = Date.now()
    try {
      sessionStorage.setItem(activityKey, String(lastActivity.current))
    } catch {
      /* Storage is optional. */
    }
  }, [activityKey])

  useEffect(() => {
    saveExpiry(expiresAt)
    const check = () => {
      const timestamp = Date.now()
      setNow(timestamp)
      if (timestamp >= expiresAt) {
        if (!ended.current) {
          ended.current = true
          onLogout()
        }
        return
      }
      if (minutes && timestamp - lastActivity.current >= minutes * 60 * 1000)
        setLocked(true)
    }
    check()
    const timer = window.setInterval(check, 1000)
    return () => window.clearInterval(timer)
  }, [expiresAt, minutes, onLogout])

  useEffect(() => {
    if (locked || warning) return
    const active = () => {
      if (Date.now() - lastActivity.current >= IDLE_WARNING_MS) {
        setNow(Date.now())
        return
      }
      if (Date.now() - lastActivity.current > 1000) markActivity()
    }
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
    ] as const
    for (const event of events)
      window.addEventListener(event, active, { passive: true, capture: true })
    return () => {
      for (const event of events)
        window.removeEventListener(event, active, true)
    }
  }, [locked, warning, markActivity])

  const controls = useMemo<SecurityControls>(
    () => ({
      inactivity: minutes,
      simulateLock: () => {
        if (!minutes) return
        lastActivity.current = Date.now() - minutes * 60 * 1000
        try {
          sessionStorage.setItem(activityKey, String(lastActivity.current))
        } catch {
          /* Storage is optional. */
        }
        setLocked(true)
      },
      simulateExpiry: () => {
        const timestamp = Date.now()
        setNow(timestamp)
        setExpiresAt(timestamp + 28000)
      },
      checkAccess: () => {
        if (canAccessTreatment(user.role)) {
          setAccessNotice(true)
          return
        }
        setAuditSaved(recordDeniedAccess(user))
        setDenied(true)
      },
      openAccountSecurity: () => {
        setDenied(false)
        setPage("account")
      },
      openStaffDirectory:
        user.role === "admin"
          ? () => {
              setDenied(false)
              setPage("staff")
            }
          : undefined,
    }),
    [minutes, activityKey, user],
  )

  const unlock = async (password: string) => {
    if (Date.now() >= expiresAt) {
      onLogout()
      return false
    }
    if (!(await validatePassword(password))) return false
    markActivity()
    setNow(Date.now())
    setLocked(false)
    return true
  }
  const renew = async () => {
    if (renewingRef.current) return
    if (
      Date.now() >= expiresAt ||
      Date.now() >= lastActivity.current + IDLE_WARNING_MS + IDLE_GRACE_MS
    ) {
      setLocked(true)
      return
    }
    renewingRef.current = true
    setRenewing(true)
    try {
      const expiry = await refreshPrototypeSession()
      if (
        Date.now() >= expiresAt ||
        Date.now() >= lastActivity.current + IDLE_WARNING_MS + IDLE_GRACE_MS
      ) {
        setLocked(true)
        return
      }
      markActivity()
      setNow(Date.now())
      setExpiresAt(expiry)
    } finally {
      renewingRef.current = false
      setRenewing(false)
    }
  }

  return (
    <SecurityContext.Provider value={controls}>
      <div
        className={
          locked ? "blur-lg pointer-events-none select-none" : undefined
        }
        inert={locked || warning}
        aria-hidden={locked || warning ? true : undefined}
      >
        {denied ? (
          <ForbiddenPage
            user={user}
            onLogout={onLogout}
            auditSaved={auditSaved}
            onHome={() => {
              setDenied(false)
              setAccessNotice(false)
            }}
          />
        ) : page === "account" ? (
          <AccountSecurityPage
            user={user}
            username={username}
            onLogout={onLogout}
            onHome={() => setPage("home")}
            validatePassword={validatePassword}
          />
        ) : page === "staff" && user.role === "admin" ? (
          <StaffMfaManagementPage
            user={user}
            staff={staff}
            onLogout={onLogout}
            onHome={() => setPage("home")}
          />
        ) : (
          children
        )}
        {accessNotice && !denied && (
          <div
            role="status"
            className="fixed bottom-6 left-1/2 z-40 flex w-full max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-lg border border-border-subtle bg-brand-surface p-4 text-sm text-brand-deep shadow-sm"
          >
            <p>Tài khoản có quyền truy cập bệnh án điều trị.</p>
            <button
              type="button"
              className="font-semibold hover:underline"
              onClick={() => setAccessNotice(false)}
            >
              Đóng
            </button>
          </div>
        )}
      </div>
      {locked ? (
        <WorkstationLock
          user={user}
          username={username}
          onLogout={onLogout}
          onUnlock={unlock}
        />
      ) : (
        warning && (
          <SessionExpiryModal
            seconds={warningSeconds}
            renewing={renewing}
            onLogout={onLogout}
            onRenew={renew}
          />
        )
      )}
    </SecurityContext.Provider>
  )
}
