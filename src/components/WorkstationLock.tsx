import { useRef, useState, type FormEvent } from "react"
import type { AuthUser } from "../App"
import Button from "./ui/Button"
import { AlertTriangle, Eye, EyeOff, Lock, User } from "lucide-react"
import Modal from "./ui/Modal"

const stayLocked = () => {}

export default function WorkstationLock({
  user,
  username,
  onLogout,
  onUnlock,
}: {
  user: AuthUser
  username: string
  onLogout: () => void
  onUnlock: (password: string) => boolean
}) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const attemptsKey = `hpms-unlock-attempts-${user.id}`
  const attempts = useRef(
    (() => {
      try {
        return Number(sessionStorage.getItem(attemptsKey)) || 0
      } catch {
        return 0
      }
    })(),
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!password) return
    if (onUnlock(password)) {
      try {
        sessionStorage.removeItem(attemptsKey)
      } catch {
        /* Storage is optional. */
      }
      return
    }
    attempts.current += 1
    try {
      sessionStorage.setItem(attemptsKey, String(attempts.current))
    } catch {
      /* Storage is optional. */
    }
    if (attempts.current > 3) {
      onLogout()
      return
    }
    setPassword("")
    setError(
      `Mật khẩu không chính xác. Bạn đã nhập sai ${attempts.current}/3 lần.`,
    )
  }

  return (
    <Modal
      titleId="workstation-title"
      descriptionId="workstation-notice"
      onClose={stayLocked}
      dismissible={false}
      backdrop="workstation"
    >
      <form onSubmit={submit}>
        <div className="p-6 sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-surface text-brand-deep">
            <Lock aria-hidden="true" strokeWidth={1.75} className="h-7 w-7" />
          </div>
          <h2
            id="workstation-title"
            className="text-center font-heading text-2xl font-semibold text-text-primary"
          >
            Phiên làm việc đã tự động khóa
          </h2>
          <p
            id="workstation-notice"
            className="mt-3 text-center text-sm leading-relaxed text-text-muted"
          >
            Máy trạm không có thao tác trong thời gian quy định. Giao diện tự
            động khóa để bảo mật dữ liệu bệnh án (CON-06).
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-border-subtle bg-canvas px-4 py-3 text-center text-xs font-medium text-text-secondary">
            <User aria-hidden="true" strokeWidth={1.75} className="h-4 w-4 shrink-0" />
            <span>
              {user.name}
              {user.department ? ` - ${user.department}` : ""} ({username})
            </span>
          </div>
          <div className="mt-6">
            <label
              htmlFor="unlock-password"
              className="mb-2 block font-heading text-[13px] font-semibold text-text-secondary"
            >
              Nhập mật khẩu để mở khóa màn hình
            </label>
            <div className="relative">
              <input
                id="unlock-password"
                data-initial-focus
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError("")
                }}
                autoComplete="current-password"
                required
                placeholder="Nhập mật khẩu của bạn"
                aria-invalid={!!error}
                aria-describedby={
                  error ? "unlock-error unlock-warning" : "unlock-warning"
                }
                className="w-full rounded-lg border border-border-strong bg-surface py-2.5 pl-3 pr-12 text-sm text-text-primary placeholder:text-text-disabled transition-[border-color,box-shadow] duration-150 focus:border-brand-primary focus:outline-none focus:ring-3 focus:ring-brand-primary/20 aria-[invalid=true]:border-[1.5px] aria-[invalid=true]:border-critical aria-[invalid=true]:bg-critical-bg"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-text-muted transition-colors hover:text-brand-deep"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
                ) : (
                  <Eye aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div
            id="unlock-warning"
            className="mt-4 flex items-start gap-2 rounded-lg border border-sptt-yellow-border/40 bg-sptt-yellow-bg p-3 text-xs leading-relaxed text-sptt-yellow"
          >
            <AlertTriangle aria-hidden="true" strokeWidth={1.75} className="h-4 w-4 shrink-0" />
            <p>
              Nhập sai mật khẩu quá 3 lần sẽ hủy phiên và yêu cầu xác thực lại
              với MFA.
            </p>
          </div>
          {error && (
            <p
              id="unlock-error"
              role="alert"
              className="mt-4 rounded-lg border border-cpoe-block-border bg-cpoe-block-bg p-3 text-sm text-cpoe-block"
            >
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="danger" onClick={onLogout}>
            Đăng xuất tài khoản
          </Button>
          <Button type="submit" disabled={!password}>
            Mở khóa phiên làm việc
          </Button>
        </div>
      </form>
    </Modal>
  )
}
