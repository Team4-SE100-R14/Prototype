import { useMemo, useState } from "react"
import type { AuthUser } from "../../App"
import TopNav from "../TopNav"
import Button from "../ui/Button"
import { UserPlus } from "lucide-react"
import { CLINICAL_PATIENTS } from "../../lib/clinicalWorkflow"
import IntakeQueueBoard from "../intake/IntakeQueueBoard"

export default function PatientQueue({
  user,
  onLogout,
  onOpenExam,
  onOpenPrescription,
  embedded = false,
}: {
  user: AuthUser
  onLogout: () => void
  onOpenExam: (patientId: string) => void
  onOpenPrescription: () => void
  embedded?: boolean
}) {
  const [room, setRoom] = useState("Phòng Nội Tổng Hợp 1")
  const [priority, setPriority] = useState<
    "all" | "emergency" | "normal"
  >("all")

  const patients = useMemo(
    () =>
      CLINICAL_PATIENTS.filter(
        (patient) => priority === "all" || patient.priority === priority,
      ),
    [priority],
  )

  return (
    <div className={`${embedded ? "min-h-full" : "min-h-screen"} bg-canvas`}>
      {!embedded && <TopNav
        user={user}
        onLogout={onLogout}
        title="Không gian làm việc Bác sĩ"
        actions={
          <Button
            variant="ghost"
            className="hidden border border-border-subtle bg-surface sm:block"
            onClick={onOpenPrescription}
          >
            Mở hồ sơ đang khám
          </Button>
        }
      />}

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-deep">
              <span className="h-2 w-2 rounded-full bg-normal" />
              Tiếp nhận ngoại trú
            </div>
            <div className="font-display text-3xl font-bold text-text-primary">
              Hàng đợi phòng khám
            </div>
            <div className="mt-2 text-sm text-text-muted">
              Theo dõi và gọi bệnh nhân theo thứ tự ưu tiên.
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-surface text-brand-deep">
              <UserPlus aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs font-medium text-text-muted">
                Tổng số đang chờ
              </div>
              <div className="font-display text-lg font-bold text-text-primary">
                15 bệnh nhân
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <IntakeQueueBoard user={user} />
        </div>

        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="grid gap-4 border-b border-border-subtle bg-subsurface/60 p-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text-secondary">
                Phòng khám
              </span>
              <select
                value={room}
                onChange={(event) => setRoom(event.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option>Phòng Nội Tổng Hợp 1</option>
                <option>Phòng Nội Tổng Hợp 2</option>
                <option>Phòng Tim mạch 1</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text-secondary">
                Lọc theo mức ưu tiên
              </span>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as "all" | "emergency" | "normal",
                  )
                }
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="all">Tất cả mức ưu tiên</option>
                <option value="emergency">Cấp cứu</option>
                <option value="normal">Bình thường</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-4xl text-left text-sm">
              <thead className="bg-subsurface text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  {[
                    "STT",
                    "Mã BN",
                    "Họ và tên",
                    "Tuổi & Giới tính",
                    "Mức ưu tiên",
                    "Thao tác",
                  ].map((heading) => (
                    <th key={heading} className="px-5 py-3.5 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-t border-border-subtle bg-surface transition-colors hover:bg-canvas"
                  >
                    <td className="px-5 py-5 font-mono font-semibold text-text-secondary">
                      {patient.order}
                    </td>
                    <td className="px-5 py-5 font-mono font-semibold text-brand-deep">
                      {patient.id}
                    </td>
                    <td className="px-5 py-5 font-semibold text-text-primary">
                      {patient.name}
                    </td>
                    <td className="px-5 py-5 text-text-secondary">
                      {patient.age} - {patient.gender}
                    </td>
                    <td className="px-5 py-5">
                      {patient.priority === "emergency" ? (
                        <span className="inline-flex rounded-full bg-critical-bg px-3 py-1 text-xs font-bold text-critical">
                          Cấp cứu
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-subsurface px-3 py-1 text-xs font-semibold text-text-secondary">
                          Bình thường
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-5">
                      <Button
                        onClick={() => onOpenExam(patient.id)}
                      >
                        Gọi khám
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
