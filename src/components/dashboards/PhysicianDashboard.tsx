import { useCallback, useState } from "react"
import type { AuthUser } from "../../App"
import WardVitalWorkspace, {
  type WardWorkspaceStatus,
} from "../clinical/WardVitalWorkspace"
import ClinicalExamPage from "../doctor/ClinicalExamPage"
import PatientQueue from "../doctor/PatientQueue"
import EmergencyArrivalBanner from "../intake/EmergencyArrivalBanner"
import InpatientWorkspace from "../inpatient/InpatientWorkspace"
import PrescriptionWorkspace from "../prescription/PrescriptionWorkspace"
import TopNav from "../TopNav"
import Button from "../ui/Button"
import {
  Bed,
  Bell,
  FileText,
  List,
  Stethoscope,
  Volume2,
  type LucideIcon,
} from "lucide-react"
import Modal from "../ui/Modal"

interface Props {
  user: AuthUser
  onLogout: () => void
}

type Workspace = "clinical" | "prescription" | "inpatient" | "beds" | "alerts"
type NavigationIntent = {
  workspace: Workspace
  examOpen?: boolean
  wardView?: "beds" | "alerts"
}

const NAV_ITEMS: Array<{
  id: Workspace
  label: string
  icon: LucideIcon
}> = [
  {
    id: "clinical",
    label: "Khám và chẩn đoán",
    icon: Stethoscope,
  },
  {
    id: "prescription",
    label: "Kê đơn thuốc",
    icon: FileText,
  },
  {
    id: "inpatient",
    label: "Nội trú",
    icon: Bed,
  },
  {
    id: "beds",
    label: "Bảng giường bệnh",
    icon: Bed,
  },
  {
    id: "alerts",
    label: "Danh sách cảnh báo",
    icon: List,
  },
]

export default function PhysicianDashboard(props: Props) {
  const [patientId, setPatientId] = useState("BN-2026-0901")
  const [workspace, setWorkspace] = useState<Workspace>("clinical")
  const [examOpen, setExamOpen] = useState(false)
  const [wardView, setWardView] = useState<"beds" | "alerts">("beds")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [clinicalDirty, setClinicalDirty] = useState(false)
  const [prescriptionDirty, setPrescriptionDirty] = useState(false)
  const [clinicalSaveRequest, setClinicalSaveRequest] = useState(0)
  const [clinicalDiscardRequest, setClinicalDiscardRequest] = useState(0)
  const [prescriptionSaveRequest, setPrescriptionSaveRequest] = useState(0)
  const [prescriptionDiscardRequest, setPrescriptionDiscardRequest] =
    useState(0)
  const [pendingNavigation, setPendingNavigation] =
    useState<NavigationIntent | null>(null)
  const [wardStatus, setWardStatus] = useState<WardWorkspaceStatus>({
    connectionLabel: "Đang kết nối trực tiếp",
    connectionProblem: false,
    unread: 2,
    bellShake: false,
  })

  const updateWardStatus = useCallback((status: WardWorkspaceStatus) => {
    setWardStatus(status)
  }, [])

  const applyNavigation = (intent: NavigationIntent) => {
    setWorkspace(intent.workspace)
    if (typeof intent.examOpen === "boolean") setExamOpen(intent.examOpen)
    if (intent.wardView) setWardView(intent.wardView)
  }

  const requestNavigation = (intent: NavigationIntent) => {
    const leavingClinicalDraft =
      workspace === "clinical" &&
      examOpen &&
      clinicalDirty &&
      (intent.workspace !== "clinical" || intent.examOpen === false)
    const leavingPrescriptionDraft =
      workspace === "prescription" &&
      prescriptionDirty &&
      intent.workspace !== "prescription"
    if (leavingClinicalDraft || leavingPrescriptionDraft) {
      setPendingNavigation(intent)
      return
    }
    applyNavigation(intent)
  }

  const openWorkspace = (next: Workspace) => {
    requestNavigation({
      workspace: next,
      wardView:
        next === "beds" || next === "alerts" ? next : undefined,
    })
  }

  const continuePendingNavigation = (save: boolean) => {
    if (!pendingNavigation) return
    if (workspace === "clinical" && examOpen && clinicalDirty) {
      if (save) setClinicalSaveRequest((request) => request + 1)
      else setClinicalDiscardRequest((request) => request + 1)
    }
    if (workspace === "prescription" && prescriptionDirty) {
      if (save) setPrescriptionSaveRequest((request) => request + 1)
      else setPrescriptionDiscardRequest((request) => request + 1)
    }
    applyNavigation(pendingNavigation)
    setPendingNavigation(null)
  }

  const navigation = (
    <nav className="space-y-1" aria-label="Chức năng Bác sĩ">
      {NAV_ITEMS.map((item) => {
        const active =
          workspace === item.id ||
          (item.id === "beds" &&
            (workspace === "beds" || workspace === "alerts") &&
            wardView === "beds") ||
          (item.id === "alerts" &&
            (workspace === "beds" || workspace === "alerts") &&
            wardView === "alerts")
        return (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => openWorkspace(item.id)}
            className={`flex w-full items-center justify-start gap-3 text-left ${
              active ? "bg-brand-surface text-brand-deep" : ""
            }`}
            aria-current={active ? "page" : undefined}
          >
            <item.icon aria-hidden="true" strokeWidth={1.75} className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1">{item.label}</span>
            {item.id === "alerts" && wardStatus.unread > 0 && (
              <span className="rounded-full bg-critical px-2 py-0.5 text-xs text-surface">
                {wardStatus.unread}
              </span>
            )}
          </Button>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <TopNav
        user={props.user}
        onLogout={props.onLogout}
        title="Không gian làm việc Bác sĩ"
        actions={
          <div className="ml-auto hidden items-center gap-2 xl:flex">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                wardStatus.connectionProblem
                  ? "border-warning/30 bg-warning-bg text-warning"
                  : "border-normal/20 bg-normal-bg text-normal"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  wardStatus.connectionProblem
                    ? "bg-warning"
                    : "animate-pulse bg-normal"
                }`}
              />
              {wardStatus.connectionLabel}
            </span>
            <Button
              variant="ghost"
              className="flex items-center gap-2 border border-border-subtle px-3 py-1.5"
              onClick={() => setSoundEnabled((enabled) => !enabled)}
            >
              <span className={wardStatus.bellShake ? "animate-bell" : ""}>
                {soundEnabled ? (
                  <Volume2 aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                ) : (
                  <Bell aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                )}
              </span>
              Âm báo: {soundEnabled ? "Bật" : "Tắt"}
            </Button>
            <span className="rounded-full border border-border-subtle bg-subsurface px-3 py-1.5 text-xs font-semibold text-text-secondary">
              Cảnh báo chưa xác nhận: {wardStatus.unread}
            </span>
          </div>
        }
      />

      <EmergencyArrivalBanner user={props.user} />

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 self-start overflow-y-auto border-r border-border-subtle bg-surface p-4 lg:block">
          <div className="mb-5 rounded-lg bg-brand-surface p-3">
            <div className="text-xs font-semibold text-brand-deep">
              KHOA ĐƯỢC PHÂN CÔNG
            </div>
            <div className="mt-1 text-sm font-semibold text-text-primary">
              Khoa Nội tổng quát
            </div>
          </div>
          {navigation}
          <div className="mt-8 border-t border-border-subtle pt-4 text-xs leading-relaxed text-text-muted">
            Dữ liệu bệnh nhân và cảnh báo được giới hạn trong phạm vi khoa được
            phân công.
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-border-subtle bg-surface p-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {NAV_ITEMS.map((item) => {
                const active = workspace === item.id
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`flex items-center justify-center gap-2 px-2 text-xs ${
                      active ? "bg-brand-surface text-brand-deep" : ""
                    }`}
                    onClick={() => openWorkspace(item.id)}
                  >
                    <item.icon aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                    {item.label}
                    {item.id === "alerts" && wardStatus.unread > 0 && (
                      <span className="rounded-full bg-critical px-1.5 py-0.5 text-xs text-surface">
                        {wardStatus.unread}
                      </span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className={workspace === "clinical" ? "block" : "hidden"}>
            <div className={examOpen ? "hidden" : "block"}>
              <PatientQueue
                {...props}
                embedded
                onOpenExam={(nextPatientId) => {
                  setPatientId(nextPatientId)
                  setExamOpen(true)
                }}
                onOpenPrescription={() =>
                  requestNavigation({ workspace: "prescription" })
                }
              />
            </div>
            <div className={examOpen ? "block" : "hidden"}>
              <ClinicalExamPage
                {...props}
                embedded
                patientId={patientId}
                onDirtyChange={setClinicalDirty}
                saveDraftRequest={clinicalSaveRequest}
                discardDraftRequest={clinicalDiscardRequest}
                onBackToQueue={() =>
                  requestNavigation({
                    workspace: "clinical",
                    examOpen: false,
                  })
                }
                onOpenPrescription={() =>
                  requestNavigation({ workspace: "prescription" })
                }
              />
            </div>
          </div>

          <div className={workspace === "prescription" ? "block" : "hidden"}>
            <PrescriptionWorkspace
              {...props}
              embedded
              patientId={patientId}
              onDirtyChange={setPrescriptionDirty}
              saveDraftRequest={prescriptionSaveRequest}
              discardDraftRequest={prescriptionDiscardRequest}
              onOpenExam={() => {
                requestNavigation({
                  workspace: "clinical",
                  examOpen: true,
                })
              }}
              onBackToQueue={() => {
                requestNavigation({
                  workspace: "clinical",
                  examOpen: false,
                })
              }}
            />
          </div>

          {workspace === "inpatient" && (
            <InpatientWorkspace user={props.user} />
          )}

          <div
            className={
              workspace === "beds" || workspace === "alerts"
                ? "block"
                : "hidden"
            }
          >
            <WardVitalWorkspace
              {...props}
              embedded
              requestedView={wardView}
              onRequestedViewChange={(nextView) => {
                setWardView(nextView)
                setWorkspace(nextView)
              }}
              soundEnabled={soundEnabled}
              onStatusChange={updateWardStatus}
            />
          </div>
        </div>
      </div>

      {pendingNavigation && (
        <Modal
          titleId="doctor-draft-navigation-title"
          descriptionId="doctor-draft-navigation-description"
          dismissible={false}
          onClose={() => setPendingNavigation(null)}
        >
          <div className="border-b border-border-subtle px-6 py-5">
            <div
              id="doctor-draft-navigation-title"
              className="font-display text-xl font-semibold text-text-primary"
            >
              Lưu bản nháp trước khi rời trang?
            </div>
            <div
              id="doctor-draft-navigation-description"
              className="mt-2 text-sm leading-relaxed text-text-muted"
            >
              Bạn đang có thông tin chưa được lưu. Hãy lưu bản nháp để tiếp tục
              làm việc sau hoặc bỏ các thay đổi vừa nhập.
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 bg-canvas px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setPendingNavigation(null)}
            >
              Ở lại trang
            </Button>
            <div className="flex gap-2">
              <Button
                variant="danger"
                onClick={() => continuePendingNavigation(false)}
              >
                Không lưu
              </Button>
              <Button onClick={() => continuePendingNavigation(true)}>
                Lưu nháp và tiếp tục
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
