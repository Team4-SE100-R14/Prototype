import { useState } from "react"
import type { AuthUser } from "../../App"
import { useToast } from "../ui/Toast"
import BedCapacityReport from "./BedCapacityReport"
import IcdPatternReport from "./IcdPatternReport"
import MedicationSafetyReport from "./MedicationSafetyReport"
import PatientVolumeReport from "./PatientVolumeReport"

const REPORTS = [
  { id: "rpt01", code: "RPT-01", label: "Tiếp nhận & Lượng bệnh nhân" },
  { id: "rpt02", code: "RPT-02", label: "Giường bệnh & Công suất" },
  { id: "rpt03", code: "RPT-03", label: "Mô hình bệnh tật ICD-10" },
  { id: "rpt06", code: "RPT-06", label: "An toàn dùng thuốc" },
] as const

type ReportId = (typeof REPORTS)[number]["id"]

export default function ReportsPage({ user }: { user: AuthUser }) {
  const [active, setActive] = useState<ReportId>("rpt01")
  const { show, node } = useToast()
  const onExported = (fileName: string) =>
    show(`Đã tạo tệp báo cáo ${fileName}. Thao tác xuất đã được ghi vào Nhật ký kiểm toán.`)

  return (
    <div>
      <div
        className="mb-6 flex gap-2 overflow-x-auto"
        role="tablist"
        aria-label="Danh mục báo cáo"
      >
        {REPORTS.map((report) => (
          <button
            key={report.id}
            type="button"
            role="tab"
            aria-selected={active === report.id}
            onClick={() => setActive(report.id)}
            className={`shrink-0 cursor-pointer rounded-lg border px-3.5 py-2 text-left transition-colors duration-150 ${
              active === report.id
                ? "border-brand-primary bg-brand-surface text-brand-deep"
                : "border-border-strong bg-surface text-text-secondary hover:bg-subsurface"
            }`}
          >
            <span className="block font-heading text-xs font-bold">{report.label}</span>
            <span className="mt-0.5 block font-mono text-[11px] font-semibold text-text-muted">
              {report.code}
            </span>
          </button>
        ))}
        <div className="ml-auto hidden shrink-0 self-center text-xs text-text-muted lg:block">
          Nhật ký kiểm toán (RPT-05) nằm ở tab riêng
        </div>
      </div>

      {active === "rpt01" && <PatientVolumeReport user={user} onExported={onExported} />}
      {active === "rpt02" && <BedCapacityReport user={user} onExported={onExported} />}
      {active === "rpt03" && <IcdPatternReport user={user} onExported={onExported} />}
      {active === "rpt06" && <MedicationSafetyReport user={user} onExported={onExported} />}
      {node}
    </div>
  )
}
