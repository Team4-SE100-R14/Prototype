import { AUDIT_KEY, AUDIT_EVENT, readSecurityAudit } from "./sessionSecurity"
// Browser-only adapter for the prototype; no SMS or production credentials.
const KEY = "hpms-patient-password"
export const PATIENT_ID = "BN-26-0089"
export const PATIENT_PHONE = "0901234567"
export const PATIENT_CCCD = "079026000089"
export const SMS_TEST_CODE = "482619"

export const PATIENT_PASSWORD_KEY = "hpms-patient-password-hash"
const encode = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")
async function digest(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"])
  return encode(new Uint8Array(await crypto.subtle.deriveBits({name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 210000}, key, 256)))
}
export async function verifyPatientPassword(password: string, fallback: string): Promise<boolean> {
  const saved = localStorage.getItem(PATIENT_PASSWORD_KEY)
  if (saved) {
    const record = JSON.parse(saved)
    return await digest(password, record.salt) === record.hash
  }
  const legacy = localStorage.getItem(KEY)
  if (legacy) {
    await savePatientPassword(legacy)
    return password === legacy
  }
  return password === fallback
}
export async function savePatientPassword(password: string) {
  const salt = encode(crypto.getRandomValues(new Uint8Array(16)))
  const hash = await digest(password, salt)
  localStorage.setItem(PATIENT_PASSWORD_KEY, JSON.stringify({salt, hash}))
  localStorage.removeItem(KEY)
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify([{
      id: crypto.randomUUID(), time: new Date().toLocaleString("vi-VN"),
      actor: PATIENT_ID, workstation: "Prototype", action: "Đặt lại mật khẩu bệnh nhân",
      actionTone: "amber", object: "REQ-AUTH-01", result: "Thành công"
    }, ...readSecurityAudit()].slice(0, 200)))
    window.dispatchEvent(new Event(AUDIT_EVENT))
  } catch { /* Credential update does not depend on optional prototype audit storage. */ }
  for (const storage of [localStorage, sessionStorage]) {
    const session = JSON.parse(storage.getItem("hpms-demo-session") || "{}")
    if (session.id === PATIENT_ID) storage.removeItem("hpms-demo-session")
  }
}

export const validPassword = (value: string) =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9\s]/.test(value)
