import { useEffect, useRef, useState } from "react"
import { useSessionSecurity } from "./SessionSecurity"
import Icon from "./ui/Icon"

export default function SessionSecurityMenu() {
  const controls = useSessionSecurity()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", escape)
    }
  }, [open])
  if (!controls) return null
  const perform = (action: () => void) => {
    setOpen(false)
    action()
  }
  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label="Bảo mật phiên"
        aria-expanded={open}
        aria-controls="session-security-menu"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-2.5 py-2 text-xs font-medium text-text-secondary hover:bg-subsurface"
      >
        <Icon className="h-4 w-4">
          <path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3z" />
          <path d="M9.5 12l1.5 1.5 3.5-4" />
        </Icon>
        <span className="hidden lg:inline">Bảo mật phiên</span>
      </button>
      {open && (
        <div
          id="session-security-menu"
          className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-lg"
        >
          <div className="border-b border-border-subtle bg-canvas px-4 py-3">
            <p className="text-xs font-semibold text-text-primary">
              Mô phỏng bảo mật phiên
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {controls.inactivity
                ? `Tự khóa sau ${controls.inactivity} phút không hoạt động`
                : "Phiên truy cập của bệnh nhân"}
            </p>
          </div>
          <div className="p-1">
            <button
              type="button"
              onClick={() => perform(controls.openAccountSecurity)}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary hover:bg-subsurface"
            >
              Bảo mật tài khoản
            </button>
            {controls.openStaffDirectory && (
              <button
                type="button"
                onClick={() => perform(controls.openStaffDirectory!)}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary hover:bg-subsurface"
              >
                Quản lý MFA nhân viên
              </button>
            )}
            {controls.inactivity && (
              <button
                type="button"
                onClick={() => perform(controls.simulateLock)}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary hover:bg-subsurface"
              >
                Mô phỏng khóa máy trạm
              </button>
            )}
            <button
              type="button"
              onClick={() => perform(controls.simulateExpiry)}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary hover:bg-subsurface"
            >
              Mô phỏng hết hạn phiên
            </button>
            <button
              type="button"
              onClick={() => perform(controls.checkAccess)}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary hover:bg-subsurface"
            >
              Kiểm tra quyền truy cập bệnh án
            </button>
          </div>
          <p className="border-t border-border-subtle px-4 py-3 text-xs leading-relaxed text-text-muted">
            Minh họa phía trình duyệt, không thay thế xác thực máy chủ.
          </p>
        </div>
      )}
    </div>
  )
}
