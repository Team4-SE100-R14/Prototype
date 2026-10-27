import type { AuthUser } from "../App"
import { AUDIT_EVENT, AUDIT_KEY, readSecurityAudit } from "./sessionSecurity"

export const MFA_STORAGE_KEY = "hpms-mfa-lifecycle"
export const MFA_CHANGED_EVENT = "hpms-mfa-changed"
export const SAMPLE_RECOVERY_CODES = [
  "7K2P-9M4X10",
  "B4R8-2W9Z45",
  "H1N6-8D3E88",
  "5J3Y-7P2S31",
  "3F8A-6L1Q99",
  "9V5X-4T7C12",
  "2E7B-8K4M70",
  "6W1Z-5N9R55",
]

export interface StaffAccount {
  user: AuthUser
  username: string
  employeeId: string
  department: string
}

export interface MfaState {
  codes: string[]
  used: string[]
  batch: number
  sessionEpoch: number
  needsSetup: boolean
}

export function readMfaRegistry(): Record<string, MfaState> {
  try {
    const value = JSON.parse(localStorage.getItem(MFA_STORAGE_KEY) || "{}")
    if (!value || typeof value !== "object" || Array.isArray(value)) return {}
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, MfaState] => {
        const state = entry[1] as MfaState | null
        return (
          !!state &&
          Array.isArray(state.codes) &&
          state.codes.every((code) => typeof code === "string") &&
          Array.isArray(state.used) &&
          state.used.every((code) => typeof code === "string") &&
          Number.isInteger(state.batch) &&
          Number.isInteger(state.sessionEpoch) &&
          typeof state.needsSetup === "boolean"
        )
      }),
    )
  } catch {
    return {}
  }
}

export function readMfaState(id: string): MfaState {
  return (
    readMfaRegistry()[id] || {
      codes: [],
      used: [],
      batch: 0,
      sessionEpoch: 0,
      needsSetup: false,
    }
  )
}

function saveMfaState(id: string, state: MfaState) {
  localStorage.setItem(
    MFA_STORAGE_KEY,
    JSON.stringify({ ...readMfaRegistry(), [id]: state }),
  )
  window.dispatchEvent(new Event(MFA_CHANGED_EVENT))
}

export const normalizeRecoveryCode = (code: string) =>
  code.replace(/-/g, "").trim().toUpperCase()
export const availableCodes = (state: MfaState) =>
  state.codes.filter((code) => !state.used.includes(code)).length

export function regenerateRecoveryCodes(id: string): string[] {
  const previous = readMfaState(id)
  let codes = [...SAMPLE_RECOVERY_CODES]
  if (previous.batch > 0) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const unique = new Set<string>()
    while (unique.size < 8) {
      const bytes = crypto.getRandomValues(new Uint8Array(10))
      const raw = Array.from(
        bytes,
        (byte) => alphabet[byte % alphabet.length],
      ).join("")
      const code = `${raw.slice(0, 4)}-${raw.slice(4)}`
      if (!previous.codes.includes(code)) unique.add(code)
    }
    codes = [...unique]
  }
  saveMfaState(id, { ...previous, codes, used: [], batch: previous.batch + 1 })
  return codes
}

export function consumeRecoveryCode(id: string, value: string): boolean {
  const state = readMfaState(id)
  if (state.needsSetup) return false
  const code = state.codes.find(
    (item) => normalizeRecoveryCode(item) === normalizeRecoveryCode(value),
  )
  if (!code || state.used.includes(code)) return false
  saveMfaState(id, { ...state, used: [...state.used, code] })
  return true
}

export function resetMfa(
  actor: AuthUser,
  target: StaffAccount,
  reason: string,
) {
  if (actor.role !== "admin" || actor.id === target.user.id)
    throw new Error("Không được phép đặt lại MFA cho tài khoản này.")
  if (reason.trim().length < 10 || reason.length > 250)
    throw new Error("Lý do phải có từ 10 đến 250 ký tự.")
  const previous = readMfaState(target.user.id)
  saveMfaState(target.user.id, {
    ...previous,
    codes: [],
    used: [],
    needsSetup: true,
    sessionEpoch: previous.sessionEpoch + 1,
  })
  // Never include recovery codes or TOTP secrets in the prototype audit log.
  try {
    const entries = readSecurityAudit()
    localStorage.setItem(
      AUDIT_KEY,
      JSON.stringify(
        [
          {
            id: `MFA-${crypto.randomUUID()}`,
            time: new Date().toLocaleString("vi-VN"),
            actor: actor.name,
            workstation: "Máy trạm minh họa",
            action: "Đặt lại MFA",
            actionTone: "amber",
            object: `${target.username} · REQ-AUTH-05 · ${reason.trim()}`,
            result: "Thành công",
          },
          ...entries,
        ].slice(0, 200),
      ),
    )
    window.dispatchEvent(new Event(AUDIT_EVENT))
  } catch {
    /* Reset enforcement must not depend on optional audit storage. */
  }
}

export function completeMfaSetup(id: string) {
  saveMfaState(id, { ...readMfaState(id), needsSetup: false })
}
