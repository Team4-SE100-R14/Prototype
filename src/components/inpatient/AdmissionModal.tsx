import { useState } from "react"
import type { AuthUser } from "../../App"
import {
  admitPatient,
  DEPARTMENTS,
  DOCTORS,
  ICD_OPTIONS,
  type Department,
  type InpatientRecord,
} from "../../lib/inpatient"
import Button from "../ui/Button"
import FieldLabel from "../ui/FieldLabel"
import NamedIcon from "../ui/NamedIcon"
import DialogShell, { ErrorBanner } from "./DialogShell"

const CONTROL =
  "w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-3 focus:ring-cyan-100"

export interface AdmissionPatient {
  code: string
  name: string
  age?: number
  gender?: string
  encounterId?: string
}

export default function AdmissionModal({
  patient,
  user,
  defaultIcd = "",
  defaultDiagnosis = "",
  onClose,
  onSuccess,
}: {
  patient: AdmissionPatient
  user: AuthUser
  defaultIcd?: string
  defaultDiagnosis?: string
  onClose: () => void
  onSuccess: (record: InpatientRecord) => void
}) {
  const [department, setDepartment] = useState<Department | "">("")
  const [doctor, setDoctor] = useState("")
  const [icd, setIcd] = useState(defaultIcd)
  const [diagnosis, setDiagnosis] = useState(defaultDiagnosis)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const doctors = department ? DOCTORS[department] : []
  const valid = !!department && !!doctor && diagnosis.trim().length >= 5

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!valid || !department) return
    const result = admitPatient(
      {
        patientCode: patient.code,
        patientName: patient.name,
        age: patient.age,
        gender: patient.gender,
        department,
        doctor,
        icdCode: icd || undefined,
        diagnosis: diagnosis.trim(),
        reason: reason.trim() || undefined,
      },
      user,
    )
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (result.record) onSuccess(result.record)
  }

  return (
    <DialogShell
      id="admission"
      title="Chỉ định nhập viện nội trú"
      eyebrow="Nội trú"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="admission-form" disabled={!valid}>
            Xác nhận nhập viện
          </Button>
        </>
      }
    >
      <form id="admission-form" onSubmit={submit} className="space-y-5">
        {error && (
          <ErrorBanner title="Không thể tạo bệnh án mới">{error}</ErrorBanner>
        )}

        <div className="grid gap-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-500">Người bệnh</div>
            <div className="mt-1 font-bold text-slate-900">{patient.name}</div>
            <div className="mt-0.5 text-xs font-semibold text-cyan-700">
              {patient.code}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Tuổi / giới</div>
            <div className="mt-1 text-sm font-bold text-slate-800">
              {patient.age ?? "—"} · {patient.gender ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Phiếu khám</div>
            <div className="mt-1 text-sm font-bold text-slate-800">
              {patient.encounterId ?? "—"}
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="admission-department" required>
              Khoa điều trị
            </FieldLabel>
            <select
              id="admission-department"
              value={department}
              onChange={(event) => {
                const next = event.target.value as Department | ""
                setDepartment(next)
                setDoctor(
                  next && DOCTORS[next].includes(user.name)
                    ? user.name
                    : "",
                )
              }}
              className={`${CONTROL} h-11 px-3`}
            >
              <option value="">Chọn khoa điều trị</option>
              {DEPARTMENTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="admission-doctor" required>
              Bác sĩ phụ trách
            </FieldLabel>
            <select
              id="admission-doctor"
              disabled={!department}
              value={doctor}
              onChange={(event) => setDoctor(event.target.value)}
              className={`${CONTROL} h-11 px-3 disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <option value="">
                {department ? "Chọn bác sĩ" : "Chọn khoa điều trị trước"}
              </option>
              {doctors.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="admission-icd">Mã ICD-10</FieldLabel>
          <select
            id="admission-icd"
            value={icd}
            onChange={(event) => setIcd(event.target.value)}
            className={`${CONTROL} h-11 px-3`}
          >
            <option value="">Chọn mã ICD-10 (nếu có)</option>
            {ICD_OPTIONS.map(([code, label]) => (
              <option key={code} value={code}>
                {code} - {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="admission-diagnosis" required>
            Chẩn đoán nhập viện
          </FieldLabel>
          <textarea
            id="admission-diagnosis"
            value={diagnosis}
            maxLength={500}
            rows={3}
            onChange={(event) => setDiagnosis(event.target.value)}
            placeholder="Nhập chẩn đoán chuyên môn..."
            className={`${CONTROL} resize-none p-3`}
          />
          <div className="mt-1.5 flex justify-between text-xs">
            <span
              className={
                diagnosis.length > 0 && diagnosis.trim().length < 5
                  ? "text-red-600"
                  : "text-slate-500"
              }
            >
              Tối thiểu 5 ký tự
            </span>
            <span className="font-medium text-slate-500">
              {diagnosis.length} / 500
            </span>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="admission-reason">Lý do nhập viện</FieldLabel>
          <textarea
            id="admission-reason"
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Mô tả lý do và chỉ định theo dõi nội trú..."
            className={`${CONTROL} resize-none p-3`}
          />
        </div>

        <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
          <NamedIcon name="info" className="mt-0.5 size-5 shrink-0" />
          <p>
            Mã bệnh án nội trú sẽ được hệ thống tự động tạo theo định dạng{" "}
            <strong>BA-YY-xxxx</strong>. Người bệnh sẽ vào hàng chờ xếp giường
            của khoa được chọn.
          </p>
        </div>
      </form>
    </DialogShell>
  )
}
