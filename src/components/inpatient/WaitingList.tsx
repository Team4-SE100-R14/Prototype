import { canAllocate, type InpatientRecord } from "../../lib/inpatient"
import type { UserRole } from "../../App"
import Button from "../ui/Button"
import NamedIcon from "../ui/NamedIcon"

export default function WaitingList({
  collapsed,
  onToggle,
  records,
  role,
  onAllocate,
}: {
  collapsed: boolean
  onToggle: () => void
  records: InpatientRecord[]
  role: UserRole
  onAllocate: (record: InpatientRecord) => void
}) {
  return (
    <aside
      className={`shrink-0 self-start rounded-xl border border-slate-200 bg-white shadow-sm transition-all ${
        collapsed ? "w-16" : "w-full xl:w-80"
      }`}
    >
      <div
        className={`flex items-center border-b border-slate-200 p-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <div>
            <h2 className="font-extrabold text-slate-900">Chờ xếp giường</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {records.length} người bệnh đang chờ
            </p>
          </div>
        )}
        <button
          type="button"
          aria-label={collapsed ? "Mở danh sách chờ" : "Thu gọn danh sách chờ"}
          onClick={onToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <NamedIcon
            name="chevron"
            className={`size-5 transition ${collapsed ? "" : "rotate-180"}`}
          />
        </button>
      </div>
      {!collapsed && (
        <div className="space-y-3 p-3">
          {records.length === 0 && (
            <div className="rounded-lg bg-slate-50 py-8 text-center text-xs text-slate-500">
              Không có người bệnh nào đang chờ xếp giường.
            </div>
          )}
          {records.map((record) => (
            <article
              key={record.id}
              className="rounded-lg border border-slate-200 p-3 transition hover:border-cyan-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-bold text-cyan-700">
                  {record.patientName
                    .split(" ")
                    .slice(-2)
                    .map((word) => word[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-900">
                    {record.patientName}
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-cyan-700">
                    {record.id}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <div>{record.department}</div>
                <div>Nhập viện: {record.admittedAt}</div>
              </div>
              <Button
                variant="secondary"
                disabled={!canAllocate(role)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 !py-2 text-xs"
                onClick={() => onAllocate(record)}
              >
                <NamedIcon name="bed" className="size-4" />
                Xếp giường
              </Button>
            </article>
          ))}
        </div>
      )}
    </aside>
  )
}
