import { useState } from "react"
import {
  treatmentDays,
  type DischargeInput,
  type InpatientRecord,
} from "../../lib/inpatient"
import Button from "../ui/Button"
import FieldLabel from "../ui/FieldLabel"
import NamedIcon from "../ui/NamedIcon"
import DialogShell, { ErrorBanner } from "./DialogShell"

const CONTROL =
  "w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-800 outline-none focus:border-cyan-600 focus:ring-3 focus:ring-cyan-100"

export default function DischargeModal({
  record,
  error,
  onClose,
  onConfirm,
}: {
  record: InpatientRecord
  error?: string
  onClose: () => void
  onConfirm: (input: DischargeInput) => void
}) {
  const [condition, setCondition] = useState("")
  const [conclusion, setConclusion] = useState("")
  const [instructions, setInstructions] = useState("")
  const [followUpDate, setFollowUpDate] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const valid =
    confirmed &&
    condition &&
    conclusion.trim().length > 0 &&
    instructions.trim().length > 0 &&
    followUpDate
  const days = treatmentDays(record)

  return (
    <DialogShell
      id="discharge"
      title="Hoàn tất xuất viện"
      eyebrow="Kết thúc điều trị nội trú"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!valid}
            onClick={() =>
              onConfirm({
                condition,
                conclusion: conclusion.trim(),
                instructions: instructions.trim(),
                followUpDate,
              })
            }
          >
            Xác nhận xuất viện
          </Button>
        </>
      }
    >
      {error && <ErrorBanner title="Không thể xuất viện">{error}</ErrorBanner>}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-5">
        {[
          ["Bệnh án", record.id],
          ["Người bệnh", record.patientName],
          ["Giường bệnh", record.bedCode ?? "—"],
          ["Ngày nhập viện", record.admittedAt.slice(0, 10)],
          ["Thời gian điều trị", days ? `${days} ngày` : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-xs font-medium text-slate-500">{label}</div>
            <div className="mt-1.5 text-sm font-bold leading-5 text-slate-800">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <FieldLabel htmlFor="discharge-condition" required>
            Tình trạng ra viện
          </FieldLabel>
          <select
            id="discharge-condition"
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className={`${CONTROL} h-11 px-3`}
          >
            <option value="">Chọn tình trạng ra viện</option>
            <option>Khỏi</option>
            <option>Đỡ / Giảm</option>
            <option>Không thay đổi</option>
            <option>Nặng hơn</option>
            <option>Chuyển viện</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="discharge-conclusion" required>
            Kết luận điều trị
          </FieldLabel>
          <textarea
            id="discharge-conclusion"
            value={conclusion}
            onChange={(event) => setConclusion(event.target.value)}
            rows={3}
            placeholder="Tóm tắt kết quả điều trị và tình trạng người bệnh khi ra viện..."
            className={`${CONTROL} resize-none p-3 leading-6 placeholder:text-slate-400`}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
          <div>
            <FieldLabel htmlFor="discharge-instructions" required>
              Lời dặn / Hướng dẫn tái khám
            </FieldLabel>
            <textarea
              id="discharge-instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={3}
              placeholder="Hướng dẫn dùng thuốc, chăm sóc và dấu hiệu cần tái khám sớm..."
              className={`${CONTROL} resize-none p-3 leading-6 placeholder:text-slate-400`}
            />
          </div>
          <div>
            <FieldLabel htmlFor="discharge-followup" required>
              Ngày tái khám
            </FieldLabel>
            <input
              id="discharge-followup"
              type="date"
              value={followUpDate}
              onChange={(event) => setFollowUpDate(event.target.value)}
              className={`${CONTROL} h-11 px-3`}
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Ngày sẽ được hiển thị theo định dạng ngày/tháng/năm.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50/50 p-4 text-sm leading-6 text-red-800">
        <NamedIcon name="alert" className="mt-0.5 size-5 shrink-0" />
        <p>
          Sau khi xác nhận, bệnh án sẽ bị khóa vĩnh viễn ở chế độ chỉ đọc. Giường
          bệnh sẽ chuyển sang trạng thái Bảo trì.
        </p>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-cyan-300">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 size-4 accent-cyan-700"
        />
        <span className="text-sm font-semibold leading-5 text-slate-700">
          Tôi xác nhận thông tin xuất viện là chính xác
        </span>
      </label>
    </DialogShell>
  )
}
