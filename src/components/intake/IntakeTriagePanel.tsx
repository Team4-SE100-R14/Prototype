import type { ReactNode } from "react"
import {
  EMERGENCY_DEPARTMENT,
  OUTPATIENT_CLINICS,
  OUTPATIENT_DEPARTMENT,
  type Acuity,
} from "../../lib/intakeQueue"
import Icon from "../ui/Icon"
import { TextArea } from "../ui/TextInput"

export interface TriageValue {
  complaint: string
  acuity: Acuity | ""
  clinic: string
}

const SELECT =
  "w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold text-text-secondary">
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
          <p className="shrink-0 text-text-muted">{value.complaint.length}/255</p>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-text-secondary">
          Phân loại tuyến khám <span className="text-critical">*</span>
        </legend>
        <div className="grid gap-3">
          <label
            className={`cursor-pointer rounded-xl border p-4 transition-colors ${
              emergency
                ? "border-critical bg-critical-bg ring-1 ring-critical"
                : "border-critical-border bg-surface hover:bg-critical-bg"
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
                <Icon className="h-5 w-5">
                  <path d="M12 3L2 21h20L12 3zm0 6v5m0 3h.01" />
                </Icon>
              </span>
              <span>
                <strong className="block text-sm text-critical">
                  CẤP CỨU (EMERGENCY)
                </strong>
                <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                  Ưu tiên mức 1. Tự động định tuyến thẳng vào Khoa Cấp cứu, kích
                  hoạt thông báo SSE tức thì đến kíp trực cấp cứu.
                </span>
              </span>
            </span>
          </label>
          <label
            className={`cursor-pointer rounded-xl border p-4 transition-colors ${
              value.acuity === "NON_EMERGENCY"
                ? "border-info bg-info-bg ring-1 ring-info"
                : "border-border-subtle bg-surface hover:bg-info-bg"
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
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info text-surface">
                <Icon className="h-5 w-5">
                  <path d="M4 20v-7a3 3 0 013-3h10a3 3 0 013 3v7M9 10V4h6v6" />
                </Icon>
              </span>
              <span>
                <strong className="block text-sm text-info">
                  KHÔNG CẤP CỨU (NON-EMERGENCY)
                </strong>
                <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
                  Ưu tiên mức 2. Xếp hàng FIFO tại phòng khám ngoại trú được
                  chọn.
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
                <span className="rounded-full bg-critical-bg px-3 py-1.5 text-xs font-semibold text-critical">
                  {EMERGENCY_DEPARTMENT}
                </span>
                <span className="rounded-full bg-critical px-3 py-1.5 text-xs font-semibold text-surface">
                  Ưu tiên 1 (MucUuTien=1)
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                Tự động định tuyến thẳng, thông báo SSE &lt;= 1.0s tới kíp cấp
                cứu.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-info-bg px-3 py-1.5 text-xs font-semibold text-info">
                  {OUTPATIENT_DEPARTMENT}
                  {value.clinic ? ` - ${value.clinic}` : ""}
                </span>
                <span className="rounded-full bg-info px-3 py-1.5 text-xs font-semibold text-surface">
                  Ưu tiên 2 (MucUuTien=2)
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                Xếp hàng FIFO theo số thứ tự (SoThuTu).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
