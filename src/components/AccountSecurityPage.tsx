import { useState } from "react"
import type { AuthUser } from "../App"
import useMfaRegistry from "../hooks/useMfaRegistry"
import { availableCodes, readMfaState } from "../lib/mfaLifecycle"
import TopNav from "./TopNav"
import Button from "./ui/Button"
import Icon from "./ui/Icon"
import {
  NewRecoveryCodesModal,
  RecoveryStepUpModal,
} from "./RecoveryCodesModals"

export default function AccountSecurityPage({
  user,
  username,
  onLogout,
  onHome,
  validatePassword,
}: {
  user: AuthUser
  username: string
  onLogout: () => void
  onHome: () => void
  validatePassword: (password: string) => boolean
}) {
  const registry = useMfaRegistry()
  const state = registry[user.id] || readMfaState(user.id)
  const [stepUp, setStepUp] = useState(false)
  const [newCodes, setNewCodes] = useState<string[] | null>(null)
  const [completed, setCompleted] = useState(false)
  return (
    <div className="min-h-screen bg-canvas">
      <TopNav user={user} onLogout={onLogout} title="Bảo mật tài khoản" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-brand-deep">
              REQ-AUTH-05 · Bảo vệ tài khoản
            </p>
            <h1 className="font-display text-2xl font-semibold text-text-primary">
              Bảo mật tài khoản
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Quản lý xác thực đa yếu tố và mã khôi phục dự phòng.
            </p>
          </div>
          <Button variant="ghost" onClick={onHome}>
            Quay về Trang chủ của tôi
          </Button>
        </div>
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-surface text-brand-deep">
            <Icon>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-2a8 8 0 0116 0v2" />
            </Icon>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {user.name}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {username} · {user.department || "Tài khoản cá nhân"}
            </p>
          </div>
        </div>
        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-5">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Xác thực đa yếu tố (MFA)
            </h2>
            <span className="rounded-full bg-normal-bg px-3 py-1.5 text-xs font-semibold text-normal">
              Đang hoạt động · Mã thử nghiệm 481920
            </span>
          </div>
          <div className="space-y-5 p-5">
            <div className="flex items-start gap-3">
              <Icon className="mt-1 h-5 w-5 shrink-0 text-brand-deep">
                <path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </Icon>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Mã khôi phục dự phòng
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  Sử dụng khi mất thiết bị xác thực. Mỗi mã chỉ được dùng một
                  lần; tạo bộ mã mới sẽ hủy toàn bộ mã cũ.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border-subtle bg-canvas p-4">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {availableCodes(state)}/8 mã còn khả dụng
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {state.batch
                    ? `Bộ mã hiện tại: ${state.batch}`
                    : "Bạn chưa lưu bộ mã dự phòng nào."}
                </p>
              </div>
              <Button
                onClick={() => {
                  setCompleted(false)
                  setStepUp(true)
                }}
              >
                Tạo lại mã khôi phục dự phòng
              </Button>
            </div>
            {completed && (
              <p
                role="status"
                className="rounded-lg bg-normal-bg p-3 text-sm text-normal"
              >
                Đã hoàn tất cấp lại mã khôi phục và xác nhận sao lưu an toàn.
              </p>
            )}
            <p className="text-xs leading-relaxed text-text-muted">
              Chế độ prototype: dùng mật khẩu tài khoản hiện tại và mã OTP
              481920. Các chức năng bảo mật được mô phỏng phía trình duyệt.
            </p>
          </div>
        </section>
      </main>
      {stepUp && (
        <RecoveryStepUpModal
          userId={user.id}
          validatePassword={validatePassword}
          onClose={() => setStepUp(false)}
          onGenerated={(codes) => {
            setStepUp(false)
            setNewCodes(codes)
          }}
        />
      )}
      {newCodes && (
        <NewRecoveryCodesModal
          codes={newCodes}
          username={username}
          onDone={() => {
            setNewCodes(null)
            setCompleted(true)
          }}
        />
      )}
    </div>
  )
}
