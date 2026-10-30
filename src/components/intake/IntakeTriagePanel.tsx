import type { ReactNode } from "react"
import {
  EMERGENCY_DEPARTMENT,
  OUTPATIENT_CLINICS,
  OUTPATIENT_DEPARTMENT,
  type Acuity,
} from "../../lib/intakeQueue"
import { AlertTriangle, Building2 } from "lucide-react"
import { TextArea } from "../ui/TextInput"

export interface TriageValue {
  complaint: string
  acuity: Acuity | ""
  clinic: string
}

const SELECT =
  "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-text-primary transition-[border-color,box-shadow] duration-150 focus:border-brand-primary focus:outline-none focus:ring-3 focus:ring-brand-primary/20 aria-[invalid=true]:border-[1.5px] aria-[invalid=true]:border-critical aria-[invalid=true]:bg-critical-bg"

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block font-heading text-[13px] font-semibold text-text-secondary">
      {children}
      {required && (
        <span className="ml-1 text-critical" aria-hidden="true">
          *
        </span>
      )}
    </span>
  )
}

// Binary acuity intake (REQ-ADM-03). Shared by Receptionist, Nurse and Doctor.
export default function IntakeTriagePanel({
  value,
  errors,
  onChange,
  idPrefix = "triage",
}: {
  value: TriageValue
  errors: Record<string, string>
  onChange: (patch: Partial<TriageValue>) => void
  idPrefix?: string
}) {
  const emergency = value.acuity === "EMERGENCY"
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-complaint`}>
          <Label required>Lý do khám / Triệu chứng ban đầu</Label>
        </label>
        <TextArea
          id={`${idPrefix}-complaint`}
          value={value.complaint}
          onChange={(event) =>
            onChange({ complaint: event.target.value.slice(0, 255) })
          }
          rows={4}
          maxLength={255}
          placeholder="Sốt cao liên tục 3 ngày, đau mỏi cơ"
          aria-invalid={!!errors.complaint}
          className={errors.complaint ? "border-critical" : ""}
        />
        <div className="mt-1 flex justify-between gap-3 text-xs">
          <p className="font-medium text-critical">{errors.complaint}</p>
          <p className="shrink-0 font-mono tabular-nums text-text-muted">{value.complaint.length}/255</p>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 font-heading text-[13px] font-semibold text-text-secondary">
          Phân loại tuyến khám <span className="text-critical">*</span>
        </legend>
        <div className="grid gap-3">
          <label
            className={`cursor-pointer rounded-xl border p-4 transition-colors duration-150 ${
              emergency
                ? "border-2 border-sptt-red-border bg-sptt-red-bg shadow-[var(--halo-red-alert)]"
                : "border-cpoe-block-border/40 bg-surface hover:bg-sptt-red-bg"
            }`}
          >
            <input
              type="radio"
              name={`${idPrefix}-acuity`}
              value="EMERGENCY"
              checked={emergency}
              onChange={() => onChange({ acuity: "EMERGENCY", clinic: "" })}
              className="sr-only"
            />
            <span className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-critical text-surface">
                <AlertTriangle aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
              </span>
              <span>
                <strong className="block font-heading text-sm text-sptt-red">
                  CẤP CỨU (EMERGENCY)
                </strong>
                <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                  Ưu tiên 1. Chuyển ngay đến Khoa Cấp cứu để bác sĩ xử trí kịp thời.
                </span>
              </span>
            </span>
          </label>
          <label
            className={`cursor-pointer rounded-xl border p-4 transition-colors duration-150 ${
              value.acuity === "NON_EMERGENCY"
                ? "border-2 border-brand-primary bg-brand-surface"
                : "border-border-strong bg-surface hover:bg-brand-surface/50"
            }`}
          >
            <input
              type="radio"
              name={`${idPrefix}-acuity`}
              value="NON_EMERGENCY"
              checked={value.acuity === "NON_EMERGENCY"}
              onChange={() => onChange({ acuity: "NON_EMERGENCY" })}
              className="sr-only"
            />
            <span className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-deep text-surface">
                <Building2 aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
              </span>
              <span>
                <strong className="block font-heading text-sm text-brand-deep">
                  KHÔNG CẤP CỨU (NON-EMERGENCY)
                </strong>
                <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                  Ưu tiên 2. Khám theo số thứ tự tại phòng khám chuyên khoa.
                </span>
              </span>
            </span>
          </label>
        </div>
        {errors.acuity && (
          <p className="mt-2 text-xs font-medium text-critical">{errors.acuity}</p>
        )}
      </fieldset>

      {value.acuity === "NON_EMERGENCY" && (
        <div>
          <label htmlFor={`${idPrefix}-clinic`}>
            <Label required>Phòng khám ngoại trú</Label>
          </label>
          <select
            id={`${idPrefix}-clinic`}
            value={value.clinic}
            onChange={(event) => onChange({ clinic: event.target.value })}
            aria-invalid={!!errors.clinic}
            className={`${SELECT} ${errors.clinic ? "border-critical" : ""}`}
          >
            <option value="">— Chọn phòng khám —</option>
            {OUTPATIENT_CLINICS.map((clinic) => (
              <option key={clinic} value={clinic}>
                {clinic}
              </option>
            ))}
          </select>
          {errors.clinic && (
            <p className="mt-1.5 text-xs font-medium text-critical">{errors.clinic}</p>
          )}
        </div>
      )}

      <div>
        <Label>Khoa/Phòng chỉ định (hệ thống tự động gán)</Label>
        <div
          className="rounded-xl border border-border-subtle bg-canvas p-4"
          aria-live="polite"
        >
          {!value.acuity ? (
            <p className="text-sm font-medium text-text-muted">
              — Chưa chọn phân loại —
            </p>
          ) : emergency ? (
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-sptt-red-border/40 bg-sptt-red-bg px-3 py-1 font-heading text-xs font-semibold text-sptt-red">
                  {EMERGENCY_DEPARTMENT}
                </span>
                <span className="rounded-full bg-critical px-3 py-1 font-heading text-xs font-semibold text-surface">
                  Ưu tiên 1
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                Chuyển trực tiếp tới Khoa Cấp cứu.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-brand-primary/30 bg-brand-surface px-3 py-1 font-heading text-xs font-semibold text-brand-deep">
                  {OUTPATIENT_DEPARTMENT}
                  {value.clinic ? ` - ${value.clinic}` : ""}
                </span>
                <span className="rounded-full bg-brand-deep px-3 py-1 font-heading text-xs font-semibold text-surface">
                  Ưu tiên 2
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                Khám theo số thứ tự tiếp nhận.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
