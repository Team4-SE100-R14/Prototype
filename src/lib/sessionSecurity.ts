import type { AuthUser, UserRole } from "../App"

export const SESSION_DURATION = 30 * 60 * 1000
export const SESSION_KEY = "hpms-demo-session"
export const AUDIT_KEY = "NhatKyHeThong"
export const AUDIT_EVENT = "hpms-security-audit"

export function inactivityMinutes(role: UserRole): number | null {
  if (role === "admin") return 10
  if (
    ["physician", "nurse", "paraclinical_tech", "receptionist"].includes(role)
  )
    return 15
  return null
}

export function canAccessTreatment(role: UserRole): boolean {
  return ["physician", "admin"].includes(role)
}

export function readExpiry(): number {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SESSION_KEY) ||
        sessionStorage.getItem(SESSION_KEY) ||
        "{}",
    )
    if (Number.isFinite(saved?.expiresAt)) return saved.expiresAt
  } catch {
    // Storage is optional in the demonstration.
  }
  return Date.now() + SESSION_DURATION
}

export function saveExpiry(expiresAt: number) {
  try {
    const storage = localStorage.getItem(SESSION_KEY)
      ? localStorage
      : sessionStorage
    const saved = JSON.parse(storage.getItem(SESSION_KEY) || "{}")
    storage.setItem(SESSION_KEY, JSON.stringify({ ...saved, expiresAt }))
  } catch {
    // The current page still enforces the countdown without browser storage.
  }
}

export interface SecurityAuditEntry {
  id: string
  time: string
  actor: string
  workstation: string
  action: string
  actionTone: "amber"
  object: string
  result: "Thất bại" | "Thành công"
}

export function readSecurityAudit(): SecurityAuditEntry[] {
  try {
    const entries = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]")
    return Array.isArray(entries)
      ? entries.filter(
          (entry) =>
            typeof entry?.id === "string" &&
            typeof entry?.actor === "string" &&
            typeof entry?.object === "string" &&
            typeof entry?.time === "string",
        )
      : []
  } catch {
    return []
  }
}

export function recordDeniedAccess(user: AuthUser) {
  const entry: SecurityAuditEntry = {
    id: `RBAC-${crypto.randomUUID()}`,
    time: new Date().toLocaleString("vi-VN"),
    actor: user.name,
    workstation: "Máy trạm minh họa",
    action: "Từ chối truy cập",
    actionTone: "amber",
    object: `Bệnh án điều trị · ${user.id} · SEC-RBAC-01 · Default-Deny`,
    result: "Thất bại",
  }
  try {
    localStorage.setItem(
      AUDIT_KEY,
      JSON.stringify([entry, ...readSecurityAudit()].slice(0, 200)),
    )
    window.dispatchEvent(new Event(AUDIT_EVENT))
    return true
  } catch {
    return false
  }
}
