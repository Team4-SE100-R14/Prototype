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

// Mock diagnosis counts for the 2026-01 .. 2026-10 reporting window.
const ICD_ROWS: Array<[string, string, string, number]> = [
  ["J18.9", "Viêm phổi, không đặc hiệu", "Hô hấp", 214],
  ["I10", "Tăng huyết áp vô căn", "Tuần hoàn", 187],
  ["E11.9", "Đái tháo đường típ 2", "Nội tiết", 156],
  ["J00", "Viêm mũi họng cấp", "Hô hấp", 141],
  ["K29.7", "Viêm dạ dày, không đặc hiệu", "Tiêu hóa", 98],
  ["J20.9", "Viêm phế quản cấp", "Hô hấp", 87],
  ["M54.5", "Đau thắt lưng", "Cơ xương khớp", 74],
  ["N39.0", "Nhiễm khuẩn đường tiết niệu", "Tiết niệu", 61],
  ["I25.1", "Bệnh tim do xơ vữa động mạch vành", "Tuần hoàn", 52],
  ["A09", "Tiêu chảy và viêm dạ dày ruột", "Tiêu hóa", 43],
]

const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-400", "bg-violet-500", "bg-rose-400", "bg-cyan-500"]
const MONTH_RE = /^\d{4}-\d{2}$/

export default function IcdPatternReport({
  user,
  onExported,
}: {
  user: AuthUser
  onExported: (fileName: string) => void
}) {
  const [from, setFrom] = useState("2026-01")
  const [to, setTo] = useState("2026-10")
  const [state, setState] = useState<ReportState>("data")
  const [icdPage, setIcdPage] = useState(1)
  const [icdPageSize, setIcdPageSize] = useState(5)

  const totalIcdPages = Math.max(1, Math.ceil(ICD_ROWS.length / icdPageSize))
  const paginatedRows = useMemo(() => {
    return ICD_ROWS.slice((icdPage - 1) * icdPageSize, icdPage * icdPageSize)
  }, [icdPage, icdPageSize])

  const createReport = () => {
    const current = new Date().toISOString().slice(0, 7)
    if (!MONTH_RE.test(from) || !MONTH_RE.test(to) || from > to || to > current)
      setState("error")
    else if (to < "2026-01") setState("empty")
    else setState("data")
  }

  const total = ICD_ROWS.reduce((sum, row) => sum + row[3], 0)
  const chapters = Object.entries(
    ICD_ROWS.reduce<Record<string, number>>((acc, row) => {
      acc[row[2]] = (acc[row[2]] ?? 0) + row[3]
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])
  const share = (value: number) =>
    `${((value / total) * 100).toFixed(1).replace(".", ",")}%`

  const exportCsv = () => {
    if (state !== "data") return
    onExported(
      exportReportCsv(
        "RPT-03",
        "Báo cáo Mô hình bệnh tật ICD-10",
        [
          ["Kỳ báo cáo", `${from} đến ${to}`],
          ["Tổng số chẩn đoán", total],
          [],
          ["Mã ICD-10", "Tên bệnh", "Nhóm bệnh", "Số ca", "Tỷ lệ"],
          ...ICD_ROWS.map((row) => [row[0], row[1], row[2], row[3], share(row[3])]),
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
        code="RPT-03"
        title="Báo cáo Mô hình bệnh tật ICD-10"
        description="Phân tích cơ cấu chẩn đoán xác định theo mã và nhóm bệnh ICD-10 trong kỳ báo cáo."
        onExport={exportCsv}
      />
      <ReportFilterBar>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:max-w-xl">
            <div>
              <FieldLabel htmlFor="rpt03-from">Từ tháng</FieldLabel>
              <input id="rpt03-from" type="month" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="rpt03-to">Đến tháng</FieldLabel>
              <input id="rpt03-to" type="month" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} />
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
            : "Chỉ thống kê các phiếu khám đã ký duyệt và khóa. Dữ liệu minh họa."}
        </p>
      </ReportFilterBar>

      {state === "empty" ? (
        <EmptyReport message="Không có phiếu khám nào được ký duyệt trong khoảng thời gian đã chọn." />
      ) : state === "data" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <ReportKpi label="Tổng số chẩn đoán xác định" value={total.toLocaleString("vi-VN")} tone="green" />
            <ReportKpi label="Số mã ICD-10 khác nhau" value={String(ICD_ROWS.length)} tone="blue" note="Trong 10 mã phổ biến nhất." />
            <ReportKpi label="Nhóm bệnh phổ biến nhất" value={chapters[0][0]} tone="amber" note={`${chapters[0][1]} ca · ${share(chapters[0][1])}`} />
          </div>
          <BarList
            title="Cơ cấu theo nhóm bệnh"
            subtitle="Tỷ lệ số ca theo nhóm ICD-10"
            rows={chapters.map(([name, value], index) => ({
              label: `${name} (${value})`,
              value: share(value),
              percent: (value / chapters[0][1]) * 100,
              color: COLORS[index % COLORS.length],
            }))}
          />
          <ReportPanel title="10 chẩn đoán phổ biến nhất" subtitle="Sắp xếp theo số ca giảm dần">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className={TH}>Mã ICD-10</th>
                  <th className={TH}>Tên bệnh</th>
                  <th className={TH}>Nhóm bệnh</th>
                  <th className={`${TH} text-right`}>Số ca</th>
                  <th className={`${TH} text-right`}>Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr className="border-t border-slate-100 text-sm text-slate-600" key={row[0]}>
                    <td className={TD}><strong className="text-blue-700">{row[0]}</strong></td>
                    <td className={`${TD} font-semibold text-slate-800`}>{row[1]}</td>
                    <td className={TD}>{row[2]}</td>
                    <td className={`${TD} text-right font-bold text-slate-900`}>{row[3]}</td>
                    <td className={`${TD} text-right`}>{share(row[3])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={icdPage}
              totalPages={totalIcdPages}
              totalItems={ICD_ROWS.length}
              pageSize={icdPageSize}
              onPageChange={setIcdPage}
              onPageSizeChange={setIcdPageSize}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="chẩn đoán"
            />
          </ReportPanel>
        </div>
      ) : null}
    </div>
  )
}
