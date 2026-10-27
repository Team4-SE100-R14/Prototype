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
import Icon from "../ui/Icon"
import { TextArea, TextInput } from "../ui/TextInput"
import TopNav from "../TopNav"

interface Props {
  user: AuthUser
  onLogout: () => void
}

type Triage = "emergency" | "outpatient"
type QueueFilter = "all" | Triage

interface PatientForm {
  id: string
  name: string
  birthDate: string
  gender: string
  cccd: string
  phone: string
  emergencyContact: string
  emergencyPhone: string
  insurance: string
  address: string
  complaint: string
  triage: Triage | ""
}

interface QueuePatient {
  id: string
  order: number
  name: string
  triage: Triage
  destination: string
  wait: string
}

const INITIAL_PATIENT: PatientForm = {
  id: "BN-26-0001",
  name: "Nguyễn Văn An",
  birthDate: "1985-08-15",
  gender: "Nam",
  cccd: "079456789123",
  phone: "0902345567",
  emergencyContact: "Nguyễn Thị Lan",
  emergencyPhone: "0912456789",
  insurance: "",
  address: "12 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh",
  complaint: "Sốt cao liên tục 3 ngày, đau mỏi cơ",
  triage: "",
}

const INITIAL_QUEUE: QueuePatient[] = [
  {
    id: "BN-26-0089",
    order: 1,
    name: "Lê Hoàng Long",
    triage: "emergency",
    destination: "Khoa Cấp cứu",
    wait: "3 phút trước",
  },
  {
    id: "BN-26-0087",
    order: 2,
    name: "Trần Thị Thanh",
    triage: "emergency",
    destination: "Khoa Cấp cứu",
    wait: "5 phút trước",
  },
  {
    id: "BN-26-0081",
    order: 3,
    name: "Phạm Quốc Minh",
    triage: "emergency",
    destination: "Khoa Cấp cứu",
    wait: "8 phút trước",
  },
  {
    id: "BN-26-0078",
    order: 4,
    name: "Vũ Thị Hồng",
    triage: "emergency",
    destination: "Khoa Cấp cứu",
    wait: "11 phút trước",
  },
  {
    id: "BN-26-0094",
    order: 5,
    name: "Nguyễn Minh Anh",
    triage: "outpatient",
    destination: "Khoa Khám ngoại trú - PK Tim mạch",
    wait: "6 phút trước",
  },
  {
    id: "BN-26-0093",
    order: 6,
    name: "Đỗ Văn Nam",
    triage: "outpatient",
    destination: "Khoa Khám ngoại trú - PK Hô hấp",
    wait: "9 phút trước",
  },
  {
    id: "BN-26-0091",
    order: 7,
    name: "Bùi Thu Hà",
    triage: "outpatient",
    destination: "Khoa Khám ngoại trú - PK Nội tổng quát",
    wait: "14 phút trước",
  },
]

const INPUT =
  "w-full rounded-lg border border-border-subtle bg-canvas px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
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
}: {
  id: string
  label: string
  value: string
  masked: string
  onChange: (value: string) => void
  onReveal: () => void
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
            if (revealed) onChange(event.target.value.replace(/\D/g, ""))
          }}
          readOnly={!revealed}
          inputMode="numeric"
          className="pr-32 font-mono"
        />
        <button
          type="button"
          onClick={reveal}
          aria-label={
            revealed
              ? `Ẩn ${label.toLowerCase()}`
              : `Hiện đầy đủ ${label.toLowerCase()}`
          }
          aria-pressed={revealed}
          className="absolute inset-y-0 right-0 flex items-center gap-1.5 rounded-r-lg px-3 text-xs font-semibold text-brand-deep hover:bg-brand-surface"
        >
          <Icon className="h-4 w-4">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {revealed && <path d="M3 3l18 18" />}
          </Icon>
          {revealed ? `Tự động che lại sau: ${seconds}s` : "Hiện đầy đủ"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-text-muted">
        Mở che trong 30 giây và được ghi nhật ký kiểm toán.
      </p>
    </Field>
  )
}

export default function ReceptionistDashboard({ user, onLogout }: Props) {
  const [patient, setPatient] = useState(INITIAL_PATIENT)
  const [queue, setQueue] = useState(INITIAL_QUEUE)
  const [filter, setFilter] = useState<QueueFilter>("all")
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState("")
  const [idSequence, setIdSequence] = useState(1)
  const [selected, setSelected] = useState<QueuePatient | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicate, setDuplicate] = useState(false)
  const [searchMatch, setSearchMatch] = useState(false)
  const [success, setSuccess] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const counts = {
    all: 28 + queue.length - INITIAL_QUEUE.length,
    emergency:
      4 + queue.filter((item) => item.triage === "emergency").length - 4,
    outpatient:
      24 + queue.filter((item) => item.triage === "outpatient").length - 3,
  }
  const filteredQueue = useMemo(
    () => queue.filter((item) => filter === "all" || item.triage === filter),
    [filter, queue],
  )
  const totalPages = Math.max(1, Math.ceil(filteredQueue.length / pageSize))
  const visibleQueue = useMemo(
    () => filteredQueue.slice((page - 1) * pageSize, page * pageSize),
    [filteredQueue, page, pageSize],
  )

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const update = <K extends keyof PatientForm>(key: K, value: PatientForm[K]) =>
    setPatient((current) => ({ ...current, [key]: value }))
  const registerNew = () => {
    const next = idSequence + 1
    setIdSequence(next)
    setPatient({
      ...INITIAL_PATIENT,
      id: `BN-26-${String(next).padStart(4, "0")}`,
      name: "",
      birthDate: "",
      cccd: "",
      phone: "",
      emergencyContact: "",
      emergencyPhone: "",
      complaint: "",
      insurance: "",
      address: "",
      triage: "",
    })
    setErrors({})
    setDuplicate(false)
    setSearchMatch(false)
    setNotice(
      `Đã tạo mã bệnh nhân BN-26-${String(next).padStart(4, "0")}. Vui lòng nhập thông tin tiếp nhận.`,
    )
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!patient.name.trim()) nextErrors.name = "Vui lòng nhập họ và tên (2-100 ký tự chữ cái)."
    if (!patient.birthDate.trim()) {
      nextErrors.birthDate = "Vui lòng nhập ngày sinh."
    } else if (
      !/^\d{4}-\d{2}-\d{2}$/.test(patient.birthDate) ||
      Number.isNaN(new Date(`${patient.birthDate}T00:00:00`).getTime())
    ) {
      nextErrors.birthDate = "Ngày sinh phải đúng định dạng ngày/tháng/năm."
    }
    if (!patient.gender) nextErrors.gender = "Vui lòng chọn giới tính."
    if (!patient.emergencyContact.trim()) nextErrors.emergencyContact = "Vui lòng nhập người liên hệ khẩn cấp."
    if (!patient.emergencyPhone.trim()) nextErrors.emergencyPhone = "Vui lòng nhập SĐT liên hệ khẩn cấp."
    if (!patient.address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ."
    if (patient.complaint.trim().length < 3) nextErrors.complaint = "Vui lòng nhập lý do khám tối thiểu 3 ký tự."
    if (!patient.triage) nextErrors.triage = "Chọn phân loại tuyến khám để tiếp tục."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    if (patient.cccd === "079456789123" && patient.id !== "BN-26-0001") {
      setDuplicate(true)
      return
    }
    const emergency = patient.triage === "emergency"
    const destination = emergency ? "Khoa Cấp cứu" : "Khoa Khám ngoại trú"
    const next: QueuePatient = {
      id: patient.id,
      order: emergency ? 1 : counts.all + 1,
      name: patient.name,
      triage: patient.triage,
      destination,
      wait: "Vừa tiếp nhận",
    }
    setQueue((current) => {
      const adjusted = emergency
        ? current.map((item) => ({ ...item, order: item.order + 1 }))
        : current
      return emergency ? [next, ...adjusted] : [...adjusted, next]
    })
    setNotice(
      emergency
        ? `Đã đưa ${patient.name} vào Khoa Cấp cứu với ưu tiên 1 và gửi thông báo tức thì đến kíp trực.`
        : `Đã đưa ${patient.name} vào hàng đợi ${destination}.`,
    )
    setSuccess(
      emergency
        ? "Đã đưa vào hàng đợi: Khoa Cấp cứu – Ưu tiên 1 (UT 1)."
        : "Đã đưa vào hàng đợi: Khoa Khám ngoại trú – Ưu tiên 2 (STT 25).",
    )
  }
  const cancel = () => {
    setPatient({ ...INITIAL_PATIENT, id: patient.id })
    setNotice("Đã khôi phục biểu mẫu về dữ liệu ban đầu.")
  }
  const searchPatient = () => {
    setSearchMatch(!!search.trim())
    setNotice(search.trim() ? "" : "Vui lòng nhập CCCD, số điện thoại hoặc họ tên và ngày sinh.")
  }
  const recordUnmask = (field: string) => {
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
              object: `${field} · ${patient.id} · 30 giây`,
              result: "Thành công",
            },
            ...(Array.isArray(entries) ? entries : []),
          ].slice(0, 200),
        ),
      )
    } catch {
      /* Không chặn quy trình tiếp nhận khi bộ nhớ nhật ký minh họa không khả dụng. */
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav user={user} onLogout={onLogout} title="Bàn Tiếp đón Trung tâm" />
      <header className="border-b border-border-subtle bg-surface px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-screen-2xl">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="mb-2 inline-flex rounded-full border border-brand-primary/20 bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-deep">
                Khoa Khám Ngoại Trú / Khoa Cấp Cứu
              </span>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
                Bàn Tiếp Nhận &amp; Phân Loại Tuyến Khám - HPMS
              </h1>
            </div>
            <Button onClick={registerNew} className="shrink-0">
              + Đăng ký hồ sơ mới
            </Button>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
            <Field label="Tra cứu bệnh nhân (Số CCCD 12 số, SĐT hoặc Họ tên + Ngày sinh)">
              <div className="relative">
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M16.5 16.5L21 21" />
                </Icon>
                <TextInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchPatient()
                  }}
                  placeholder="Nhập thông tin tìm kiếm bệnh nhân..."
                  className="pl-9 lg:min-w-xl"
                />
              </div>
            </Field>
            <Button onClick={searchPatient} className="lg:mb-0">
              Tra cứu
            </Button>
          </div>
          {notice && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2 rounded-lg border border-info/20 bg-info-bg p-3 text-sm text-info"
            >
              <Icon className="h-5 w-5 shrink-0">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5m0-8h.01" />
              </Icon>
              <p>{notice}</p>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-screen-2xl flex-1 gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
        <form onSubmit={submit} className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
            {duplicate && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-critical-border bg-critical-bg p-4 text-sm text-critical">
                <p className="font-medium">Số CCCD đã tồn tại trong hệ thống. Hồ sơ trùng khớp: BN-26-0001 - Nguyễn Văn An.</p>
                <Button variant="danger" onClick={() => { setPatient(INITIAL_PATIENT); setDuplicate(false) }}>Mở hồ sơ hiện có</Button>
              </div>
            )}
            <section className="border-b border-border-subtle p-5">
              <div className="mb-5 flex items-center gap-2">
                <Icon className="h-5 w-5 text-brand-deep">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-2a8 8 0 0116 0v2" />
                </Icon>
                <h2 className="font-display text-base font-semibold text-text-primary">
                  Thông tin hành chính bệnh nhân
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mã bệnh nhân">
                  <div className="relative">
                    <TextInput
                      value={patient.id}
                      readOnly
                      className="pr-28 font-mono font-semibold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-normal-bg px-2 py-1 text-xs font-semibold text-normal">
                      Tự động sinh
                    </span>
                  </div>
                </Field>
                <Field label="Họ và tên bệnh nhân" required error={errors.name}>
                  <TextInput
                    value={patient.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="Nguyễn Văn An"
                    aria-invalid={!!errors.name}
                    className={errors.name ? "border-critical" : ""}
                  />
                </Field>
                <Field label="Ngày sinh" required error={errors.birthDate}>
                  <input
                    id="patient-birth-date"
                    type="date"
                    value={patient.birthDate}
                    onChange={(event) =>
                      update("birthDate", event.target.value)
                    }
                    max={new Date().toISOString().slice(0, 10)}
                    aria-invalid={!!errors.birthDate}
                    className={`${INPUT} ${errors.birthDate ? "border-critical" : ""}`}
                  />
                  <p className="mt-1.5 text-xs text-text-muted">
                    Chọn biểu tượng lịch hoặc nhập đúng định dạng ngày/tháng/năm.
                  </p>
                </Field>
                <Field label="Giới tính" required error={errors.gender}>
                  <select
                    value={patient.gender}
                    onChange={(event) => update("gender", event.target.value)}
                    className={`${INPUT} ${errors.gender ? "border-critical" : ""}`}
                    aria-invalid={!!errors.gender}
                  >
                    <option>Nam</option>
                    <option>Nữ</option>
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <MaskedField
                    id="patient-cccd"
                    label="Số CCCD / Định danh"
                    value={patient.cccd}
                    masked={
                      patient.cccd
                        ? `${patient.cccd.slice(0, 3)}xxxxxx${patient.cccd.slice(-3)}`
                        : "079xxxxxx123"
                    }
                    onChange={(value) => update("cccd", value.slice(0, 12))}
                    onReveal={() => recordUnmask("Số CCCD / Định danh")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <MaskedField
                    id="patient-phone"
                    label="Số điện thoại"
                    value={patient.phone}
                    masked={
                      patient.phone
                        ? `${patient.phone.slice(0, 3)}xxxx${patient.phone.slice(-3)}`
                        : "090xxxx567"
                    }
                    onChange={(value) => update("phone", value.slice(0, 10))}
                    onReveal={() => recordUnmask("Số điện thoại")}
                  />
                </div>
                <Field label="Người liên hệ khẩn cấp" required error={errors.emergencyContact}>
                  <TextInput
                    value={patient.emergencyContact}
                    onChange={(event) =>
                      update("emergencyContact", event.target.value)
                    }
                    placeholder="Họ và tên người liên hệ"
                    aria-invalid={!!errors.emergencyContact}
                    className={errors.emergencyContact ? "border-critical" : ""}
                  />
                </Field>
                <div>
                  <MaskedField
                    id="emergency-phone"
                    label="SĐT liên hệ khẩn cấp *"
                    value={patient.emergencyPhone}
                    masked={patient.emergencyPhone ? `${patient.emergencyPhone.slice(0, 3)}xxxx${patient.emergencyPhone.slice(-3)}` : "090xxxx567"}
                    onChange={(value) => update("emergencyPhone", value.slice(0, 10))}
                    onReveal={() => recordUnmask("SĐT liên hệ khẩn cấp")}
                  />
                  {errors.emergencyPhone && <p className="mt-1.5 text-xs font-medium text-critical">{errors.emergencyPhone}</p>}
                </div>
                <div className="sm:col-span-2">
                  <Field label="Số thẻ BHYT (Tùy chọn)">
                    <TextInput
                      value={patient.insurance}
                      onChange={(event) =>
                        update("insurance", event.target.value.toUpperCase())
                      }
                      placeholder="Nhập số thẻ bảo hiểm y tế"
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Địa chỉ" required error={errors.address}>
                    <TextArea
                      value={patient.address}
                      onChange={(event) => update("address", event.target.value.slice(0, 255))}
                      rows={2}
                      maxLength={255}
                      aria-invalid={!!errors.address}
                      className={errors.address ? "border-critical" : ""}
                    />
                    <p className="mt-1 text-right text-xs text-text-muted">{patient.address.length}/255</p>
                  </Field>
                </div>
              </div>
            </section>

            <section className="p-5">
              <div className="mb-5 flex items-center gap-2">
                <Icon className="h-5 w-5 text-brand-deep">
                  <path d="M4 20v-7a3 3 0 013-3h10a3 3 0 013 3v7M9 10V4h6v6M8 16h8" />
                </Icon>
                <h2 className="font-display text-base font-semibold text-text-primary">
                  Phân loại lâm sàng &amp; Định tuyến khoa phòng (tự động)
                </h2>
              </div>
              <div className="space-y-4">
                <Field label="Lý do khám / Triệu chứng ban đầu" required error={errors.complaint}>
                  <TextArea
                    value={patient.complaint}
                    onChange={(event) =>
                      update("complaint", event.target.value.slice(0, 255))
                    }
                    rows={4}
                    maxLength={255}
                    placeholder="Sốt cao liên tục 3 ngày, đau mỏi cơ"
                    aria-invalid={!!errors.complaint}
                    className={errors.complaint ? "border-critical" : ""}
                  />
                </Field>
                <fieldset>
                  <legend className="mb-2 text-xs font-semibold text-text-secondary">
                    Phân loại tuyến khám{" "}
                    <span className="text-critical">*</span>
                  </legend>
                  <div className="grid gap-3">
                    <label
                      className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                        patient.triage === "emergency"
                          ? "border-critical bg-critical-bg ring-1 ring-critical"
                          : "border-critical-border bg-surface hover:bg-critical-bg"
                      }`}
                    >
                      <input
                        type="radio"
                        name="triage"
                        value="emergency"
                        checked={patient.triage === "emergency"}
                        onChange={() => update("triage", "emergency")}
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
                            Ưu tiên mức 1. Tự động định tuyến thẳng vào Khoa Cấp
                            cứu, kích hoạt thông báo SSE tức thì đến kíp trực
                            cấp cứu.
                          </span>
                        </span>
                      </span>
                    </label>
                    <label
                      className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                        patient.triage === "outpatient"
                          ? "border-info bg-info-bg ring-1 ring-info"
                          : "border-border-subtle bg-surface hover:bg-info-bg"
                      }`}
                    >
                      <input
                        type="radio"
                        name="triage"
                        value="outpatient"
                        checked={patient.triage === "outpatient"}
                        onChange={() => update("triage", "outpatient")}
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
                            Ưu tiên mức 2. Tự động định tuyến vào Khoa Khám
                            ngoại trú.
                          </span>
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
                {!patient.triage && (
                  <p className="text-xs font-medium text-text-muted">Chọn phân loại tuyến khám để tiếp tục.</p>
                )}
                <Field label="Khoa/Phòng chỉ định (hệ thống tự động gán)">
                  <div className="rounded-xl border border-border-subtle bg-canvas p-4" aria-live="polite">
                    {!patient.triage ? (
                      <p className="text-sm font-medium text-text-muted">— Chưa chọn phân loại —</p>
                    ) : patient.triage === "emergency" ? (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-critical-bg px-3 py-1.5 text-xs font-semibold text-critical">Khoa Cấp cứu</span>
                          <span className="rounded-full bg-critical px-3 py-1.5 text-xs font-semibold text-surface">Ưu tiên 1 (MucUuTien=1)</span>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                          Tự động định tuyến thẳng, thông báo SSE &lt;= 1.0s tới kíp cấp cứu.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-info-bg px-3 py-1.5 text-xs font-semibold text-info">Khoa Khám ngoại trú</span>
                          <span className="rounded-full bg-info px-3 py-1.5 text-xs font-semibold text-surface">Ưu tiên 2 (MucUuTien=2)</span>
                        </div>
                        <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                          Xếp hàng FIFO theo số thứ tự (SoThuTu).
                        </p>
                      </div>
                    )}
                  </div>
                </Field>
              </div>
            </section>
            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border-subtle bg-canvas/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={cancel}
                className="border border-border-subtle"
              >
                Hủy bỏ
              </Button>
              <div>
                <Button type="submit" disabled={!patient.triage}>Lưu &amp; Đưa vào hàng đợi</Button>
                {!patient.triage && <p className="mt-1.5 text-xs text-text-muted">Chọn phân loại tuyến khám để tiếp tục.</p>}
              </div>
            </div>
          </div>
        </form>
        {searchMatch && (
          <aside className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-xl rounded-xl border border-border-subtle bg-surface p-5 shadow-2xl" aria-label="Kết quả tra cứu bệnh nhân">
            <p className="text-xs font-semibold text-brand-deep">HỒ SƠ TRÙNG KHỚP</p>
            <p className="mt-1 font-display text-lg font-semibold text-text-primary">Nguyễn Văn An · BN-26-0001</p>
            <p className="mt-2 text-sm text-text-secondary">15/08/1985 · Nam · CCCD 079xxxxxx123 · SĐT 090xxxx567</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { registerNew(); setSearchMatch(false) }}>Tạo hồ sơ mới</Button>
              <Button onClick={() => { setPatient(INITIAL_PATIENT); setSearchMatch(false) }}>Chọn hồ sơ này</Button>
            </div>
          </aside>
        )}
        {success && (
          <div role="status" className="fixed bottom-5 right-5 z-40 rounded-xl border border-normal/20 bg-normal-bg p-4 text-sm font-semibold text-normal shadow-lg">
            {success}
          </div>
        )}

        <section
          className="min-w-0 self-start overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm"
          aria-labelledby="queue-title"
        >
          <div className="border-b border-border-subtle p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="queue-title"
                  className="font-display text-base font-semibold text-text-primary"
                >
                  Bảng Hàng đợi điều phối trực tiếp
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Cấp cứu luôn được ghim ở đầu hàng đợi với ưu tiên mức 1.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-normal/20 bg-normal-bg px-3 py-1.5 text-xs font-semibold text-normal">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-normal opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-normal" />
                </span>
                Luồng sự kiện thời gian thực (SSE)
              </span>
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              role="tablist"
              aria-label="Lọc hàng đợi"
            >
              {[
                {
                  id: "all" as const,
                  label: `Tất cả hàng đợi (${counts.all})`,
                },
                {
                  id: "emergency" as const,
                  label: `Khoa Cấp cứu (Ưu tiên 1) (${counts.emergency})`,
                },
                {
                  id: "outpatient" as const,
                  label: `Khoa Khám ngoại trú (Ưu tiên 2) (${counts.outpatient})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.id}
                  onClick={() => setFilter(tab.id)}
                  onMouseDown={() => setPage(1)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    filter === tab.id
                      ? "border-brand-primary bg-brand-surface text-brand-deep"
                      : "border-border-subtle text-text-muted hover:bg-subsurface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-4xl text-left text-sm">
              <thead className="border-b border-border-subtle bg-canvas">
                <tr>
                  {[
                    "STT / Mã BN",
                    "Họ và tên",
                    "Phân loại",
                    "Khoa / Phòng chỉ định",
                    "Thời gian chờ",
                    "Thao tác",
                  ].map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-text-muted"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleQueue.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-border-subtle last:border-0 ${
                      item.triage === "emergency"
                        ? "bg-critical-bg/40"
                        : "hover:bg-canvas"
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="font-mono font-semibold text-text-primary">
                        {String(item.order).padStart(2, "0")} - {item.id}
                      </span>
                      {item.triage === "emergency" && (
                        <span className="ml-2 rounded bg-critical px-1.5 py-0.5 text-xs font-bold text-surface">
                          ƯT 1
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-text-primary">
                      {item.name}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          item.triage === "emergency"
                            ? "bg-critical text-surface"
                            : "bg-info-bg text-info"
                        }`}
                      >
                        {item.triage === "emergency" ? "CẤP CỨU" : "NGOẠI TRÚ"}
                      </span>
                    </td>
                    <td className="min-w-48 px-4 py-4 text-xs leading-relaxed text-text-secondary">
                      {item.destination}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-text-muted">
                      {item.wait}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            setNotice(
                              `Đã chuyển yêu cầu điều phối ${item.id} đến ${item.destination}.`,
                            )
                          }
                          className="px-3 py-2 text-xs"
                        >
                          Điều phối
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setSelected(item)}
                          className="border border-border-subtle px-3 py-2 text-xs"
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle bg-canvas px-5 py-4 text-xs text-text-muted">
            <p>
              Hiển thị {visibleQueue.length} /{" "}
              {filteredQueue.length} bệnh nhân đang
              chờ tiếp nhận
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                Số bản ghi/trang
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value))
                    setPage(1)
                  }}
                  className="rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-text-primary"
                >
                  {[5, 10, 20].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <Button
                variant="ghost"
                className="border border-border-subtle px-3 py-1.5 text-xs"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Trước
              </Button>
              <label className="flex items-center gap-2">
                Trang
                <TextInput
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    if (Number.isFinite(next)) setPage(Math.min(totalPages, Math.max(1, next)))
                  }}
                  className="w-16 px-2 py-1.5 text-center"
                  aria-label="Nhập số trang"
                />
                / {totalPages}
              </label>
              <Button
                variant="ghost"
                className="border border-border-subtle px-3 py-1.5 text-xs"
                disabled={page === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Sau
              </Button>
            </div>
          </footer>
        </section>
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 p-4 backdrop-blur-[1px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="queue-detail-title"
            className="w-full max-w-md rounded-xl border border-border-subtle bg-surface shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-border-subtle p-5">
              <div>
                <h2
                  id="queue-detail-title"
                  className="font-display text-lg font-semibold text-text-primary"
                >
                  Chi tiết lượt chờ
                </h2>
                <p className="mt-1 font-mono text-xs text-text-muted">
                  {selected.id}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng chi tiết"
                onClick={() => setSelected(null)}
                className="rounded-md p-1.5 text-text-muted hover:bg-subsurface"
              >
                <Icon className="h-4 w-4">
                  <path d="M6 6l12 12M18 6L6 18" />
                </Icon>
              </button>
            </div>
            <div className="space-y-3 p-5 text-sm text-text-secondary">
              <p>
                <strong>Họ và tên:</strong> {selected.name}
              </p>
              <p>
                <strong>Phân loại:</strong>{" "}
                {selected.triage === "emergency"
                  ? "Cấp cứu - Ưu tiên mức 1"
                  : "Ngoại trú - Ưu tiên mức 2"}
              </p>
              <p>
                <strong>Định tuyến:</strong> {selected.destination}
              </p>
              <p>
                <strong>Thời gian chờ:</strong> {selected.wait}
              </p>
            </div>
            <div className="border-t border-border-subtle bg-canvas p-4 text-right">
              <Button onClick={() => setSelected(null)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
