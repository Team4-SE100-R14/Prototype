import type { AuthUser } from "../../App"
import {
  getClinicalPatient,
  type ClinicalPatient,
} from "../../lib/clinicalWorkflow"
import TopNav from "../TopNav"

export default function DoctorEncounterHeader({
  user,
  onLogout,
  status,
  patient = getClinicalPatient("BN-2026-0901"),
  embedded = false,
}: {
  user: AuthUser
  onLogout: () => void
  status: string
  patient?: ClinicalPatient
  embedded?: boolean
}) {
  return (
    <>
      {!embedded && <TopNav
        user={user}
        onLogout={onLogout}
        title="Không gian làm việc Bác sĩ"
      />}
      <div className="sticky top-14 z-30 border-b border-border-subtle bg-surface px-4 py-3 shadow-sm sm:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="font-display text-lg font-bold text-text-primary">
                {patient.name}
              </span>
              <span className="text-sm text-text-secondary">
                {patient.age} tuổi
              </span>
              <span className="text-sm text-text-secondary">
                {patient.gender}
              </span>
              <span className="font-mono text-sm font-semibold text-brand-deep">
                Mã BN: {patient.id}
              </span>
              {patient.allergy ? (
                <span className="rounded-full border border-critical-border bg-critical-bg px-3 py-1 text-xs font-bold text-critical">
                  Dị ứng: {patient.allergy}
                </span>
              ) : (
                <span className="rounded-full bg-normal-bg px-3 py-1 text-xs font-semibold text-normal">
                  Chưa ghi nhận dị ứng
                </span>
              )}
            </div>
          </div>

          <span className="rounded-full bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-deep">
            Trạng thái: {status}
          </span>

        </div>
      </div>
    </>
  )
}
