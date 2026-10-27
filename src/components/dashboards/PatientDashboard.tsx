import { useState, type ReactNode } from "react"
import type { AuthUser } from "../../App"
import SessionSecurityMenu from "../SessionSecurityMenu"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Modal from "../ui/Modal"

interface Props {
  user: AuthUser
  onLogout: () => void
}

type PortalTab = "outpatient" | "inpatient" | "medications" | "results"
const PATIENT_PII_KEY = "hpms-patient-pii-unmasked"

interface PortalTabDefinition {
  id: PortalTab
  label: string
  shortLabel: string
}

const TABS: PortalTabDefinition[] = [
  {
    id: "outpatient",
    label: "Lịch sử khám ngoại trú (3 lượt)",
    shortLabel: "Khám ngoại trú",
  },
  {
    id: "inpatient",
    label: "Hồ sơ điều trị nội trú (1 lượt)",
    shortLabel: "Điều trị nội trú",
  },
  {
    id: "medications",
    label: "Đơn thuốc đang dùng (1 đơn)",
    shortLabel: "Đơn thuốc",
  },
  {
    id: "results",
    label: "Kết quả Cận lâm sàng & Hình ảnh (4 kết quả)",
    shortLabel: "Kết quả y khoa",
  },
]

const ATTACHMENTS = [
  {
    id: "xray",
    title: "X-Quang Ngực Thẳng",
    type: "Tệp PDF / Ảnh",
    date: "28/09/2026",
    source: "Khoa Chẩn đoán hình ảnh",
  },
  {
    id: "ecg",
    title: "Điện tâm đồ ECG thường quy",
    type: "Đã có kết quả",
    date: "28/09/2026",
    source: "Khoa Khám ngoại trú",
  },
] as const

function BrandMark() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-surface shadow-sm">
      <Icon className="h-6 w-6">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </Icon>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-border-subtle px-5 py-5 first:border-t-0 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-deep">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-semibold text-text-primary">
            {title}
          </h3>
          <div className="mt-2 text-sm leading-relaxed text-text-secondary">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

function EmptyTab({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm sm:p-8">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface text-brand-deep">
        {icon}
      </div>
      <h2 className="font-display text-xl font-semibold text-text-primary">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
        {description}
      </p>
      {children}
    </section>
  )
}

function ResultPreview({
  attachment,
  onClose,
}: {
  attachment: typeof ATTACHMENTS[number]
  onClose: () => void
}) {
  return (
    <Modal
      titleId="result-preview-title"
      descriptionId="result-preview-description"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6">
        <div>
          <p className="mb-1 text-xs font-semibold text-brand-deep">
            KẾT QUẢ ĐÃ HOÀN TẤT
          </p>
          <h2
            id="result-preview-title"
            className="font-display text-lg font-semibold text-text-primary"
          >
            {attachment.title}
          </h2>
          <p
            id="result-preview-description"
            className="mt-1 text-xs text-text-muted"
          >
            {attachment.date} · {attachment.source}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bản xem kết quả"
          className="rounded-lg p-2 text-text-muted hover:bg-subsurface hover:text-text-primary"
        >
          <Icon className="h-5 w-5">
            <path d="M6 6l12 12M18 6L6 18" />
          </Icon>
        </button>
      </div>
      <div className="p-5 sm:p-6">
        {attachment.id === "xray" ? (
          <div className="rounded-xl bg-text-primary p-5 text-surface">
            <div className="mx-auto flex aspect-[4/3] max-w-md items-center justify-center rounded-lg border border-surface/20 bg-slate-800">
              <svg
                aria-label="Hình minh họa phim X-Quang ngực"
                role="img"
                viewBox="0 0 240 180"
                className="h-full w-full text-slate-300"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  d="M120 20v140M95 28c-34 13-48 42-48 77 0 30 13 49 42 51 23 2 31-25 31-56V45c-8-11-15-16-25-17zm50 0c34 13 48 42 48 77 0 30-13 49-42 51-23 2-31-25-31-56V45c8-11 15-16 25-17zM77 48c21 8 32 18 43 34m43-34c-21 8-32 18-43 34M67 73c22 5 38 15 53 27m53-27c-22 5-38 15-53 27M62 99c23 4 40 10 58 24m58-24c-23 4-40 10-58 24"
                />
              </svg>
            </div>
            <p className="mt-4 text-center text-xs text-slate-300">
              Bản xem trước hình ảnh chẩn đoán đã được giảm độ phân giải.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-canvas p-4">
            <svg
              aria-label="Hình minh họa điện tâm đồ"
              role="img"
              viewBox="0 0 720 180"
              className="h-44 min-w-2xl text-critical"
            >
              <defs>
                <pattern
                  id="ecg-grid-small"
                  width="12"
                  height="12"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M12 0H0V12"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity=".08"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#ecg-grid-small)" />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                d="M0 95h70l12-20 14 52 15-105 17 128 15-55h76l12-20 14 52 15-105 17 128 15-55h76l12-20 14 52 15-105 17 128 15-55h76l12-20 14 52 15-105 17 128 15-55h76"
              />
            </svg>
          </div>
        )}
        <div className="mt-5 rounded-xl border border-border-subtle bg-canvas p-4">
          <p className="text-xs font-semibold text-text-muted">
            KẾT LUẬN CHUYÊN MÔN
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {attachment.id === "xray"
              ? "Bóng tim không to. Hai phế trường sáng, không thấy tổn thương nhu mô phổi khu trú. Không tràn dịch màng phổi."
              : "Nhịp xoang đều, tần số 72 lần/phút. Trục tim bình thường. Chưa ghi nhận biến đổi thiếu máu cơ tim cấp."}
          </p>
        </div>
      </div>
      <div className="flex justify-end border-t border-border-subtle bg-canvas px-5 py-4 sm:px-6">
        <Button onClick={onClose}>Đã hiểu</Button>
      </div>
    </Modal>
  )
}

export default function PatientDashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<PortalTab>("outpatient")
  const [preview, setPreview] = useState<typeof ATTACHMENTS[number] | null>(
    null,
  )
  const [notice, setNotice] = useState("")
  const [piiVisible, setPiiVisible] = useState(() => {
    try {
      return sessionStorage.getItem(PATIENT_PII_KEY) === "true"
    } catch {
      return false
    }
  })

  const togglePii = () => {
    setPiiVisible((visible) => {
      const next = !visible
      try {
        if (next) sessionStorage.setItem(PATIENT_PII_KEY, "true")
        else sessionStorage.removeItem(PATIENT_PII_KEY)
      } catch {
        // The in-memory self-view remains available when storage is unavailable.
      }
      return next
    })
  }

  const download = (attachment: typeof ATTACHMENTS[number]) => {
    const text = [
      "HPMS - KẾT QUẢ Y KHOA",
      `Tên kết quả: ${attachment.title}`,
      `Ngày thực hiện: ${attachment.date}`,
      `Đơn vị thực hiện: ${attachment.source}`,
      "",
      attachment.id === "xray"
        ? "Kết luận: Bóng tim không to. Hai phế trường sáng, không thấy tổn thương nhu mô phổi khu trú."
        : "Kết luận: Nhịp xoang đều, tần số 72 lần/phút. Chưa ghi nhận biến đổi thiếu máu cơ tim cấp.",
      "",
      "Tài liệu minh họa trên cổng thông tin bệnh nhân HPMS.",
    ].join("\n")
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = `HPMS-${attachment.id}-${attachment.date.replace(/\//g, "-")}.txt`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice(`Đã tạo tệp tải về cho “${attachment.title}”.`)
  }

  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <BrandMark />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-text-primary sm:text-base">
              HPMS - Cổng Thông Tin Bệnh Nhân
            </p>
            <p className="hidden text-xs text-text-muted sm:block">
              Hồ sơ sức khỏe cá nhân an toàn và liên tục
            </p>
          </div>
          <SessionSecurityMenu />
          <div className="hidden items-center gap-3 border-l border-border-subtle pl-3 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-surface font-display text-sm font-bold text-brand-deep">
              A
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">
                Bệnh nhân: Nguyễn Văn An
              </p>
              <span className="mt-0.5 inline-flex rounded-full bg-normal-bg px-2 py-0.5 text-xs font-medium text-normal">
                Chỉ xem (Read-only)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="rounded-lg p-2.5 text-text-muted hover:bg-subsurface hover:text-text-primary"
          >
            <Icon className="h-5 w-5">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </Icon>
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-border-subtle px-4 py-2 sm:hidden">
          <span className="text-xs font-semibold text-text-primary">
            Bệnh nhân: Nguyễn Văn An
          </span>
          <span className="rounded-full bg-normal-bg px-2 py-1 text-xs font-medium text-normal">
            Chỉ xem (Read-only)
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section
          aria-labelledby="patient-summary-title"
          className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm"
        >
          <div className="bg-brand-surface/60 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold text-brand-deep">
                  HỒ SƠ SỨC KHỎE CÁ NHÂN
                </p>
                <h1
                  id="patient-summary-title"
                  className="mt-1 font-display text-2xl font-semibold text-text-primary sm:text-3xl"
                >
                  Nguyễn Văn An
                </h1>
                <p className="mt-1 font-mono text-sm text-text-muted">BN-26-0001</p>
              </div>
              <div className="flex flex-col items-start gap-3 lg:items-end">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-border-subtle bg-surface px-3 py-2 text-text-secondary">
                    Mã định danh EMR:{" "}
                    <strong className="font-mono text-text-primary">
                      BN-26-0001
                    </strong>
                  </span>
                  <span className="rounded-full border border-border-subtle bg-surface px-3 py-2 text-text-secondary">
                    Mã HSSK:{" "}
                    <strong className="font-mono text-text-primary">
                      HSSK-26-0001
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={togglePii}
                  aria-pressed={piiVisible}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-deep hover:bg-surface"
                >
                  <Icon className="h-4 w-4">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                    {piiVisible && <path d="M3 3l18 18" />}
                  </Icon>
                  {piiVisible
                    ? "Che thông tin nhạy cảm"
                    : "Bỏ che thông tin (Hiển thị đầy đủ)"}
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-px bg-border-subtle sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Ngày sinh", "15/08/1985"],
              ["Giới tính", "Nam"],
              ["Số CCCD", piiVisible ? "079123456789" : "079xxxxxx123"],
              ["SĐT", piiVisible ? "0901234567" : "090xxxx567"],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface px-5 py-4 sm:px-7">
                <p className="text-xs text-text-muted">{label}</p>
                <p
                  className={`mt-1 text-sm font-semibold text-text-primary ${
                    label === "Số CCCD" || label === "SĐT" ? "font-mono" : ""
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 border-t border-border-subtle p-5 sm:p-6 lg:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-critical-border bg-critical-bg p-4 text-critical">
              <Icon className="mt-0.5 h-5 w-5 shrink-0">
                <path d="M12 3L2 21h20L12 3zm0 6v5m0 3h.01" />
              </Icon>
              <div>
                <p className="text-xs font-bold">TIỀN SỬ DỊ ỨNG</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed">
                  Penicillin (Sốc phản vệ), Aspirin (Phát ban nhẹ)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-bg p-4 text-warning">
              <Icon className="mt-0.5 h-5 w-5 shrink-0">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5m0 4h.01" />
              </Icon>
              <div>
                <p className="text-xs font-bold">BỆNH LÝ MẠN TÍNH</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed">
                  Tăng huyết áp nguyên phát (I10)
                </p>
              </div>
            </div>
          </div>
        </section>

        <nav
          className="mt-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface p-1.5 shadow-sm"
          aria-label="Nội dung hồ sơ sức khỏe"
        >
          <div className="flex min-w-max gap-1" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id)
                  setNotice("")
                }}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-brand-primary text-surface shadow-sm"
                    : "text-text-muted hover:bg-subsurface hover:text-text-primary"
                }`}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {notice && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-normal/20 bg-normal-bg p-4 text-sm text-normal"
          >
            {notice}
          </p>
        )}

        <div className="mt-5" id={`panel-${activeTab}`} role="tabpanel">
          {activeTab === "outpatient" && (
            <article className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm">
              <header className="flex flex-col gap-3 border-b border-border-subtle bg-canvas px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-xs font-semibold text-brand-deep">
                    LƯỢT KHÁM NGOẠI TRÚ
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-text-primary">
                    Lượt khám #PK-26-0128 - Ngày khám: 28/09/2026
                  </h2>
                </div>
                <span className="self-start rounded-full bg-normal px-3 py-1.5 text-xs font-bold text-surface sm:self-auto">
                  Đã hoàn tất
                </span>
              </header>
              <Section
                title="Bác sĩ phụ trách"
                icon={
                  <Icon>
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5 21v-2a7 7 0 0114 0v2M19 7h3m-1.5-1.5v3" />
                  </Icon>
                }
              >
                <p className="font-semibold text-text-primary">
                  BS. CKI Phan Huỳnh Hùng - Khoa Tim mạch
                </p>
              </Section>
              <Section
                title="Chẩn đoán bệnh (ICD-10)"
                icon={
                  <Icon>
                    <path d="M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5" />
                  </Icon>
                }
              >
                <p>
                  <strong className="font-mono text-brand-deep">I10</strong> -
                  Bệnh tăng huyết áp vô căn (nguyên phát)
                </p>
              </Section>
              <Section
                title="Kết luận & Lời dặn của Bác sĩ"
                icon={
                  <Icon>
                    <path d="M4 5h16v12H8l-4 4V5zM8 9h8m-8 4h5" />
                  </Icon>
                }
              >
                <p>
                  Bệnh nhân tuân thủ phác đồ thuốc, hạn chế ăn mặn, tái khám sau
                  30 ngày.
                </p>
              </Section>
              <Section
                title="Đơn thuốc đã cấp (Đã khóa)"
                icon={
                  <Icon>
                    <path d="M9 4h6v5a3 3 0 01-6 0V4zm0 5L5 20m10-11l4 11M8 15h8" />
                  </Icon>
                }
              >
                <div className="overflow-x-auto rounded-xl border border-border-subtle">
                  <table className="w-full min-w-2xl text-left text-sm">
                    <thead className="border-b border-border-subtle bg-canvas">
                      <tr>
                        {[
                          "Tên thuốc & Hàm lượng",
                          "Số lượng",
                          "Liều dùng / Ngày",
                          "Cách dùng",
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
                      <tr>
                        <td className="px-4 py-4 font-semibold text-text-primary">
                          Amlodipine 5mg
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">30 Viên</td>
                        <td className="whitespace-nowrap px-4 py-4">
                          1 viên/ngày
                        </td>
                        <td className="min-w-60 px-4 py-4">
                          Uống vào buổi sáng sau ăn
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section
                title="Kết quả cận lâm sàng đính kèm"
                icon={
                  <Icon>
                    <path d="M7 3h7l5 5v13H7V3zm7 0v5h5M10 13h6m-6 4h4" />
                  </Icon>
                }
              >
                <div className="grid gap-3 lg:grid-cols-2">
                  {ATTACHMENTS.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="rounded-xl border border-border-subtle bg-canvas p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-brand-deep">
                          <Icon>
                            <path d="M5 4h14v16H5zM8 15l3-3 2 2 3-4 2 3" />
                          </Icon>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary">
                            {attachment.title}
                          </p>
                          <p className="mt-1 text-xs text-text-muted">
                            {attachment.type} · {attachment.date}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={() => setPreview(attachment)}
                          className="flex-1"
                        >
                          Xem kết quả
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => download(attachment)}
                          className="flex flex-1 items-center justify-center gap-2 border border-border-subtle"
                        >
                          <Icon className="h-4 w-4">
                            <path d="M12 3v12m-4-4l4 4 4-4M4 17v4h16v-4" />
                          </Icon>
                          Tải về
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </article>
          )}

          {activeTab === "inpatient" && (
            <EmptyTab
              title="Hồ sơ điều trị nội trú"
              description="Một đợt điều trị nội trú đã hoàn tất và được đưa vào hồ sơ sức khỏe dọc của bạn."
              icon={
                <Icon className="h-6 w-6">
                  <path d="M3 18h18M5 18v-8h6a4 4 0 014 4v4m4 0V8M7 7h4" />
                </Icon>
              }
            >
              <div className="mt-6 rounded-xl border border-border-subtle bg-canvas p-5">
                <p className="text-xs font-semibold text-brand-deep">
                  ĐỢT ĐIỀU TRỊ #NT-26-0041
                </p>
                <p className="mt-2 font-semibold text-text-primary">
                  Khoa Nội trú chung · 12/08/2026 - 18/08/2026
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  Chẩn đoán ra viện: Viêm phổi cộng đồng. Tình trạng ra viện: Ổn
                  định.
                </p>
              </div>
            </EmptyTab>
          )}

          {activeTab === "medications" && (
            <EmptyTab
              title="Đơn thuốc đang dùng"
              description="Thông tin dưới đây giúp bạn theo dõi thuốc đang sử dụng. Không tự ý thay đổi liều nếu chưa hỏi bác sĩ."
              icon={
                <Icon className="h-6 w-6">
                  <path d="M9 4h6v5a3 3 0 01-6 0V4zm0 5L5 20m10-11l4 11M8 15h8" />
                </Icon>
              }
            >
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-border-subtle bg-canvas p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-text-primary">
                    Amlodipine 5mg
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    1 viên/ngày · Uống vào buổi sáng sau ăn
                  </p>
                </div>
                <span className="self-start rounded-full bg-normal-bg px-3 py-1.5 text-xs font-semibold text-normal sm:self-auto">
                  Đang sử dụng
                </span>
              </div>
            </EmptyTab>
          )}

          {activeTab === "results" && (
            <EmptyTab
              title="Kết quả Cận lâm sàng & Hình ảnh"
              description="Bốn kết quả đã được bác sĩ xác nhận và công bố trên cổng thông tin của bạn."
              icon={
                <Icon className="h-6 w-6">
                  <path d="M5 4h14v16H5zM8 15l3-3 2 2 3-4 2 3" />
                </Icon>
              }
            >
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "X-Quang Ngực Thẳng",
                  "Điện tâm đồ ECG thường quy",
                  "Công thức máu toàn phần",
                  "Sinh hóa máu cơ bản",
                ].map((result, index) => (
                  <div
                    key={result}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-canvas p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {result}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {index < 2 ? "28/09/2026" : "27/09/2026"}
                      </p>
                    </div>
                    <span className="rounded-full bg-normal-bg px-2 py-1 text-xs font-semibold text-normal">
                      Đã có kết quả
                    </span>
                  </div>
                ))}
              </div>
            </EmptyTab>
          )}
        </div>

        <footer className="mt-6 flex items-start gap-3 rounded-2xl border border-info/20 bg-info-bg p-5 text-info">
          <Icon className="mt-0.5 h-5 w-5 shrink-0">
            <path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3z" />
            <path d="M9.5 12l1.5 1.5 3.5-4" />
          </Icon>
          <p className="text-sm leading-relaxed">
            Hồ sơ bệnh án điện tử tuân thủ Thông tư 46/2018/TT-BYT. Mọi thông
            tin chưa hoàn tất hoặc ghi chú nội bộ tạm thời không hiển thị trên
            cổng thông tin này để đảm bảo an toàn y khoa.
          </p>
        </footer>
      </main>
      {preview && (
        <ResultPreview attachment={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
