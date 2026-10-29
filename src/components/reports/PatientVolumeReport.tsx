import { useState } from "react"
import type { AuthUser } from "../../App"
import { exportReportCsv } from "../../lib/reportExport"
import Button from "../ui/Button"
import FieldLabel from "../ui/FieldLabel"
import NamedIcon from "../ui/NamedIcon"
import {
  EmptyReport,
  OutcomeChart,
  PatientPyramid,
  ReportFilterBar,
  ReportHeading,
  ReportKpi,
  ReportPanel,
  TD,
  TH,
  type ReportState,
} from "./ReportParts"

const AGE_ROWS = [
  ["0 – 25", 128, 145, 4, 277],
  ["26 – 45", 226, 259, 7, 492],
  ["46 – 65", 198, 236, 8, 442],
  ["Trên 65", 15, 20, 2, 37],
] as const

const MONTH_RE = /^\d{4}-\d{2}$/

export default function PatientVolumeReport({
  user,
  onExported,
}: {
  user: AuthUser
  onExported: (fileName: string) => void
}) {
  const [period, setPeriod] = useState<"month" | "year">("month")
  const [from, setFrom] = useState("2026-01")
  const [to, setTo] = useState("2026-10")
  const [state, setState] = useState<ReportState>("data")

  const createReport = () => {
    const current = new Date().toISOString().slice(0, 7)
    if (!MONTH_RE.test(from) || !MONTH_RE.test(to) || from > to || to > current)
      setState("error")
    else if (to < "2026-01") setState("empty")
    else setState("data")
  }

  const exportCsv = () => {
    if (state !== "data") return
    onExported(
      exportReportCsv(
        "RPT-01",
        "Báo cáo Tiếp nhận & Lượng bệnh nhân",
        [
          ["Kỳ báo cáo", `${from} đến ${to}`],
          ["Tổng số bệnh nhân (duy nhất)", 1248],
          ["Khám xong, cho về kê đơn", 860],
          ["Chỉ định nhập viện", 312],
          ["Chuyển viện", 76],
          [],
          ["Nhóm tuổi", "Nam", "Nữ", "Khác", "Tổng"],
          ...AGE_ROWS.map((row) => [...row]),
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
        code="RPT-01"
        title="Báo cáo Tiếp nhận & Lượng bệnh nhân"
        description="Theo dõi cơ cấu người bệnh, kết luận điều trị và xu hướng tiếp nhận theo kỳ báo cáo."
        onExport={exportCsv}
      />
      <ReportFilterBar>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end">
          <div>
            <FieldLabel>Chu kỳ báo cáo</FieldLabel>
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {(["month", "year"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPeriod(item)}
                  className={`rounded-md px-4 py-2 text-xs font-bold transition ${
                    period === item
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {item === "month" ? "Theo tháng" : "Theo năm"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:max-w-xl">
            <div>
              <FieldLabel htmlFor="rpt01-from">
                {period === "month" ? "Từ tháng" : "Từ năm"}
              </FieldLabel>
              <input
                id="rpt01-from"
                type={period === "month" ? "month" : "number"}
                value={period === "month" ? from : from.slice(0, 4)}
                onChange={(event) =>
                  setFrom(
                    period === "month"
                      ? event.target.value
                      : `${event.target.value}-01`,
                  )
                }
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="rpt01-to">
                {period === "month" ? "Đến tháng" : "Đến năm"}
              </FieldLabel>
              <input
                id="rpt01-to"
                type={period === "month" ? "month" : "number"}
                value={period === "month" ? to : to.slice(0, 4)}
                onChange={(event) =>
                  setTo(
                    period === "month"
                      ? event.target.value
                      : `${event.target.value}-12`,
                  )
                }
                className={inputClass}
              />
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
            : "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc và không vượt quá ngày hiện tại."}
        </p>
      </ReportFilterBar>

      {state === "empty" ? (
        <EmptyReport
          message="Không tìm thấy hồ sơ tiếp nhận nào trong khoảng thời gian đã chọn."
          icon="user"
        />
      ) : state === "data" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportKpi label="Tổng số bệnh nhân (duy nhất)" value="1.248" tone="green" note="Mỗi bệnh nhân chỉ được tính một lần trong kỳ báo cáo." />
            <ReportKpi label="Khám xong, cho về kê đơn" value="860" tone="green" />
            <ReportKpi label="Chỉ định nhập viện" value="312" tone="blue" />
            <ReportKpi label="Chuyển viện" value="76" />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <PatientPyramid />
            <OutcomeChart />
          </div>
          <ReportPanel
            title="Chi tiết theo nhóm tuổi"
            subtitle="Phân loại người bệnh duy nhất theo giới tính"
          >
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className={TH}>Nhóm tuổi</th>
                  <th className={`${TH} text-right`}>Nam</th>
                  <th className={`${TH} text-right`}>Nữ</th>
                  <th className={`${TH} text-right`}>Khác</th>
                  <th className={`${TH} text-right`}>Tổng</th>
                </tr>
              </thead>
              <tbody>
                {AGE_ROWS.map((row) => (
                  <tr className="border-t border-slate-100 text-sm text-slate-600" key={row[0]}>
                    <td className={`${TD} font-semibold text-slate-800`}>{row[0]}</td>
                    <td className={`${TD} text-right`}>{row[1]}</td>
                    <td className={`${TD} text-right`}>{row[2]}</td>
                    <td className={`${TD} text-right`}>{row[3]}</td>
                    <td className={`${TD} text-right font-bold text-slate-900`}>{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportPanel>
        </div>
      ) : null}
    </div>
  )
}
