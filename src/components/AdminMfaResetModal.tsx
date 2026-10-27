import { useState, type FormEvent } from "react"
import type { AuthUser } from "../App"
import {
  availableCodes,
  readMfaState,
  resetMfa,
  type StaffAccount,
} from "../lib/mfaLifecycle"
import Button from "./ui/Button"
import Modal from "./ui/Modal"
import { SecurityAlert, SecurityDialogHeader } from "./ui/SecurityDialog"
import { TextArea } from "./ui/TextInput"

export default function AdminMfaResetModal({
  actor,
  target,
  onClose,
  onReset,
}: {
  actor: AuthUser
  target: StaffAccount
  onClose: () => void
  onReset: () => void
}) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const selfReset = actor.id === target.user.id
  const state = readMfaState(target.user.id)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (
      busy ||
      selfReset ||
      actor.role !== "admin" ||
      reason.trim().length < 10
    )
      return
    setBusy(true)
    try {
      resetMfa(actor, target, reason)
      onReset()
    } catch (failure) {
      setBusy(false)
      setError(
        failure instanceof Error
          ? failure.message
          : "Không thể đặt lại MFA. Vui lòng thử lại.",
      )
    }
  }
  return (
    <Modal titleId="admin-reset-title" onClose={onClose}>
      <SecurityDialogHeader
        titleId="admin-reset-title"
        title="Đặt lại xác thực đa yếu tố (Administrative MFA Reset)"
        onClose={onClose}
      />
      <form onSubmit={submit}>
        <div className="space-y-5 p-6">
          <div className="space-y-2 rounded-lg border border-border-subtle bg-subsurface p-4 text-sm leading-relaxed text-text-secondary">
            <p>
              <strong>Nhân viên y tế:</strong> {target.user.name} (
              {target.username})
            </p>
            <p>
              <strong>Mã nhân viên:</strong> {target.employeeId} | Khoa:{" "}
              {target.department}
            </p>
            <p>
              <strong>Trạng thái MFA hiện tại:</strong>{" "}
              {state.needsSetup ? "Chưa thiết lập lại" : "Đã bật"} (
              {state.needsSetup
                ? "Khóa bí mật đã thu hồi"
                : "Khóa bí mật đã cấp"}
              , {availableCodes(state)}/8 mã dự phòng còn lại)
            </p>
          </div>
          <SecurityAlert tone="warning">
            Hành động này sẽ xóa toàn bộ khóa bí mật TOTP và hủy bỏ mọi mã phục
            hồi còn lại. Toàn bộ phiên làm việc của nhân viên trên mọi thiết bị
            sẽ bị chấm dứt ngay lập tức. Nhân viên sẽ bị buộc phải thiết lập lại
            MFA từ đầu ở lần đăng nhập tiếp theo.
          </SecurityAlert>
          {selfReset && (
            <SecurityAlert tone="danger">
              Quản trị viên không thể tự đặt lại MFA cho chính mình (Self-Reset
              Denial). Phải do một Quản trị viên khác thực hiện.
            </SecurityAlert>
          )}
          <div>
            <label
              htmlFor="mfa-reset-reason"
              className="mb-2 block text-sm font-medium text-text-secondary"
            >
              Lý do quản trị viên đặt lại MFA (Bắt buộc tối thiểu 10 ký tự)
            </label>
            <TextArea
              id="mfa-reset-reason"
              data-initial-focus
              rows={4}
              minLength={10}
              maxLength={250}
              required
              value={reason}
              disabled={selfReset}
              onChange={(event) => {
                setReason(event.target.value)
                setError("")
              }}
              placeholder="Nhập lý do xác minh danh tính trực tiếp ngoại tuyến, vd: Bác sĩ Đạt mất điện thoại tại ca trực, đã đối chiếu CCCD và cấp lại"
              aria-describedby="mfa-reason-count"
            />
            <p
              id="mfa-reason-count"
              className="mt-2 text-right font-mono text-xs text-text-muted"
            >
              {reason.length} / 250 ký tự
            </p>
          </div>
          {error && <SecurityAlert tone="danger">{error}</SecurityAlert>}
          <p className="text-xs leading-relaxed text-text-muted">
            Prototype chấm dứt các phiên trong cùng trình duyệt và yêu cầu thiết
            lập lại MFA. Thu hồi trên mọi thiết bị cần máy chủ xác thực.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={
              busy ||
              selfReset ||
              actor.role !== "admin" ||
              reason.trim().length < 10
            }
          >
            {busy
              ? "Đang đặt lại…"
              : "Xác nhận đặt lại MFA & Hủy phiên làm việc"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
