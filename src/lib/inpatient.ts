import type { AuthUser, UserRole } from "../App"
import {
  AUDIT_EVENT,
  AUDIT_KEY,
  readSecurityAudit,
  type SecurityAuditEntry,
} from "./sessionSecurity"

export const INPATIENT_EVENT = "hpms-inpatient-changed"
export const INPATIENT_STORAGE_KEY = "hpms-inpatient-v1"

export type Department = "Khoa Nội tổng hợp" | "Khoa Ngoại" | "Khoa Nhi"
export const DEPARTMENTS: Department[] = [
  "Khoa Nội tổng hợp",
  "Khoa Ngoại",
  "Khoa Nhi",
]

export const DOCTORS: Record<Department, string[]> = {
  "Khoa Nội tổng hợp": [
    "BS. Trần Minh Khoa",
    "BS. Lê Minh Tuấn",
    "BS. Nguyễn Hoàng",
  ],
  "Khoa Ngoại": ["BS. Phạm Quốc Anh"],
  "Khoa Nhi": ["BS. Trần Mai Linh"],
}

export const ICD_OPTIONS: Array<[string, string]> = [
  ["J18.9", "Viêm phổi, không đặc hiệu"],
  ["J00", "Viêm mũi họng cấp"],
  ["I10", "Tăng huyết áp vô căn"],
  ["E11.9", "Đái tháo đường típ 2"],
]

export type BedStatus = "empty" | "occupied" | "maintenance"
export type BedAlert = "warning" | "critical"
export type RecordStatus = "waiting" | "treating" | "discharged"

export interface Room {
  name: string
  area: string
  department: Department
}

export interface Bed {
  code: string
  room: string
  department: Department
  status: BedStatus
  recordId?: string
  maintenance?: string
  alert?: BedAlert
  alertText?: string
}

export interface ProgressNote {
  id: string
  time: string
  author: string
  text: string
}

export interface BedStay {
  bedCode: string
  department: Department
  from: string
  to: string | null
  reason: string | null
}

export interface DischargeInfo {
  condition: string
  conclusion: string
  instructions: string
  followUpDate: string
  dischargedAt: string
  by: string
}

export interface InpatientRecord {
  id: string
  patientCode: string
  patientName: string
  age?: number
  gender?: string
  department: Department
  doctor: string
  bedCode: string | null
  admittedAt: string
  icdCode?: string
  diagnosis: string
  reason?: string
  status: RecordStatus
  notes: ProgressNote[]
  bedHistory: BedStay[]
  discharge?: DischargeInfo
}

export interface InpatientState {
  records: InpatientRecord[]
  beds: Bed[]
}

export type OpResult =
  | { ok: true; record?: InpatientRecord }
  | { ok: false; error: string }

export const ROOMS: Room[] = [
  { name: "Phòng 201", area: "Khu A · Nội tổng hợp", department: "Khoa Nội tổng hợp" },
  { name: "Phòng 202", area: "Khu A · Nội tổng hợp", department: "Khoa Nội tổng hợp" },
  { name: "Phòng 203", area: "Khu A · Nội tổng hợp", department: "Khoa Nội tổng hợp" },
  { name: "Phòng 301", area: "Khu B · Ngoại", department: "Khoa Ngoại" },
  { name: "Phòng 401", area: "Khu C · Nhi", department: "Khoa Nhi" },
]

const MAINTENANCE_LABEL = "Đang vệ sinh / bảo trì"

export const STATUS_LABEL: Record<RecordStatus, string> = {
  waiting: "Chờ xếp giường",
  treating: "Đang điều trị",
  discharged: "Đã xuất viện",
}

/* ------------------------------------------------------------------ */
/* Permissions                                                         */
/* ------------------------------------------------------------------ */

export const canViewInpatient = (role: UserRole) =>
  role === "physician" || role === "nurse"
export const canAdmit = (role: UserRole) => role === "physician"
export const canAllocate = (role: UserRole) =>
  role === "physician" || role === "nurse"
export const canTransfer = canAllocate
export const canDischarge = (role: UserRole) => role === "physician"
export const canAddNote = canAllocate
export const canMarkBedReady = (role: UserRole) => role === "nurse"

/* ------------------------------------------------------------------ */
/* Date helpers (dd/mm/yyyy HH:mm, matching the Khiem prototype)       */
/* ------------------------------------------------------------------ */

const pad = (value: number) => String(value).padStart(2, "0")

export function formatDateTime(date = new Date()): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function parseDateTime(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/)
  if (!match) return null
  const [, day, month, year, hour = "0", minute = "0"] = match
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  )
  return Number.isNaN(date.getTime()) ? null : date
}

/** Whole days between admission and now (or discharge), minimum 1. */
export function treatmentDays(record: InpatientRecord): number | null {
  const from = parseDateTime(record.admittedAt)
  if (!from) return null
  const to = record.discharge
    ? (parseDateTime(record.discharge.dischargedAt) ?? new Date())
    : new Date()
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000))
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

function bed(
  room: string,
  department: Department,
  code: string,
  extra: Partial<Bed> = {},
): Bed {
  return { code, room, department, status: "empty", ...extra }
}

const NOI: Department = "Khoa Nội tổng hợp"
const NGOAI: Department = "Khoa Ngoại"
const NHI: Department = "Khoa Nhi"

function seedState(): InpatientState {
  const maintenance = { status: "maintenance" as const, maintenance: MAINTENANCE_LABEL }
  const beds: Bed[] = [
    bed("Phòng 201", NOI, "G-KNOI-201A"),
    bed("Phòng 201", NOI, "G-KNOI-201B", {
      status: "occupied",
      recordId: "BA-26-0057",
      alert: "warning",
      alertText: "SpO2 92% - 10:42",
    }),
    bed("Phòng 201", NOI, "G-KNOI-201C", { status: "occupied", recordId: "BA-26-0050" }),
    bed("Phòng 201", NOI, "G-KNOI-201D", maintenance),
    bed("Phòng 202", NOI, "G-KNOI-202A", {
      status: "occupied",
      recordId: "BA-26-0053",
      alert: "critical",
      alertText: "SpO2 88% - 10:45",
    }),
    bed("Phòng 202", NOI, "G-KNOI-202B"),
    bed("Phòng 202", NOI, "G-KNOI-202C", maintenance),
    bed("Phòng 202", NOI, "G-KNOI-202D", { status: "occupied", recordId: "BA-26-0046" }),
    bed("Phòng 203", NOI, "G-KNOI-203A"),
    bed("Phòng 203", NOI, "G-KNOI-203B"),
    bed("Phòng 301", NGOAI, "G-KNGOAI-301A"),
    bed("Phòng 301", NGOAI, "G-KNGOAI-301B"),
    bed("Phòng 301", NGOAI, "G-KNGOAI-301C", maintenance),
    bed("Phòng 401", NHI, "G-KNHI-401A"),
    bed("Phòng 401", NHI, "G-KNHI-401B"),
  ]

  const treating = (
    id: string,
    patientCode: string,
    patientName: string,
    age: number,
    gender: string,
    doctor: string,
    bedCode: string,
    admittedAt: string,
    icdCode: string,
    diagnosis: string,
    notes: ProgressNote[] = [],
  ): InpatientRecord => ({
    id,
    patientCode,
    patientName,
    age,
    gender,
    department: NOI,
    doctor,
    bedCode,
    admittedAt,
    icdCode,
    diagnosis,
    status: "treating",
    notes,
    bedHistory: [{ bedCode, department: NOI, from: admittedAt, to: null, reason: null }],
  })

  const waiting = (
    id: string,
    patientCode: string,
    patientName: string,
    age: number,
    gender: string,
    department: Department,
    doctor: string,
    admittedAt: string,
    diagnosis: string,
  ): InpatientRecord => ({
    id,
    patientCode,
    patientName,
    age,
    gender,
    department,
    doctor,
    bedCode: null,
    admittedAt,
    diagnosis,
    status: "waiting",
    notes: [],
    bedHistory: [],
  })

  const discharged = (
    id: string,
    patientCode: string,
    patientName: string,
    age: number,
    gender: string,
    department: Department,
    doctor: string,
    bedCode: string,
    admittedAt: string,
    dischargedAt: string,
    diagnosis: string,
    condition: string,
  ): InpatientRecord => ({
    id,
    patientCode,
    patientName,
    age,
    gender,
    department,
    doctor,
    bedCode,
    admittedAt,
    diagnosis,
    status: "discharged",
    notes: [],
    bedHistory: [
      { bedCode, department, from: admittedAt, to: dischargedAt, reason: "Xuất viện" },
    ],
    discharge: {
      condition,
      conclusion: "Ổn định, đủ điều kiện ra viện.",
      instructions: "Dùng thuốc theo đơn, tái khám theo hẹn.",
      followUpDate: "2026-10-20",
      dischargedAt,
      by: doctor,
    },
  })

  const records: InpatientRecord[] = [
    treating(
      "BA-26-0057", "BN-26-0142", "Trần Thị Bích", 55, "Nữ",
      "BS. Lê Minh Tuấn", "G-KNOI-201B", "03/10/2026 14:20",
      "J18.9", "Viêm phổi, không đặc hiệu",
      [
        {
          id: "N-0057-3",
          time: "03/10/2026 20:30",
          author: "BS. Lê Minh Tuấn",
          text: "Người bệnh tỉnh, tiếp xúc tốt. Còn ho khan, khó thở nhẹ khi vận động. SpO2 94% khi thở oxy gọng mũi 2 lít/phút. Tiếp tục theo dõi sát dấu hiệu sinh tồn.",
        },
        {
          id: "N-0057-2",
          time: "03/10/2026 15:10",
          author: "BS. Nguyễn Hoàng",
          text: "Đã tiếp nhận tại khoa. Người bệnh sốt 38,2°C, mạch 92 lần/phút, huyết áp 140/85 mmHg. Khám phổi có ran ẩm vùng đáy phổi phải.",
        },
        {
          id: "N-0057-1",
          time: "03/10/2026 14:20",
          author: "BS. Lê Minh Tuấn",
          text: "Nhập khoa từ phòng khám Nội. Chẩn đoán ban đầu: Viêm phổi, không đặc hiệu. Chỉ định xét nghiệm công thức máu, CRP và chụp X-quang ngực.",
        },
      ],
    ),
    treating("BA-26-0050", "BN-26-0098", "Nguyễn Văn Minh", 62, "Nam", "BS. Nguyễn Hoàng", "G-KNOI-201C", "02/10/2026 08:05", "I10", "Tăng huyết áp vô căn"),
    treating("BA-26-0053", "BN-26-0129", "Phạm Quốc Bảo", 47, "Nam", "BS. Lê Minh Tuấn", "G-KNOI-202A", "03/10/2026 09:10", "J18.9", "Viêm phổi, không đặc hiệu"),
    treating("BA-26-0046", "BN-26-0113", "Lê Thị Thanh Nga", 71, "Nữ", "BS. Nguyễn Hoàng", "G-KNOI-202D", "01/10/2026 16:35", "E11.9", "Đái tháo đường típ 2"),
    waiting("BA-26-0054", "BN-26-0171", "Đỗ Mạnh Hùng", 58, "Nam", NOI, "BS. Lê Minh Tuấn", "04/10/2026 10:32", "Đau ngực, theo dõi hội chứng vành cấp"),
    waiting("BA-26-0051", "BN-26-0165", "Vũ Thị Thu Hà", 44, "Nữ", NOI, "BS. Nguyễn Hoàng", "04/10/2026 09:18", "Tăng huyết áp vô căn"),
    waiting("BA-26-0049", "BN-26-0158", "Hoàng Đức Long", 36, "Nam", NGOAI, "BS. Phạm Quốc Anh", "04/10/2026 08:45", "Viêm ruột thừa cấp"),
    discharged("BA-26-0038", "BN-26-0087", "Ngô Thị Lan", 52, "Nữ", NGOAI, "BS. Phạm Quốc Anh", "G-KNGOAI-301A", "28/09/2026 08:10", "02/10/2026 09:30", "Sỏi túi mật", "Khỏi"),
    discharged("BA-26-0041", "BN-26-0092", "Đinh Văn Hải", 66, "Nam", NOI, "BS. Lê Minh Tuấn", "G-KNOI-203A", "29/09/2026 11:00", "03/10/2026 10:15", "Viêm phổi, không đặc hiệu", "Đỡ / Giảm"),
    discharged("BA-26-0044", "BN-26-0101", "Bé Nguyễn Gia Bảo", 6, "Nam", NHI, "BS. Trần Mai Linh", "G-KNHI-401A", "30/09/2026 15:40", "03/10/2026 08:50", "Viêm phổi, không đặc hiệu", "Khỏi"),
  ]

  return { beds, records }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

let memoryState: InpatientState | null = null

function isValidState(value: unknown): value is InpatientState {
  const candidate = value as InpatientState | null
  return (
    !!candidate &&
    Array.isArray(candidate.records) &&
    Array.isArray(candidate.beds) &&
    candidate.beds.length > 0
  )
}

export function readInpatientState(): InpatientState {
  try {
    const stored = localStorage.getItem(INPATIENT_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (isValidState(parsed)) return parsed
    }
  } catch {
    // Fall through to the in-memory copy when storage is unavailable.
  }
  return memoryState ?? seedState()
}

function writeInpatientState(next: InpatientState) {
  memoryState = next
  try {
    localStorage.setItem(INPATIENT_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage is optional for the demonstration.
  }
  window.dispatchEvent(new Event(INPATIENT_EVENT))
}

export function resetInpatientState() {
  memoryState = null
  try {
    localStorage.removeItem(INPATIENT_STORAGE_KEY)
  } catch {
    // Nothing to reset when storage is unavailable.
  }
  window.dispatchEvent(new Event(INPATIENT_EVENT))
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

const WORKSTATION: Partial<Record<UserRole, string>> = {
  physician: "Phòng khám Bác sĩ",
  nurse: "Trạm Điều dưỡng",
  admin: "Phòng Kế hoạch tổng hợp",
}

export function appendAudit(
  actor: AuthUser,
  action: string,
  object: string,
  result: SecurityAuditEntry["result"] = "Thành công",
) {
  const entry: SecurityAuditEntry = {
    id: `INC-${crypto.randomUUID()}`,
    time: new Date().toLocaleString("vi-VN"),
    actor: actor.name,
    workstation: WORKSTATION[actor.role] ?? "Máy trạm minh họa",
    action,
    actionTone: "cyan",
    object,
    result,
  }
  try {
    localStorage.setItem(
      AUDIT_KEY,
      JSON.stringify([entry, ...readSecurityAudit()].slice(0, 200)),
    )
    window.dispatchEvent(new Event(AUDIT_EVENT))
  } catch {
    // Audit storage must not block the workflow in the demonstration.
  }
}

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export function findRecord(state: InpatientState, id: string) {
  return state.records.find((record) => record.id === id)
}

export function findBed(state: InpatientState, code: string | null | undefined) {
  return code ? state.beds.find((item) => item.code === code) : undefined
}

export function activeRecordFor(state: InpatientState, patientCode: string) {
  return state.records.find(
    (record) =>
      record.patientCode === patientCode && record.status !== "discharged",
  )
}

export function emptyBeds(state: InpatientState, department?: Department) {
  return state.beds.filter(
    (item) =>
      item.status === "empty" && (!department || item.department === department),
  )
}

export function bedCounts(beds: Bed[]) {
  return {
    total: beds.length,
    empty: beds.filter((item) => item.status === "empty").length,
    occupied: beds.filter((item) => item.status === "occupied").length,
    maintenance: beds.filter((item) => item.status === "maintenance").length,
  }
}

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

function deny(actor: AuthUser, action: string, object: string): OpResult {
  appendAudit(actor, action, `${object} · Default-Deny`, "Thất bại")
  return { ok: false, error: "Bạn không có quyền thực hiện thao tác này (403)." }
}

export interface AdmissionInput {
  patientCode: string
  patientName: string
  age?: number
  gender?: string
  department: Department
  doctor: string
  icdCode?: string
  diagnosis: string
  reason?: string
}

export function admitPatient(input: AdmissionInput, actor: AuthUser): OpResult {
  if (!canAdmit(actor.role))
    return deny(actor, "Chỉ định nhập viện", input.patientCode)
  const state = readInpatientState()
  const active = activeRecordFor(state, input.patientCode)
  if (active) {
    appendAudit(
      actor,
      "Chỉ định nhập viện",
      `${input.patientCode} · trùng bệnh án ${active.id} (${STATUS_LABEL[active.status]})`,
      "Thất bại",
    )
    return {
      ok: false,
      error: `Bệnh nhân đang có bệnh án nội trú ${active.id} (${STATUS_LABEL[active.status]}). Không thể tạo đồng thời nhiều bệnh án nội trú.`,
    }
  }
  const next =
    state.records.reduce(
      (max, record) => Math.max(max, Number(record.id.split("-")[2]) || 0),
      0,
    ) + 1
  const record: InpatientRecord = {
    id: `BA-26-${String(next).padStart(4, "0")}`,
    patientCode: input.patientCode,
    patientName: input.patientName,
    age: input.age,
    gender: input.gender,
    department: input.department,
    doctor: input.doctor,
    bedCode: null,
    admittedAt: formatDateTime(),
    icdCode: input.icdCode,
    diagnosis: input.diagnosis,
    reason: input.reason,
    status: "waiting",
    notes: [],
    bedHistory: [],
  }
  writeInpatientState({ ...state, records: [record, ...state.records] })
  appendAudit(
    actor,
    "Chỉ định nhập viện",
    `${record.id} · ${record.patientCode} · ${record.department} · ICD=${record.icdCode ?? "—"}`,
  )
  return { ok: true, record }
}

export function allocateBed(
  recordId: string,
  bedCode: string,
  actor: AuthUser,
): OpResult {
  if (!canAllocate(actor.role)) return deny(actor, "Xếp giường", recordId)
  const state = readInpatientState()
  const record = findRecord(state, recordId)
  if (!record || record.status !== "waiting")
    return { ok: false, error: "Bệnh án không còn ở trạng thái chờ xếp giường." }
  const target = findBed(state, bedCode)
  if (!target || target.status !== "empty") {
    appendAudit(actor, "Xếp giường", `${recordId} · ${bedCode} không khả dụng`, "Thất bại")
    return {
      ok: false,
      error: "Giường không còn khả dụng. Danh sách giường trống đã được làm mới.",
    }
  }
  if (target.department !== record.department)
    return { ok: false, error: `Giường thuộc ${target.department}, khác khoa điều trị của bệnh án.` }
  const now = formatDateTime()
  const updated: InpatientRecord = {
    ...record,
    status: "treating",
    bedCode,
    bedHistory: [
      ...record.bedHistory,
      { bedCode, department: target.department, from: now, to: null, reason: null },
    ],
  }
  writeInpatientState({
    beds: state.beds.map((item) =>
      item.code === bedCode
        ? { ...item, status: "occupied", recordId, maintenance: undefined }
        : item,
    ),
    records: state.records.map((item) => (item.id === recordId ? updated : item)),
  })
  appendAudit(actor, "Xếp giường", `${recordId} · ${record.patientCode} · ${bedCode}`)
  return { ok: true, record: updated }
}

export function transferBed(
  recordId: string,
  newBedCode: string,
  actor: AuthUser,
): OpResult {
  if (!canTransfer(actor.role)) return deny(actor, "Chuyển giường", recordId)
  const state = readInpatientState()
  const record = findRecord(state, recordId)
  if (!record || record.status !== "treating" || !record.bedCode)
    return { ok: false, error: "Chỉ chuyển giường được với bệnh án đang điều trị." }
  const target = findBed(state, newBedCode)
  if (!target || target.status !== "empty") {
    appendAudit(actor, "Chuyển giường", `${recordId} · ${newBedCode} không khả dụng`, "Thất bại")
    return {
      ok: false,
      error: "Giường vừa được người dùng khác sử dụng. Vui lòng chọn giường trống khác.",
    }
  }
  const oldCode = record.bedCode
  const now = formatDateTime()
  const departmentChanged = target.department !== record.department
  const history = record.bedHistory.map((stay, index, all) =>
    index === all.length - 1 && stay.to === null
      ? { ...stay, to: now, reason: departmentChanged ? "Chuyển khoa" : "Chuyển giường" }
      : stay,
  )
  const updated: InpatientRecord = {
    ...record,
    department: target.department,
    bedCode: newBedCode,
    bedHistory: [
      ...history,
      { bedCode: newBedCode, department: target.department, from: now, to: null, reason: null },
    ],
    notes: [
      {
        id: `N-${Date.now()}`,
        time: now,
        author: actor.name,
        text: `Chuyển giường ${oldCode} → ${newBedCode}${departmentChanged ? ` (chuyển sang ${target.department})` : ""}.`,
      },
      ...record.notes,
    ],
  }
  writeInpatientState({
    beds: state.beds.map((item) => {
      if (item.code === oldCode)
        return {
          ...item,
          status: "maintenance",
          recordId: undefined,
          alert: undefined,
          alertText: undefined,
          maintenance: MAINTENANCE_LABEL,
        }
      if (item.code === newBedCode)
        return { ...item, status: "occupied", recordId, maintenance: undefined }
      return item
    }),
    records: state.records.map((item) => (item.id === recordId ? updated : item)),
  })
  appendAudit(actor, "Chuyển giường", `${recordId} · ${oldCode} → ${newBedCode}`)
  return { ok: true, record: updated }
}

export interface DischargeInput {
  condition: string
  conclusion: string
  instructions: string
  followUpDate: string
}

export function dischargePatient(
  recordId: string,
  input: DischargeInput,
  actor: AuthUser,
): OpResult {
  if (!canDischarge(actor.role)) return deny(actor, "Xuất viện", recordId)
  const state = readInpatientState()
  const record = findRecord(state, recordId)
  if (!record || record.status !== "treating")
    return { ok: false, error: "Chỉ xuất viện được với bệnh án đang điều trị." }
  const now = formatDateTime()
  const updated: InpatientRecord = {
    ...record,
    status: "discharged",
    bedHistory: record.bedHistory.map((stay, index, all) =>
      index === all.length - 1 && stay.to === null
        ? { ...stay, to: now, reason: "Xuất viện" }
        : stay,
    ),
    discharge: { ...input, dischargedAt: now, by: actor.name },
  }
  writeInpatientState({
    beds: state.beds.map((item) =>
      item.code === record.bedCode
        ? {
            ...item,
            status: "maintenance",
            recordId: undefined,
            alert: undefined,
            alertText: undefined,
            maintenance: MAINTENANCE_LABEL,
          }
        : item,
    ),
    records: state.records.map((item) => (item.id === recordId ? updated : item)),
  })
  appendAudit(
    actor,
    "Xuất viện",
    `${recordId} · ${record.patientCode} · ${record.bedCode ?? "—"} · ${input.condition} · bệnh án khóa`,
  )
  return { ok: true, record: updated }
}

export function addProgressNote(
  recordId: string,
  text: string,
  actor: AuthUser,
): OpResult {
  if (!canAddNote(actor.role)) return deny(actor, "Ghi diễn biến", recordId)
  const content = text.trim()
  if (content.length < 10)
    return { ok: false, error: "Nội dung diễn biến cần tối thiểu 10 ký tự." }
  const state = readInpatientState()
  const record = findRecord(state, recordId)
  if (!record || record.status !== "treating")
    return { ok: false, error: "Bệnh án đã đóng hoặc chưa xếp giường, không thể ghi diễn biến." }
  const updated: InpatientRecord = {
    ...record,
    notes: [
      { id: `N-${Date.now()}`, time: formatDateTime(), author: actor.name, text: content },
      ...record.notes,
    ],
  }
  writeInpatientState({
    ...state,
    records: state.records.map((item) => (item.id === recordId ? updated : item)),
  })
  appendAudit(actor, "Ghi diễn biến", `${recordId} · ${record.patientCode}`)
  return { ok: true, record: updated }
}

export function markBedReady(bedCode: string, actor: AuthUser): OpResult {
  if (!canMarkBedReady(actor.role))
    return deny(actor, "Đánh dấu giường sẵn sàng", bedCode)
  const state = readInpatientState()
  const target = findBed(state, bedCode)
  if (!target || target.status !== "maintenance")
    return { ok: false, error: "Giường không ở trạng thái bảo trì." }
  writeInpatientState({
    ...state,
    beds: state.beds.map((item) =>
      item.code === bedCode
        ? { ...item, status: "empty", maintenance: undefined }
        : item,
    ),
  })
  appendAudit(actor, "Đánh dấu giường sẵn sàng", bedCode)
  return { ok: true }
}
