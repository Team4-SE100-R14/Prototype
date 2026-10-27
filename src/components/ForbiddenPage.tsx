import type { AuthUser, UserRole } from "../App"
import TopNav from "./TopNav"
import Button from "./ui/Button"
import Icon from "./ui/Icon"

const ROLES: Record<UserRole, string> = {
  admin: "Quản trị viên (Admin)",
  physician: "Bác sĩ điều trị (Doctor)",
  nurse: "Điều dưỡng (Nurse)",
  paraclinical_tech: "KTV Cận lâm sàng",
  receptionist: "Tiếp đón",
  patient: "Bệnh nhân",
}

export default function ForbiddenPage({
  user,
  onLogout,
  onHome,
  auditSaved,
}: {
  user: AuthUser
  onLogout: () => void
  onHome: () => void
  auditSaved: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav
        user={user}
        onLogout={onLogout}
        title="Kiểm soát quyền truy cập"
      />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <section
          aria-labelledby="forbidden-title"
          className="w-full max-w-2xl rounded-xl border border-border-subtle bg-surface p-6 text-center shadow-sm sm:p-8"
        >
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-critical-bg text-critical">
            <Icon className="h-11 w-11">
              <path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3z" />
              <rect x="8" y="10" width="8" height="6" rx="1" />
              <path d="M10 10V8a2 2 0 014 0v2" />
            </Icon>
            <span className="absolute bottom-0 right-0 rounded-full border-4 border-surface bg-critical text-surface">
              <Icon className="h-5 w-5">
                <path d="M12 6v7m0 4h.01" />
              </Icon>
            </span>
          </div>
          <h1
            id="forbidden-title"
            className="font-display text-2xl font-semibold text-text-primary"
          >
            403 - Từ chối truy cập (Access Denied)
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Tài khoản của bạn không có quyền truy cập chức năng này.
          </p>
          <div className="mt-6 space-y-4 rounded-lg border border-border-subtle bg-canvas p-5 text-left text-sm leading-relaxed text-text-secondary">
            <p>
              <span className="font-semibold">Tài khoản:</span> {user.name} -
              Vai trò: {ROLES[user.role]}
            </p>
            <p>
              <span className="font-semibold">Yêu cầu quyền hạn:</span> Bác sĩ
              điều trị (Doctor) hoặc Quản trị viên (Admin)
            </p>
            <p>
              <span className="font-semibold">Chính sách:</span> Hệ thống áp
              dụng Default-Deny (SEC-RBAC-01). Mọi truy cập trái thẩm quyền đều
              được ghi log vào NhatKyHeThong.
            </p>
          </div>
          {!auditSaved && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-critical-bg p-3 text-sm text-critical"
            >
              Không thể lưu nhật ký trên trình duyệt này. Truy cập vẫn bị từ
              chối.
            </p>
          )}
          <Button onClick={onHome} className="mt-6 w-full sm:w-auto">
            Quay về Trang chủ của tôi
          </Button>
          <p className="mt-5 text-xs text-text-muted">
            Minh họa phân quyền và nhật ký phía trình duyệt.
          </p>
        </section>
      </main>
    </div>
  )
}
