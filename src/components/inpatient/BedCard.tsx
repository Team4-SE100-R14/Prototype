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
import Tooltip from "../ui/Tooltip"

const STATE_STYLES = {
  empty: "border-bed-available-border bg-bed-available-bg/55",
  occupied: "border-bed-occupied-border bg-bed-occupied-bg/55",
  maintenance: "border-bed-maintenance-border bg-bed-maintenance-bg bed-maintenance-hatch",
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

  const alertHalo =
    bed.status === "occupied" && bed.alert === "critical"
      ? "border-2 !border-sptt-red-border shadow-[var(--halo-red-alert)]"
      : bed.status === "occupied" && bed.alert === "warning"
        ? "border-2 !border-sptt-yellow-border shadow-[var(--halo-yellow-alert)]"
        : ""

  return (
    <article
      className={`relative min-h-56 rounded-xl border p-4 shadow-clinical-xs interactive-peek transition-[border-color,box-shadow,background-color] duration-150 hover:shadow-clinical-sm ${
        STATE_STYLES[bed.status]
      } ${alertHalo}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="font-mono text-xs font-bold tracking-wide text-text-secondary">
            {bed.code}
          </div>
          <Tooltip
            content={
              bed.status === "empty"
                ? "Giường trống sẵn sàng tiếp nhận bệnh nhân nội trú mới"
                : bed.status === "occupied"
                  ? "Giường đang điều trị • Bệnh án nội trú liên kết hợp lệ"
                  : "Đang khử khuẩn / bảo trì buồng bệnh • Cần điều dưỡng xác nhận sẵn sàng"
            }
          >
            <div
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-heading text-xs font-semibold cursor-help ${
                bed.status === "empty"
                  ? "border-bed-available-border/40 bg-bed-available-bg text-bed-available"
                  : bed.status === "occupied"
                    ? "border-bed-occupied-border/40 bg-bed-occupied-bg text-bed-occupied"
                    : "border-bed-maintenance-border bg-surface text-bed-maintenance"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  bed.status === "empty"
                    ? "bg-bed-available-border"
                    : bed.status === "occupied"
                      ? "bg-bed-occupied-border"
                      : "bg-bed-maintenance-border"
                }`}
              />
              {bed.status === "empty"
                ? "Trống"
                : bed.status === "occupied"
                  ? "Đang sử dụng"
                  : "Bảo trì"}
            </div>
          </Tooltip>
        </div>
        {bed.status === "occupied" && record && (
          <div className="relative">
            <button
              type="button"
              aria-label="Mở tùy chọn giường"
              onClick={() => setMenu(!menu)}
              className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            >
              <NamedIcon name="more-vertical" className="size-4" />
            </button>
            {menu && (
              <div className="absolute right-0 top-9 z-40 w-36 overflow-hidden rounded-lg border border-border-subtle bg-surface-elevated py-1 shadow-clinical-md">
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false)
                    onViewRecord()
                  }}
                  className="w-full cursor-pointer px-3 py-2 text-left font-heading text-xs font-semibold text-text-secondary transition-colors hover:bg-subsurface"
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
                    className="w-full cursor-pointer px-3 py-2 text-left font-heading text-xs font-semibold text-text-secondary transition-colors hover:bg-subsurface"
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
          className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-bed-available-border/60 bg-surface/70 text-bed-available transition-colors duration-150 hover:border-bed-available-border hover:bg-bed-available-bg"
        >
          <NamedIcon name="bed" className="mb-2 size-7" />
          <span className="font-heading text-sm font-bold">Sẵn sàng</span>
          <span className="mt-1 text-xs text-bed-available">
            Chọn để xếp giường
          </span>
        </button>
      )}

      {bed.status === "occupied" && record && (
        <>
          {bed.alert && (
            <div className="absolute right-3 top-14 z-10">
              <Tooltip
                position="left"
                content={
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-100">
                      {bed.alert === "critical" ? "Nguy kịch (Cảnh báo đỏ)" : "Cảnh báo sớm (Vàng)"}
                    </p>
                    <p className="text-slate-300">{bed.alertText}</p>
                  </div>
                }
              >
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-surface shadow-clinical-md cursor-help ${
                    bed.alert === "critical"
                      ? "animate-alert-red bg-sptt-red-border"
                      : "animate-alert-yellow bg-sptt-yellow-border"
                  }`}
                >
                  <NamedIcon name="alert" className="size-4" />
                </div>
              </Tooltip>
            </div>
          )}
          <div className="mb-3 pr-8">
            <div className="font-heading text-base font-bold text-text-primary">
              {record.patientName}
            </div>
            <Tooltip content="Mã bệnh nhân & Số lưu trữ bệnh án nội trú">
              <div className="mt-1 font-mono text-xs font-semibold text-brand-deep cursor-help">
                {record.patientCode} · {record.id}
              </div>
            </Tooltip>
          </div>
          <div className="space-y-2 border-t border-border-subtle/80 pt-3 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <NamedIcon name="calendar" className="size-4 text-text-muted" />
              <span className="tabular-nums">Nhập viện: {record.admittedAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <NamedIcon name="stethoscope" className="size-4 text-text-muted" />
              <span>{record.doctor}</span>
            </div>
          </div>
        </>
      )}

      {bed.status === "maintenance" && (
        <div className="flex h-32 flex-col items-center justify-center text-center">
          <NamedIcon name="sparkles" className="mb-2 size-7 text-bed-maintenance" />
          <div className="font-heading text-sm font-semibold text-bed-maintenance">
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
