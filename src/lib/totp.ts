const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
// Fixed acceptance code for this prototype; never use for production authentication.
export const PROTOTYPE_MFA_CODE = "481920"
export const DEMO_SECRET_LABEL = "HPMS-9942-AUTH-7712"
const demoKey = new TextEncoder().encode(DEMO_SECRET_LABEL)

export function encodeBase32(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let result = ""
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits) result += BASE32[(value << (5 - bits)) & 31]
  return result
}

// Public demonstration key only. Production enrollment and verification must run on a server.
export const DEMO_SECRET_BASE32 = encodeBase32(demoKey)

export function authenticatorUri(account: string): string {
  return `otpauth://totp/${encodeURIComponent(`HPMS:${account}`)}?secret=${DEMO_SECRET_BASE32}&issuer=HPMS&algorithm=SHA1&digits=6&period=30`
}

export function remainingSeconds(timestamp = Date.now()): number {
  return 30 - (Math.floor(timestamp / 1000) % 30)
}

export async function generateTotp(
  timestamp = Date.now(),
  secret: Uint8Array = demoKey,
  digits = 6,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  )
  const counter = Math.floor(timestamp / 30000)
  const message = new ArrayBuffer(8)
  const view = new DataView(message)
  view.setUint32(0, Math.floor(counter / 0x100000000))
  view.setUint32(4, counter >>> 0)
  const hash = new Uint8Array(await crypto.subtle.sign("HMAC", key, message))
  const offset = hash[hash.length - 1] & 15
  const number =
    ((hash[offset] & 127) << 24) |
    (hash[offset + 1] << 16) |
    (hash[offset + 2] << 8) |
    hash[offset + 3]
  return (number % 10 ** digits).toString().padStart(digits, "0")
}

export async function verifyTotp(
  code: string,
  timestamp = Date.now(),
): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false
  return code === (await generateTotp(timestamp))
}
