import type { AuthUser } from "../App"
import { AUDIT_EVENT, AUDIT_KEY, readSecurityAudit } from "./sessionSecurity"

// REQ-ADM-03: binary clinical acuity intake and department queue routing.
export type Acuity = "EMERGENCY" | "NON_EMERGENCY"
export type EncounterStatus = "DangCho" | "DangKham"

export interface IntakeEncounter {
  id: string
  maBenhNhan: string
  hoTen: string
  lyDoKham: string
  acuity: Acuity
  mucUuTien: 1 | 2
  department: string
  clinic: string | null
  soThuTu: number
  status: EncounterStatus
  createdAt: number
  createdBy: string
}

export interface IntakeInput {
  maBenhNhan: string
  hoTen: string
  lyDoKham: string
  acuity: Acuity | ""
  clinic: string
}

export const INTAKE_EVENT = "hpms-intake-queue-changed"
export const INTAKE_STORAGE_KEY = "hpms-intake-queue-v1"
export const EMERGENCY_DEPARTMENT = "Khoa Cấp cứu"
export const OUTPATIENT_DEPARTMENT = "Khoa Khám ngoại trú"
export const OUTPATIENT_CLINICS = [
  "PK Tim mạch",
  "PK Hô hấp",
  "PK Nội tổng quát",
]

const PATIENT_ID_PATTERN = /^BN-\d{2}-\d{4,}$/

interface IntakeState {
  counter: number
  items: IntakeEncounter[]
}

const minutesAgo = (minutes: number) => Date.now() - minutes * 60_000

function seedState(): IntakeState {
  const seed: Array<[string, string, string, Acuity, string | null, number]> = [
    ["BN-26-0089", "Lê Hoàng Long", "Đau ngực dữ dội, khó thở", "EMERGENCY", null, 11],
    ["BN-26-0087", "Trần Thị Thanh", "Co giật, mất ý thức thoáng qua", "EMERGENCY", null, 9],
    ["BN-26-0081", "Phạm Quốc Minh", "Chấn thương sau tai nạn giao thông", "EMERGENCY", null, 8],
    ["BN-26-0078", "Vũ Thị Hồng", "Sốt cao kèm phát ban lan rộng", "EMERGENCY", null, 5],
    ["BN-26-0094", "Nguyễn Minh Anh", "Hồi hộp, đánh trống ngực", "NON_EMERGENCY", "PK Tim mạch", 14],
    ["BN-26-0093", "Đỗ Văn Nam", "Ho kéo dài hai tuần", "NON_EMERGENCY", "PK Hô hấp", 9],
    ["BN-26-0091", "Bùi Thu Hà", "Đau bụng âm ỉ vùng thượng vị", "NON_EMERGENCY", "PK Nội tổng quát", 6],
  ]
  const items = seed.map(([maBenhNhan, hoTen, lyDoKham, acuity, clinic, ago], index) => ({
    id: `PK-26-${String(index + 1).padStart(4, "0")}`,
    maBenhNhan,
    hoTen,
    lyDoKham,
    acuity,
    mucUuTien: acuity === "EMERGENCY" ? 1 : 2,
    department: acuity === "EMERGENCY" ? EMERGENCY_DEPARTMENT : OUTPATIENT_DEPARTMENT,
    clinic,
    soThuTu: index + 1,
    status: "DangCho" as const,
    createdAt: minutesAgo(ago),
    createdBy: "Hệ thống",
  }))
  return { counter: items.length, items: items as IntakeEncounter[] }
}

function readState(): IntakeState {
  try {
    const stored = localStorage.getItem(INTAKE_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed?.items) && Number.isFinite(parsed?.counter)) return parsed
    }
  } catch {
    /* Storage is optional for the prototype. */
  }
  const seeded = seedState()
  writeState(seeded, false)
  return seeded
}

function writeState(state: IntakeState, announce = true, detail?: unknown) {
  try {
    localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* Storage is optional for the prototype. */
  }
  if (announce && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INTAKE_EVENT, { detail }))
  }
}

export function readIntakeQueue(): IntakeEncounter[] {
  return readState().items
}

// Emergency first (MucUuTien = 1), then FIFO by integer ticket sequence.
export function sortQueue(items: IntakeEncounter[]) {
  return [...items].sort(
    (a, b) => a.mucUuTien - b.mucUuTien || a.soThuTu - b.soThuTu,
  )
}

export function destinationLabel(item: Pick<IntakeEncounter, "department" | "clinic">) {
  return item.clinic ? `${item.department} - ${item.clinic}` : item.department
}

export function formatWait(createdAt: number, now = Date.now()) {
  const minutes = Math.floor((now - createdAt) / 60_000)
  return minutes < 1 ? "Vừa tiếp nhận" : `${minutes} phút trước`
}

export function validateIntake(
  input: IntakeInput,
  options: { requirePatient?: boolean } = {},
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (options.requirePatient) {
    if (!PATIENT_ID_PATTERN.test(input.maBenhNhan.trim()))
      errors.maBenhNhan = "Mã bệnh nhân phải đúng định dạng BN-YY-xxxx."
    if (!input.hoTen.trim()) errors.hoTen = "Vui lòng nhập họ và tên bệnh nhân."
  }
  const complaint = input.lyDoKham.trim()
  if (complaint.length < 3 || complaint.length > 255)
    errors.complaint =
      "Please enter the presenting chief complaint (minimum 3 characters)."
  if (!input.acuity) errors.acuity = "Chọn phân loại tuyến khám để tiếp tục."
  else if (input.acuity === "NON_EMERGENCY" && !input.clinic)
    errors.clinic = "Vui lòng chọn phòng khám ngoại trú."
  return errors
}

function appendRoutingAudit(
  actor: AuthUser,
  action: string,
  encounter: IntakeEncounter,
  workstation: string,
) {
  try {
    const entry = {
      id: `ADM-${crypto.randomUUID()}`,
      time: new Date().toLocaleString("vi-VN"),
      actor: actor.name,
      workstation,
      action,
      actionTone: "cyan",
      object: `${encounter.id} · ${encounter.maBenhNhan} · ${encounter.acuity} · ${destinationLabel(encounter)} · MucUuTien=${encounter.mucUuTien}`,
      result: "Thành công",
    }
    localStorage.setItem(
      AUDIT_KEY,
      JSON.stringify([entry, ...readSecurityAudit()].slice(0, 200)),
    )
    window.dispatchEvent(new Event(AUDIT_EVENT))
  } catch {
    /* Audit storage must not block intake in the demonstration. */
  }
}

const WORKSTATION: Record<string, string> = {
  receptionist: "Bàn Tiếp đón Trung tâm",
  nurse: "Trạm Điều dưỡng",
  physician: "Phòng khám Bác sĩ",
}

export function enqueueEncounter(
  input: IntakeInput,
  actor: AuthUser,
): IntakeEncounter | null {
  if (!input.acuity || Object.keys(validateIntake(input)).length) return null
  const state = readState()
  const counter = state.counter + 1
  const emergency = input.acuity === "EMERGENCY"
  const encounter: IntakeEncounter = {
    id: `PK-26-${String(counter).padStart(4, "0")}`,
    maBenhNhan: input.maBenhNhan.trim(),
    hoTen: input.hoTen.trim(),
    lyDoKham: input.lyDoKham.trim(),
    acuity: input.acuity,
    mucUuTien: emergency ? 1 : 2,
    department: emergency ? EMERGENCY_DEPARTMENT : OUTPATIENT_DEPARTMENT,
    clinic: emergency ? null : input.clinic,
    soThuTu: counter,
    status: "DangCho",
    createdAt: Date.now(),
    createdBy: actor.name,
  }
  writeState({ counter, items: [...state.items, encounter] }, true, {
    type: emergency ? "emergency-arrival" : "queued",
    encounterId: encounter.id,
  })
  appendRoutingAudit(
    actor,
    emergency ? "Định tuyến cấp cứu" : "Định tuyến ngoại trú",
    encounter,
    WORKSTATION[actor.role] || "Máy trạm minh họa",
  )
  return encounter
}

export function startConsultation(encounterId: string, actor: AuthUser) {
  const state = readState()
  const target = state.items.find((item) => item.id === encounterId)
  if (!target || target.status !== "DangCho") return null
  const started = { ...target, status: "DangKham" as const }
  writeState(
    {
      ...state,
      items: state.items.map((item) => (item.id === encounterId ? started : item)),
    },
    true,
    { type: "consultation-started", encounterId },
  )
  appendRoutingAudit(
    actor,
    "Bắt đầu khám",
    started,
    WORKSTATION[actor.role] || "Máy trạm minh họa",
  )
  return started
}
