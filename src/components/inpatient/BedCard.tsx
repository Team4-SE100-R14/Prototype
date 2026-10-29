import { useState } from "react"
import {
  canMarkBedReady,
  canTransfer,
  type Bed,
  type InpatientRecord,
} from "../../lib/inpatient"
import type { UserRole } from "../../App"
import Button from "../ui/Button"
import NamedIcon from "../ui/NamedIcon"

const STATE_STYLES = {
  empty: "border-emerald-200 bg-emerald-50/35",
  occupied: "border-blue-200 bg-white",
  maintenance: "border-slate-200 bg-slate-50",
}

export default function BedCard({
  bed,
  record,
  role,
  onPickEmpty,
  onViewRecord,
  onTransfer,
  onMarkReady,
}: {
  bed: Bed
  record?: InpatientRecord
  role: UserRole
  onPickEmpty: () => void
  onViewRecord: () => void
  onTransfer: () => void
  onMarkReady: () => void
}) {
  const [menu, setMenu] = useState(false)

  return (
    <article
      className={`relative min-h-56 rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
        STATE_STYLES[bed.status]
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-xs font-bold tracking-wide text-slate-500">
            {bed.code}
          </div>
          <div
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              bed.status === "empty"
                ? "bg-emerald-100 text-emerald-700"
                : bed.status === "occupied"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-200 text-slate-600"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                bed.status === "empty"
                  ? "bg-emerald-500"
                  : bed.status === "occupied"
                    ? "bg-blue-500"
                    : "bg-slate-400"
              }`}
            />
            {bed.status === "empty"
              ? "Trống"
              : bed.status === "occupied"
                ? "Đang sử dụng"
                : "Bảo trì"}
          </div>
        </div>
        {bed.status === "occupied" && record && (
          <div className="relative">
            <button
              type="button"
              aria-label="Mở tùy chọn giường"
              onClick={() => setMenu(!menu)}
              className="rounded-lg px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ⋮
            </button>
            {menu && (
              <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false)
                    onViewRecord()
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Xem bệnh án
                </button>
                {canTransfer(role) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false)
                      onTransfer()
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Chuyển giường
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {bed.status === "empty" && (
        <button
          type="button"
          onClick={onPickEmpty}
          className="flex h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed border-emerald-200 text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
        >
          <NamedIcon name="bed" className="mb-2 size-8" />
          <span className="text-sm font-bold">Sẵn sàng</span>
          <span className="mt-1 text-xs text-emerald-600">
            Chọn để xếp giường
          </span>
        </button>
      )}

      {bed.status === "occupied" && record && (
        <>
          {bed.alert && (
            <div className="group absolute right-3 top-14 z-10">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-white shadow-lg ${
                  bed.alert === "critical"
                    ? "animate-alert-red bg-red-500"
                    : "animate-alert-yellow bg-amber-500"
                }`}
              >
                <NamedIcon name="alert" className="size-4" />
              </div>
              <div className="pointer-events-none absolute right-0 top-10 w-max max-w-48 translate-y-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">
                {bed.alert === "critical" ? "Nguy kịch" : "Cảnh báo"}:{" "}
                {bed.alertText}
              </div>
            </div>
          )}
          <div className="mb-3 pr-8">
            <div className="text-base font-extrabold text-slate-900">
              {record.patientName}
            </div>
            <div className="mt-1 text-xs font-bold text-cyan-700">
              {record.patientCode} · {record.id}
            </div>
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <NamedIcon name="calendar" className="size-4 text-slate-400" />
              <span>Nhập viện: {record.admittedAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <NamedIcon name="stethoscope" className="size-4 text-slate-400" />
              <span>{record.doctor}</span>
            </div>
          </div>
        </>
      )}

      {bed.status === "maintenance" && (
        <div className="flex h-32 flex-col items-center justify-center text-center">
          <NamedIcon name="bed" className="mb-2 size-8 text-slate-400" />
          <div className="text-sm font-semibold text-slate-600">
            {bed.maintenance}
          </div>
          <Button
            variant="secondary"
            className="mt-3 !px-3 !py-2 text-xs"
            title={
              canMarkBedReady(role)
                ? undefined
                : "Chỉ điều dưỡng được đổi trạng thái giường"
            }
            onClick={onMarkReady}
          >
            Đánh dấu sẵn sàng
          </Button>
        </div>
      )}
    </article>
  )
}
