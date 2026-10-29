import { useMemo, useState } from "react"
import type { AuthUser } from "../../App"
import useInpatient from "../../hooks/useInpatient"
import {
  bedCounts,
  DEPARTMENTS,
  parseDateTime,
  type Department,
} from "../../lib/inpatient"
import { exportReportCsv } from "../../lib/reportExport"
import Button from "../ui/Button"
import FieldLabel from "../ui/FieldLabel"
import NamedIcon from "../ui/NamedIcon"
import {
  BarList,
  EmptyReport,
  FILTER_CONTROL,
  ReportFilterBar,
  ReportHeading,
  ReportKpi,
  ReportPanel,
  TD,
  TH,
} from "./ReportParts"

const DEPT_COLOR: Record<Department, string> = {
  "Khoa Nội tổng hợp": "bg-blue-500",
  "Khoa Ngoại": "bg-emerald-500",
  "Khoa Nhi": "bg-amber-400",
}

const percent = (part: number, total: number) =>
  total === 0 ? 0 : (part / total) * 100
const formatPercent = (value: number) =>
  `${value.toFixed(1).replace(".", ",")}%`

export default function BedCapacityReport({
  user,
  onExported,
}: {
  user: AuthUser
  onExported: (fileName: string) => void
}) {
  const state = useInpatient()
  const [department, setDepartment] = useState<Department | "">("")
  const [applied, setApplied] = useState<Department | "">("")

  const data = useMemo(() => {
    const beds = state.beds.filter((bed) => !applied || bed.department === applied)
    const counts = bedCounts(beds)
    const stays = state.records
      .flatMap((record) =>
        record.bedHistory.map((stay) => ({ record, stay })),
      )
      .filter(({ stay }) => !applied || stay.department === applied)
      .sort(
        (a, b) =>
          (parseDateTime(b.stay.from)?.getTime() ?? 0) -
          (parseDateTime(a.stay.from)?.getTime() ?? 0),
      )
    const discharged = state.records.filter(
      (record) =>
        record.status === "discharged" &&
        record.discharge &&
        (!applied || record.department === applied),
    )
    const lengths = discharged
      .map((record) => {
        const from = parseDateTime(record.admittedAt)
        const to = parseDateTime(record.discharge?.dischargedAt ?? "")
        return from && to ? (to.getTime() - from.getTime()) / 86_400_000 : null
      })
      .filter((value): value is number => value !== null)
    const alos = lengths.length
      ? lengths.reduce((sum, value) => sum + value, 0) / lengths.length
      : null
    const byDepartment = DEPARTMENTS.filter(
      (name) => !applied || name === applied,
    ).map((name) => {
      const group = bedCounts(state.beds.filter((bed) => bed.department === name))
      return { name, ...group, rate: percent(group.occupied, group.total) }
    })
    return { counts, stays, alos, byDepartment }
  }, [state, applied])

  const exportCsv = () => {
    onExported(
      exportReportCsv(
        "RPT-02",
        "Báo cáo Giường bệnh & Công suất",
        [
          ["Khoa", applied || "Tất cả"],
          ["Tổng số giường", data.counts.total],
          ["Trống", data.counts.empty],
          ["Đang sử dụng", data.counts.occupied],
          ["Bảo trì", data.counts.maintenance],
          ["Tỷ lệ lấp đầy", formatPercent(percent(data.counts.occupied, data.counts.total))],
          ["ALOS (ngày)", data.alos === null ? "" : data.alos.toFixed(1)],
          [],
          ["Mã giường", "Mã bệnh án", "Mã bệnh nhân", "Khoa", "Nhận giường", "Trả giường", "Lý do kết thúc"],
          ...data.stays.map(({ record, stay }) => [
            stay.bedCode,
            record.id,
            record.patientCode,
            stay.department,
            stay.from,
            stay.to ?? "Đang sử dụng",
            stay.reason ?? "",
          ]),
        ],
        user,
      ),
    )
  }

  const generatedAt = new Date().toLocaleString("vi-VN")

  return (
    <div>
      <ReportHeading
        code="RPT-02"
        title="Báo cáo Giường bệnh & Công suất"
        description="Đánh giá tình trạng sử dụng, hiệu suất luân chuyển và công suất giường theo khoa điều trị. Số liệu lấy trực tiếp từ module Nội trú."
        onExport={exportCsv}
      />
      <ReportFilterBar>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-64">
              <FieldLabel htmlFor="rpt02-department">Khoa điều trị</FieldLabel>
              <select
                id="rpt02-department"
                value={department}
                onChange={(event) =>
                  setDepartment(event.target.value as Department | "")
                }
                className={FILTER_CONTROL}
              >
                <option value="">Tất cả</option>
                {DEPARTMENTS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <Button variant="report" onClick={() => setApplied(department)}>
              Tạo báo cáo
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <NamedIcon name="calendar" className="size-4 text-slate-400" />
            Thời điểm thống kê: {generatedAt}
          </div>
        </div>
      </ReportFilterBar>

      {data.counts.total === 0 ? (
        <EmptyReport message="Chưa cấu hình giường bệnh cho khoa đã chọn." icon="bed" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <ReportKpi label="Tổng số giường" value={String(data.counts.total)} />
            <ReportKpi label="Trống" value={String(data.counts.empty)} tone="green" />
            <ReportKpi label="Đang sử dụng" value={String(data.counts.occupied)} tone="blue" />
            <ReportKpi label="Bảo trì" value={String(data.counts.maintenance)} tone="gray" />
            <ReportKpi
              label="Tỷ lệ lấp đầy"
              value={formatPercent(percent(data.counts.occupied, data.counts.total))}
              tone="green"
            />
            <ReportKpi
              label="Thời gian nằm viện trung bình (ALOS)"
              value={data.alos === null ? "—" : `${data.alos.toFixed(1).replace(".", ",")} ngày`}
              tone="blue"
              note={data.alos === null ? "Chưa có ca xuất viện trong phạm vi lọc." : undefined}
            />
          </div>

          <BarList
            title="Tỷ lệ lấp đầy theo khoa"
            subtitle="Tại thời điểm thống kê"
            badge="Mục tiêu ≤ 85%"
            rows={data.byDepartment.map((item) => ({
              label: `${item.name} (${item.occupied}/${item.total})`,
              value: formatPercent(item.rate),
              percent: item.rate,
              color: DEPT_COLOR[item.name],
            }))}
          />

          <ReportPanel
            title="Lịch sử sử dụng giường"
            subtitle="Các lượt nhận và kết thúc sử dụng giường, mới nhất trước"
          >
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="bg-slate-50">
                  {["Mã giường", "Mã bệnh án", "Mã bệnh nhân", "Khoa", "Thời gian nhận giường", "Thời gian trả giường", "Lý do kết thúc"].map(
                    (label) => (
                      <th className={TH} key={label}>
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.stays.length === 0 && (
                  <tr>
                    <td className="px-5 py-8 text-center text-sm text-slate-500" colSpan={7}>
                      Chưa có lượt sử dụng giường nào.
                    </td>
                  </tr>
                )}
                {data.stays.map(({ record, stay }, index) => (
                  <tr
                    className="border-t border-slate-100 text-sm text-slate-600"
                    key={`${record.id}-${stay.bedCode}-${index}`}
                  >
                    <td className={TD}><strong className="text-slate-900">{stay.bedCode}</strong></td>
                    <td className={TD}>{record.id}</td>
                    <td className={TD}><strong className="text-blue-700">{record.patientCode}</strong></td>
                    <td className={TD}>{stay.department}</td>
                    <td className={TD}>{stay.from}</td>
                    <td className={TD}>
                      {stay.to ?? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                          <span className="size-1.5 rounded-full bg-blue-500" />
                          Đang sử dụng
                        </span>
                      )}
                    </td>
                    <td className={TD}>{stay.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportPanel>
        </div>
      )}
    </div>
  )
}
