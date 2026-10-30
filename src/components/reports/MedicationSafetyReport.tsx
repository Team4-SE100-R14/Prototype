import { useMemo, useState } from "react"
import type { AuthUser } from "../../App"
import { exportReportCsv } from "../../lib/reportExport"
import Button from "../ui/Button"
import FieldLabel from "../ui/FieldLabel"
import NamedIcon from "../ui/NamedIcon"
import Pagination from "../ui/Pagination"
import {
  BarList,
  EmptyReport,
  ReportFilterBar,
  ReportHeading,
  ReportKpi,
  ReportPanel,
  TD,
  TH,
  type ReportState,
} from "./ReportParts"

// Mock figures; the pairs and severities mirror the PRES safety-check demo.
const ALERT_ROWS: Array<[string, string, number, string]> = [
  ["Dị ứng thuốc", "Nhóm penicillin với tiền sử dị ứng Penicillin", 38, "Chặn, phải xóa thuốc"],
  ["Tương tác nghiêm trọng", "Warfarin + Aspirin", 24, "Chặn, phải gỡ thuốc vi phạm"],
  ["Tương tác trung bình", "Amlodipine + Simvastatin", 71, "Cho phép kèm lý do lâm sàng"],
  ["Tương tác nhẹ", "Paracetamol + Metoclopramide", 119, "Ghi nhận cảnh báo"],
  ["Thuốc ngưng sử dụng", "Ranitidine 150mg", 17, "Chặn, thuốc không còn trong danh mục"],
]

const SOURCE_ROWS: Array<[string, number, string]> = [
  ["rxcheck.dev (dịch vụ ngoài)", 1486, "bg-emerald-500"],
  ["Bộ nhớ đệm", 612, "bg-blue-500"],
  ["Bảng tương tác nội bộ (dự phòng)", 93, "bg-amber-400"],
]

const MONTH_RE = /^\d{4}-\d{2}$/

export default function MedicationSafetyReport({
  user,
  onExported,
}: {
  user: AuthUser
  onExported: (fileName: string) => void
}) {
  const [from, setFrom] = useState("2026-01")
  const [to, setTo] = useState("2026-10")
  const [state, setState] = useState<ReportState>("data")
  const [alertPage, setAlertPage] = useState(1)
  const [alertPageSize, setAlertPageSize] = useState(4)

  const totalAlertPages = Math.max(1, Math.ceil(ALERT_ROWS.length / alertPageSize))
  const paginatedAlerts = useMemo(() => {
    return ALERT_ROWS.slice((alertPage - 1) * alertPageSize, alertPage * alertPageSize)
  }, [alertPage, alertPageSize])

  const createReport = () => {
    const current = new Date().toISOString().slice(0, 7)
    if (!MONTH_RE.test(from) || !MONTH_RE.test(to) || from > to || to > current)
      setState("error")
    else if (to < "2026-01") setState("empty")
    else setState("data")
  }

  const totalAlerts = ALERT_ROWS.reduce((sum, row) => sum + row[2], 0)
  const totalChecks = SOURCE_ROWS.reduce((sum, row) => sum + row[1], 0)

  const exportCsv = () => {
    if (state !== "data") return
    onExported(
      exportReportCsv(
        "RPT-06",
        "Báo cáo An toàn dùng thuốc",
        [
          ["Kỳ báo cáo", `${from} đến ${to}`],
          ["Số lượt kiểm tra an toàn", totalChecks],
          ["Tổng số cảnh báo", totalAlerts],
          [],
          ["Loại cảnh báo", "Ví dụ phổ biến", "Số lượt", "Xử lý"],
          ...ALERT_ROWS.map((row) => [...row]),
          [],
          ["Nguồn kiểm tra", "Số lượt"],
          ...SOURCE_ROWS.map((row) => [row[0], row[1]]),
        ],
        user,
      ),
    )
  }

  const inputClass = `h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none ${
    state === "error"
      ? "border-red-400 ring-2 ring-red-100"
      : "border-slate-300 focus:border-emerald-600"
  }`

  return (
    <div>
      <ReportHeading
        code="RPT-06"
        title="Báo cáo An toàn dùng thuốc"
        description="Theo dõi cảnh báo dị ứng, tương tác thuốc và nguồn kiểm tra trong quá trình kê đơn điện tử."
        onExport={exportCsv}
      />
      <ReportFilterBar>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:max-w-xl">
            <div>
              <FieldLabel htmlFor="rpt06-from">Từ tháng</FieldLabel>
              <input id="rpt06-from" type="month" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="rpt06-to">Đến tháng</FieldLabel>
              <input id="rpt06-to" type="month" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} />
            </div>
          </div>
          <Button variant="report" onClick={createReport}>
            Tạo báo cáo
          </Button>
        </div>
        <p
          className={`mt-3 flex items-center gap-2 text-xs ${
            state === "error" ? "font-semibold text-red-600" : "text-slate-500"
          }`}
        >
          {state === "error" && <NamedIcon name="alert" className="size-4" />}
          {state === "error"
            ? "Kỳ báo cáo không hợp lệ: ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc và không vượt quá tháng hiện tại."
            : "Số liệu minh họa, dựa trên các kịch bản trong demo Kê đơn thuốc."}
        </p>
      </ReportFilterBar>

      {state === "empty" ? (
        <EmptyReport message="Không có lượt kiểm tra an toàn thuốc nào trong khoảng thời gian đã chọn." />
      ) : state === "data" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportKpi label="Lượt kiểm tra an toàn" value={totalChecks.toLocaleString("vi-VN")} tone="blue" />
            <ReportKpi label="Tổng số cảnh báo" value={String(totalAlerts)} tone="amber" />
            <ReportKpi label="Cảnh báo bị chặn kê đơn" value={String(ALERT_ROWS[0][2] + ALERT_ROWS[1][2] + ALERT_ROWS[4][2])} tone="red" note="Dị ứng, tương tác nghiêm trọng và thuốc ngưng sử dụng." />
            <ReportKpi label="Dùng bảng nội bộ dự phòng" value={`${((SOURCE_ROWS[2][1] / totalChecks) * 100).toFixed(1).replace(".", ",")}%`} tone="gray" note="Khi rxcheck.dev quá hạn, quá giới hạn yêu cầu hoặc bộ ngắt mở." />
          </div>
          <BarList
            title="Nguồn dữ liệu kiểm tra tương tác"
            subtitle="Tỷ lệ lượt kiểm tra theo nguồn"
            rows={SOURCE_ROWS.map(([label, value, color]) => ({
              label: `${label} (${value.toLocaleString("vi-VN")})`,
              value: `${((value / totalChecks) * 100).toFixed(1).replace(".", ",")}%`,
              percent: (value / totalChecks) * 100,
              color,
            }))}
          />
          <ReportPanel title="Cảnh báo theo loại" subtitle="Số lượt cảnh báo và cách hệ thống xử lý">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className={TH}>Loại cảnh báo</th>
                  <th className={TH}>Ví dụ phổ biến</th>
                  <th className={`${TH} text-right`}>Số lượt</th>
                  <th className={TH}>Xử lý</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAlerts.map((row) => (
                  <tr className="border-t border-slate-100 text-sm text-slate-600" key={row[0]}>
                    <td className={`${TD} font-semibold text-slate-800`}>{row[0]}</td>
                    <td className={TD}>{row[1]}</td>
                    <td className={`${TD} text-right font-bold text-slate-900`}>{row[2]}</td>
                    <td className={TD}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={alertPage}
              totalPages={totalAlertPages}
              totalItems={ALERT_ROWS.length}
              pageSize={alertPageSize}
              onPageChange={setAlertPage}
              onPageSizeChange={setAlertPageSize}
              pageSizeOptions={[2, 4, 8]}
              itemLabel="loại cảnh báo"
            />
          </ReportPanel>
        </div>
      ) : null}
    </div>
  )
}
