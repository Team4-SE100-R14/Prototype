import { Clock } from "lucide-react"
import Button from "./ui/Button"
import Modal from "./ui/Modal"

const keepWarning = () => {}

export default function SessionExpiryModal({
  seconds,
  onLogout,
  onRenew,
}: {
  seconds: number
  onLogout: () => void
  onRenew: () => void
}) {
  return (
    <Modal
      titleId="expiry-title"
      descriptionId="expiry-description"
      onClose={keepWarning}
      dismissible={false}
    >
      <div className="flex items-start gap-3 border-b border-border-subtle px-6 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-warning">
          <Clock aria-hidden="true" strokeWidth={1.75} className="h-6 w-6" />
        </div>
        <h2
          id="expiry-title"
          className="pt-1 font-display text-lg font-semibold text-text-primary"
        >
          Cảnh báo phiên làm việc sắp hết hạn
        </h2>
      </div>
      <div className="space-y-5 p-6 sm:p-8">
        <p
          role="timer"
          className="rounded-lg border border-warning/20 bg-warning-bg px-4 py-3 text-sm font-medium leading-relaxed text-warning"
        >
          Phiên làm việc sẽ kết thúc sau:{" "}
          <strong className="font-mono">{seconds} giây</strong> do hết hạn
          Access Token.
        </p>
        <p
          id="expiry-description"
          className="text-sm leading-relaxed text-text-secondary"
        >
          Bạn có muốn tiếp tục làm việc và gia hạn phiên bảo mật?
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onLogout}>
          Đăng xuất ngay
        </Button>
        <Button onClick={onRenew}>Gia hạn phiên làm việc</Button>
      </div>
    </Modal>
  )
}
