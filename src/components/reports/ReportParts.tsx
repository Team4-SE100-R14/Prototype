import Button from "../ui/Button"
import NamedIcon, { type IconName } from "../ui/NamedIcon"

export type ReportState = "data" | "error" | "empty"

export function ReportHeading({
  title,
  description,
  code,
  onExport,
}: {
  title: string
  description: string
  code: string
  onExport: () => void
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
      <div>
        <div className="mb-2 inline-flex items-center rounded-xs border border-brand-primary/30 bg-brand-surface px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-brand-deep">
          {code}
        </div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">
          {description}
        </p>
      </div>
      <Button
        variant="secondary"
        className="inline-flex items-center gap-2"
        onClick={onExport}
      >
        <NamedIcon name="download" className="size-4" />
        Xuất báo cáo (CSV)
      </Button>
    </div>
  )
}

export function ReportKpi({
  label,
  value,
  tone = "default",
  note,
}: {
  label: string
  value: string
  tone?: "default" | "green" | "blue" | "gray" | "red" | "amber"
  note?: string
}) {
  const toneStyles = {
    default: "bg-border-strong",
    green: "bg-sptt-stable-border",
    blue: "bg-brand-primary",
    gray: "bg-bed-maintenance-border",
    red: "bg-sptt-red-border",
    amber: "bg-sptt-yellow-border",
  }
  return (
    <article className="min-h-36 rounded-xl border border-border-subtle bg-surface p-5 shadow-clinical-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="font-heading text-xs font-semibold leading-5 text-text-secondary">{label}</div>
        <span className={`mt-1 size-2.5 shrink-0 rounded-full ${toneStyles[tone]}`} />
      </div>
      <div className="mt-3 font-heading text-[28px] font-bold leading-[1.2] tracking-tight tabular-nums text-text-primary">
        {value}
      </div>
      {note && <p className="mt-2 text-xs leading-5 text-text-muted">{note}</p>}
    </article>
  )
}

export function EmptyReport({
  message,
  icon = "document",
}: {
  message: string
  icon?: IconName
}) {
  return (
    <section className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-20 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-subsurface text-text-muted">
        <NamedIcon name={icon} className="size-7" />
      </div>
      <div className="mt-4 font-heading text-base font-bold text-text-primary">
        Chưa có dữ liệu báo cáo
      </div>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">
        {message}
      </p>
    </section>
  )
}

export function ReportPanel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-clinical-xs">
      <div className="border-b border-border-subtle px-5 py-4">
        <h2 className="font-heading text-base font-semibold text-text-primary">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}

export function ReportFilterBar({ children }: { children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-border-subtle bg-surface p-5 shadow-clinical-xs">
      {children}
    </section>
  )
}

export const FILTER_CONTROL =
  "h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-primary outline-none transition-[border-color,box-shadow] duration-150 focus:border-brand-primary focus:ring-3 focus:ring-brand-primary/20"

export function PatientPyramid() {
  const rows = [
    { age: "Trên 65", male: "w-[72%]", female: "w-[86%]", other: "w-[5%]" },
    { age: "46 – 65", male: "w-[88%]", female: "w-full", other: "w-[7%]" },
    { age: "26 – 45", male: "w-[68%]", female: "w-[77%]", other: "w-[6%]" },
    { age: "0 – 25", male: "w-[47%]", female: "w-[51%]", other: "w-[4%]" },
  ]
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-clinical-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-text-primary">Cơ cấu tuổi và giới tính</h2>
          <p className="mt-1 text-xs text-text-muted">Đơn vị: người bệnh duy nhất</p>
        </div>
        <div className="flex gap-3 font-heading text-xs font-semibold text-text-secondary">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#0891B2]" />Nam</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#4F46E5]" />Nữ</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#D97706]" />Khác</span>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div className="grid grid-cols-[1fr_64px_1fr] items-center gap-2" key={row.age}>
            <div className="flex h-7 items-center justify-end rounded-l bg-subsurface">
              <div className={`h-4 rounded-l bg-[#0891B2] ${row.male}`} />
            </div>
            <div className="text-center font-mono text-xs font-semibold tabular-nums text-text-muted">{row.age}</div>
            <div className="flex h-7 items-center gap-1 rounded-r bg-subsurface">
              <div className={`h-4 rounded-r bg-[#4F46E5] ${row.female}`} />
              <div className={`h-4 rounded-xs bg-[#D97706] ${row.other}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-between border-t border-border-subtle pt-3 font-mono text-xs font-medium tabular-nums text-text-muted">
        <span>400</span><span>200</span><span>0</span><span>200</span><span>400</span>
      </div>
    </section>
  )
}

export function OutcomeChart() {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-clinical-xs">
      <h2 className="font-heading text-base font-semibold text-text-primary">Phân bổ kết luận điều trị</h2>
      <p className="mt-1 text-xs text-text-muted">Theo kết quả xử trí sau khám</p>
      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <div className="relative size-44">
          <svg viewBox="0 0 120 120" className="-rotate-90" role="img" aria-label="Biểu đồ tròn phân bổ kết luận điều trị">
            <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="17" className="text-subsurface" />
            <circle cx="60" cy="60" r="44" fill="none" stroke="#059669" strokeWidth="17" strokeDasharray="190 277" />
            <circle cx="60" cy="60" r="44" fill="none" stroke="#0891B2" strokeWidth="17" strokeDasharray="69 277" strokeDashoffset="-190" />
            <circle cx="60" cy="60" r="44" fill="none" stroke="#D97706" strokeWidth="17" strokeDasharray="18 277" strokeDashoffset="-259" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <strong className="font-mono text-2xl font-bold tabular-nums text-text-primary">1.248</strong>
            <span className="text-xs font-medium text-text-muted">Tổng cộng</span>
          </div>
        </div>
        <div className="space-y-3 text-xs">
          {[
            ["bg-[#059669]", "Khám xong, cho về kê đơn", "860 · 68,9%"],
            ["bg-[#0891B2]", "Chỉ định nhập viện", "312 · 25,0%"],
            ["bg-[#D97706]", "Chuyển viện", "76 · 6,1%"],
          ].map(([color, label, value]) => (
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5" key={label}>
              <span className={`size-2.5 rounded-full ${color}`} />
              <span className="font-medium text-text-secondary">{label}</span>
              <strong className="font-mono tabular-nums text-text-primary">{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BarList({
  title,
  subtitle,
  badge,
  rows,
}: {
  title: string
  subtitle: string
  badge?: string
  rows: Array<{ label: string; value: string; percent: number; color: string }>
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-clinical-xs">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold text-text-primary">{title}</h2>
          <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
        </div>
        {badge && (
          <span className="rounded-full border border-brand-primary/30 bg-brand-surface px-2.5 py-1 font-heading text-xs font-semibold text-brand-deep">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-7 space-y-5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex justify-between text-xs">
              <span className="font-heading font-semibold text-text-secondary">{row.label}</span>
              <strong className="font-mono tabular-nums text-text-primary">{row.value}</strong>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-subsurface">
              <div
                className={`h-full rounded-full ${row.color}`}
                style={{ width: `${Math.min(100, Math.max(0, row.percent))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export const TH =
  "bg-subsurface border-b border-border-strong px-4 py-3 text-left font-heading text-xs font-semibold text-text-secondary first:pl-5 last:pr-5"
export const TD = "px-4 py-3.5 tabular-nums first:pl-5 last:pr-5"
