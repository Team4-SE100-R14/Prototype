import { useCallback, useState, type FormEvent } from "react"
import { regenerateRecoveryCodes } from "../lib/mfaLifecycle"
import { PROTOTYPE_MFA_CODE } from "../lib/totp"
import Button from "./ui/Button"
import Icon from "./ui/Icon"
import Modal from "./ui/Modal"
import { SecurityAlert, SecurityDialogHeader } from "./ui/SecurityDialog"
import { TextInput } from "./ui/TextInput"

export function RecoveryStepUpModal({
  userId,
  validatePassword,
  onClose,
  onGenerated,
}: {
  userId: string
  validatePassword: (password: string) => boolean
  onClose: () => void
  onGenerated: (codes: string[]) => void
}) {
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (!validatePassword(password) || otp !== PROTOTYPE_MFA_CODE) {
      setError(
        "Mật khẩu hoặc mã OTP không chính xác. Mã phục hồi hiện tại của bạn vẫn được giữ nguyên.",
      )
      return
    }
    setBusy(true)
    try {
      onGenerated(regenerateRecoveryCodes(userId))
    } catch {
      setBusy(false)
      setError(
        "Không thể lưu bộ mã mới. Mã phục hồi hiện tại vẫn được giữ nguyên. Vui lòng thử lại.",
      )
    }
  }
  return (
    <Modal titleId="step-up-title" onClose={onClose}>
      <SecurityDialogHeader
        titleId="step-up-title"
        title="Xác thực bảo mật nâng cao (Step-Up Authentication)"
        onClose={onClose}
      />
      <form onSubmit={submit}>
        <div className="space-y-5 p-6">
          <SecurityAlert>
            Để đảm bảo an toàn, bạn phải xác thực lại mật khẩu hiện tại và mã
            TOTP đang hoạt động trước khi tạo bộ mã dự phòng mới.
          </SecurityAlert>
          <div>
            <label
              htmlFor="recovery-password"
              className="mb-2 block text-sm font-medium text-text-secondary"
            >
              Mật khẩu tài khoản hiện tại
            </label>
            <div className="relative">
              <TextInput
                id="recovery-password"
                data-initial-focus
                type={visible ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu của bạn"
                required
                className="pr-12"
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError("")
                }}
                aria-invalid={!!error}
                aria-describedby={error ? "step-up-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-text-muted"
              >
                <Icon>
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {visible && <path d="M3 3l18 18" />}
                </Icon>
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="recovery-otp"
              className="mb-2 block text-sm font-medium text-text-secondary"
            >
              Mã xác thực 6 số từ ứng dụng Authenticator
            </label>
            <TextInput
              id="recovery-otp"
              value={otp}
              onChange={(event) => {
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                setError("")
              }}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="vd: 481920"
              required
              className="font-mono tracking-widest"
              aria-invalid={!!error}
              aria-describedby="prototype-step-up-code"
            />
            <p
              id="prototype-step-up-code"
              className="mt-2 text-xs text-text-muted"
            >
              Mã cố định để kiểm thử prototype:{" "}
              <strong className="font-mono">481920</strong>.
            </p>
          </div>
          <SecurityAlert tone="warning">
            Lưu ý: Ngay sau khi xác thực thành công, toàn bộ mã phục hồi cũ sẽ
            bị vô hiệu hóa vĩnh viễn và thay thế bằng 8 mã mới.
          </SecurityAlert>
          {error && (
            <SecurityAlert id="step-up-error" tone="danger">
              {error}
            </SecurityAlert>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={busy || !password || otp.length !== 6}
          >
            {busy ? "Đang tạo mã…" : "Xác thực & Tạo 8 mã mới"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function NewRecoveryCodesModal({
  codes,
  username,
  onDone,
}: {
  codes: string[]
  username: string
  onDone: () => void
}) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [closeWarning, setCloseWarning] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const guardedClose = useCallback(() => {
    if (!acknowledged) {
      setCloseWarning(true)
      return
    }
    onDone()
  }, [acknowledged, onDone])
  const text = `HPMS - Mã khôi phục dự phòng (${username})\nMỗi mã chỉ sử dụng một lần. Lưu tệp ở nơi bảo mật.\n\n${codes.map((code, index) => `${index + 1}. ${code}`).join("\n")}\n`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"))
      setNotice("Đã sao chép tất cả 8 mã.")
      setError("")
    } catch {
      setError(
        "Không thể sao chép tự động. Vui lòng tải tệp văn bản hoặc lưu các mã thủ công.",
      )
    }
  }
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = `HPMS-ma-khoi-phuc-${username}.txt`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice("Đã tạo tệp văn bản để tải về. Vui lòng kiểm tra tệp đã lưu.")
  }
  return (
    <Modal titleId="new-recovery-title" onClose={guardedClose}>
      <SecurityDialogHeader
        titleId="new-recovery-title"
        title="8 Mã khôi phục dự phòng mới của bạn"
        onClose={guardedClose}
      />
      <div className="space-y-5 p-6">
        <p className="inline-flex rounded-full border border-normal/20 bg-normal-bg px-3 py-2 text-xs font-semibold text-normal">
          Đã kích hoạt: 8/8 mã khả dụng (Mỗi mã dùng 1 lần duy nhất)
        </p>
        <p className="text-sm leading-relaxed text-text-muted">
          Lưu trữ 8 mã này ở nơi bảo mật. Mỗi mã gồm 10 ký tự và chỉ có giá trị
          sử dụng một lần (Single-use) để đăng nhập khẩn cấp khi mất điện thoại.
        </p>
        <div
          className="grid grid-cols-2 gap-2 sm:gap-3"
          aria-label="8 mã khôi phục mới"
        >
          {[0, 4, 1, 5, 2, 6, 3, 7].map((index) => (
            <div
              key={codes[index]}
              className="flex items-center gap-2 rounded-lg border border-border-strong bg-canvas px-3 py-3 font-mono text-xs font-semibold text-text-primary sm:text-sm"
            >
              <span className="font-normal text-text-muted">{index + 1}.</span>
              <code>{codes[index]}</code>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={copy}
            className="flex items-center justify-center gap-2 border border-border-subtle"
          >
            <Icon className="h-4 w-4">
              <rect x="8" y="8" width="12" height="12" rx="2" />
              <path d="M16 8V4H4v12h4" />
            </Icon>
            Sao chép tất cả 8 mã
          </Button>
          <Button
            variant="ghost"
            onClick={download}
            className="flex items-center justify-center gap-2 border border-border-subtle"
          >
            <Icon className="h-4 w-4">
              <path d="M12 3v12m-4-4l4 4 4-4M4 17v4h16v-4" />
            </Icon>
            Tải về tệp văn bản (.txt)
          </Button>
        </div>
        {notice && (
          <p role="status" className="text-xs text-normal">
            {notice}
          </p>
        )}
        {error && <SecurityAlert tone="danger">{error}</SecurityAlert>}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-canvas p-4 text-sm leading-relaxed text-text-secondary">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => {
              setAcknowledged(event.target.checked)
              setCloseWarning(false)
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-brand-primary"
          />
          Tôi xác nhận đã sao lưu và lưu trữ an toàn 8 mã khôi phục này ở nơi
          bảo mật.
        </label>
        {closeWarning && (
          <p role="alert" className="text-sm text-warning">
            Bạn phải xác nhận đã lưu mã an toàn trước khi đóng.
          </p>
        )}
        <p className="text-xs text-text-muted">
          Prototype lưu mã trên trình duyệt để minh họa. Không dùng các mã này
          cho tài khoản thực.
        </p>
      </div>
      <div
        className="border-t border-border-subtle bg-canvas px-6 py-4"
        title={
          !acknowledged
            ? "Bạn phải xác nhận đã lưu mã an toàn trước khi đóng."
            : undefined
        }
        onClick={() => {
          if (!acknowledged) setCloseWarning(true)
        }}
      >
        <Button
          className={`w-full ${!acknowledged ? "pointer-events-none" : ""}`}
          disabled={!acknowledged}
          onClick={guardedClose}
        >
          Hoàn tất & Đóng hộp thoại
        </Button>
      </div>
    </Modal>
  )
}
