import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import type { AuthUser } from "../../App"
import Button from "../ui/Button"
import Pagination from "../ui/Pagination"
import Tooltip from "../ui/Tooltip"
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  Flame,
  Info,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Siren,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react"
import { TextArea, TextInput } from "../ui/TextInput"
import TopNav from "../TopNav"
import IntakeTriagePanel from "../intake/IntakeTriagePanel"
import useIntakeQueue from "../../hooks/useIntakeQueue"
import {
  EMERGENCY_DEPARTMENT,
  OUTPATIENT_DEPARTMENT,
  destinationLabel,
  enqueueEncounter,
  formatWait,
  startConsultation,
  validateIntake,
  type Acuity,
  type IntakeEncounter,
  type IntakeInput,
} from "../../lib/intakeQueue"

interface Props {
  user: AuthUser
  onLogout: () => void
}

type QueueFilter = "all" | Acuity
type WorkspaceMode = "intake" | "register"

export interface PatientRecord {
  id: string
  name: string
  birthDate: string
  gender: "Nam" | "Nữ"
  cccd: string
  phone: string
  emergencyContact: string
  emergencyPhone: string
  insurance: string
  address: string
  complaint?: string
  clinic?: string
  acuity?: Acuity | ""
}

const REGISTRY_STORAGE_KEY = "hpms-patient-registry-v1"

const PRELOADED_PATIENTS: PatientRecord[] = [
  {
    id: "BN-26-0001",
    name: "Nguyễn Văn An",
    birthDate: "1985-08-15",
    gender: "Nam",
    cccd: "079456789123",
    phone: "0902345567",
    emergencyContact: "Nguyễn Thị Lan (Vợ)",
    emergencyPhone: "0912456789",
    insurance: "DN4791234567890",
    address: "12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
    complaint: "Sốt cao liên tục 3 ngày, đau mỏi cơ",
    clinic: "",
    acuity: "",
  },
  {
    id: "BN-26-0021",
    name: "Trần Văn B",
    birthDate: "1959-04-12",
    gender: "Nam",
    cccd: "079159345678",
    phone: "0918345678",
    emergencyContact: "Trần Minh Khoa (Con)",
    emergencyPhone: "0903123456",
    insurance: "GD4798765432101",
    address: "45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    complaint: "Khó thở khi gắng sức, đau thắt ngực",
    clinic: "PK Tim mạch",
    acuity: "NON_EMERGENCY",
  },
  {
    id: "BN-26-0034",
    name: "Lê Thị C",
    birthDate: "1954-11-20",
    gender: "Nữ",
    cccd: "079154789321",
    phone: "0932123456",
    emergencyContact: "Lê Văn Hùng (Chồng)",
    emergencyPhone: "0908765432",
    insurance: "HT4791122334455",
    address: "78 Cách Mạng Tháng 8, Phường 6, Quận 3, TP. Hồ Chí Minh",
    complaint: "Ho khan kéo dài, sốt nhẹ về chiều",
    clinic: "PK Hô hấp",
    acuity: "NON_EMERGENCY",
  },
]

const QUICK_COMPLAINTS = [
  "Sốt cao",
  "Đau ngực, khó thở",
  "Đau bụng cấp",
  "Chấn thương / Ngã",
  "Tái khám định kỳ",
  "Chóng mặt, đau đầu",
]

const INPUT_CLASS =
  "w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text-primary transition-[border-color,box-shadow] focus:border-brand-primary focus:outline-none focus:ring-3 focus:ring-brand-primary/20"

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return Math.max(0, age)
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
  helper,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  helper?: string
  children: ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-text-secondary"
      >
        {label}
        {required && (
          <span className="ml-1 text-critical" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-critical">{error}</p>}
      {!error && helper && <p className="mt-1 text-xs text-text-muted">{helper}</p>}
    </div>
  )
}

function MaskedField({
  id,
  label,
  value,
  masked,
  onChange,
  onReveal,
  readOnly = false,
}: {
  id: string
  label: string
  value: string
  masked: string
  onChange: (value: string) => void
  onReveal: () => void
  readOnly?: boolean
}) {
  const [revealed, setRevealed] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!revealed) return
    setSeconds(30)
    const interval = window.setInterval(
      () =>
        setSeconds((current) => {
          if (current <= 1) {
            setRevealed(false)
            window.clearInterval(interval)
            return 30
          }
          return current - 1
        }),
      1000,
    )
    return () => window.clearInterval(interval)
  }, [revealed])

  const reveal = () => {
    setRevealed((current) => {
      if (!current) {
        if (timer.current) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setRevealed(false), 30000)
        onReveal()
      } else if (timer.current) window.clearTimeout(timer.current)
      return !current
    })
  }

  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        <TextInput
          id={id}
          value={revealed ? value : masked}
          onChange={(event) => {
            if (revealed && !readOnly) onChange(event.target.value.replace(/\D/g, ""))
          }}
          readOnly={readOnly || !revealed}
          inputMode="numeric"
          className="pr-32 font-mono"
        />
        <Tooltip
          position="left"
          content={
            revealed
              ? `Tự động ẩn sau ${seconds}s`
              : `Nhấn để xem (Tự động ẩn sau 30s)`
          }
          className="absolute inset-y-0 right-0"
        >
          <button
            type="button"
            onClick={reveal}
            aria-label={
              revealed
                ? `Ẩn ${label.toLowerCase()}`
                : `Hiện đầy đủ ${label.toLowerCase()}`
            }
            aria-pressed={revealed}
            className={`h-full flex cursor-pointer items-center gap-1.5 rounded-r-lg px-3 font-mono text-xs font-semibold tabular-nums transition-colors ${
              revealed
                ? "bg-warning-bg text-warning hover:bg-warning-bg/80"
                : "font-sans text-brand-deep hover:bg-brand-surface"
            }`}
          >
            {revealed ? (
              <EyeOff aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
            )}
            {revealed ? `Tự che: ${seconds}s` : "Hiện 30s"}
          </button>
        </Tooltip>
      </div>
    </Field>
  )
}

function MaskedValueBadge({
  id,
  label,
  value,
  masked,
  onReveal,
  icon,
}: {
  id: string
  label: string
  value: string
  masked: string
  onReveal: () => void
  icon: ReactNode
}) {
  const [revealed, setRevealed] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!revealed) return
    setSeconds(30)
    const interval = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRevealed(false)
          window.clearInterval(interval)
          return 30
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [revealed])

  const reveal = () => {
    setRevealed((current) => {
      if (!current) {
        if (timer.current) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setRevealed(false), 30000)
        onReveal()
      } else if (timer.current) {
        window.clearTimeout(timer.current)
      }
      return !current
    })
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-2.5 shadow-clinical-xs transition-all hover:border-brand-primary/40">
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <span className="text-text-muted shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {label}
          </p>
          <p className="font-mono text-xs font-bold text-text-primary truncate">
            {revealed ? value : masked}
          </p>
        </div>
      </div>
      <Tooltip
        position="left"
        content={
          revealed
            ? `Tự động ẩn sau ${seconds}s`
            : `Nhấn để xem (Tự động ẩn sau 30s)`
        }
      >
        <button
          type="button"
          onClick={reveal}
          aria-label={
            revealed
              ? `Ẩn ${label.toLowerCase()}`
              : `Hiện đầy đủ ${label.toLowerCase()} trong 30s`
          }
          className={`interactive-tactile flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-semibold tabular-nums transition-colors ${
            revealed
              ? "bg-warning-bg text-warning border border-warning/40 hover:bg-warning-bg/80"
              : "bg-brand-surface text-brand-deep border border-brand-primary/20 hover:bg-brand-surface/80"
          }`}
        >
          {revealed ? (
            <>
              <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{seconds}s</span>
            </>
          ) : (
            <>
              <Eye aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="font-sans text-[11px]">Hiện 30s</span>
            </>
          )}
        </button>
      </Tooltip>
    </div>
  )
}

export default function ReceptionistDashboard({ user, onLogout }: Props) {
  // 1. Registry & Active Patient State
  const [registry, setRegistry] = useState<PatientRecord[]>(() => {
    try {
      const stored = localStorage.getItem(REGISTRY_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length) return parsed
      }
    } catch {
      /* Fallback to preloaded */
    }
    return PRELOADED_PATIENTS
  })

  // Mode: "intake" (fast encounter check-in) vs "register" (create new profile)
  const [mode, setMode] = useState<WorkspaceMode>("intake")
  const [activePatient, setActivePatient] = useState<PatientRecord | null>(
    PRELOADED_PATIENTS[0],
  )
  const [editingDemographics, setEditingDemographics] = useState(false)

  // 2. Intake Form State (Encounter / Triage)
  const [intakeComplaint, setIntakeComplaint] = useState(
    PRELOADED_PATIENTS[0].complaint || "",
  )
  const [intakeAcuity, setIntakeAcuity] = useState<Acuity | "">(
    PRELOADED_PATIENTS[0].acuity || "",
  )
  const [intakeClinic, setIntakeClinic] = useState(
    PRELOADED_PATIENTS[0].clinic || "",
  )
  const [intakeErrors, setIntakeErrors] = useState<Record<string, string>>({})

  // 3. New Patient Registration Form State
  const [idSequence, setIdSequence] = useState(() => {
    return (
      Math.max(
        ...PRELOADED_PATIENTS.map((p) => {
          const match = p.id.match(/\d+$/)
          return match ? Number(match[0]) : 1
        }),
        1,
      ) + 1
    )
  })

  const [newPatient, setNewPatient] = useState<PatientRecord>({
    id: `BN-26-0002`,
    name: "",
    birthDate: "",
    gender: "Nam",
    cccd: "",
    phone: "",
    emergencyContact: "",
    emergencyPhone: "",
    insurance: "",
    address: "",
  })
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({})
  const [duplicateWarning, setDuplicateWarning] = useState<PatientRecord | null>(null)

  // 4. Search & Autocomplete State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)

  // 5. Queue & Notifications
  const queue = useIntakeQueue()
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all")
  const [queueSearch, setQueueSearch] = useState("")
  const [selectedEncounter, setSelectedEncounter] = useState<IntakeEncounter | null>(null)
  const [notice, setNotice] = useState("")
  const [success, setSuccess] = useState("")
  const [codeRedModal, setCodeRedModal] = useState(false)
  const [codeRedNote, setCodeRedNote] = useState("Ngưng tim, ngưng thở tối khẩn")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Save registry on change
  useEffect(() => {
    try {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry))
    } catch {
      /* Storage quota safe */
    }
  }, [registry])

  // Sync active patient changes to intake
  const selectPatientForIntake = (patient: PatientRecord) => {
    setActivePatient(patient)
    setIntakeComplaint(patient.complaint || "")
    setIntakeAcuity(patient.acuity || "")
    setIntakeClinic(patient.clinic || "")
    setIntakeErrors({})
    setEditingDemographics(false)
    setMode("intake")
    setSearchQuery("")
    setNotice(`Đã chọn bệnh nhân ${patient.name} (${patient.id}) để tiếp nhận khám.`)
  }

  // Live matching patients from registry
  const matchedPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const cleanNumbers = q.replace(/\D/g, "")
    return registry.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q)
      const matchId = p.id.toLowerCase().includes(q)
      const matchCccd = cleanNumbers && p.cccd.includes(cleanNumbers)
      const matchPhone = cleanNumbers && p.phone.includes(cleanNumbers)
      return matchName || matchId || matchCccd || matchPhone
    })
  }, [registry, searchQuery])

  // Queue metrics & filtering
  const waiting = queue.filter((item) => item.status === "DangCho")
  const counts = {
    all: waiting.length,
    emergency: waiting.filter((item) => item.acuity === "EMERGENCY").length,
    outpatient: waiting.filter((item) => item.acuity === "NON_EMERGENCY").length,
  }

  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const matchesFilter = queueFilter === "all" || item.acuity === queueFilter
      const q = queueSearch.trim().toLowerCase()
      if (!q) return matchesFilter
      const matchesSearch =
        item.hoTen.toLowerCase().includes(q) ||
        item.maBenhNhan.toLowerCase().includes(q) ||
        String(item.soThuTu).includes(q)
      return matchesFilter && matchesSearch
    })
  }, [queue, queueFilter, queueSearch])

  const totalPages = Math.max(1, Math.ceil(filteredQueue.length / pageSize))
  const visibleQueue = useMemo(
    () => filteredQueue.slice((page - 1) * pageSize, page * pageSize),
    [filteredQueue, page, pageSize],
  )

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // System audit log recorder
  const recordUnmask = (field: string, patientId: string) => {
    try {
      const entries = JSON.parse(localStorage.getItem("NhatKyHeThong") || "[]")
      localStorage.setItem(
        "NhatKyHeThong",
        JSON.stringify(
          [
            {
              id: `PII-${crypto.randomUUID()}`,
              time: new Date().toLocaleString("vi-VN"),
              actor: user.name,
              workstation: "Bàn Tiếp đón Trung tâm",
              action: "Mở che dữ liệu định danh",
              actionTone: "amber",
              object: `${field} · ${patientId} · 30 giây`,
              result: "Thành công",
            },
            ...(Array.isArray(entries) ? entries : []),
          ].slice(0, 200),
        ),
      )
    } catch {
      /* Safe fallback */
    }
  }

  // Handle Encounter Intake Submission
  const handleIntakeSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!activePatient) {
      setNotice("Vui lòng chọn hoặc đăng ký bệnh nhân trước khi tiếp nhận khám.")
      return
    }

    const intake: IntakeInput = {
      maBenhNhan: activePatient.id,
      hoTen: activePatient.name,
      lyDoKham: intakeComplaint,
      acuity: intakeAcuity,
      clinic: intakeClinic,
    }

    const errors = validateIntake(intake, { requirePatient: true })
    setIntakeErrors(errors)
    if (Object.keys(errors).length || !intakeAcuity) return

    const created = enqueueEncounter(intake, user)
    if (!created) return

    const emergency = created.acuity === "EMERGENCY"
    const destination = destinationLabel(created)

    // Save encounter info back to patient profile
    setActivePatient((current) =>
      current ? { ...current, complaint: intakeComplaint, clinic: intakeClinic, acuity: intakeAcuity } : null,
    )

    setSuccess(
      emergency
        ? `Đã chuyển ${created.hoTen} vào ${destination} (STT ${created.soThuTu}).`
        : `Đã đưa vào hàng đợi: ${created.hoTen} (${created.maBenhNhan}) – ${destination} – Ưu tiên 2 (STT ${created.soThuTu}).`,
    )
    setNotice(
      `Đã in phiếu khám và điều phối thành công bệnh nhân ${created.hoTen}.`,
    )

    // Reset complaint for next intake
    setIntakeComplaint("")
    setIntakeAcuity("")
    setIntakeClinic("")
  }

  // Handle Switch to Registration Mode
  const startNewPatientRegistration = () => {
    const nextCode = `BN-26-${String(idSequence).padStart(4, "0")}`
    setNewPatient({
      id: nextCode,
      name: "",
      birthDate: "",
      gender: "Nam",
      cccd: "",
      phone: "",
      emergencyContact: "",
      emergencyPhone: "",
      insurance: "",
      address: "",
    })
    setRegisterErrors({})
    setDuplicateWarning(null)
    setMode("register")
    setNotice(`Đang tạo hồ sơ mới với mã định danh tự động ${nextCode}.`)
  }

  // Check CCCD Duplicate on the fly
  const handleCccdChange = (cccdValue: string) => {
    const val = cccdValue.slice(0, 12)
    setNewPatient((prev) => ({ ...prev, cccd: val }))
    if (val.length === 12) {
      const match = registry.find((p) => p.cccd === val)
      if (match) {
        setDuplicateWarning(match)
      } else {
        setDuplicateWarning(null)
      }
    } else {
      setDuplicateWarning(null)
    }
  }

  // Handle Save New Patient Profile
  const handleRegisterSubmit = (andProceedToIntake: boolean) => {
    const errors: Record<string, string> = {}
    if (!newPatient.name.trim() || newPatient.name.trim().length < 2) {
      errors.name = "Họ và tên bắt buộc (tối thiểu 2 ký tự tiếng Việt có dấu)."
    }
    if (!newPatient.birthDate.trim()) {
      errors.birthDate = "Vui lòng chọn ngày sinh."
    }
    if (!newPatient.gender) {
      errors.gender = "Vui lòng chọn giới tính."
    }
    if (!newPatient.phone.trim() || !/^0\d{9}$/.test(newPatient.phone.trim())) {
      errors.phone = "Số điện thoại liên lạc phải gồm 10 chữ số (bắt đầu bằng 0)."
    }
    if (!newPatient.address.trim()) {
      errors.address = "Vui lòng nhập địa chỉ thường trú."
    }
    if (!newPatient.emergencyContact.trim()) {
      errors.emergencyContact = "Vui lòng nhập người liên hệ khẩn cấp."
    }
    if (!newPatient.emergencyPhone.trim() || !/^0\d{9}$/.test(newPatient.emergencyPhone.trim())) {
      errors.emergencyPhone = "SĐT khẩn cấp phải gồm 10 chữ số (bắt đầu bằng 0)."
    }

    if (newPatient.cccd.trim()) {
      if (!/^\d{12}$/.test(newPatient.cccd.trim())) {
        errors.cccd = "Số CCCD phải gồm đúng 12 chữ số."
      } else {
        const dup = registry.find((p) => p.cccd === newPatient.cccd.trim())
        if (dup) {
          setDuplicateWarning(dup)
          errors.cccd = "Số CCCD này đã thuộc về bệnh nhân đã đăng ký trong hệ thống."
        }
      }
    }

    setRegisterErrors(errors)
    if (Object.keys(errors).length) return

    // Add to registry
    const registered: PatientRecord = { ...newPatient }
    setRegistry((prev) => [registered, ...prev])
    setIdSequence((prev) => prev + 1)

    if (andProceedToIntake) {
      selectPatientForIntake(registered)
      setSuccess(`Đã tạo thành công hồ sơ ${registered.name} (${registered.id}). Vui lòng nhập lý do khám để cấp số.`)
    } else {
      setMode("intake")
      selectPatientForIntake(registered)
      setSuccess(`Đã lưu hồ sơ bệnh nhân ${registered.name} (${registered.id}) vào cơ sở dữ liệu.`)
    }
  }

  // Handle Code Red Emergency Bypass
  const handleCodeRedSubmit = () => {
    const emergencyId = `BN-26-CC${String(idSequence).padStart(2, "0")}`
    const intake: IntakeInput = {
      maBenhNhan: emergencyId,
      hoTen: "Bệnh nhân Cấp cứu Khẩn (Code Red)",
      lyDoKham: codeRedNote || "Ngưng tim, ngưng thở hoặc hôn mê sâu",
      acuity: "EMERGENCY",
      clinic: "",
    }
    const created = enqueueEncounter(intake, user)
    if (created) {
      setIdSequence((prev) => prev + 1)
      setCodeRedModal(false)
      setSuccess(
        `Đã chuyển khẩn cấp ${created.hoTen} vào Khoa Cấp cứu (STT ${created.soThuTu}).`,
      )
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav user={user} onLogout={onLogout} title="Bàn Tiếp đón Trung tâm" />

      {/* Modern High-UX Header & Fast Action Hub */}
      <header className="border-b border-border-subtle bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Scope */}
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Tiếp Nhận &amp; Điều Phối Khám
              </h1>
              <p className="mt-0.5 text-xs text-text-muted">
                Quản lý lượt vào, phân loại cấp cứu và điều phối phòng khám.
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Code Red Emergency Bypass Trigger */}
              <Tooltip content="Cấp cứu tối khẩn: Bỏ qua thủ tục hành chính, chuyển thẳng vào Khoa Cấp cứu.">
                <Button
                  variant="danger"
                  onClick={() => setCodeRedModal(true)}
                  className="interactive-tactile flex items-center gap-2 shadow-clinical-sm font-bold animate-pulse"
                >
                  <Siren aria-hidden="true" className="h-4 w-4" />
                  Báo động đỏ
                </Button>
              </Tooltip>

              {/* Mode Switcher Buttons */}
              <div className="inline-flex rounded-xl border border-border-subtle bg-subsurface p-1 shadow-clinical-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode("intake")
                    setNotice("")
                  }}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 font-heading text-xs font-semibold transition-all ${
                    mode === "intake"
                      ? "bg-surface text-brand-deep shadow-clinical-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Tiếp nhận lượt khám
                </button>
                <button
                  type="button"
                  onClick={startNewPatientRegistration}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 font-heading text-xs font-semibold transition-all ${
                    mode === "register"
                      ? "bg-surface text-brand-deep shadow-clinical-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  Đăng ký hồ sơ mới
                </button>
              </div>
            </div>
          </div>

          {/* Quick Registry Search Bar with Tra cứu button */}
          <div className="relative mt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex flex-1 items-center rounded-xl border border-border-strong bg-surface shadow-clinical-xs transition-all focus-within:border-brand-primary focus-within:ring-3 focus-within:ring-brand-primary/20">
                <Search aria-hidden="true" className="ml-3.5 h-4 w-4 text-text-muted shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      if (matchedPatients.length > 0) {
                        selectPatientForIntake(matchedPatients[0])
                        setSearchFocused(false)
                      } else {
                        setNotice(`Không tìm thấy bệnh nhân khớp với "${searchQuery}". Vui lòng đăng ký hồ sơ mới.`)
                      }
                    }
                  }}
                  placeholder="Tìm kiếm theo CCCD, số điện thoại hoặc họ tên..."
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mr-3 cursor-pointer rounded p-1 text-text-muted hover:bg-subsurface hover:text-text-primary"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button
                onClick={() => {
                  if (matchedPatients.length > 0) {
                    selectPatientForIntake(matchedPatients[0])
                    setSearchFocused(false)
                  } else if (searchQuery.trim()) {
                    setNotice(`Không tìm thấy bệnh nhân khớp với "${searchQuery}". Bạn có thể tạo hồ sơ mới.`)
                  } else {
                    setNotice("Vui lòng nhập CCCD, số điện thoại hoặc họ tên để tra cứu.")
                  }
                }}
                className="interactive-tactile sm:w-auto shrink-0 font-semibold text-xs"
              >
                Tìm kiếm
              </Button>
            </div>

            {/* Live Autocomplete Results Drawer */}
            {searchFocused && searchQuery.trim() && (
              <div
                className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-border-subtle bg-surface p-2 shadow-clinical-lg"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Kết quả hồ sơ khớp ({matchedPatients.length})
                </div>
                {matchedPatients.length === 0 ? (
                  <div className="p-4 text-center text-sm text-text-muted">
                    <p>Không tìm thấy hồ sơ khớp với từ khóa "{searchQuery}".</p>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchFocused(false)
                        startNewPatientRegistration()
                      }}
                      className="mt-2 text-xs text-brand-deep underline"
                    >
                      + Tạo hồ sơ mới cho bệnh nhân này
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {matchedPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          selectPatientForIntake(p)
                          setSearchFocused(false)
                        }}
                        className="flex cursor-pointer items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-brand-surface/60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-surface font-heading text-xs font-bold text-brand-deep">
                            {p.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-heading text-sm font-semibold text-text-primary">
                              {p.name} · <span className="font-mono text-xs font-bold text-brand-deep">{p.id}</span>
                            </p>
                            <p className="text-xs text-text-muted">
                              {p.gender} · {calculateAge(p.birthDate)} tuổi ({p.birthDate}) · CCCD: <span className="font-mono">{p.cccd ? `${p.cccd.slice(0, 3)}xxxxxx${p.cccd.slice(-3)}` : "Chưa có"}</span> · SĐT: <span className="font-mono">{p.phone ? `${p.phone.slice(0, 4)}xxxx${p.phone.slice(-3)}` : "Chưa có"}</span>
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" className="!px-3 !py-1 text-xs text-brand-deep font-semibold">
                          Tiếp nhận →
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Inline Notices */}
          {notice && (
            <div
              role="status"
              className="mt-3 flex items-start gap-2 rounded-xl border border-info/20 bg-info-bg p-3 text-sm text-info animate-fade-in"
            >
              <Info aria-hidden="true" className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">{notice}</p>
            </div>
          )}
        </div>
      </header>

      {/* Main Split-Screen Workspace (Left: Specialized Intake/Register Pane | Right: Real-time Live Queue) */}
      <main className="mx-auto grid w-full max-w-screen-2xl flex-1 gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,44fr)_minmax(0,56fr)]">
        
        {/* ========================================================================= */}
        {/* LEFT WORKSPACE PANE: MODE A (Intake Encounter) OR MODE B (Register)       */}
        {/* ========================================================================= */}
        <div className="min-w-0 space-y-5">
          {mode === "intake" ? (
            /* ========================================================= */
            /* MODE A: TIẾP NHẬN LƯỢT KHÁM (Fast Patient Intake Flow)     */
            /* ========================================================= */
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-clinical-xs">
              {/* Active Patient Identity Card */}
              <div className="border-b border-border-subtle bg-brand-surface/40 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-deep text-surface shadow-clinical-xs font-heading font-bold text-base">
                      {activePatient?.name ? activePatient.name.slice(0, 1) : "?"}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-text-primary">
                          {activePatient?.name || "Chưa chọn bệnh nhân"}
                        </h2>
                        {activePatient && (
                          <span className="rounded-full border border-brand-primary/30 bg-surface px-2.5 py-0.5 font-mono text-xs font-bold text-brand-deep">
                            {activePatient.id}
                          </span>
                        )}

                      </div>
                      {activePatient && (
                        <p className="mt-1 text-xs text-text-secondary">
                          {activePatient.gender} · {calculateAge(activePatient.birthDate)} tuổi (Sinh ngày {activePatient.birthDate})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for active patient */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Tooltip content="Chỉnh sửa thông tin hành chính, địa chỉ hoặc số điện thoại của bệnh nhân này.">
                      <Button
                        variant="ghost"
                        onClick={() => setEditingDemographics(!editingDemographics)}
                        className="interactive-tactile !px-2.5 !py-1.5 text-xs text-text-secondary"
                      >
                        <Edit3 className="size-3.5 mr-1" />
                        {editingDemographics ? "Thu gọn" : "Sửa hồ sơ"}
                      </Button>
                    </Tooltip>
                    <Tooltip content="Đổi sang bệnh nhân khác để tiếp nhận">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setActivePatient(null)
                          setSearchQuery("")
                        }}
                        className="interactive-tactile !px-2.5 !py-1.5 text-xs text-text-muted hover:text-text-primary"
                      >
                        <RefreshCw className="size-3.5 mr-1" />
                        Đổi
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                {/* Patient Summary Metadata Chips with Interactive PII Unmask (30s) */}
                {activePatient && !editingDemographics && (
                  <div className="mt-4 space-y-2.5 border-t border-border-subtle/80 pt-3.5">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {/* Masked CCCD Badge with 30s Unmask */}
                      <MaskedValueBadge
                        id="patient-badge-cccd"
                        label="Số CCCD / Định danh"
                        value={activePatient.cccd || "Chưa cập nhật"}
                        masked={
                          activePatient.cccd
                            ? `${activePatient.cccd.slice(0, 3)}xxxxxx${activePatient.cccd.slice(-3)}`
                            : "079xxxxxx123"
                        }
                        onReveal={() => recordUnmask("Số CCCD / Định danh", activePatient.id)}
                        icon={<Shield className="size-4" />}
                      />

                      {/* Masked Phone Badge with 30s Unmask */}
                      <MaskedValueBadge
                        id="patient-badge-phone"
                        label="Số điện thoại cá nhân"
                        value={activePatient.phone}
                        masked={
                          activePatient.phone
                            ? `${activePatient.phone.slice(0, 4)}xxxx${activePatient.phone.slice(-3)}`
                            : "090xxxx567"
                        }
                        onReveal={() => recordUnmask("Số điện thoại", activePatient.id)}
                        icon={<Phone className="size-4" />}
                      />

                      {/* Masked Emergency Phone Badge with 30s Unmask */}
                      <MaskedValueBadge
                        id="patient-badge-emergency-phone"
                        label={`SĐT Khẩn cấp (${activePatient.emergencyContact})`}
                        value={activePatient.emergencyPhone}
                        masked={
                          activePatient.emergencyPhone
                            ? `${activePatient.emergencyPhone.slice(0, 4)}xxxx${activePatient.emergencyPhone.slice(-3)}`
                            : "091xxxx789"
                        }
                        onReveal={() => recordUnmask("SĐT liên hệ khẩn cấp", activePatient.id)}
                        icon={<ShieldAlert className="size-4" />}
                      />

                      {/* Address summary */}
                      <div className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface p-2.5 shadow-clinical-xs">
                        <MapPin className="size-4 text-text-muted shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            Địa chỉ thường trú
                          </p>
                          <p className="text-xs font-semibold text-text-primary truncate" title={activePatient.address}>
                            {activePatient.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {activePatient.insurance && (
                      <div className="text-right text-[11px] text-text-muted px-1">
                        BHYT: <strong className="font-mono text-text-primary">{activePatient.insurance}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Inline Demographics Quick Editor (Expanded only when receptionist clicks "Sửa hồ sơ") */}
              {editingDemographics && activePatient && (
                <div className="border-b border-border-subtle bg-subsurface/60 p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-brand-deep flex items-center gap-1.5">
                      <Edit3 className="size-3.5" /> Chỉnh sửa thông tin hành chính
                    </h3>
                    <span className="text-xs text-text-muted">Mở che trong 30s để sửa đổi</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MaskedField
                      id="edit-patient-cccd"
                      label="Số CCCD / Định danh (12 số)"
                      value={activePatient.cccd}
                      masked={
                        activePatient.cccd
                          ? `${activePatient.cccd.slice(0, 3)}xxxxxx${activePatient.cccd.slice(-3)}`
                          : "079xxxxxx123"
                      }
                      onChange={(value) => setActivePatient({ ...activePatient, cccd: value.slice(0, 12) })}
                      onReveal={() => recordUnmask("Số CCCD / Định danh", activePatient.id)}
                    />
                    <MaskedField
                      id="edit-patient-phone"
                      label="Số điện thoại liên hệ"
                      value={activePatient.phone}
                      masked={
                        activePatient.phone
                          ? `${activePatient.phone.slice(0, 4)}xxxx${activePatient.phone.slice(-3)}`
                          : "090xxxx567"
                      }
                      onChange={(value) => setActivePatient({ ...activePatient, phone: value.slice(0, 10) })}
                      onReveal={() => recordUnmask("Số điện thoại", activePatient.id)}
                    />
                    <Field label="Người liên hệ khẩn cấp">
                      <TextInput
                        value={activePatient.emergencyContact}
                        onChange={(e) => setActivePatient({ ...activePatient, emergencyContact: e.target.value })}
                      />
                    </Field>
                    <MaskedField
                      id="edit-patient-emergency-phone"
                      label="SĐT liên hệ khẩn cấp"
                      value={activePatient.emergencyPhone}
                      masked={
                        activePatient.emergencyPhone
                          ? `${activePatient.emergencyPhone.slice(0, 4)}xxxx${activePatient.emergencyPhone.slice(-3)}`
                          : "091xxxx789"
                      }
                      onChange={(value) => setActivePatient({ ...activePatient, emergencyPhone: value.slice(0, 10) })}
                      onReveal={() => recordUnmask("SĐT liên hệ khẩn cấp", activePatient.id)}
                    />
                    <div className="sm:col-span-2">
                      <Field label="Địa chỉ thường trú">
                        <TextInput
                          value={activePatient.address}
                          onChange={(e) => setActivePatient({ ...activePatient, address: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setEditingDemographics(false)}
                      className="!px-3 !py-1 text-xs"
                    >
                      Đóng chỉnh sửa
                    </Button>
                  </div>
                </div>
              )}

              {/* Patient Empty State if None Selected */}
              {!activePatient ? (
                <div className="p-8 text-center">
                  <User className="mx-auto h-12 w-12 text-border-strong mb-3" />
                  <h3 className="font-display text-base font-semibold text-text-primary">
                    Chưa có bệnh nhân nào được chọn
                  </h3>
                  <p className="mt-1 text-xs text-text-muted max-w-sm mx-auto">
                    Vui lòng tra cứu bệnh nhân theo CCCD/SĐT ở thanh tìm kiếm phía trên, hoặc đăng ký hồ sơ mới nếu bệnh nhân đến khám lần đầu.
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => selectPatientForIntake(PRELOADED_PATIENTS[0])}
                      className="border border-border-subtle text-xs"
                    >
                      Chọn mẫu: Nguyễn Văn An
                    </Button>
                    <Button onClick={startNewPatientRegistration} className="text-xs">
                      + Đăng ký hồ sơ mới
                    </Button>
                  </div>
                </div>
              ) : (
                /* Focused Encounter Intake & Clinical Triage Form */
                <form onSubmit={handleIntakeSubmit} className="p-5 space-y-5">
                  <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                    <ClipboardList className="h-4 w-4 text-brand-deep" />
                    <h3 className="font-display text-sm font-bold text-text-primary">
                      Lượt khám hôm nay
                    </h3>
                  </div>

                  {/* Chief Complaint with Quick Chips */}
                  <div>
                    <label htmlFor="intake-complaint" className="mb-1.5 block text-xs font-semibold text-text-secondary">
                      Lý do đến khám / Triệu chứng ban đầu <span className="text-critical">*</span>
                    </label>
                    <TextArea
                      id="intake-complaint"
                      rows={3}
                      value={intakeComplaint}
                      onChange={(e) => setIntakeComplaint(e.target.value.slice(0, 255))}
                      placeholder="Mô tả triệu chứng chính (ví dụ: Sốt cao liên tục 3 ngày, đau mỏi cơ, ho nhiều...)"
                      className={intakeErrors.complaint ? "border-critical" : ""}
                    />
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {intakeErrors.complaint ? (
                        <p className="font-medium text-critical">{intakeErrors.complaint}</p>
                      ) : (
                        <span />
                      )}
                      <span className="font-mono text-text-muted">{intakeComplaint.length}/255</span>
                    </div>

                    {/* Quick Complaint Suggestion Chips */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {QUICK_COMPLAINTS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setIntakeComplaint(chip)}
                          className="cursor-pointer rounded-lg border border-border-subtle bg-subsurface px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand-primary/40 hover:bg-brand-surface hover:text-brand-deep interactive-tactile"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Binary Clinical Acuity Selector (Strict REQ-ADM-03) */}
                  <fieldset className="space-y-3">
                    <legend className="text-xs font-semibold text-text-secondary">
                      Phân loại tuyến khám lâm sàng <span className="text-critical">*</span>
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Option 1: EMERGENCY */}
                      <label
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all interactive-peek ${
                          intakeAcuity === "EMERGENCY"
                            ? "border-sptt-red-border bg-sptt-red-bg shadow-[var(--halo-red-alert)]"
                            : "border-border-subtle bg-surface hover:border-critical/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="intake-acuity"
                          value="EMERGENCY"
                          checked={intakeAcuity === "EMERGENCY"}
                          onChange={() => {
                            setIntakeAcuity("EMERGENCY")
                            setIntakeClinic("")
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-critical text-surface shadow-clinical-xs">
                            <Siren className="h-5 w-5" />
                          </span>
                          <div>
                            <strong className="block font-heading text-sm font-bold text-sptt-red">
                              Cấp cứu (Ưu tiên 1)
                            </strong>
                            <span className="mt-0.5 block text-xs text-text-muted">
                              Chuyển ngay đến Khoa Cấp cứu
                            </span>
                          </div>
                        </div>
                      </label>

                      {/* Option 2: NON_EMERGENCY */}
                      <label
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all interactive-peek ${
                          intakeAcuity === "NON_EMERGENCY"
                            ? "border-brand-primary bg-brand-surface shadow-clinical-xs"
                            : "border-border-subtle bg-surface hover:border-brand-primary/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="intake-acuity"
                          value="NON_EMERGENCY"
                          checked={intakeAcuity === "NON_EMERGENCY"}
                          onChange={() => setIntakeAcuity("NON_EMERGENCY")}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-deep text-surface shadow-clinical-xs">
                            <Building2 className="h-5 w-5" />
                          </span>
                          <div>
                            <strong className="block font-heading text-sm font-bold text-brand-deep">
                              Khám thường (Ưu tiên 2)
                            </strong>
                            <span className="mt-0.5 block text-xs text-text-muted">
                              Khám theo số thứ tự tại phòng khám
                            </span>
                          </div>
                        </div>
                      </label>
                    </div>
                    {intakeErrors.acuity && (
                      <p className="text-xs font-medium text-critical">{intakeErrors.acuity}</p>
                    )}
                  </fieldset>

                  {/* Outpatient Target Clinic Dropdown */}
                  {intakeAcuity === "NON_EMERGENCY" && (
                    <div className="animate-fade-in">
                      <label htmlFor="intake-clinic" className="mb-1.5 block text-xs font-semibold text-text-secondary">
                        Phòng khám chuyên khoa chỉ định <span className="text-critical">*</span>
                      </label>
                      <select
                        id="intake-clinic"
                        value={intakeClinic}
                        onChange={(e) => setIntakeClinic(e.target.value)}
                        className={`${INPUT_CLASS} ${intakeErrors.clinic ? "border-critical" : ""}`}
                      >
                        <option value="">— Chọn phòng khám ngoại trú —</option>
                        <option value="PK Tim mạch">Phòng khám Tim mạch (Tầng 1 - P.102)</option>
                        <option value="PK Hô hấp">Phòng khám Hô hấp (Tầng 1 - P.105)</option>
                        <option value="PK Nội tổng quát">Phòng khám Nội tổng quát (Tầng 2 - P.201)</option>
                      </select>
                      {intakeErrors.clinic && (
                        <p className="mt-1.5 text-xs font-medium text-critical">{intakeErrors.clinic}</p>
                      )}
                    </div>
                  )}

                  {/* Commit Action Bar */}
                  <div className="flex flex-col-reverse gap-2.5 pt-3 border-t border-border-subtle sm:flex-row sm:items-center sm:justify-between">
<div />
                    <div className="flex gap-2 shrink-0">
                      <Button
                        type="submit"
                        disabled={!intakeAcuity}
                        className="interactive-tactile px-5 font-semibold text-xs shadow-clinical-sm"
                      >
                        <CheckCircle2 className="size-4 mr-1.5" />
                        Cấp số thứ tự
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* MODE B: ĐĂNG KÝ HỒ SƠ BỆNH NHÂN MỚI (New Profile Flow)    */
            /* ========================================================= */
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-clinical-xs animate-fade-in">
              <div className="border-b border-border-subtle bg-brand-surface/40 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-deep text-surface shadow-clinical-xs">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-text-primary">
                          Đăng Ký Hồ Sơ Bệnh Nhân Mới
                        </h2>
                        <span className="rounded-full bg-normal-bg px-2.5 py-0.5 font-mono text-xs font-bold text-normal">
                          {newPatient.id}
                        </span>
                      </div>

                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setMode("intake")}
                    className="!px-3 !py-1.5 text-xs text-text-muted hover:text-text-primary"
                  >
                    ← Quay lại tiếp nhận
                  </Button>
                </div>

                {/* Duplicate Warning Alert if CCCD matches existing record */}
                {duplicateWarning && (
                  <div
                    role="alert"
                    className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-critical-border bg-critical-bg p-3.5 text-sm text-critical animate-fade-in"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Cảnh báo trùng khớp số CCCD!</p>
                        <p className="text-xs mt-0.5">
                          Số CCCD này đã thuộc về bệnh nhân: <strong>{duplicateWarning.name}</strong> ({duplicateWarning.id}).
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => selectPatientForIntake(duplicateWarning)}
                      className="text-xs !px-3 !py-1.5"
                    >
                      Mở hồ sơ &amp; Tiếp nhận ngay
                    </Button>
                  </div>
                )}
              </div>

              {/* Registration Form */}
              <div className="p-5 space-y-6">
                {/* Block 1: Định danh cá nhân */}
                <section>
                  <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-brand-deep flex items-center gap-1.5">
                    <User className="size-3.5" /> 1. Thông tin cá nhân
                  </h3>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="Họ và tên bệnh nhân" required error={registerErrors.name}>
                      <TextInput
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className={registerErrors.name ? "border-critical" : ""}
                      />
                    </Field>

                    <Field label="Ngày sinh" required error={registerErrors.birthDate}>
                      <input
                        type="date"
                        value={newPatient.birthDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                        className={`${INPUT_CLASS} ${registerErrors.birthDate ? "border-critical" : ""}`}
                      />
                    </Field>

                    <Field label="Giới tính" required error={registerErrors.gender}>
                      <select
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as "Nam" | "Nữ" })}
                        className={INPUT_CLASS}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </Field>

                    <Field
                      label="Số CCCD / Định danh (12 số)"
                      error={registerErrors.cccd}
                      
                    >
                      <TextInput
                        value={newPatient.cccd}
                        onChange={(e) => handleCccdChange(e.target.value.replace(/\D/g, ""))}
                        placeholder="079xxxxxxxxx"
                        maxLength={12}
                        className={`font-mono ${registerErrors.cccd ? "border-critical" : ""}`}
                      />
                    </Field>
                  </div>
                </section>

                {/* Block 2: Liên lạc & Địa chỉ */}
                <section className="border-t border-border-subtle pt-4">
                  <h3 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-brand-deep flex items-center gap-1.5">
                    <Phone className="size-3.5" /> 2. Liên lạc &amp; Bảo hiểm y tế
                  </h3>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="Số điện thoại cá nhân" required error={registerErrors.phone}>
                      <TextInput
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        placeholder="090xxxxxxx"
                        maxLength={10}
                        className={`font-mono ${registerErrors.phone ? "border-critical" : ""}`}
                      />
                    </Field>

                    <Field label="Số thẻ BHYT (Tùy chọn)">
                      <TextInput
                        value={newPatient.insurance}
                        onChange={(e) => setNewPatient({ ...newPatient, insurance: e.target.value.toUpperCase() })}
                        placeholder="DN4791234567890"
                        className="font-mono uppercase"
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Địa chỉ thường trú" required error={registerErrors.address}>
                        <TextArea
                          rows={2}
                          value={newPatient.address}
                          onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value.slice(0, 255) })}
                          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                          className={registerErrors.address ? "border-critical" : ""}
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                {/* Block 3: Người liên hệ khẩn cấp (An toàn bệnh viện) */}
                <section className="border-t border-border-subtle pt-4">
                  <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                    <h3 className="mb-2 font-heading text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <ShieldAlert className="size-3.5" /> 3. Người liên hệ khẩn cấp
                    </h3>

                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <Field label="Họ tên người liên hệ" required error={registerErrors.emergencyContact}>
                        <TextInput
                          value={newPatient.emergencyContact}
                          onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                          placeholder="Ví dụ: Nguyễn Thị Lan (Vợ/Thân nhân)"
                          className={`bg-surface ${registerErrors.emergencyContact ? "border-critical" : ""}`}
                        />
                      </Field>

                      <Field label="Số điện thoại khẩn cấp" required error={registerErrors.emergencyPhone}>
                        <TextInput
                          value={newPatient.emergencyPhone}
                          onChange={(e) => setNewPatient({ ...newPatient, emergencyPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                          placeholder="091xxxxxxx"
                          maxLength={10}
                          className={`bg-surface font-mono ${registerErrors.emergencyPhone ? "border-critical" : ""}`}
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                {/* Registration Actions */}
                <div className="flex flex-col-reverse gap-2.5 pt-4 border-t border-border-subtle sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => setMode("intake")}
                    className="border border-border-subtle text-xs"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleRegisterSubmit(false)}
                    className="text-xs"
                  >
                    Chỉ lưu hồ sơ
                  </Button>
                  <Button
                    onClick={() => handleRegisterSubmit(true)}
                    className="interactive-tactile text-xs font-semibold shadow-clinical-sm"
                  >
                    <Check className="size-4 mr-1.5" />
                    Tạo hồ sơ &amp; Tiếp nhận khám ngay
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT WORKSPACE PANE: REAL-TIME INTAKE QUEUE & DISPATCH CONSOLE          */}
        {/* ========================================================================= */}
        <section
          className="min-w-0 self-start overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-clinical-xs"
          aria-labelledby="queue-title"
        >
          {/* Queue Header & Filters */}
          <div className="border-b border-border-subtle p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="queue-title" className="font-display text-base font-bold text-text-primary">
                  Danh Sách Chờ Khám
                </h2>
              </div>

              {/* SSE Live Indicator */}
              <Tooltip content="Cập nhật trực tiếp thời gian thực">
                <span className="cursor-help inline-flex items-center gap-2 rounded-full border border-normal/20 bg-normal-bg px-3 py-1 text-xs font-semibold text-normal shadow-clinical-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-normal opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-normal" />
                  </span>
                  Trực tiếp
                </span>
              </Tooltip>
            </div>

            {/* Filter Tabs & Queue Internal Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist">
                {[
                  { id: "all" as const, label: `Tất cả (${counts.all})` },
                  { id: "EMERGENCY" as const, label: `Cấp cứu (${counts.emergency})` },
                  { id: "NON_EMERGENCY" as const, label: `Ngoại trú (${counts.outpatient})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={queueFilter === tab.id}
                    onClick={() => {
                      setQueueFilter(tab.id)
                      setPage(1)
                    }}
                    className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 font-heading text-xs font-semibold transition-all ${
                      queueFilter === tab.id
                        ? "border border-brand-primary bg-brand-surface text-brand-deep shadow-clinical-xs"
                        : "border border-border-subtle text-text-muted hover:bg-subsurface hover:text-text-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-44">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={queueSearch}
                  onChange={(e) => {
                    setQueueSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Lọc tên / STT..."
                  className="w-full rounded-lg border border-border-subtle bg-subsurface py-1 pl-8 pr-2.5 text-xs text-text-primary focus:border-brand-primary focus:bg-surface focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-subsurface/70 text-xs font-semibold text-text-secondary">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">STT / Mã BN</th>
                  <th className="whitespace-nowrap px-4 py-3">Họ và tên</th>
                  <th className="whitespace-nowrap px-4 py-3">Phân loại</th>
                  <th className="whitespace-nowrap px-4 py-3">Phòng khám</th>
                  <th className="whitespace-nowrap px-4 py-3">Thời gian</th>
                  <th className="whitespace-nowrap px-4 py-3">Trạng thái</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {visibleQueue.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-text-muted">
                      Không có lượt chờ nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  visibleQueue.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.acuity === "EMERGENCY"
                          ? "bg-critical-bg/30 hover:bg-critical-bg/50"
                          : "hover:bg-canvas"
                      }`}
                    >
                      {/* STT & Patient ID */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-text-primary">
                            #{String(item.soThuTu).padStart(2, "0")}
                          </span>
                          <span className="font-mono text-xs text-brand-deep">
                            {item.maBenhNhan}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="font-heading text-xs font-bold text-text-primary">
                          {item.hoTen}
                        </span>
                      </td>

                      {/* Acuity */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Tooltip
                          content={
                            item.acuity === "EMERGENCY"
                              ? "Ưu tiên 1: Cấp cứu"
                              : "Ưu tiên 2: Khám theo số thứ tự"
                          }
                        >
                          <span
                            className={`cursor-help inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              item.acuity === "EMERGENCY"
                                ? "bg-critical text-surface"
                                : "bg-info-bg text-info border border-info/30"
                            }`}
                          >
                            {item.acuity === "EMERGENCY" ? "CẤP CỨU" : "NGOẠI TRÚ"}
                          </span>
                        </Tooltip>
                      </td>

                      {/* Destination Clinic */}
                      <td className="px-4 py-3.5 text-xs text-text-secondary">
                        <span className="line-clamp-1">{destinationLabel(item)}</span>
                      </td>

                      {/* Waiting time */}
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-text-muted">
                        {formatWait(item.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            item.status === "DangCho"
                              ? "bg-warning-bg text-warning"
                              : "bg-normal-bg text-normal"
                          }`}
                        >
                          {item.status === "DangCho" ? "Đang chờ" : "Đang khám"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            disabled={item.status !== "DangCho"}
                            onClick={() => {
                              if (startConsultation(item.id, user)) {
                                setNotice(
                                  `Đã điều phối ${item.hoTen} (${item.maBenhNhan}) vào phòng khám ${destinationLabel(item)}.`,
                                )
                              }
                            }}
                            className="interactive-tactile !px-2.5 !py-1 text-xs"
                          >
                            Điều phối
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedEncounter(item)}
                            className="border border-border-subtle !px-2.5 !py-1 text-xs"
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredQueue.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="lượt chờ"
          />
        </section>
      </main>

      {/* Floating Success Toast */}
      {success && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-normal/30 bg-surface px-5 py-3.5 text-sm font-semibold text-normal shadow-clinical-xl animate-fade-in"
        >
          <CheckCircle2 className="h-5 w-5 text-normal shrink-0" />
          <p className="text-xs text-text-primary font-medium">{success}</p>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-2 cursor-pointer text-text-muted hover:text-text-primary"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Encounter Details Modal */}
      {selectedEncounter && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedEncounter(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="queue-detail-title"
            className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface shadow-clinical-xl"
          >
            <div className="flex items-start justify-between border-b border-border-subtle p-5">
              <div>
                <h2 id="queue-detail-title" className="font-display text-lg font-bold text-text-primary">
                  Chi Tiết Phiếu Tiếp Nhận
                </h2>
                <p className="mt-1 font-mono text-xs text-text-muted">
                  Phiếu {selectedEncounter.id} · Bệnh nhân {selectedEncounter.maBenhNhan}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng chi tiết"
                onClick={() => setSelectedEncounter(null)}
                className="cursor-pointer rounded-lg p-1.5 text-text-muted hover:bg-subsurface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-5 text-xs text-text-secondary">
              <div className="flex justify-between border-b border-border-subtle/60 pb-2">
                <span className="text-text-muted">Họ và tên:</span>
                <span className="font-bold text-text-primary">{selectedEncounter.hoTen}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle/60 pb-2">
                <span className="text-text-muted">Phân loại tuyến khám:</span>
                <span className="font-semibold text-brand-deep">
                  {selectedEncounter.acuity === "EMERGENCY" ? "Cấp cứu (Ưu tiên mức 1)" : "Ngoại trú (Ưu tiên mức 2)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border-subtle/60 pb-2">
                <span className="text-text-muted">Định tuyến khoa/phòng:</span>
                <span className="font-medium text-text-primary">{destinationLabel(selectedEncounter)}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle/60 pb-2">
                <span className="text-text-muted">Lý do đến khám:</span>
                <span className="font-medium text-text-primary max-w-xs text-right">{selectedEncounter.lyDoKham}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle/60 pb-2">
                <span className="text-text-muted">Thời điểm tiếp nhận:</span>
                <span className="font-mono text-text-primary">{formatWait(selectedEncounter.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Người tiếp nhận:</span>
                <span className="font-medium text-text-primary">{selectedEncounter.createdBy}</span>
              </div>
            </div>
            <div className="border-t border-border-subtle bg-canvas p-4 text-right">
              <Button onClick={() => setSelectedEncounter(null)} className="text-xs">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Code Red Emergency Bypass Modal */}
      {codeRedModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-[3px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCodeRedModal(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="code-red-title"
            className="w-full max-w-lg rounded-2xl border-2 border-critical-border bg-surface shadow-clinical-xl animate-fade-in"
          >
            <div className="flex items-start justify-between border-b border-critical-border/30 bg-critical-bg p-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-critical text-surface shadow-clinical-sm">
                  <Siren className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h2 id="code-red-title" className="font-display text-lg font-bold text-critical">
                    TIẾP NHẬN Báo động đỏ
                  </h2>
                  <p className="text-xs text-critical/80 mt-0.5">
                    Áp dụng cho bệnh nhân ngưng tuần hoàn hô hấp, sốc nặng, hôn mê sâu (REQ-ADM-03).
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setCodeRedModal(false)}
                className="cursor-pointer rounded-lg p-1.5 text-critical/70 hover:bg-critical/10 hover:text-critical"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                Bệnh nhân sẽ được cấp mã khẩn cấp và chuyển thẳng vào đầu danh sách Khoa Cấp cứu.
              </p>
              <Field label="Tình trạng bệnh nhân" required>
                <TextInput
                  value={codeRedNote}
                  onChange={(e) => setCodeRedNote(e.target.value)}
                  placeholder="Ví dụ: Ngưng tim ngưng thở / Hôn mê sâu..."
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2.5 border-t border-border-subtle bg-canvas p-4 rounded-b-2xl">
              <Button variant="ghost" onClick={() => setCodeRedModal(false)} className="text-xs">
                Hủy
              </Button>
              <Button
                variant="danger"
                onClick={handleCodeRedSubmit}
                className="interactive-tactile text-xs font-bold shadow-clinical-md"
              >
                Chuyển cấp cứu ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
