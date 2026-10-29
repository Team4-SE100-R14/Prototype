import { useState } from "react"
import type { Bed, InpatientRecord } from "../../lib/inpatient"
import Button from "../ui/Button"
import NamedIcon from "../ui/NamedIcon"
import FieldLabel from "../ui/FieldLabel"
import DialogShell, { ErrorBanner } from "./DialogShell"

const SELECT =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-cyan-600"

export default function AllocationDialog({
  record,
  freeBeds,
  initialBedCode,
  error,
  onClose,
  onConfirm,
}: {
  record: InpatientRecord
  freeBeds: Bed[]
  initialBedCode?: string
  error?: string
  onClose: () => void
  onConfirm: (bedCode: string) => void
}) {
  const [bedCode, setBedCode] = useState(
    freeBeds.some((bed) => bed.code === initialBedCode)
      ? (initialBedCode as string)
      : (freeBeds[0]?.code ?? ""),
  )
  const chosen = freeBeds.find((bed) => bed.code === bedCode)

  return (
    <DialogShell
      id="allocation"
      title="Xác nhận xếp giường"
      eyebrow="Xếp giường nội trú"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={!chosen} onClick={() => onConfirm(bedCode)}>
            Xác nhận xếp giường
          </Button>
        </>
      }
    >
      {error && <ErrorBanner title="Không thể xếp giường">{error}</ErrorBanner>}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Người bệnh
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-800">
                {record.patientName
                  .split(" ")
                  .slice(-2)
                  .map((word) => word[0])
                  .join("")}
              </div>
              <div>
                <div className="font-extrabold text-slate-900">
                  {record.patientName}
                </div>
                <div className="mt-1 text-sm font-bold text-cyan-700">
                  {record.id}
                </div>
                <div className="text-xs text-slate-500">{record.department}</div>
              </div>
            </div>
          </div>
          <div className="border-slate-200 sm:border-l sm:pl-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Giường chỉ định
            </div>
            {freeBeds.length === 0 ? (
              <p className="text-sm text-red-700">
                {record.department} hiện không còn giường trống.
              </p>
            ) : (
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <NamedIcon name="bed" />
                </div>
                <div className="min-w-0 flex-1">
                  <FieldLabel htmlFor="allocation-bed" required>
                    Giường trống
                  </FieldLabel>
                  <select
                    id="allocation-bed"
                    value={bedCode}
                    onChange={(event) => setBedCode(event.target.value)}
                    className={SELECT}
                  >
                    {freeBeds.map((bed) => (
                      <option key={bed.code} value={bed.code}>
                        {bed.code} · {bed.room}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Trống
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">
        Sau khi xác nhận, giường sẽ chuyển sang trạng thái Đang sử dụng và được
        liên kết với bệnh án nội trú của người bệnh.
      </p>
    </DialogShell>
  )
}
