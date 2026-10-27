import { useEffect, useState, type FormEvent } from "react"
import type { AuthUser, UserRole } from "../App"
import Icon from "./ui/Icon"

interface DemoUser {
  password: string
  user: AuthUser
}

interface Props {
  onLogin: (
    username: string,
    password: string,
    remember: boolean,
  ) => string | null
  demoUsers: Record<string, DemoUser>
}

const ROLES: {
  username: string
  role: UserRole
  label: string
}[] = [
  { username: "admin", role: "admin", label: "Quản trị viên" },
  { username: "dat.nguyen", role: "physician", label: "Bác sĩ" },
  { username: "mai.le", role: "nurse", label: "Điều dưỡng" },
  { username: "tuan.cls", role: "paraclinical_tech", label: "KTV Cận lâm sàng" },
  { username: "lan.tiepdon", role: "receptionist", label: "Tiếp đón" },
  { username: "bn-26-0089", role: "patient", label: "Bệnh nhân" },
]

interface Attempt {
  failures: number
  lockedUntil: number
}

const ATTEMPTS_KEY = "hpms-login-attempts"

function readAttempts(): Record<string, Attempt> {
  try {
    const value = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "{}")
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, Attempt] => {
        const attempt = entry[1] as Attempt | null
        return (
          !!attempt &&
          Number.isFinite(attempt.failures) &&
          Number.isFinite(attempt.lockedUntil)
        )
      }),
    )
  } catch {
    return {}
  }
}

export default function LoginPage({ onLogin, demoUsers }: Props) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [showRecovery, setShowRecovery] = useState(false)
  const [attempts, setAttempts] = useState(readAttempts)
  const [now, setNow] = useState(Date.now)
  const account = username.trim().toLowerCase()
  const canonicalAccount =
    Object.keys(demoUsers).find(
      (key) =>
        key === account ||
        demoUsers[key].user.id.toLowerCase() === account ||
        `${
          demoUsers[key].user.role === "patient" ? "bn" : "nv"
        }-${demoUsers[key].user.id.toLowerCase()}` === account,
    ) || account
  const lockedUntil = attempts[canonicalAccount]?.lockedUntil || 0
  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000))
  const countdown = `${Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0")}:${(secondsLeft % 60).toString().padStart(2, "0")}`

  useEffect(() => {
    try {
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
    } catch {
      // The preview still works when browser storage is unavailable.
    }
  }, [attempts])

  useEffect(() => {
    if (!lockedUntil) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [lockedUntil])

  const selectRole = (name: string) => {
    setUsername(name)
    setPassword(demoUsers[name].password)
    setSelected(name)
    setShowPassword(false)
    setShowRecovery(false)
    setError("")
    setNow(Date.now())
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const timestamp = Date.now()
    setNow(timestamp)
    if ((attempts[canonicalAccount]?.lockedUntil || 0) > timestamp) return
    const result = onLogin(canonicalAccount, password, remember)
    if (!result) {
      const next = { ...attempts }
      delete next[canonicalAccount]
      try {
        localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next))
      } catch {
        // Clear the in-memory counter even when storage is unavailable.
      }
      setAttempts(next)
      return
    }
    const previous = attempts[canonicalAccount]
    const failures = (previous?.lockedUntil ? 0 : previous?.failures || 0) + 1
    setAttempts((current) => ({
      ...current,
      [canonicalAccount]: {
        failures,
        lockedUntil: failures >= 5 ? timestamp + 15 * 60 * 1000 : 0,
      },
    }))
    setError(
      failures >= 5
        ? ""
        : "Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.",
    )
  }

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-deep text-surface">
            <Icon className="h-6 w-6">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </Icon>
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight text-text-primary">
              HPMS
            </p>
            <p className="text-xs text-text-muted">
              Hệ thống Quản lý Bệnh viện &amp; Bệnh nhân
            </p>
          </div>
        </div>

        <section
          aria-labelledby="login-title"
          className="rounded-xl border border-border-subtle bg-surface shadow-sm"
        >
          <div className="border-b border-border-subtle px-5 py-5 sm:px-8">
            <p className="mb-3 text-xs font-medium text-text-muted">
              Chọn vai trò đăng nhập
            </p>
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              role="group"
              aria-label="Vai trò đăng nhập"
            >
              {ROLES.map(({ username: name, label }) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selected === name}
                  onClick={() => selectRole(name)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                    selected === name
                      ? "border-brand-primary bg-brand-surface text-brand-deep"
                      : "border-border-subtle bg-surface text-text-secondary hover:bg-subsurface"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <h1
              id="login-title"
              className="font-display text-2xl font-semibold text-text-primary"
            >
              Đăng nhập Hệ thống HPMS
            </h1>
            <p className="mt-2 mb-6 text-sm leading-relaxed text-text-muted">
              Nhập thông tin tài khoản để truy cập không gian làm việc của bạn.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Tên đăng nhập / Mã định danh
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    setSelected(null)
                    setError("")
                    setNow(Date.now())
                  }}
                  placeholder="Nhập username, mã NV-xxxx hoặc BN-xxxx"
                  className="w-full px-3 py-2.5 text-sm border border-border-subtle rounded-lg bg-canvas text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  aria-invalid={!!error || secondsLeft > 0}
                  aria-describedby={
                    secondsLeft > 0
                      ? "lockout-message"
                      : error
                        ? "login-error"
                        : undefined
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setError("")
                    }}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full pl-3 pr-12 py-2.5 text-sm border border-border-subtle rounded-lg bg-canvas text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                    autoComplete="current-password"
                    required
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-text-muted hover:text-brand-deep"
                  >
                    <Icon>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                      {showPassword && <path d="M3 3l18 18" />}
                    </Icon>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-text-secondary">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 rounded border-border-strong accent-brand-primary"
                  />
                  Ghi nhớ phiên đăng nhập
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecovery((value) => !value)}
                  aria-expanded={showRecovery}
                  aria-controls="password-recovery"
                  className="font-medium text-brand-deep hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {showRecovery && (
                <div
                  id="password-recovery"
                  role="status"
                  className="rounded-lg border border-border-subtle bg-brand-surface p-3 text-sm leading-relaxed text-brand-deep"
                >
                  Vui lòng liên hệ Quản trị viên để xác minh danh tính và được
                  hỗ trợ đặt lại mật khẩu.
                </div>
              )}

              {error && !secondsLeft && (
                <div
                  id="login-error"
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-critical-border bg-critical-bg p-3 text-sm text-critical"
                >
                  <Icon className="h-5 w-5 shrink-0">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4m0 4h.01" />
                  </Icon>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!username.trim() || !password || secondsLeft > 0}
                className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-deep disabled:bg-subsurface disabled:text-text-muted disabled:cursor-not-allowed text-surface text-sm font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-2"
              >
                Đăng nhập vào hệ thống
                <Icon className="h-4 w-4">
                  <path d="M5 12h14m-5-5l5 5-5 5" />
                </Icon>
              </button>

              {secondsLeft > 0 && (
                <div
                  id="lockout-message"
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-critical-border bg-critical-bg p-4 text-sm leading-relaxed text-critical"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 018 0v3m-4 5v2" />
                  </Icon>
                  <p>
                    Tài khoản bị tạm khóa 15 phút do nhập sai mật khẩu quá 5 lần
                    liên tiếp. Thời gian mở khóa còn lại:{" "}
                    <strong className="font-mono">{countdown}</strong>. Liên hệ
                    Quản trị viên để được mở khóa sớm.
                  </p>
                </div>
              )}
            </form>
            {selected && (
              <p className="mt-5 text-center text-xs text-text-muted">
                Thông tin tài khoản minh họa đã được điền cho vai trò{" "}
                {ROLES.find((role) => role.username === selected)?.label}.
              </p>
            )}
          </div>
        </section>
        <footer className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-text-muted">
          <Icon className="mt-0.5 h-4 w-4 shrink-0">
            <path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3z" />
            <path d="M8 12l3 3 5-6" />
          </Icon>
          <p>
            Hệ thống Quản lý Bệnh viện &amp; Bệnh nhân HPMS - Tiêu chuẩn bảo mật
            TLS 1.3
          </p>
        </footer>
      </div>
    </main>
  )
}
