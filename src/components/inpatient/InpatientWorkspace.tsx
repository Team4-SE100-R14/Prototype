import { useState } from "react"
import type { AuthUser } from "../../App"
import useInpatient from "../../hooks/useInpatient"
import {
  addProgressNote,
  allocateBed,
  canMarkBedReady,
  dischargePatient,
  emptyBeds,
  findBed,
  findRecord,
  markBedReady,
  transferBed,
  type Bed,
  type DischargeInput,
  type InpatientRecord,
} from "../../lib/inpatient"
import { useToast } from "../ui/Toast"
import AllocationDialog from "./AllocationDialog"
import BedBoardPage from "./BedBoardPage"
import DischargeModal from "./DischargeModal"
import InpatientRecordPage from "./InpatientRecordPage"
import TransferDialog from "./TransferDialog"

type Dialog =
  | { kind: "allocate"; recordId: string; bedCode?: string }
  | { kind: "transfer"; recordId: string }
  | { kind: "discharge"; recordId: string }

export default function InpatientWorkspace({ user }: { user: AuthUser }) {
  const state = useInpatient()
  const [recordId, setRecordId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [dialogError, setDialogError] = useState("")
  const { show, node } = useToast()

  const openDialog = (next: Dialog | null) => {
    setDialogError("")
    setDialog(next)
  }

  const record = recordId ? findRecord(state, recordId) : undefined
  const dialogRecord = dialog ? findRecord(state, dialog.recordId) : undefined

  const handlePickEmptyBed = (bed: Bed) => {
    const candidate = state.records.find(
      (item) => item.status === "waiting" && item.department === bed.department,
    )
    if (!candidate) {
      show(`Không có người bệnh nào đang chờ xếp giường tại ${bed.department}.`, "error")
      return
    }
    openDialog({ kind: "allocate", recordId: candidate.id, bedCode: bed.code })
  }

  const handleMarkReady = (bed: Bed) => {
    const result = markBedReady(bed.code, user)
    if (result.ok) show(`Giường ${bed.code} đã sẵn sàng tiếp nhận người bệnh.`)
    else
      show(
        canMarkBedReady(user.role)
          ? result.error
          : "Bạn không có quyền thay đổi trạng thái giường (403).",
        "error",
      )
  }

  const handleAllocate = (bedCode: string) => {
    if (dialog?.kind !== "allocate" || !dialogRecord) return
    const result = allocateBed(dialog.recordId, bedCode, user)
    if (!result.ok) {
      setDialogError(result.error)
      return
    }
    setDialog(null)
    show(
      `Đã xếp giường ${bedCode} cho ${dialogRecord.patientName} (${dialogRecord.id}) thành công.`,
    )
  }

  const handleTransfer = (bedCode: string) => {
    if (dialog?.kind !== "transfer" || !dialogRecord) return
    const result = transferBed(dialog.recordId, bedCode, user)
    if (!result.ok) {
      setDialogError(result.error)
      return
    }
    setDialog(null)
    show(`Đã chuyển ${dialogRecord.patientName} sang giường ${bedCode} thành công.`)
  }

  const handleDischarge = (input: DischargeInput) => {
    if (dialog?.kind !== "discharge" || !dialogRecord) return
    const bedCode = dialogRecord.bedCode
    const result = dischargePatient(dialog.recordId, input, user)
    if (!result.ok) {
      setDialogError(result.error)
      return
    }
    setDialog(null)
    show(
      `Đã hoàn tất xuất viện. Bệnh án ${dialogRecord.id} đã khóa và giường ${bedCode ?? ""} chuyển sang Bảo trì.`,
    )
  }

  const handleAddNote = (text: string) => {
    if (!record) return false
    const result = addProgressNote(record.id, text, user)
    if (result.ok) show("Đã lưu diễn biến bệnh và ký số thành công.")
    else show(result.error, "error")
    return result.ok
  }

  const viewRecord = (target: InpatientRecord) => setRecordId(target.id)

  return (
    <main className="mx-auto max-w-[1600px] p-5 lg:p-8">
      {record ? (
        <InpatientRecordPage
          key={record.id}
          record={record}
          bed={findBed(state, record.bedCode)}
          role={user.role}
          onBack={() => setRecordId(null)}
          onTransfer={() => openDialog({ kind: "transfer", recordId: record.id })}
          onDischarge={() => openDialog({ kind: "discharge", recordId: record.id })}
          onAddNote={handleAddNote}
        />
      ) : (
        <BedBoardPage
          state={state}
          role={user.role}
          onAllocate={(target) =>
            openDialog({ kind: "allocate", recordId: target.id })
          }
          onPickEmptyBed={handlePickEmptyBed}
          onTransfer={(target) =>
            openDialog({ kind: "transfer", recordId: target.id })
          }
          onViewRecord={viewRecord}
          onMarkReady={handleMarkReady}
        />
      )}

      {dialog?.kind === "allocate" && dialogRecord && (
        <AllocationDialog
          record={dialogRecord}
          freeBeds={emptyBeds(state, dialogRecord.department)}
          initialBedCode={dialog.bedCode}
          error={dialogError}
          onClose={() => openDialog(null)}
          onConfirm={handleAllocate}
        />
      )}
      {dialog?.kind === "transfer" && dialogRecord && (
        <TransferDialog
          record={dialogRecord}
          currentBed={findBed(state, dialogRecord.bedCode)}
          freeBeds={emptyBeds(state)}
          error={dialogError}
          onClose={() => openDialog(null)}
          onConfirm={handleTransfer}
        />
      )}
      {dialog?.kind === "discharge" && dialogRecord && (
        <DischargeModal
          record={dialogRecord}
          error={dialogError}
          onClose={() => openDialog(null)}
          onConfirm={handleDischarge}
        />
      )}
      {node}
    </main>
  )
}
