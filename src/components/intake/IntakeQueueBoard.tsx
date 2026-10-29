import { useState, type FormEvent } from "react"
import type { AuthUser } from "../../App"
import useIntakeQueue from "../../hooks/useIntakeQueue"
import {
  destinationLabel,
  enqueueEncounter,
  formatWait,
  startConsultation,
  validateIntake,
  type Acuity,
} from "../../lib/intakeQueue"
import Button from "../ui/Button"
import Modal from "../ui/Modal"
import { TextInput } from "../ui/TextInput"
import IntakeTriagePanel, { type TriageValue } from "./IntakeTriagePanel"

type Filter = "all" | Acuity

const EMPTY = {
  maBenhNhan: "BN-26-",
  hoTen: "",
  complaint: "",
  acuity: "" as TriageValue["acuity"],
  clinic: "",
}

function QuickIntakeModal({
  user,
  onClose,
  onDone,
}: {
  user: AuthUser
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input = {
      maBenhNhan: form.maBenhNhan,
      hoTen: form.hoTen,
      lyDoKham: form.complaint,
      acuity: form.acuity,
      clinic: form.clinic,
    }
    const found = validateIntake(input, { requirePatient: true })
    setErrors(found)
    if (Object.keys(found).length) return
    const created = enqueueEncounter(input, user)
    if (!created) return
    onDone(
      created.acuity === "EMERGENCY"
        ? `Đã đưa ${created.hoTen} vào ${destinationLabel(created)} với ưu tiên 1 và gửi thông báo tức thì.`
        : `Đã đưa ${created.hoTen} vào hàng đợi ${destinationLabel(created)} (STT ${created.soThuTu}).`,
    )
  }
  return (
    <Modal titleId="quick-intake-title" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="border-b border-border-subtle p-5">
          <h2
            id="quick-intake-title"
            className="font-display text-lg font-semibold text-text-primary"
          >
            Tiếp nhận nhanh &amp; phân loại tuyến khám
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Phân loại nhị phân (cấp cứu / không cấp cứu) chỉ dùng để định tuyến
            hàng đợi, không kích hoạt cảnh báo sinh hiệu nội trú.
          </p>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="quick-id"
                className="mb-1.5 block text-xs font-semibold text-text-secondary"
              >
                Mã bệnh nhân (BN-YY-xxxx) <span className="text-critical">*</span>
              </label>
              <TextInput
                id="quick-id"
                data-initial-focus
                value={form.maBenhNhan}
                onChange={(event) =>
                  setForm({ ...form, maBenhNhan: event.target.value.toUpperCase() })
                }
                aria-invalid={!!errors.maBenhNhan}
                className={`font-mono ${errors.maBenhNhan ? "border-critical" : ""}`}
              />
              {errors.maBenhNhan && (
                <p className="mt-1.5 text-xs font-medium text-critical">
                  {errors.maBenhNhan}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="quick-name"
                className="mb-1.5 block text-xs font-semibold text-text-secondary"
              >
                Họ và tên <span className="text-critical">*</span>
              </label>
              <TextInput
                id="quick-name"
                value={form.hoTen}
                onChange={(event) => setForm({ ...form, hoTen: event.target.value })}
                aria-invalid={!!errors.hoTen}
                className={errors.hoTen ? "border-critical" : ""}
              />
              {errors.hoTen && (
                <p className="mt-1.5 text-xs font-medium text-critical">{errors.hoTen}</p>
              )}
            </div>
          </div>
          <IntakeTriagePanel
            idPrefix="quick"
            value={form}
            errors={errors}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-canvas p-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} className="border border-border-subtle">
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={!form.acuity}>
            Lưu &amp; Đưa vào hàng đợi
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Live intake queue (PhieuKham) for clinical staff: emergency first, then FIFO.
export default function IntakeQueueBoard({ user }: { user: AuthUser }) {
  const queue = useIntakeQueue()
  const [filter, setFilter] = useState<Filter>("all")
  const [quickOpen, setQuickOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const waiting = queue.filter((item) => item.status === "DangCho")
  const visible = queue.filter((item) => filter === "all" || item.acuity === filter)
  const count = (acuity: Acuity) =>
    waiting.filter((item) => item.acuity === acuity).length
  const tabs: Array<{ id: Filter; label: string }> = [
    { id: "all", label: `Tất cả (${waiting.length} đang chờ)` },
    { id: "EMERGENCY", label: `Cấp cứu (${count("EMERGENCY")})` },
    { id: "NON_EMERGENCY", label: `Ngoại trú (${count("NON_EMERGENCY")})` },
  ]

  return (
    <section
      className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm"
      aria-labelledby="intake-board-title"
    >
      <div className="border-b border-border-subtle p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="intake-board-title"
              className="font-display text-base font-semibold text-text-primary"
            >
              Hàng đợi tiếp nhận (phiếu khám)
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Cấp cứu (ưu tiên 1) luôn đứng trước; ngoại trú xếp FIFO theo số
              thứ tự.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-normal/20 bg-normal-bg px-3 py-1.5 text-xs font-semibold text-normal">
              <span className="h-2 w-2 animate-pulse rounded-full bg-normal" />
              SSE trực tiếp
            </span>
            <Button onClick={() => setQuickOpen(true)}>+ Tiếp nhận nhanh</Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Lọc hàng đợi tiếp nhận">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`shrink-0 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                filter === tab.id
                  ? "border-brand-primary bg-brand-surface text-brand-deep"
                  : "border-border-subtle text-text-muted hover:bg-subsurface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {notice && (
          <p role="status" className="mt-3 rounded-lg border border-info/20 bg-info-bg p-3 text-sm text-info">
            {notice}
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-4xl text-left text-sm">
          <thead className="border-b border-border-subtle bg-canvas">
            <tr>
              {["STT / Mã BN", "Họ và tên", "Lý do khám", "Phân loại", "Khoa / Phòng", "Chờ", "Trạng thái", "Thao tác"].map(
                (column) => (
                  <th key={column} className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-text-muted">
                    {column}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr
                key={item.id}
                className={`border-b border-border-subtle last:border-0 ${
                  item.acuity === "EMERGENCY" ? "bg-critical-bg/40" : "hover:bg-canvas"
                }`}
              >
                <td className="whitespace-nowrap px-4 py-4 font-mono font-semibold text-text-primary">
                  {String(item.soThuTu).padStart(2, "0")} - {item.maBenhNhan}
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-semibold text-text-primary">{item.hoTen}</td>
                <td className="min-w-48 px-4 py-4 text-xs text-text-secondary">{item.lyDoKham}</td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.acuity === "EMERGENCY" ? "bg-critical text-surface" : "bg-info-bg text-info"
                    }`}
                  >
                    {item.acuity === "EMERGENCY" ? "CẤP CỨU · ƯT 1" : "NGOẠI TRÚ · ƯT 2"}
                  </span>
                </td>
                <td className="min-w-40 px-4 py-4 text-xs text-text-secondary">{destinationLabel(item)}</td>
                <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-text-muted">
                  {formatWait(item.createdAt)}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.status === "DangCho" ? "bg-warning-bg text-warning" : "bg-normal-bg text-normal"
                    }`}
                  >
                    {item.status === "DangCho" ? "Đang chờ" : "Đang khám"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <Button
                    disabled={item.status !== "DangCho"}
                    onClick={() => {
                      if (startConsultation(item.id, user))
                        setNotice(`Đã chuyển ${item.hoTen} sang trạng thái Đang khám.`)
                    }}
                    className="px-3 py-2 text-xs"
                  >
                    Bắt đầu khám
                  </Button>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-text-muted">
                  Không có bệnh nhân trong hàng đợi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {quickOpen && (
        <QuickIntakeModal
          user={user}
          onClose={() => setQuickOpen(false)}
          onDone={(message) => {
            setNotice(message)
            setQuickOpen(false)
          }}
        />
      )}
    </section>
  )
}
