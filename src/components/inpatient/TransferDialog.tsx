import { useState } from "react"
import {
  DEPARTMENTS,
  type Bed,
  type Department,
  type InpatientRecord,
} from "../../lib/inpatient"
import Button from "../ui/Button"
import FieldLabel from "../ui/FieldLabel"
import NamedIcon from "../ui/NamedIcon"
import DialogShell, { ErrorBanner } from "./DialogShell"

const SELECT =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600"

export default function TransferDialog({
  record,
  currentBed,
  freeBeds,
  error,
  onClose,
  onConfirm,
}: {
  record: InpatientRecord
  currentBed?: Bed
  freeBeds: Bed[]
  error?: string
  onClose: () => void
  onConfirm: (bedCode: string) => void
}) {
  const [department, setDepartment] = useState<Department>(record.department)
  const [bedCode, setBedCode] = useState("")
  const options = freeBeds.filter((bed) => bed.department === department)

  return (
    <DialogShell
      id="transfer"
      title="Chuyển giường / Chuyển khoa"
      eyebrow="Điều phối nội trú"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!department || !bedCode}
            onClick={() => onConfirm(bedCode)}
          >
            Xác nhận chuyển giường
          </Button>
        </>
      }
    >
      {error && (
        <ErrorBanner title="Giường không còn khả dụng">{error}</ErrorBanner>
      )}

      <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Giường hiện tại
          </div>
          <div className="mt-4 flex gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <NamedIcon name="bed" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">
                {currentBed?.code ?? record.bedCode}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {currentBed?.room}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                {record.department} · {record.patientName}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center text-cyan-700">
          <div className="rounded-full bg-cyan-50 p-2">
            <NamedIcon name="arrow" />
          </div>
        </div>

        <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-cyan-700">
            Giường mới
          </div>
          <div className="mt-4">
            <FieldLabel htmlFor="transfer-department" required>
              Khoa chuyển đến
            </FieldLabel>
            <select
              id="transfer-department"
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value as Department)
                setBedCode("")
              }}
              className={SELECT}
            >
              {DEPARTMENTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <FieldLabel htmlFor="transfer-bed" required>
              Giường trống
            </FieldLabel>
            <select
              id="transfer-bed"
              value={bedCode}
              onChange={(event) => setBedCode(event.target.value)}
              className={SELECT}
            >
              <option value="">Chọn giường trống</option>
              {options.map((bed) => (
                <option key={bed.code} value={bed.code}>
                  {bed.code} · {bed.room}
                </option>
              ))}
            </select>
            {options.length === 0 && (
              <p className="mt-2 text-xs text-red-700">
                {department} hiện không còn giường trống.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
        <NamedIcon name="alert" className="mt-0.5 size-5 shrink-0" />
        <p>
          Giường cũ sẽ chuyển sang trạng thái <strong>Bảo trì</strong> để chờ vệ
          sinh.
        </p>
      </div>
    </DialogShell>
  )
}
