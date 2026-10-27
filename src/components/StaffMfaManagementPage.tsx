import { useState } from "react"
import type { AuthUser } from "../App"
import useMfaRegistry from "../hooks/useMfaRegistry"
import {
  availableCodes,
  readMfaState,
  type StaffAccount,
} from "../lib/mfaLifecycle"
import AdminMfaResetModal from "./AdminMfaResetModal"
import TopNav from "./TopNav"
import Button from "./ui/Button"
import { SecurityAlert } from "./ui/SecurityDialog"

export default function StaffMfaManagementPage({
  user,
  staff,
  onLogout,
  onHome,
}: {
  user: AuthUser
  staff: StaffAccount[]
  onLogout: () => void
  onHome: () => void
}) {
  const registry = useMfaRegistry()
  const [target, setTarget] = useState<StaffAccount | null>(null)
  const [notice, setNotice] = useState("")
  const [query, setQuery] = useState("")
  const roles: Record<string, string> = {
    admin: "Quản trị viên",
    physician: "Bác sĩ",
    nurse: "Điều dưỡng",
    paraclinical_tech: "KTV Cận lâm sàng",
    receptionist: "Tiếp đón",
  }
  if (user.role !== "admin") return null
  const list = staff.filter((account) =>
    `${account.user.name} ${account.username} ${account.employeeId}`
      .toLocaleLowerCase("vi")
      .includes(query.toLocaleLowerCase("vi")),
  )
  return (
    <div className="min-h-screen bg-canvas">
      <TopNav user={user} onLogout={onLogout} title="Quản lý MFA nhân viên" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-brand-deep">
              REQ-AUTH-05 · Quản trị bảo mật
            </p>
            <h1 className="font-display text-2xl font-semibold text-text-primary">
              Quản lý MFA nhân viên
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Đặt lại xác thực khi nhân viên mất thiết bị và không còn mã khôi
              phục.
            </p>
          </div>
          <Button variant="ghost" onClick={onHome}>
            Quay về Trang chủ của tôi
          </Button>
        </div>
        <div className="mb-5">
          <SecurityAlert tone="warning">
            Chỉ đặt lại MFA sau khi xác minh trực tiếp danh tính nhân viên. Thao
            tác này thu hồi mã cũ và chấm dứt các phiên đang hoạt động.
          </SecurityAlert>
        </div>
        {notice && (
          <p
            role="status"
            className="mb-5 rounded-lg bg-normal-bg p-4 text-sm text-normal"
          >
            {notice}
          </p>
        )}
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="border-b border-border-subtle p-4">
            <label
              htmlFor="staff-mfa-query"
              className="mb-2 block text-xs font-medium text-text-secondary"
            >
              Tìm nhân viên
            </label>
            <input
              id="staff-mfa-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nhập họ tên, tên đăng nhập hoặc mã nhân viên"
              className="w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-canvas text-xs text-text-muted">
                <tr>
                  {[
                    "Nhân viên y tế",
                    "Khoa / Vai trò",
                    "Trạng thái MFA",
                    "Thao tác",
                  ].map((label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap px-5 py-3 font-semibold"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((account) => {
                  const state =
                    registry[account.user.id] || readMfaState(account.user.id)
                  const own = account.user.id === user.id
                  return (
                    <tr
                      key={account.user.id}
                      className="border-b border-border-subtle last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-text-primary">
                          {account.user.name}
                        </p>
                        <p className="mt-1 font-mono text-xs text-text-muted">
                          {account.username} · {account.employeeId}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-text-secondary">
                        <p>{account.department}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {roles[account.user.role]}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                            state.needsSetup
                              ? "bg-warning-bg text-warning"
                              : "bg-normal-bg text-normal"
                          }`}
                        >
                          {state.needsSetup ? "Cần thiết lập lại" : "Đã bật"}
                        </span>
                        <p className="mt-2 whitespace-nowrap font-mono text-xs text-text-muted">
                          {availableCodes(state)}/8 mã còn lại
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Button
                          variant="danger"
                          className="whitespace-nowrap"
                          disabled={own}
                          title={
                            own
                              ? "Quản trị viên không thể tự đặt lại MFA cho chính mình."
                              : undefined
                          }
                          onClick={() => {
                            setNotice("")
                            setTarget(account)
                          }}
                        >
                          Đặt lại MFA (Reset MFA)
                        </Button>
                        {own && (
                          <p className="mt-2 max-w-xs text-xs leading-relaxed text-critical">
                            Quản trị viên không thể tự đặt lại MFA cho chính
                            mình (Self-Reset Denial). Phải do một Quản trị viên
                            khác thực hiện.
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!list.length && (
              <p className="p-6 text-center text-sm text-text-muted">
                Không tìm thấy nhân viên phù hợp.
              </p>
            )}
          </div>
        </div>
      </main>
      {target && (
        <AdminMfaResetModal
          actor={user}
          target={target}
          onClose={() => setTarget(null)}
          onReset={() => {
            setNotice(
              `Đã đặt lại MFA cho ${target.user.name}. Các phiên đã bị thu hồi; nhân viên phải thiết lập lại ở lần đăng nhập tiếp theo.`,
            )
            setTarget(null)
          }}
        />
      )}
    </div>
  )
}
