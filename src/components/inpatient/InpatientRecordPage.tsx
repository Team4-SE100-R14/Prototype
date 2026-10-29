import { useState } from "react"
import type { UserRole } from "../../App"
import {
  canAddNote,
  canDischarge,
  canTransfer,
  STATUS_LABEL,
  treatmentDays,
  type Bed,
  type InpatientRecord,
} from "../../lib/inpatient"
import Button from "../ui/Button"
import FieldLabel from "../ui/FieldLabel"
import NamedIcon from "../ui/NamedIcon"
import VitalChart from "./VitalChart"

const TABS = ["Diễn biến bệnh", "Sinh hiệu", "Y lệnh", "Thông tin nhập viện"]

export default function InpatientRecordPage({
  record,
  bed,
  role,
  onBack,
  onTransfer,
  onDischarge,
  onAddNote,
}: {
  record: InpatientRecord
  bed?: Bed
  role: UserRole
  onBack: () => void
  onTransfer: () => void
  onDischarge: () => void
  onAddNote: (text: string) => boolean
}) {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [note, setNote] = useState("")
  const discharged = record.status === "discharged"
  const treating = record.status === "treating"
  const days = treatmentDays(record)

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-semibold text-slate-500 hover:text-cyan-700"
      >
        ← Quay lại bảng giường
      </button>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 p-6 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Bệnh án nội trú {record.id}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                  discharged
                    ? "bg-slate-100 text-slate-600 ring-slate-200"
                    : treating
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-amber-50 text-amber-700 ring-amber-200"
                }`}
              >
                {discharged ? (
                  <NamedIcon name="lock" className="size-3.5" />
                ) : (
                  <span
                    className={`size-1.5 rounded-full ${treating ? "bg-emerald-500" : "bg-amber-500"}`}
                  />
                )}
                {STATUS_LABEL[record.status]}
              </span>
              {discharged && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                  <NamedIcon name="lock" className="size-3.5" />
                  Đã khóa
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <strong className="text-base text-slate-900">
                {record.patientName}
              </strong>
              <span className="font-bold text-cyan-700">
                {record.patientCode}
              </span>
              {record.age !== undefined && (
                <span className="text-slate-600">{record.age} tuổi</span>
              )}
              {record.gender && (
                <span className="text-slate-600">{record.gender}</span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="inline-flex items-center gap-2"
              onClick={onTransfer}
              disabled={!treating || !canTransfer(role)}
              title={discharged ? "Bệnh án đã khóa" : undefined}
            >
              <NamedIcon name="bed" className="size-5" />
              Chuyển giường
            </Button>
            <div className="group relative">
              <Button
                onClick={onDischarge}
                disabled={!treating || !canDischarge(role)}
              >
                Xuất viện
              </Button>
              {!canDischarge(role) && (
                <div className="pointer-events-none absolute right-0 top-12 z-20 w-64 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold leading-5 text-white opacity-0 shadow-xl transition group-hover:opacity-100">
                  Chỉ bác sĩ điều trị mới được phép xác nhận xuất viện.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-5 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Khoa điều trị", record.department],
            ["Giường bệnh", bed?.code ?? record.bedCode ?? "Chưa xếp giường"],
            ["Bác sĩ phụ trách", record.doctor],
            ["Ngày nhập viện", record.admittedAt],
            [
              "Chẩn đoán nhập viện",
              `${record.icdCode ? `${record.icdCode} · ` : ""}${record.diagnosis}`,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-xs font-medium text-slate-500">{label}</div>
              <div className="mt-1.5 text-sm font-bold leading-5 text-slate-800">
                {value}
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex overflow-x-auto border-t border-slate-200 px-6"
          role="tablist"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 border-b-2 px-4 py-3.5 text-sm font-bold transition ${
                activeTab === tab
                  ? "border-cyan-700 text-cyan-800"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {discharged && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-100 p-4 text-sm font-semibold text-slate-700">
          <div className="rounded-full bg-white p-2 text-slate-500 shadow-sm">
            <NamedIcon name="lock" className="size-4" />
          </div>
          <div>
            <strong className="block text-slate-900">
              Bệnh án đã đóng - chỉ đọc
            </strong>
            <span className="mt-0.5 block text-xs font-medium text-slate-500">
              Mọi nội dung đã được khóa vĩnh viễn sau khi hoàn tất xuất viện
              {record.discharge ? ` (${record.discharge.dischargedAt})` : ""}.
            </span>
          </div>
        </div>
      )}

      {activeTab === "Diễn biến bệnh" ? (
        <div className="mt-6 space-y-6">
          <VitalChart />

          {treating && canAddNote(role) && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-cyan-50 p-2 text-cyan-700">
                  <NamedIcon name="document" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900">
                    Thêm diễn biến bệnh
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Ghi nhận tình trạng và đánh giá chuyên môn
                  </p>
                </div>
              </div>
              <FieldLabel htmlFor="progress-note" required>
                Nội dung diễn biến
              </FieldLabel>
              <textarea
                id="progress-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Nhập tình trạng người bệnh, đánh giá và hướng xử trí..."
                className="w-full resize-none rounded-lg border border-slate-300 p-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-cyan-600 focus:ring-3 focus:ring-cyan-100"
              />
              <div className="mt-1.5 flex justify-between text-xs text-slate-500">
                <span
                  className={
                    note.length > 0 && note.trim().length < 10
                      ? "text-red-600"
                      : ""
                  }
                >
                  Tối thiểu 10 ký tự
                </span>
                <span className="font-semibold">{note.length} / 2000</span>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  disabled={note.trim().length < 10}
                  onClick={() => {
                    if (onAddNote(note)) setNote("")
                  }}
                >
                  Lưu diễn biến
                </Button>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 font-extrabold text-slate-900">
              Lịch sử diễn biến bệnh
            </h2>
            {record.notes.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Chưa có diễn biến nào được ghi nhận.
              </p>
            ) : (
              <div className="relative">
                <div className="absolute bottom-3 left-2.5 top-3 w-px bg-slate-200" />
                <div className="space-y-6">
                  {record.notes.map((item) => (
                    <article className="relative flex gap-5" key={item.id}>
                      <div className="relative z-10 mt-1.5 size-5 shrink-0 rounded-full border-4 border-white bg-cyan-600 ring-1 ring-cyan-200" />
                      <div className="flex-1 rounded-xl border border-slate-200 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-cyan-700">
                              {item.time}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-800">
                                {item.author}
                              </span>
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                Đã ký số
                              </span>
                            </div>
                          </div>
                          <div className="group relative text-slate-400">
                            <NamedIcon name="lock" className="size-4" />
                            <div className="pointer-events-none absolute right-0 top-6 w-max rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                              Ghi chép không thể chỉnh sửa
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {item.text}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : activeTab === "Thông tin nhập viện" ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-extrabold text-slate-900">
            Thông tin nhập viện
          </h2>
          <dl className="grid gap-5 sm:grid-cols-2">
            {[
              ["Mã bệnh án", record.id],
              ["Mã bệnh nhân", record.patientCode],
              ["Thời điểm chỉ định nhập viện", record.admittedAt],
              ["Thời gian điều trị", days ? `${days} ngày` : "—"],
              ["Chẩn đoán nhập viện", record.diagnosis],
              ["Mã ICD-10", record.icdCode ?? "—"],
              ["Lý do nhập viện", record.reason ?? "—"],
              ["Bác sĩ phụ trách", record.doctor],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
          {record.discharge && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="mb-4 text-sm font-extrabold text-slate-900">
                Thông tin xuất viện
              </h3>
              <dl className="grid gap-5 sm:grid-cols-2">
                {[
                  ["Tình trạng ra viện", record.discharge.condition],
                  ["Thời điểm xuất viện", record.discharge.dischargedAt],
                  ["Kết luận điều trị", record.discharge.conclusion],
                  ["Lời dặn / tái khám", record.discharge.instructions],
                  ["Ngày tái khám", record.discharge.followUpDate.split("-").reverse().join("/")],
                  ["Bác sĩ xác nhận", record.discharge.by],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-slate-500">{label}</dt>
                    <dd className="mt-1 text-sm font-bold text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <NamedIcon name="document" />
          </div>
          <h2 className="mt-4 font-extrabold text-slate-800">{activeTab}</h2>
          <p className="mt-2 text-sm text-slate-500">
            Nội dung đang được tổng hợp trong hồ sơ người bệnh.
          </p>
        </div>
      )}
    </div>
  )
}
