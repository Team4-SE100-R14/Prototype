import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { AuthUser } from "../../App"
import TopNav from "../TopNav"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import { TextArea, TextInput } from "../ui/TextInput"

interface Props {
  user: AuthUser
  onLogout: () => void
  embedded?: boolean
  requestedView?: "beds" | "alerts"
  onRequestedViewChange?: (view: "beds" | "alerts") => void
  soundEnabled?: boolean
  onStatusChange?: (status: WardWorkspaceStatus) => void
}

type MetricKey = "rr" | "spo2" | "pulse" | "sys" | "dia" | "temp"
type Level = "normal" | "yellow" | "red" | "missing"
type BedStatus = "normal" | "yellow" | "red" | "incomplete"
type Connection = "connected" | "lost" | "refreshing" | "reconnected"

export interface WardWorkspaceStatus {
  connectionLabel: string
  connectionProblem: boolean
  unread: number
  bellShake: boolean
}

interface VitalValues {
  rr: number | null
  spo2: number | null
  pulse: number | null
  sys: number | null
  dia: number | null
  temp: number | null
}

interface Patient {
  id: string
  name: string
  sex: "Nam" | "Nữ"
  age: number
  chartId: string
  doctor: string
}

interface Bed {
  code: string
  patient?: Patient
  values?: VitalValues
  measuredAt?: string
  status: BedStatus
}

interface VitalRecord extends VitalValues {
  id: string
  time: string
  recorder: string
}

interface AlertItem {
  id: string
  bed: string
  patientId: string
  patient: string
  level: "red" | "yellow"
  parameter: string
  value: string
  time: string
  acknowledged: boolean
}

interface Banner {
  id: string
  bed: string
  patient: string
  level: "red" | "yellow"
  message: string
  time: string
}

interface Evaluation {
  values: VitalValues
  levels: Record<MetricKey, Level>
  red: number
  yellow: number
  missing: number
  result: "red" | "yellow" | "normal"
  outcome: string
}

const METRICS: { key: MetricKey; label: string; short: string; unit: string; helper: string }[] = [
  { key: "rr", label: "Nhịp thở", short: "NT", unit: "lần/phút", helper: "Bình thường 12–20" },
  { key: "spo2", label: "SpO2", short: "SpO2", unit: "%", helper: "Bình thường 94–100" },
  { key: "pulse", label: "Mạch", short: "Mạch", unit: "lần/phút", helper: "Bình thường 51–100" },
  { key: "sys", label: "Huyết áp tâm thu", short: "HATT", unit: "mmHg", helper: "Bình thường 101–140" },
  { key: "dia", label: "Huyết áp tâm trương", short: "HATTr", unit: "mmHg", helper: "Bình thường 60–89" },
  { key: "temp", label: "Nhiệt độ", short: "Nhiệt", unit: "°C", helper: "Bình thường 36,1–38,0" },
]

const EMPTY_VALUES: VitalValues = { rr: null, spo2: null, pulse: null, sys: null, dia: null, temp: null }

const PATIENTS: Record<string, Patient> = {
  "302A": { id: "BN-26-0021", name: "Trần Văn B", sex: "Nam", age: 67, chartId: "BA-26-0105", doctor: "BS. Trần Minh Khoa" },
  "305B": { id: "BN-26-0034", name: "Lê Thị C", sex: "Nữ", age: 72, chartId: "BA-26-0116", doctor: "BS. Trần Minh Khoa" },
  "301A": { id: "BN-26-0012", name: "Nguyễn Văn An", sex: "Nam", age: 54, chartId: "BA-26-0098", doctor: "BS. Trần Minh Khoa" },
  "301B": { id: "BN-26-0040", name: "Phạm Văn D", sex: "Nam", age: 61, chartId: "BA-26-0120", doctor: "BS. Trần Minh Khoa" },
  "303A": { id: "BN-26-0045", name: "Hoàng Thị E", sex: "Nữ", age: 58, chartId: "BA-26-0124", doctor: "BS. Trần Minh Khoa" },
  "304B": { id: "BN-26-0050", name: "Đỗ Văn G", sex: "Nam", age: 46, chartId: "BA-26-0129", doctor: "BS. Trần Minh Khoa" },
  "306A": { id: "BN-26-0052", name: "Vũ Thị H", sex: "Nữ", age: 76, chartId: "BA-26-0132", doctor: "BS. Trần Minh Khoa" },
  "306B": { id: "BN-26-0055", name: "Bùi Văn K", sex: "Nam", age: 39, chartId: "BA-26-0135", doctor: "BS. Trần Minh Khoa" },
}

const initialBeds = (): Bed[] => {
  const occupied: Record<string, { values: VitalValues; measuredAt: string; status: BedStatus }> = {
    "302A": { values: { rr: 20, spo2: 88, pulse: 96, sys: 128, dia: 82, temp: 37.4 }, measuredAt: "08:45", status: "red" },
    "305B": { values: { rr: 22, spo2: 95, pulse: 112, sys: 132, dia: 84, temp: 37.2 }, measuredAt: "08:38", status: "yellow" },
    "301A": { values: { rr: 16, spo2: 98, pulse: 78, sys: 120, dia: 80, temp: 36.8 }, measuredAt: "08:30", status: "normal" },
    "301B": { values: { rr: 18, spo2: 97, pulse: 82, sys: 126, dia: 79, temp: 37.0 }, measuredAt: "08:20", status: "normal" },
    "303A": { values: { rr: 17, spo2: 96, pulse: 74, sys: null, dia: null, temp: 36.7 }, measuredAt: "07:55", status: "incomplete" },
    "304B": { values: { rr: 18, spo2: 97, pulse: 86, sys: 134, dia: 88, temp: 37.1 }, measuredAt: "08:12", status: "normal" },
    "306A": { values: { rr: null, spo2: 95, pulse: 90, sys: 138, dia: 86, temp: null }, measuredAt: "07:40", status: "incomplete" },
    "306B": { values: { rr: 15, spo2: 99, pulse: 72, sys: 118, dia: 76, temp: 36.6 }, measuredAt: "08:05", status: "normal" },
  }
  return ["301A", "301B", "302A", "302B", "303A", "303B", "304A", "304B", "305A", "305B", "306A", "306B"].map(code => ({
    code,
    patient: PATIENTS[code],
    values: occupied[code]?.values,
    measuredAt: occupied[code]?.measuredAt,
    status: occupied[code]?.status || "normal",
  }))
}

const initialAlerts = (): AlertItem[] => [
  { id: "CB-1024", bed: "302A", patientId: "BN-26-0021", patient: "Trần Văn B", level: "red", parameter: "SpO2", value: "88%", time: "08:45", acknowledged: false },
  { id: "CB-1023", bed: "305B", patientId: "BN-26-0034", patient: "Lê Thị C", level: "yellow", parameter: "Mạch / Nhịp thở", value: "112 / 22", time: "08:38", acknowledged: false },
  { id: "CB-1019", bed: "301B", patientId: "BN-26-0040", patient: "Phạm Văn D", level: "yellow", parameter: "Nhiệt độ", value: "38,4°C", time: "Hôm qua, 22:10", acknowledged: true },
]

const makeHistory = (bed: string): VitalRecord[] => {
  if (bed === "302A") return [
    { id: "SH-26-0142", time: "Hôm nay, 08:45", rr: 20, spo2: 88, pulse: 96, sys: 128, dia: 82, temp: 37.4, recorder: "ĐD. Phạm Thị Lan" },
    { id: "SH-26-0135", time: "Hôm nay, 05:40", rr: 20, spo2: 92, pulse: 92, sys: 130, dia: 84, temp: 37.3, recorder: "ĐD. Nguyễn Thu Hà" },
    { id: "SH-26-0122", time: "Hôm qua, 23:50", rr: 18, spo2: 94, pulse: 88, sys: 132, dia: 82, temp: 37.1, recorder: "ĐD. Nguyễn Thu Hà" },
    { id: "SH-26-0108", time: "Hôm qua, 17:45", rr: 17, spo2: 96, pulse: 84, sys: 126, dia: 80, temp: 36.9, recorder: "ĐD. Phạm Thị Lan" },
  ]
  const source = initialBeds().find(item => item.code === bed)?.values || EMPTY_VALUES
  return [0, 1, 2].map(index => ({
    id: `SH-26-01${38 - index}`,
    time: index === 0 ? "Hôm nay, 08:20" : index === 1 ? "Hôm nay, 02:15" : "Hôm qua, 20:10",
    ...source,
    spo2: source.spo2 === null ? null : Math.min(100, source.spo2 + index),
    pulse: source.pulse === null ? null : Math.max(50, source.pulse - index * 2),
    recorder: index === 0 ? "ĐD. Phạm Thị Lan" : "ĐD. Nguyễn Thu Hà",
  }))
}

function classify(key: MetricKey, value: number | null): Level {
  if (value === null || Number.isNaN(value)) return "missing"
  if (key === "rr") return value <= 8 || value >= 25 ? "red" : value <= 11 || value >= 21 ? "yellow" : "normal"
  if (key === "spo2") return value <= 91 ? "red" : value <= 93 ? "yellow" : "normal"
  if (key === "pulse") return value <= 40 || value >= 131 ? "red" : value <= 50 || value >= 101 ? "yellow" : "normal"
  if (key === "sys") return value <= 90 || value >= 220 ? "red" : value <= 100 || value >= 141 ? "yellow" : "normal"
  if (key === "dia") return value <= 49 || value >= 120 ? "red" : value <= 59 || value >= 90 ? "yellow" : "normal"
  return value <= 35 || value >= 39.1 ? "red" : value <= 36 || value >= 38.1 ? "yellow" : "normal"
}

function assessment(values: VitalValues) {
  const levels = Object.fromEntries(METRICS.map(metric => [metric.key, classify(metric.key, values[metric.key])])) as Record<MetricKey, Level>
  const red = Object.values(levels).filter(level => level === "red").length
  const yellow = Object.values(levels).filter(level => level === "yellow").length
  const missing = Object.values(levels).filter(level => level === "missing").length
  return { levels, red, yellow, missing, result: red ? "red" as const : yellow >= 2 ? "yellow" as const : "normal" as const }
}

const levelClasses: Record<Level, string> = {
  normal: "border-emerald-200 bg-emerald-50 text-emerald-700",
  yellow: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  missing: "border-slate-200 bg-slate-100 text-slate-500",
}

const levelLabel: Record<Level, string> = { normal: "Bình thường", yellow: "Vàng", red: "Đỏ", missing: "Thiếu" }

function formatValue(key: MetricKey, value: number | null, compact = false) {
  if (value === null) return compact ? "—" : "Thiếu"
  const formatted = key === "temp" ? value.toFixed(1).replace(".", ",") : value
  if (compact) return String(formatted)
  const unit = METRICS.find(item => item.key === key)?.unit || ""
  return `${formatted} ${unit}`
}

function statusFrom(values: VitalValues): BedStatus {
  const result = assessment(values)
  if (result.result !== "normal") return result.result
  return result.missing ? "incomplete" : "normal"
}

function nowInput(minutes: number) {
  const value = new Date(Date.now() + minutes * 60_000)
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function SmallIcon({ name, className = "h-5 w-5" }: { name: "bed" | "bell" | "alert" | "list" | "chevron" | "close" | "volume" | "clock" | "user" | "activity"; className?: string }) {
  const paths: Record<string, ReactNode> = {
    bed: <><path d="M3 18v-8m18 8v-5a3 3 0 0 0-3-3H9v8m-6-5h18M6 10V7h3a3 3 0 0 1 3 3" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    alert: <><path d="M12 9v4m0 4h.01M10.3 3.8 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    volume: <><path d="M11 5 6 9H2v6h4l5 4V5Zm4 4a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  }
  return <Icon className={className}>{paths[name]}</Icon>
}

function Chip({ level, children }: { level: Level; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${levelClasses[level]}`}>{children}</span>
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-border-subtle bg-surface shadow-sm ${className}`}>{children}</section>
}

export default function WardVitalWorkspace({
  user,
  onLogout,
  embedded = false,
  requestedView,
  onRequestedViewChange,
  soundEnabled,
  onStatusChange,
}: Props) {
  const isNurse = user.role === "nurse"
  const [view, setView] = useState<"beds" | "alerts" | "record">("beds")
  const [beds, setBeds] = useState(initialBeds)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [selectedBedCode, setSelectedBedCode] = useState("302A")
  const [banners, setBanners] = useState<Banner[]>([])
  const [toasts, setToasts] = useState<string[]>([])
  const [connection, setConnection] = useState<Connection>("connected")
  const [retry, setRetry] = useState(1)
  const [sound, setSound] = useState(true)
  const [bellShake, setBellShake] = useState(false)
  const [alertFilter, setAlertFilter] = useState<"all" | "unread" | "red" | "yellow">("all")
  const [demoOpen, setDemoOpen] = useState(false)
  const [simulatedMinutes, setSimulatedMinutes] = useState(0)
  const [discharged, setDischarged] = useState(false)
  const [flashingBed, setFlashingBed] = useState<string | null>(null)
  const [histories, setHistories] = useState<Record<string, VitalRecord[]>>(() => Object.fromEntries(Object.keys(PATIENTS).map(code => [code, makeHistory(code)])))
  const [metric, setMetric] = useState<MetricKey>("spo2")
  const [thresholdOpen, setThresholdOpen] = useState(false)
  const [form, setForm] = useState<Record<MetricKey, string>>({ rr: "", spo2: "", pulse: "", sys: "", dia: "", temp: "" })
  const [measuredAt, setMeasuredAt] = useState(nowInput(0))
  const [note, setNote] = useState("")
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [scenarioStep, setScenarioStep] = useState<Record<string, number>>({})
  const triggerLog = useRef<{ patientId: string; key: MetricKey; level: Level; minute: number }[]>([])
  const patientState = useRef<Record<string, "normal" | "yellow" | "red">>({})
  const alertSequence = useRef(1025)
  const recordSequence = useRef(143)
  const selectedBed = beds.find(bed => bed.code === selectedBedCode) || beds[0]
  const effectiveSound = soundEnabled ?? sound

  useEffect(() => {
    if (requestedView) setView(requestedView)
  }, [requestedView])

  const changeView = (nextView: "beds" | "alerts") => {
    setView(nextView)
    onRequestedViewChange?.(nextView)
  }

  const notify = (message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(items => [...items, message])
    window.setTimeout(() => setToasts(items => items.filter(item => item !== message)), 3600)
    return id
  }

  const pulseBell = () => {
    setBellShake(true)
    if (effectiveSound) {
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (AudioContextClass) {
          const context = new AudioContextClass()
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(880, context.currentTime)
          gain.gain.setValueAtTime(0.08, context.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.32)
          oscillator.connect(gain)
          gain.connect(context.destination)
          oscillator.start()
          oscillator.stop(context.currentTime + 0.32)
        }
      } catch {
        // Trình duyệt có thể chặn âm thanh tự động; biểu tượng vẫn rung để báo hiệu.
      }
    }
    window.setTimeout(() => setBellShake(false), 900)
  }

  const openRecord = (bed: string) => {
    if (!PATIENTS[bed]) return
    setSelectedBedCode(bed)
    setView("record")
    setEvaluation(null)
    setForm({ rr: "", spo2: "", pulse: "", sys: "", dia: "", temp: "" })
    setMeasuredAt(nowInput(simulatedMinutes))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const pushBanner = (alert: AlertItem) => {
    setBanners(items => [{
      id: `${alert.id}-${Date.now()}`,
      bed: alert.bed,
      patient: alert.patient,
      level: alert.level,
      message: `${alert.parameter} ${alert.value}`,
      time: new Date(Date.now() + simulatedMinutes * 60_000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    }, ...items].slice(0, 4))
    setFlashingBed(alert.bed)
    window.setTimeout(() => setFlashingBed(null), 3500)
    if (alert.level === "red") pulseBell()
  }

  const simulateAlert = (bed: "302A" | "305B", level: "red" | "yellow", forcePush = false) => {
    const patient = PATIENTS[bed]
    const item: AlertItem = {
      id: `CB-${alertSequence.current++}`,
      bed,
      patientId: patient.id,
      patient: patient.name,
      level,
      parameter: level === "red" ? "SpO2" : "Mạch / Nhịp thở",
      value: level === "red" ? "88%" : "112 bpm / 22 lần/phút",
      time: new Date(Date.now() + simulatedMinutes * 60_000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      acknowledged: false,
    }
    setAlerts(items => [item, ...items])
    setBeds(items => items.map(current => current.code === bed ? { ...current, status: level } : current))
    if (forcePush || connection !== "lost") pushBanner(item)
  }

  const disconnect = () => {
    setConnection("lost")
    setRetry(1)
    window.setTimeout(() => setRetry(2), 1000)
    window.setTimeout(() => setRetry(4), 3000)
  }

  const reconnect = () => {
    setConnection("reconnected")
    simulateAlert("302A", "red", true)
    simulateAlert("305B", "yellow", true)
    notify("Đã đồng bộ 2 cảnh báo chưa xác nhận bị lỡ trong lúc mất kết nối")
    window.setTimeout(() => setConnection("connected"), 2600)
  }

  const refreshToken = () => {
    setConnection("refreshing")
    window.setTimeout(() => {
      setConnection("reconnected")
      window.setTimeout(() => setConnection("connected"), 2500)
    }, 1400)
  }

  const formValues = (): VitalValues => Object.fromEntries(METRICS.map(item => [item.key, form[item.key] === "" ? null : Number(form[item.key])])) as unknown as VitalValues

  const errors = useMemo(() => {
    const result: Partial<Record<MetricKey | "time", string>> = {}
    const values = formValues()
    const bounds: Record<MetricKey, [number, number]> = { rr: [8, 60], spo2: [50, 100], pulse: [30, 250], sys: [50, 260], dia: [30, 160], temp: [30, 45] }
    METRICS.forEach(({ key }) => {
      const value = values[key]
      if (value !== null && (value < bounds[key][0] || value > bounds[key][1] || (key !== "temp" && !Number.isInteger(value)))) {
        result[key] = "Giá trị nằm ngoài giới hạn sinh lý cho phép."
      }
    })
    if (values.sys !== null && values.dia !== null && values.dia >= values.sys) {
      result.sys = "Giá trị nằm ngoài giới hạn sinh lý cho phép."
      result.dia = "Giá trị nằm ngoài giới hạn sinh lý cho phép."
    }
    if (!measuredAt) result.time = "Vui lòng nhập thời gian đo."
    else if (new Date(measuredAt).getTime() > Date.now() + simulatedMinutes * 60_000 + 30_000) result.time = "Thời gian đo không được lớn hơn thời điểm hiện tại."
    return result
  }, [form, measuredAt, simulatedMinutes])

  const createAlertFromEvaluation = (values: VitalValues, result: ReturnType<typeof assessment>) => {
    const patient = selectedBed.patient!
    const minute = simulatedMinutes
    const violations = METRICS.filter(item => result.levels[item.key] === result.result)
    const previousState = patientState.current[patient.id]
    const escalated = previousState === "yellow" && result.result === "red"
    const retriggered = previousState === "normal" && triggerLog.current.some(log => log.patientId === patient.id)
    const duplicate = !escalated && violations.some(item => triggerLog.current.some(log =>
      log.patientId === patient.id && log.key === item.key && log.level === result.result && minute - log.minute < 15,
    ))
    patientState.current[patient.id] = result.result
    if (duplicate) return "Cảnh báo tương tự đã được tạo cách đây 6 phút (< 15 phút) nên không tạo cảnh báo trùng. Số liệu mới vẫn được cập nhật trên màn hình."

    const id = `CB-${alertSequence.current++}`
    violations.forEach(item => triggerLog.current.push({ patientId: patient.id, key: item.key, level: result.result, minute }))
    const item: AlertItem = {
      id,
      bed: selectedBed.code,
      patientId: patient.id,
      patient: patient.name,
      level: result.result as "red" | "yellow",
      parameter: violations.map(value => value.label).join(", "),
      value: violations.map(value => formatValue(value.key, values[value.key])).join(", "),
      time: new Date(Date.now() + simulatedMinutes * 60_000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      acknowledged: false,
    }
    setAlerts(items => [item, ...items])
    if (connection !== "lost") pushBanner(item)
    if (escalated) return `Chỉ số xấu đi từ Vàng sang Đỏ: bỏ qua thời gian chống trùng, đã tạo cảnh báo ĐỎ mới ${id} ngay lập tức.`
    if (retriggered) return `Chỉ số đã trở về bình thường rồi vi phạm lại: đặt lại bộ đếm 15 phút và tạo cảnh báo mới ${id}.`
    return `Đã tạo cảnh báo mới ${id} và phát tới toàn khoa.`
  }

  const saveVitals = () => {
    setTouched(Object.fromEntries([...METRICS.map(item => item.key), "time"].map(key => [key, true])))
    if (Object.keys(errors).length || discharged) return
    const values = formValues()
    const result = assessment(values)
    let outcome = "Không tạo cảnh báo."
    if (result.result === "normal") patientState.current[selectedBed.patient!.id] = "normal"
    else outcome = createAlertFromEvaluation(values, result)
    const id = `SH-26-0${recordSequence.current++}`
    const record: VitalRecord = {
      id,
      time: new Date(measuredAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
      ...values,
      recorder: "ĐD. Phạm Thị Lan",
    }
    setHistories(current => ({ ...current, [selectedBed.code]: [record, ...(current[selectedBed.code] || [])] }))
    setBeds(items => items.map(item => item.code === selectedBed.code ? {
      ...item,
      values,
      measuredAt: new Date(measuredAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      status: statusFrom(values),
    } : item))
    setEvaluation({ values, ...result, outcome })
    notify(`Đã lưu phiếu sinh hiệu ${id}`)
    setForm({ rr: "", spo2: "", pulse: "", sys: "", dia: "", temp: "" })
    setNote("")
    setMeasuredAt(nowInput(simulatedMinutes))
    setTouched({})
  }

  const fillScenario = (scenario: string) => {
    setSelectedBedCode("302A")
    if (view !== "record") setView("record")
    const values: Record<MetricKey, string> = { rr: "16", spo2: "98", pulse: "78", sys: "120", dia: "80", temp: "36.8" }
    if (scenario === "yellow") Object.assign(values, { rr: "22", spo2: "93", pulse: "88", sys: "125", dia: "80", temp: "37.0" })
    if (scenario === "red") Object.assign(values, { rr: "24", spo2: "88", pulse: "135", sys: "105", dia: "70", temp: "38.0" })
    if (scenario === "missing") Object.assign(values, { rr: "", spo2: "96", pulse: "80", sys: "", dia: "", temp: "" })
    if (scenario === "invalid") Object.assign(values, { rr: "16", spo2: "98", pulse: "78", sys: "80", dia: "95", temp: "46.5" })
    if (scenario === "oscillate") {
      const step = scenarioStep.oscillate || 0
      Object.assign(values, { rr: "22", pulse: String([110, 115, 118][step % 3]) })
      setScenarioStep(current => ({ ...current, oscillate: step + 1 }))
    }
    if (scenario === "escalate") {
      const step = scenarioStep.escalate || 0
      Object.assign(values, step % 2 === 0 ? { rr: "22", spo2: "92" } : { rr: "16", spo2: "89" })
      setScenarioStep(current => ({ ...current, escalate: step + 1 }))
    }
    if (scenario === "retrigger") {
      const step = scenarioStep.retrigger || 0
      Object.assign(values, step % 2 === 0 ? { rr: "16", spo2: "98", pulse: "78" } : { rr: "22", spo2: "93", pulse: "110" })
      setScenarioStep(current => ({ ...current, retrigger: step + 1 }))
    }
    setForm(values)
    setTouched({})
    setEvaluation(null)
  }

  const resetMock = () => {
    setBeds(initialBeds())
    setAlerts(initialAlerts())
    setBanners([])
    setToasts([])
    setConnection("connected")
    setSound(true)
    setSimulatedMinutes(0)
    setDischarged(false)
    setHistories(Object.fromEntries(Object.keys(PATIENTS).map(code => [code, makeHistory(code)])))
    triggerLog.current = []
    patientState.current = {}
    alertSequence.current = 1025
    recordSequence.current = 143
    setEvaluation(null)
    setForm({ rr: "", spo2: "", pulse: "", sys: "", dia: "", temp: "" })
    setMeasuredAt(nowInput(0))
    notify("Đã đặt lại dữ liệu mô phỏng")
  }

  const priority = { red: 0, yellow: 1, incomplete: 2, normal: 3 }
  const sortedBeds = [...beds].sort((a, b) => priority[a.status] - priority[b.status])
  const unread = alerts.filter(item => !item.acknowledged).length
  const filteredAlerts = alerts.filter(item => alertFilter === "all" || (alertFilter === "unread" && !item.acknowledged) || item.level === alertFilter)

  const connectionLabel = connection === "connected"
    ? "Đang kết nối trực tiếp"
    : connection === "lost"
      ? `Mất kết nối - thử lại sau ${retry} giây`
      : connection === "refreshing"
        ? "Đang làm mới phiên..."
        : "Đã kết nối lại"

  useEffect(() => {
    onStatusChange?.({
      connectionLabel,
      connectionProblem:
        connection === "lost" || connection === "refreshing",
      unread,
      bellShake,
    })
  }, [bellShake, connection, connectionLabel, onStatusChange, unread])

  return (
    <div className={`${embedded ? "min-h-full" : "min-h-screen"} bg-canvas text-text-primary`}>
      {!embedded && <TopNav
        user={user}
        onLogout={onLogout}
        title={isNurse ? "Không gian Điều dưỡng" : "Không gian Bác sĩ"}
        actions={
          <div className="ml-auto hidden items-center gap-2 xl:flex">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${connection === "lost" || connection === "refreshing" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              <span className={`h-2 w-2 rounded-full ${connection === "lost" || connection === "refreshing" ? "bg-amber-500" : "animate-pulse bg-emerald-500"}`} />
              {connectionLabel}
            </span>
            <Button variant="ghost" className="flex items-center gap-2 border border-border-subtle !px-3 !py-1.5" onClick={() => setSound(value => !value)}>
              <span className={bellShake ? "animate-bell" : ""}><SmallIcon name={effectiveSound ? "volume" : "bell"} className="h-4 w-4" /></span>
              Âm báo: {effectiveSound ? "Bật" : "Tắt"}
            </Button>
            <span className="rounded-full border border-border-subtle bg-subsurface px-3 py-1.5 text-xs font-semibold text-text-secondary">Cảnh báo chưa xác nhận: {unread}</span>
          </div>
        }
      />}

      <div className={`flex ${embedded ? "min-h-full" : "min-h-[calc(100vh-3.5rem)]"}`}>
        {!embedded && <aside className="hidden w-60 shrink-0 border-r border-border-subtle bg-surface p-4 lg:block">
          <div className="mb-5 rounded-lg bg-brand-surface p-3">
            <p className="text-xs font-semibold text-brand-deep">KHOA ĐƯỢC PHÂN CÔNG</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">Khoa Nội tổng quát</p>
          </div>
          <nav className="space-y-1">
            <Button variant="ghost" onClick={() => changeView("beds")} className={`flex w-full items-center justify-start gap-3 ${view === "beds" || view === "record" ? "bg-brand-surface text-brand-deep" : ""}`}>
              <SmallIcon name="bed" /> Bảng giường bệnh
            </Button>
            <Button variant="ghost" onClick={() => changeView("alerts")} className={`flex w-full items-center justify-start gap-3 ${view === "alerts" ? "bg-brand-surface text-brand-deep" : ""}`}>
              <SmallIcon name="list" /> Danh sách cảnh báo
              {unread > 0 && <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{unread}</span>}
            </Button>
          </nav>
          <div className="mt-8 border-t border-border-subtle pt-4 text-xs leading-relaxed text-text-muted">
            Chỉ hiển thị cảnh báo của các khoa bạn được phân công: <strong className="text-text-secondary">Khoa Nội tổng quát</strong>
          </div>
        </aside>}

        <main className="min-w-0 flex-1 p-4 md:p-6">
          {view === "beds" && (
            <DashboardView
              beds={sortedBeds}
              unread={unread}
              flashingBed={flashingBed}
              isNurse={isNurse}
              onOpen={openRecord}
              onAlerts={() => changeView("alerts")}
            />
          )}
          {view === "alerts" && (
            <AlertsView
              alerts={filteredAlerts}
              filter={alertFilter}
              onFilter={setAlertFilter}
              onOpen={openRecord}
              onAcknowledge={id => setAlerts(items => items.map(item => item.id === id ? { ...item, acknowledged: true } : item))}
              onBack={() => changeView("beds")}
            />
          )}
          {view === "record" && selectedBed.patient && (
            <RecordView
              bed={selectedBed}
              isNurse={isNurse}
              discharged={discharged}
              form={form}
              setForm={setForm}
              measuredAt={measuredAt}
              setMeasuredAt={setMeasuredAt}
              note={note}
              setNote={setNote}
              touched={touched}
              setTouched={setTouched}
              errors={errors}
              evaluation={evaluation}
              histories={histories[selectedBed.code] || []}
              metric={metric}
              setMetric={setMetric}
              thresholdOpen={thresholdOpen}
              setThresholdOpen={setThresholdOpen}
              onSave={saveVitals}
              onClear={() => { setForm({ rr: "", spo2: "", pulse: "", sys: "", dia: "", temp: "" }); setTouched({}); setEvaluation(null) }}
              onBack={() => changeView("beds")}
            />
          )}
        </main>
      </div>

      <div className="fixed right-5 top-20 z-50 flex w-96 max-w-[calc(100vw-2.5rem)] flex-col gap-2">
        {banners.map(banner => (
          <div key={banner.id} role="button" tabIndex={0} onClick={() => openRecord(banner.bed)} onKeyDown={event => event.key === "Enter" && openRecord(banner.bed)} className={`cursor-pointer rounded-xl border-l-4 bg-surface p-4 shadow-xl ${banner.level === "red" ? "border-red-600" : "border-amber-500"}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 ${banner.level === "red" ? "text-red-600" : "text-amber-600"}`}><SmallIcon name="alert" /></span>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold ${banner.level === "red" ? "text-red-700" : "text-amber-700"}`}>[{banner.level === "red" ? "NGUY HIỂM" : "CẢNH BÁO"}] · {banner.time}</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">Giường {banner.bed} - {banner.patient}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{banner.message}</p>
              </div>
              <Button variant="ghost" aria-label="Đóng thông báo" onClick={event => { event.stopPropagation(); setBanners(items => items.filter(item => item.id !== banner.id)) }} className="!-m-2 !p-2"><SmallIcon name="close" className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed right-5 bottom-5 z-50 flex w-96 max-w-[calc(100vw-2.5rem)] flex-col gap-2">
        {toasts.map((toast, index) => (
          <div key={`${toast}-${index}`} className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">{toast}</div>
        ))}
      </div>

      <DemoPanel
        open={demoOpen}
        setOpen={setDemoOpen}
        simulatedMinutes={simulatedMinutes}
        addMinutes={minutes => { setSimulatedMinutes(value => value + minutes); setMeasuredAt(nowInput(simulatedMinutes + minutes)) }}
        fillScenario={fillScenario}
        connection={connection}
        onRed={() => simulateAlert("302A", "red")}
        onYellow={() => simulateAlert("305B", "yellow")}
        onDisconnect={disconnect}
        onReconnect={reconnect}
        onRefresh={refreshToken}
        discharged={discharged}
        setDischarged={setDischarged}
        onReset={resetMock}
      />
    </div>
  )
}

function DashboardView({ beds, unread, flashingBed, isNurse, onOpen, onAlerts }: {
  beds: Bed[]; unread: number; flashingBed: string | null; isNurse: boolean; onOpen: (bed: string) => void; onAlerts: () => void
}) {
  const occupied = beds.filter(item => item.patient).length
  const summaries = [
    { label: "Tổng giường", value: "12", tone: "text-brand-deep bg-brand-surface" },
    { label: "Có bệnh nhân", value: String(occupied), tone: "text-text-primary bg-subsurface" },
    { label: "Cảnh báo đỏ", value: String(beds.filter(item => item.status === "red").length), tone: "text-red-700 bg-red-50" },
    { label: "Cảnh báo vàng", value: String(beds.filter(item => item.status === "yellow").length), tone: "text-amber-700 bg-amber-50" },
    { label: "Thiếu sinh hiệu", value: String(beds.filter(item => item.status === "incomplete").length), tone: "text-slate-600 bg-slate-100" },
  ]
  return <>
    <div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-deep">Theo dõi nội trú · Cập nhật trực tiếp</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">Bảng giường bệnh - Khoa Nội tổng quát</h1>
        <p className="mt-1 text-sm text-text-muted">Chỉ hiển thị cảnh báo của các khoa bạn được phân công: Khoa Nội tổng quát</p>
      </div>
      <Button variant="ghost" onClick={onAlerts} className="flex items-center gap-2 border border-border-subtle bg-surface">
        <SmallIcon name="bell" /> Danh sách cảnh báo <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{unread}</span>
      </Button>
    </div>
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
      {summaries.map(item => <Card key={item.label} className="overflow-hidden"><div className="flex items-center gap-3 p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-lg font-mono text-xl font-bold ${item.tone}`}>{item.value}</span><span className="text-xs font-semibold text-text-secondary">{item.label}</span></div></Card>)}
    </div>
    <div className="mb-3 flex items-center justify-between">
      <div><h2 className="font-display text-base font-semibold">Theo dõi theo mức độ ưu tiên</h2><p className="text-xs text-text-muted">Giường nguy hiểm và cảnh báo luôn được đưa lên đầu hàng đợi.</p></div>
      <div className="flex items-center gap-3 text-xs text-text-muted"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Nguy hiểm</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Cảnh báo</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Ổn định</span></div>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {beds.map(bed => <BedCard key={bed.code} bed={bed} flashing={flashingBed === bed.code} isNurse={isNurse} onOpen={onOpen} />)}
    </div>
  </>
}

function BedCard({ bed, flashing, isNurse, onOpen }: { bed: Bed; flashing: boolean; isNurse: boolean; onOpen: (bed: string) => void }) {
  if (!bed.patient || !bed.values) return <Card className="min-h-64 border-dashed bg-subsurface opacity-70"><div className="flex h-full min-h-64 flex-col p-4"><span className="font-mono text-sm font-bold text-text-muted">{bed.code}</span><div className="flex flex-1 flex-col items-center justify-center text-text-muted"><SmallIcon name="bed" className="mb-2 h-7 w-7" /><span className="text-sm font-medium">Giường trống</span></div></div></Card>
  const border = bed.status === "red" ? "border-red-300" : bed.status === "yellow" ? "border-amber-300" : "border-border-subtle"
  const flash = flashing ? bed.status === "red" ? "animate-alert-red" : "animate-alert-yellow" : ""
  const status = bed.status === "red" ? ["red", "Cảnh báo đỏ"] : bed.status === "yellow" ? ["yellow", "Cảnh báo vàng"] : bed.status === "incomplete" ? ["missing", "Thiếu sinh hiệu · INCOMPLETE"] : ["normal", "Ổn định"]
  return <Card className={`group overflow-hidden border-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${border} ${flash}`}>
    <div className="p-4">
      <div className="mb-3 flex items-start justify-between">
        <div><p className="font-mono text-sm font-bold text-brand-deep">GIƯỜNG {bed.code}</p><h3 className="mt-1 font-display text-base font-bold text-text-primary">{bed.patient.name}</h3><p className="text-xs text-text-muted">{bed.patient.id}</p></div>
        <span className="rounded-md bg-subsurface px-2 py-1 text-xs font-medium text-text-secondary">Đo lúc {bed.measuredAt}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {METRICS.map(item => {
          const level = classify(item.key, bed.values![item.key])
          return <div key={item.key} className={`rounded-lg border px-2 py-2 ${levelClasses[level]}`}><p className="text-[10px] font-medium opacity-80">{item.short}</p><p className="mt-0.5 font-mono text-xs font-bold">{formatValue(item.key, bed.values![item.key], true)}</p></div>
        })}
      </div>
    </div>
    <div className="flex items-center justify-between border-t border-border-subtle bg-canvas px-4 py-3">
      <Chip level={status[0] as Level}>{status[1]}</Chip>
      <Button variant="ghost" title={isNurse ? "Nhập sinh hiệu" : "Chỉ điều dưỡng được nhập sinh hiệu"} onClick={() => onOpen(bed.code)} className="flex items-center gap-1 !px-2 !py-1.5 text-xs text-brand-deep">
        {isNurse ? "Nhập sinh hiệu" : "Mở hồ sơ"} <SmallIcon name="chevron" className="h-4 w-4" />
      </Button>
    </div>
  </Card>
}

function AlertsView({ alerts, filter, onFilter, onOpen, onAcknowledge, onBack }: {
  alerts: AlertItem[]; filter: "all" | "unread" | "red" | "yellow"; onFilter: (value: "all" | "unread" | "red" | "yellow") => void; onOpen: (bed: string) => void; onAcknowledge: (id: string) => void; onBack: () => void
}) {
  const filters = [{ id: "all", label: "Tất cả" }, { id: "unread", label: "Chưa xác nhận" }, { id: "red", label: "Đỏ" }, { id: "yellow", label: "Vàng" }] as const
  return <>
    <div className="mb-5">
      <Button variant="ghost" onClick={onBack} className="mb-2 !px-0 text-text-muted">← Bảng giường bệnh</Button>
      <h1 className="font-display text-2xl font-bold">Danh sách cảnh báo</h1>
      <p className="mt-1 text-sm text-text-muted">CanhBaoYTe · Cảnh báo theo ngưỡng độc lập từng chỉ số</p>
    </div>
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-4">
        <div className="flex gap-2">{filters.map(item => <Button key={item.id} variant="ghost" onClick={() => onFilter(item.id)} className={`rounded-full border !px-3 !py-1.5 text-xs ${filter === item.id ? "border-brand-primary bg-brand-surface text-brand-deep" : "border-border-subtle"}`}>{item.label}</Button>)}</div>
        <span className="text-xs text-text-muted">{alerts.length} cảnh báo phù hợp</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-subsurface text-xs text-text-muted"><tr>{["Mã cảnh báo", "Giường", "Bệnh nhân", "Mức độ", "Thông số vi phạm", "Giá trị", "Thời gian", "Trạng thái", "Thao tác"].map(value => <th key={value} className="whitespace-nowrap px-4 py-3 font-semibold">{value}</th>)}</tr></thead>
          <tbody className="divide-y divide-border-subtle">
            {alerts.map(item => <tr key={item.id} onClick={() => onOpen(item.bed)} className="cursor-pointer hover:bg-canvas">
              <td className="px-4 py-4 font-mono text-xs font-semibold text-brand-deep">{item.id}</td>
              <td className="px-4 py-4 font-mono font-bold">{item.bed}</td>
              <td className="whitespace-nowrap px-4 py-4"><p className="font-semibold">{item.patient}</p><p className="text-xs text-text-muted">{item.patientId}</p></td>
              <td className="px-4 py-4"><Chip level={item.level}>{item.level === "red" ? "Nguy hiểm" : "Cảnh báo"}</Chip></td>
              <td className="px-4 py-4">{item.parameter}</td><td className="whitespace-nowrap px-4 py-4 font-mono font-semibold">{item.value}</td><td className="whitespace-nowrap px-4 py-4 text-text-secondary">{item.time}</td>
              <td className="px-4 py-4"><Chip level={item.acknowledged ? "normal" : "missing"}>{item.acknowledged ? "Đã xác nhận" : "Chưa xác nhận"}</Chip></td>
              <td className="px-4 py-4">{!item.acknowledged ? <Button onClick={event => { event.stopPropagation(); onAcknowledge(item.id) }} className="!px-3 !py-1.5 text-xs">Xác nhận</Button> : <span className="text-xs text-text-muted">Đã xử lý</span>}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </Card>
  </>
}

function RecordView(props: {
  bed: Bed; isNurse: boolean; discharged: boolean; form: Record<MetricKey, string>; setForm: React.Dispatch<React.SetStateAction<Record<MetricKey, string>>>
  measuredAt: string; setMeasuredAt: (value: string) => void; note: string; setNote: (value: string) => void; touched: Record<string, boolean>
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; errors: Partial<Record<MetricKey | "time", string>>; evaluation: Evaluation | null
  histories: VitalRecord[]; metric: MetricKey; setMetric: (metric: MetricKey) => void; thresholdOpen: boolean; setThresholdOpen: (value: boolean) => void
  onSave: () => void; onClear: () => void; onBack: () => void
}) {
  const { bed, isNurse, discharged, form, setForm, measuredAt, setMeasuredAt, note, setNote, touched, setTouched, errors, evaluation, histories, metric, setMetric, thresholdOpen, setThresholdOpen, onSave, onClear, onBack } = props
  const patient = bed.patient!
  const preview = formValuesFromStrings(form)
  const missing = Object.values(form).some(value => value === "")
  return <>
    <Button variant="ghost" onClick={onBack} className="mb-3 !px-0 text-text-muted">Bảng giường bệnh <span className="mx-2">›</span> Giường {bed.code}</Button>
    <Card className="mb-5 p-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-surface text-brand-deep"><SmallIcon name="user" className="h-6 w-6" /></div><div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-xl font-bold">{patient.name}</h1><Chip level={discharged ? "missing" : "normal"}>{discharged ? "Đã xuất viện" : "Đang điều trị"}</Chip>{bed.status === "incomplete" && <Chip level="missing">Thiếu sinh hiệu (INCOMPLETE)</Chip>}</div><p className="mt-1 text-sm text-text-muted">{patient.id} · {patient.sex}, {patient.age} tuổi</p></div></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm lg:grid-cols-3"><div><p className="text-xs text-text-muted">Giường</p><p className="font-mono font-bold text-brand-deep">{bed.code}</p></div><div><p className="text-xs text-text-muted">Mã bệnh án nội trú</p><p className="font-mono font-semibold">{patient.chartId}</p></div><div><p className="text-xs text-text-muted">Bác sĩ phụ trách</p><p className="font-semibold">{patient.doctor}</p></div></div>
      </div>
    </Card>
    <div className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-5">
        {isNurse ? <Card className="p-5">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Nhập phiếu sinh hiệu</h2><p className="mt-1 text-xs text-text-muted">Các trường chỉ số đều không bắt buộc, có thể lưu phiếu một phần.</p></div><span className="rounded-lg bg-brand-surface p-2 text-brand-deep"><SmallIcon name="activity" /></span></div>
          {discharged && <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800"><SmallIcon name="alert" /> Bệnh nhân đã xuất viện, không thể ghi sinh hiệu.</div>}
          <fieldset disabled={discharged} className="disabled:opacity-60">
            <label className="mb-1.5 block text-sm font-semibold text-text-secondary" htmlFor="measuredAt">Thời gian đo <span className="text-red-600">*</span></label>
            <TextInput id="measuredAt" type="datetime-local" value={measuredAt} onChange={event => setMeasuredAt(event.target.value)} onBlur={() => setTouched(current => ({ ...current, time: true }))} className={touched.time && errors.time ? "border-red-400 bg-red-50" : ""} />
            {touched.time && errors.time && <p className="mt-1 text-xs text-red-600">{errors.time}</p>}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-2">
              {METRICS.map(item => {
                const level = classify(item.key, preview[item.key])
                const showError = touched[item.key] && errors[item.key]
                return <label key={item.key} className="block text-sm font-semibold text-text-secondary">
                  <span className="mb-1.5 flex items-center justify-between"><span>{item.label}</span><span className={`h-2.5 w-2.5 rounded-full ${level === "red" ? "bg-red-500" : level === "yellow" ? "bg-amber-500" : level === "normal" ? "bg-emerald-500" : "bg-slate-300"}`} /></span>
                  <div className="relative"><TextInput type="number" step={item.key === "temp" ? "0.1" : "1"} value={form[item.key]} onChange={event => setForm(current => ({ ...current, [item.key]: event.target.value }))} onBlur={() => setTouched(current => ({ ...current, [item.key]: true }))} placeholder="—" className={`pr-20 font-mono ${showError ? "border-red-400 bg-red-50" : ""}`} /><span className="pointer-events-none absolute right-3 top-3 text-xs font-normal text-text-muted">{item.unit}</span></div>
                  <span className={`mt-1 block text-xs font-normal ${showError ? "text-red-600" : "text-text-muted"}`}>{showError || item.helper}</span>
                </label>
              })}
            </div>
            <label className="mt-4 block text-sm font-semibold text-text-secondary">Ghi chú <span className="font-normal text-text-muted">(không bắt buộc)</span><TextArea rows={2} value={note} onChange={event => setNote(event.target.value)} className="mt-1.5 resize-none" placeholder="Nhập ghi chú điều dưỡng nếu có" /></label>
            {missing && <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"><SmallIcon name="alert" className="h-4 w-4 shrink-0" /><span>Một số chỉ số chưa được nhập. Chỉ số thiếu sẽ được đánh dấu “Thiếu” và không bao giờ được coi là bình thường.</span></div>}
            <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={onClear}>Xóa trắng</Button><Button onClick={onSave} disabled={discharged}>Lưu sinh hiệu</Button></div>
          </fieldset>
        </Card> : <Card className="border-brand-primary bg-brand-surface p-5"><div className="flex gap-3 text-brand-deep"><SmallIcon name="alert" /><div><h2 className="font-display font-bold">Hồ sơ chỉ đọc</h2><p className="mt-1 text-sm">Chỉ điều dưỡng được nhập sinh hiệu. Bác sĩ có thể xem đầy đủ diễn tiến và ngưỡng cảnh báo.</p></div></div></Card>}
        {evaluation && <EvaluationCard evaluation={evaluation} />}
        <ThresholdReference open={thresholdOpen} setOpen={setThresholdOpen} />
      </div>
      <HistoryCard records={histories} metric={metric} setMetric={setMetric} />
    </div>
  </>
}

function formValuesFromStrings(form: Record<MetricKey, string>): VitalValues {
  return Object.fromEntries(METRICS.map(item => [item.key, form[item.key] === "" ? null : Number(form[item.key])])) as unknown as VitalValues
}

function EvaluationCard({ evaluation }: { evaluation: Evaluation }) {
  const resultLevel = evaluation.result === "red" ? "red" : evaluation.result === "yellow" ? "yellow" : "normal"
  const title = evaluation.result === "red" ? "R1 · Cảnh báo ĐỎ" : evaluation.result === "yellow" ? "R2 · Cảnh báo VÀNG" : "R3 · Ổn định"
  const explanation = evaluation.result === "red" ? "Có từ 1 chỉ số Đỏ trở lên." : evaluation.result === "yellow" ? "Không có chỉ số Đỏ và có từ 2 chỉ số Vàng trở lên." : "Không có chỉ số Đỏ và có ít hơn 2 chỉ số Vàng. Không tạo cảnh báo."
  return <Card className="animate-fade-in overflow-hidden">
    <div className="border-b border-border-subtle p-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Kết quả đánh giá phiếu vừa lưu</h2><p className="mt-1 text-xs text-text-muted">Hệ thống không dùng điểm tổng hợp (NEWS2, MEWS); mỗi chỉ số được đánh giá độc lập.</p></div><span className="text-xs text-text-muted">Thời gian đánh giá: 85 ms</span></div></div>
    <div className="p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Phân loại từng chỉ số</p>
      <div className="overflow-hidden rounded-lg border border-border-subtle"><table className="w-full text-left text-sm"><thead className="bg-subsurface text-xs text-text-muted"><tr><th className="px-3 py-2">Chỉ số</th><th className="px-3 py-2">Giá trị</th><th className="px-3 py-2">Phân loại</th></tr></thead><tbody className="divide-y divide-border-subtle">{METRICS.map(item => <tr key={item.key}><td className="px-3 py-2 font-medium">{item.label}</td><td className="px-3 py-2 font-mono">{formatValue(item.key, evaluation.values[item.key])}</td><td className="px-3 py-2"><Chip level={evaluation.levels[item.key]}>{levelLabel[evaluation.levels[item.key]]}</Chip></td></tr>)}</tbody></table></div>
      <div className="my-4 flex flex-wrap gap-2"><Chip level="red">Số chỉ số Đỏ: {evaluation.red}</Chip><Chip level="yellow">Số chỉ số Vàng: {evaluation.yellow}</Chip><Chip level="missing">Chỉ số thiếu: {evaluation.missing}</Chip></div>
      <div className={`rounded-lg border p-4 ${levelClasses[resultLevel]}`}><div className="flex items-center gap-2"><Chip level={resultLevel}>{title}</Chip><strong className="text-sm">{explanation}</strong></div><p className="mt-3 border-t border-current/20 pt-3 text-sm font-medium">{evaluation.outcome}</p></div>
    </div>
  </Card>
}

function HistoryCard({ records, metric, setMetric }: { records: VitalRecord[]; metric: MetricKey; setMetric: (metric: MetricKey) => void }) {
  const chronological = [...records].reverse()
  const values = chronological.map(item => item[metric]).filter((value): value is number => value !== null)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 100)
  const range = Math.max(max - min, 1)
  const points = chronological.map((item, index) => {
    const value = item[metric]
    if (value === null) return null
    const x = chronological.length === 1 ? 50 : 7 + (index / (chronological.length - 1)) * 86
    const y = 88 - ((value - min) / range) * 66
    return `${x},${y}`
  }).filter(Boolean).join(" ")
  return <Card className="overflow-hidden">
    <div className="flex items-center justify-between border-b border-border-subtle p-5"><div><h2 className="font-display text-lg font-bold">Lịch sử sinh hiệu</h2><p className="mt-1 text-xs text-text-muted">Bản ghi chỉ được thêm mới, không thể sửa hoặc xóa.</p></div><label className="text-xs font-semibold text-text-secondary">Chỉ số: <select value={metric} onChange={event => setMetric(event.target.value as MetricKey)} className="ml-2 rounded-lg border border-border-subtle bg-canvas px-3 py-2 text-sm">{METRICS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label></div>
    <div className="border-b border-border-subtle bg-canvas p-5">
      <div className="mb-2 flex justify-between text-xs text-text-muted"><span>24 giờ gần nhất</span><span className="flex items-center gap-3"><i className="h-2 w-2 rounded-full bg-red-400" /> Vùng đỏ <i className="h-2 w-2 rounded-full bg-amber-400" /> Vùng vàng</span></div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full overflow-visible">
        <rect x="0" y="0" width="100" height="22" className="fill-red-50" /><rect x="0" y="22" width="100" height="18" className="fill-amber-50" /><rect x="0" y="40" width="100" height="30" className="fill-emerald-50" /><rect x="0" y="70" width="100" height="18" className="fill-amber-50" /><rect x="0" y="88" width="100" height="12" className="fill-red-50" />
        {[22, 40, 70, 88].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} className="stroke-slate-200" strokeWidth="0.5" strokeDasharray="2 2" />)}
        <polyline points={points} fill="none" className="stroke-cyan-700" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {chronological.map((item, index) => {
          const value = item[metric]; if (value === null) return null
          const x = chronological.length === 1 ? 50 : 7 + (index / (chronological.length - 1)) * 86
          const y = 88 - ((value - min) / range) * 66
          return <circle key={item.id} cx={x} cy={y} r="2" className={classify(metric, value) === "red" ? "fill-red-600" : classify(metric, value) === "yellow" ? "fill-amber-500" : "fill-emerald-600"} />
        })}
      </svg>
    </div>
    <div className="max-h-[34rem] overflow-auto"><table className="w-full min-w-[62rem] text-left text-xs"><thead className="sticky top-0 bg-subsurface text-text-muted"><tr>{["Mã phiếu", "Thời gian đo", "Nhịp thở", "SpO2", "Mạch", "HA (tâm thu/tâm trương)", "Nhiệt độ", "Trạng thái", "Người ghi"].map(value => <th key={value} className="whitespace-nowrap px-3 py-3 font-semibold">{value}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{records.map(record => {
      const evaluated = assessment(record)
      const status = evaluated.result === "red" ? ["red", "Cảnh báo đỏ"] : evaluated.result === "yellow" ? ["yellow", "Cảnh báo vàng"] : evaluated.missing ? ["missing", "Thiếu sinh hiệu"] : ["normal", "Ổn định"]
      return <tr key={record.id} className="hover:bg-canvas"><td className="px-3 py-3 font-mono font-semibold text-brand-deep">{record.id}</td><td className="whitespace-nowrap px-3 py-3">{record.time}</td>{(["rr", "spo2", "pulse"] as MetricKey[]).map(key => <td key={key} className="px-3 py-3"><Chip level={evaluated.levels[key]}>{formatValue(key, record[key], true)}</Chip></td>)}<td className="px-3 py-3"><Chip level={evaluated.levels.sys === "red" || evaluated.levels.dia === "red" ? "red" : evaluated.levels.sys === "yellow" || evaluated.levels.dia === "yellow" ? "yellow" : record.sys === null || record.dia === null ? "missing" : "normal"}>{record.sys === null || record.dia === null ? "Thiếu" : `${record.sys}/${record.dia}`}</Chip></td><td className="px-3 py-3"><Chip level={evaluated.levels.temp}>{formatValue("temp", record.temp, true)}</Chip></td><td className="px-3 py-3"><Chip level={status[0] as Level}>{status[1]}</Chip></td><td className="whitespace-nowrap px-3 py-3 text-text-secondary">{record.recorder}</td></tr>
    })}</tbody></table></div>
  </Card>
}

function ThresholdReference({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  const rows = [
    ["Nhịp thở (lần/phút)", "≤ 8 hoặc ≥ 25", "9–11 hoặc 21–24", "12–20"],
    ["SpO2 (%)", "≤ 91", "92–93", "94–100"],
    ["Mạch (lần/phút)", "≤ 40 hoặc ≥ 131", "41–50 hoặc 101–130", "51–100"],
    ["Huyết áp tâm thu (mmHg)", "≤ 90 hoặc ≥ 220", "91–100 hoặc 141–219", "101–140"],
    ["Huyết áp tâm trương (mmHg)", "≤ 49 hoặc ≥ 120", "50–59 hoặc 90–119", "60–89"],
    ["Nhiệt độ (°C)", "≤ 35,0 hoặc ≥ 39,1", "35,1–36,0 hoặc 38,1–39,0", "36,1–38,0"],
  ]
  return <Card className="overflow-hidden"><Button variant="ghost" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between !rounded-none p-5 text-left"><span><strong className="font-display text-base">Ngưỡng cảnh báo</strong><span className="ml-2 text-xs font-normal text-text-muted">Tham chiếu chỉ đọc</span></span><span className={`transition-transform ${open ? "rotate-90" : ""}`}><SmallIcon name="chevron" /></span></Button>{open && <div className="border-t border-border-subtle p-5"><p className="mb-3 text-xs text-text-muted">Ngưỡng mặc định do hội đồng y khoa duyệt theo từng khoa.</p><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-subsurface"><tr><th className="px-3 py-2">Chỉ số</th><th className="px-3 py-2 text-red-700">Đỏ</th><th className="px-3 py-2 text-amber-700">Vàng</th><th className="px-3 py-2 text-emerald-700">Bình thường</th></tr></thead><tbody className="divide-y divide-border-subtle">{rows.map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={cell} className={`px-3 py-2 ${index === 0 ? "font-semibold" : "font-mono"}`}>{cell}</td>)}</tr>)}</tbody></table></div><p className="mt-3 rounded-lg bg-subsurface p-3 text-xs text-text-secondary">Chỉ số chưa ghi nhận = “Thiếu”, không bao giờ coi là bình thường và không sinh cảnh báo giả. Chống trùng 15 phút theo cùng bệnh nhân + cùng chỉ số + cùng mức độ; leo thang Vàng → Đỏ bỏ qua chống trùng.</p></div>}</Card>
}

function DemoPanel(props: {
  open: boolean; setOpen: (value: boolean) => void; simulatedMinutes: number; addMinutes: (value: number) => void; fillScenario: (value: string) => void
  connection: Connection; onRed: () => void; onYellow: () => void; onDisconnect: () => void; onReconnect: () => void; onRefresh: () => void
  discharged: boolean; setDischarged: (value: boolean) => void; onReset: () => void
}) {
  const { open, setOpen, simulatedMinutes, addMinutes, fillScenario, connection, onRed, onYellow, onDisconnect, onReconnect, onRefresh, discharged, setDischarged, onReset } = props
  const clock = new Date(Date.now() + simulatedMinutes * 60_000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const demoButton = "border border-border-subtle bg-surface !px-2.5 !py-1.5 text-left text-xs"
  return <div className="fixed bottom-4 left-4 z-50 w-[27rem] max-w-[calc(100vw-2rem)]">
    {open && <Card className="mb-2 max-h-[70vh] overflow-auto p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between"><div><p className="font-display text-sm font-bold">Điều khiển demo</p><p className="text-[10px] text-text-muted">Chỉ dùng cho prototype</p></div><Chip level="normal"><SmallIcon name="clock" className="mr-1 h-3.5 w-3.5" /> Đồng hồ mô phỏng: {clock}</Chip></div>
      <p className="mb-2 text-xs font-bold text-text-secondary">Điền nhanh kịch bản</p>
      <div className="grid grid-cols-2 gap-2">
        {[["stable", "Ổn định"], ["yellow", "Cảnh báo vàng"], ["red", "Cảnh báo đỏ"], ["missing", "Thiếu chỉ số"], ["invalid", "Ngoài miền sinh lý"], ["oscillate", "Dao động trong khoảng vàng"], ["escalate", "Vàng → Đỏ"], ["retrigger", "Về bình thường rồi vi phạm lại"]].map(item => <Button key={item[0]} variant="ghost" className={demoButton} onClick={() => fillScenario(item[0])}>{item[1]}</Button>)}
      </div>
      <div className="my-4 border-t border-border-subtle" />
      <div className="flex items-center justify-between"><p className="text-xs font-bold text-text-secondary">Tua thời gian mô phỏng</p><span className="text-xs text-amber-700">Chống trùng còn {Math.max(0, 15 - simulatedMinutes)} phút</span></div>
      <div className="mt-2 flex gap-2">{[5, 10, 16].map(value => <Button key={value} variant="ghost" className={demoButton} onClick={() => addMinutes(value)}>+{value} phút</Button>)}</div>
      <div className="my-4 border-t border-border-subtle" />
      <p className="mb-2 text-xs font-bold text-text-secondary">Mô phỏng SSE</p>
      <div className="grid grid-cols-2 gap-2"><Button variant="danger" className={demoButton} onClick={onRed}>Đẩy cảnh báo đỏ giường 302A</Button><Button variant="ghost" className={`${demoButton} border-amber-200 bg-amber-50 text-amber-700`} onClick={onYellow}>Đẩy cảnh báo vàng giường 305B</Button><Button variant="ghost" className={demoButton} onClick={onDisconnect}>Ngắt kết nối SSE</Button><Button variant="ghost" className={demoButton} disabled={connection !== "lost"} onClick={onReconnect}>Kết nối lại và đồng bộ</Button><Button variant="ghost" className={`${demoButton} col-span-2`} onClick={onRefresh}>Mô phỏng token hết hạn (15 phút)</Button></div>
      <div className="my-4 border-t border-border-subtle" />
      <p className="mb-2 text-xs font-bold text-text-secondary">Trạng thái bệnh nhân</p>
      <div className="flex gap-2"><Button variant="ghost" className={`${demoButton} ${!discharged ? "border-emerald-300 bg-emerald-50 text-emerald-700" : ""}`} onClick={() => setDischarged(false)}>Đang điều trị</Button><Button variant="ghost" className={`${demoButton} ${discharged ? "border-slate-400 bg-slate-100" : ""}`} onClick={() => setDischarged(true)}>Đã xuất viện</Button><Button variant="danger" className="ml-auto !px-2.5 !py-1.5 text-xs" onClick={onReset}>Đặt lại dữ liệu mock</Button></div>
    </Card>}
    <Button onClick={() => setOpen(!open)} className="flex items-center gap-2 shadow-lg"><SmallIcon name="activity" className="h-4 w-4" /> Điều khiển demo <span className={`transition-transform ${open ? "rotate-90" : "-rotate-90"}`}><SmallIcon name="chevron" className="h-4 w-4" /></span></Button>
  </div>
}
