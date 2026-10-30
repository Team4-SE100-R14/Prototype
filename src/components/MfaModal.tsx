import { useEffect, useRef, useState, type FormEvent } from "react"
import QRCode from "qrcode"
import type { AuthUser } from "../App"
import {
  authenticatorUri,
  DEMO_SECRET_BASE32,
  DEMO_SECRET_LABEL,
  remainingSeconds,
  PROTOTYPE_MFA_CODE,
} from "../lib/totp"
import { AlertCircle, Copy, ShieldCheck, X } from "lucide-react"
import Modal from "./ui/Modal"
import Button from "./ui/Button"
import { consumeRecoveryCode, normalizeRecoveryCode } from "../lib/mfaLifecycle"
import { TextInput } from "./ui/TextInput"

const ERROR_MESSAGE =
  "Mã xác thực không hợp lệ. Vui lòng nhập mã thử nghiệm 481920."
const GHOST =
  "cursor-pointer rounded-lg px-4 py-2.5 font-heading text-sm font-semibold text-text-secondary transition-colors hover:bg-subsurface disabled:cursor-not-allowed"
const INPUT =
  "w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-3 focus:ring-brand-primary/20"

function Shield() {
  return <ShieldCheck aria-hidden="true" strokeWidth={1.75} className="h-6 w-6" />
}

export default function MfaModal({
  user,
  onCancel,
  onVerified,
  requireSetup = false,
  onSetupCompleted,
}: {
  user: AuthUser
  onCancel: () => void
  onVerified: () => void
  requireSetup?: boolean
  onSetupCompleted?: () => void
}) {
  const [setup, setSetup] = useState(requireSetup)
  const [setupRequired, setSetupRequired] = useState(requireSetup)
  const [recovery, setRecovery] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState("")
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [setupCode, setSetupCode] = useState("")
  const [seconds, setSeconds] = useState(remainingSeconds)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [qr, setQr] = useState("")
  const [qrError, setQrError] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const mounted = useRef(true)
  const verifying = useRef(false)
  const titleId = setup ? "mfa-setup-title" : "mfa-title"

  useEffect(() => {
    mounted.current = true
    const timer = window.setInterval(() => setSeconds(remainingSeconds()), 250)
    return () => {
      mounted.current = false
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!setup) return
    let active = true
    setQrError(false)
    QRCode.toDataURL(authenticatorUri(user.id), {
      errorCorrectionLevel: "M",
      margin: 4,
    })
      .then((image) => {
        if (active) setQr(image)
      })
      .catch(() => {
        if (active) setQrError(true)
      })
    return () => {
      active = false
    }
  }, [setup, user.id])

  const switchView = (showSetup: boolean) => {
    setRecovery(false)
    setSetup(showSetup)
    setError("")
    setNotice("")
    setSetupCode("")
    setDigits(Array(6).fill(""))
    setCopied(false)
  }

  const fillDigits = (text: string, start: number) => {
    const numbers = text.replace(/\D/g, "").slice(0, 6 - start)
    if (!numbers) return
    const next = [...digits]
    for (let index = 0; index < numbers.length; index++)
      next[start + index] = numbers[index]
    setDigits(next)
    setError("")
    inputs.current[Math.min(start + numbers.length, 5)]?.focus()
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (verifying.current) return
    verifying.current = true
    setBusy(true)
    setError("")
    try {
      const valid =
        !setup && recovery
          ? consumeRecoveryCode(user.id, recoveryCode)
          : (setup ? setupCode : digits.join("")) === PROTOTYPE_MFA_CODE
      if (!mounted.current) return
      if (!valid) {
        setError(
          recovery
            ? "Mã khôi phục không hợp lệ, đã sử dụng hoặc đã bị thu hồi."
            : ERROR_MESSAGE,
        )
        return
      }
      if (setup) {
        onSetupCompleted?.()
        setSetupRequired(false)
        switchView(false)
        setNotice(
          "Đã hoàn tất thiết lập minh họa. Nhập lại mã 481920 để vào hệ thống.",
        )
      } else {
        onVerified()
      }
    } catch {
      if (mounted.current)
        setError("Không thể tiếp tục lúc này. Vui lòng thử lại.")
    } finally {
      verifying.current = false
      if (mounted.current) setBusy(false)
    }
  }

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_SECRET_BASE32)
      if (mounted.current) setCopied(true)
    } catch {
      if (mounted.current)
        setError(
          "Không thể sao chép tự động. Vui lòng chọn và sao chép khóa trong ô bên dưới.",
        )
    }
  }

  return (
    <Modal titleId={titleId} descriptionId="mfa-description" onClose={onCancel}>
      <div className="flex items-start gap-3 border-b border-border-subtle px-6 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-deep">
          <Shield />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="font-display text-lg font-semibold text-text-primary"
          >
            {setup
              ? "Thiết lập ứng dụng xác thực 2 bước (MFA)"
              : "Xác thực bảo mật đa yếu tố (MFA)"}
          </h2>
          <p
            id="mfa-description"
            className="mt-1 text-xs leading-relaxed text-text-muted"
          >
            {setup
              ? "Thiết lập minh họa: dùng mã cố định 481920, không cần cài đặt ứng dụng hoặc quét mã QR."
              : recovery
                ? "Nhập mã khôi phục dự phòng chưa sử dụng để đăng nhập khẩn cấp."
                : "Nhập mã cố định 481920 để kiểm thử prototype. Không cần ứng dụng xác thực."}
          </p>
        </div>
        <button
          type="button"
          aria-label="Quay lại đăng nhập"
          onClick={onCancel}
          className="rounded-md p-1.5 text-text-muted hover:bg-subsurface hover:text-text-secondary"
        >
          <X aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={submit}>
        <div className="space-y-6 p-6 sm:p-8">
          {setup ? (
            <ol className="space-y-5">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface text-sm font-semibold text-brand-deep">
                  1
                </span>
                <p className="pt-1 text-sm leading-relaxed text-text-secondary">
                  Cài đặt ứng dụng Google Authenticator hoặc Microsoft
                  Authenticator (bước minh họa, không bắt buộc).
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface text-sm font-semibold text-brand-deep">
                  2
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="pt-1 text-sm font-medium text-text-secondary">
                    Quét mã QR hoặc nhập khóa bí mật thủ công (minh họa).
                  </p>
                  <div className="mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-surface">
                    {qr ? (
                      <img
                        src={qr}
                        alt="Mã QR thiết lập ứng dụng xác thực HPMS"
                        className="h-full w-full"
                      />
                    ) : (
                      <p
                        role="status"
                        className="p-4 text-center text-xs text-text-muted"
                      >
                        {qrError
                          ? "Không thể tạo mã QR. Vui lòng dùng khóa nhập thủ công."
                          : "Đang tạo mã QR…"}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-text-secondary">
                    Khóa bí mật: {DEMO_SECRET_LABEL}
                  </p>
                  <label
                    htmlFor="mfa-secret"
                    className="block text-xs text-text-muted"
                  >
                    Khóa nhập thủ công trong ứng dụng (Base32)
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="mfa-secret"
                      readOnly
                      value={DEMO_SECRET_BASE32}
                      onFocus={(event) => event.target.select()}
                      className={`${INPUT} min-w-0 font-mono text-xs`}
                    />
                    <button
                      type="button"
                      onClick={copySecret}
                      className={`${GHOST} flex shrink-0 items-center justify-center gap-2 border border-border-subtle`}
                    >
                      <Copy aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                      {copied ? "Đã sao chép" : "Sao chép mã"}
                    </button>
                  </div>
                  <p role="status" className="text-xs text-text-muted">
                    {copied
                      ? "Đã sao chép khóa Base32 để nhập vào ứng dụng xác thực."
                      : "Mã QR và khóa Base32 sử dụng cùng một khóa minh họa."}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface text-sm font-semibold text-brand-deep">
                  3
                </span>
                <div className="flex-1">
                  <label
                    htmlFor="mfa-setup-code"
                    className="mb-2 block pt-1 text-sm font-medium text-text-secondary"
                  >
                    Nhập mã 6 số kiểm tra
                  </label>
                  <input
                    id="mfa-setup-code"
                    data-initial-focus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={setupCode}
                    onChange={(event) => {
                      setSetupCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                      setError("")
                    }}
                    required
                    aria-invalid={!!error}
                    aria-describedby={error ? "mfa-error" : undefined}
                    className={`${INPUT} font-mono tracking-widest`}
                  />
                </div>
              </li>
            </ol>
          ) : recovery ? (
            <div>
              <label
                htmlFor="mfa-recovery-code"
                className="mb-2 block text-sm font-medium text-text-secondary"
              >
                Mã khôi phục dự phòng
              </label>
              <TextInput
                id="mfa-recovery-code"
                data-initial-focus
                value={recoveryCode}
                autoComplete="off"
                maxLength={11}
                placeholder="7K2P-9M4X10"
                className="font-mono tracking-wider"
                onChange={(event) => {
                  setRecoveryCode(
                    event.target.value
                      .replace(/[^a-zA-Z0-9-]/g, "")
                      .toUpperCase(),
                  )
                  setError("")
                }}
                required
              />
              <p className="mt-2 text-xs text-text-muted">
                Mỗi mã chỉ dùng một lần. Dấu gạch nối không tính vào 10 ký tự.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="mb-4 text-sm font-medium text-text-secondary">
                  Mã xác thực 6 chữ số
                </p>
                <div
                  role="group"
                  aria-label="Mã xác thực 6 chữ số"
                  className="mx-auto flex w-full max-w-sm justify-center gap-2 sm:gap-3"
                >
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputs.current[index] = element
                      }}
                      data-initial-focus={index === 0 ? true : undefined}
                      aria-label={`Chữ số thứ ${index + 1}`}
                      aria-invalid={!!error}
                      aria-describedby={error ? "mfa-error" : undefined}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      pattern="[0-9]"
                      required
                      value={digit}
                      placeholder={PROTOTYPE_MFA_CODE[index]}
                      disabled={busy}
                      onFocus={(event) => event.target.select()}
                      onChange={(event) => {
                        if (!event.target.value) {
                          setDigits((previous) =>
                            previous.map((value, position) =>
                              position === index ? "" : value,
                            ),
                          )
                          setError("")
                          return
                        }
                        fillDigits(event.target.value, index)
                      }}
                      onPaste={(event) => {
                        event.preventDefault()
                        fillDigits(event.clipboardData.getData("text"), index)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Backspace" && !digit && index > 0) {
                          event.preventDefault()
                          setDigits((previous) =>
                            previous.map((value, position) =>
                              position === index - 1 ? "" : value,
                            ),
                          )
                          inputs.current[index - 1]?.focus()
                        }
                        if (event.key === "ArrowLeft" && index > 0) {
                          event.preventDefault()
                          inputs.current[index - 1]?.focus()
                        }
                        if (event.key === "ArrowRight" && index < 5) {
                          event.preventDefault()
                          inputs.current[index + 1]?.focus()
                        }
                      }}
                      className="aspect-square w-full min-w-0 max-w-14 rounded-lg border border-border-strong bg-canvas text-center font-mono text-xl font-semibold text-text-primary placeholder:text-border-strong focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm text-text-muted">
                <div className="relative h-10 w-10 shrink-0">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 40 40"
                    className="h-full w-full -rotate-90"
                  >
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-border-subtle"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      pathLength="30"
                      strokeDasharray={`${seconds} 30`}
                      className="text-brand-primary"
                    />
                  </svg>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center font-mono text-xs font-semibold text-brand-deep"
                  >
                    {seconds}
                  </span>
                </div>
                <p>
                  Chu kỳ mô phỏng:{" "}
                  <strong className="font-mono font-semibold text-brand-deep">
                    {seconds}s
                  </strong>
                </p>
              </div>
            </>
          )}

          {error && (
            <div
              id="mfa-error"
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-critical-border bg-critical-bg p-4 text-sm leading-relaxed text-critical"
            >
              <AlertCircle aria-hidden="true" strokeWidth={1.75} className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {notice && (
            <p
              role="status"
              className="rounded-lg bg-normal-bg p-3 text-sm text-normal"
            >
              {notice}
            </p>
          )}
          {!setup && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => switchView(true)}
                className="text-sm font-medium text-brand-deep hover:underline"
              >
                Chưa cài đặt thiết bị xác thực? Quét mã QR tại đây
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecovery((value) => !value)
                  setRecoveryCode("")
                  setError("")
                }}
                className="mt-3 block w-full text-sm font-medium text-brand-deep hover:underline"
              >
                {recovery
                  ? "Quay lại mã xác thực 6 số"
                  : "Dùng mã khôi phục dự phòng"}
              </button>
            </div>
          )}
          <p className="text-center text-xs leading-relaxed text-text-muted">
            {recovery ? (
              "Mã khôi phục được mô phỏng phía trình duyệt."
            ) : (
              <>
                Mã thử nghiệm:{" "}
                <strong className="font-mono">{PROTOTYPE_MFA_CODE}</strong>. Mã
                không hết hạn và chỉ dùng cho prototype.
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            disabled={busy || (setup && setupRequired)}
            onClick={() => (setup ? switchView(false) : onCancel())}
            variant="ghost"
          >
            {setup ? "Để sau" : "Quay lại đăng nhập"}
          </Button>
          <Button
            type="submit"
            disabled={
              busy ||
              (setup
                ? setupCode.length !== 6
                : recovery
                  ? normalizeRecoveryCode(recoveryCode).length !== 10
                  : digits.some((digit) => !digit))
            }
          >
            {busy
              ? "Đang xác thực…"
              : setup
                ? "Kích hoạt bảo vệ 2 lớp"
                : "Xác thực & Vào hệ thống"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
