import { useMemo, useState } from 'react'
import type { AuthUser } from '../../App'
import TopNav from '../TopNav'
import AuditLogPage from '../AuditLogPage'
import ReportsPage from '../reports/ReportsPage'
import NamedIcon from '../ui/NamedIcon'
import Pagination from '../ui/Pagination'
import Tooltip from '../ui/Tooltip'

interface Props { user: AuthUser; onLogout: () => void }

const CLINICS = [
  { name: 'Nội tổng quát', capacity: 40, current: 38, doctors: 3, status: 'critical' },
  { name: 'Ngoại tổng quát', capacity: 35, current: 22, doctors: 2, status: 'normal' },
  { name: 'Nhi khoa', capacity: 40, current: 36, doctors: 2, status: 'warning' },
  { name: 'Tim mạch', capacity: 30, current: 15, doctors: 2, status: 'normal' },
  { name: 'Da liễu', capacity: 30, current: 28, doctors: 1, status: 'warning' },
  { name: 'Sản phụ khoa', capacity: 35, current: 12, doctors: 2, status: 'normal' },
  { name: 'Tai Mũi Họng', capacity: 25, current: 25, doctors: 1, status: 'critical' },
  { name: 'Mắt', capacity: 20, current: 8, doctors: 1, status: 'normal' },
]

const BEDS = [
  { ward: 'Nội A', total: 40, occupied: 37, available: 3 },
  { ward: 'Nội B', total: 40, occupied: 32, available: 8 },
  { ward: 'Ngoại A', total: 35, occupied: 28, available: 7 },
  { ward: 'Ngoại B', total: 35, occupied: 20, available: 15 },
  { ward: 'Nhi', total: 30, occupied: 25, available: 5 },
  { ward: 'ICU', total: 12, occupied: 11, available: 1 },
  { ward: 'Hồi sức', total: 8, occupied: 7, available: 1 },
  { ward: 'Sản', total: 25, occupied: 18, available: 7 },
]

const SHIFTS = [
  { name: 'BS. Nguyễn Minh Tuấn', dept: 'Nội tổng quát', shift: 'Sáng 07:00–12:00', status: 'on' },
  { name: 'BS. Vũ Công Thành', dept: 'Ngoại tổng quát', shift: 'Sáng 07:00–12:00', status: 'on' },
  { name: 'BS. Lê Thị Hương', dept: 'Nhi khoa', shift: 'Sáng 07:00–12:00', status: 'on' },
  { name: 'BS. Phạm Quốc Anh', dept: 'Tim mạch', shift: 'Chiều 13:00–18:00', status: 'off' },
  { name: 'BS. Hoàng Thị Yến', dept: 'Da liễu', shift: 'Chiều 13:00–18:00', status: 'off' },
  { name: 'BS. Đinh Văn Trung', dept: 'ICU', shift: 'Trực đêm 18:00–07:00', status: 'off' },
]

export default function AdminDashboard({ user, onLogout }: Props) {
  const [tab, setTab] = useState<'clinics' | 'beds' | 'shifts' | 'formulary' | 'reports' | 'audit'>('clinics')
  const [clinicPage, setClinicPage] = useState(1)
  const [clinicPageSize, setClinicPageSize] = useState(4)

  const [bedPage, setBedPage] = useState(1)
  const [bedPageSize, setBedPageSize] = useState(4)

  const [shiftPage, setShiftPage] = useState(1)
  const [shiftPageSize, setShiftPageSize] = useState(4)

  const [drugPage, setDrugPage] = useState(1)
  const [drugPageSize, setDrugPageSize] = useState(4)
  const [drugSearch, setDrugSearch] = useState("")

  const FORMULARY_LIST = useMemo(() => [
    { name: 'Amoxicillin 500mg', group: 'Kháng sinh', unit: 'Viên', stock: 2400, ok: true },
    { name: 'Metformin 500mg', group: 'Tiểu đường', unit: 'Viên', stock: 800, ok: true },
    { name: 'Amlodipine 5mg', group: 'Tim mạch', unit: 'Viên', stock: 120, ok: false },
    { name: 'Pantoprazole 40mg', group: 'Tiêu hóa', unit: 'Ống/Lọ', stock: 450, ok: true },
    { name: 'Ceftriaxone 1g', group: 'Kháng sinh', unit: 'Lọ tiêm', stock: 60, ok: false },
    { name: 'Salbutamol 2.5mg', group: 'Hô hấp', unit: 'Ống khí dung', stock: 200, ok: true },
  ], [])

  const filteredDrugs = useMemo(() => {
    const q = drugSearch.trim().toLowerCase()
    if (!q) return FORMULARY_LIST
    return FORMULARY_LIST.filter(d => d.name.toLowerCase().includes(q) || d.group.toLowerCase().includes(q))
  }, [FORMULARY_LIST, drugSearch])

  const totalClinicPages = Math.max(1, Math.ceil(CLINICS.length / clinicPageSize))
  const paginatedClinics = useMemo(() => CLINICS.slice((clinicPage - 1) * clinicPageSize, clinicPage * clinicPageSize), [clinicPage, clinicPageSize])

  const totalBedPages = Math.max(1, Math.ceil(BEDS.length / bedPageSize))
  const paginatedBeds = useMemo(() => BEDS.slice((bedPage - 1) * bedPageSize, bedPage * bedPageSize), [bedPage, bedPageSize])

  const totalShiftPages = Math.max(1, Math.ceil(SHIFTS.length / shiftPageSize))
  const paginatedShifts = useMemo(() => SHIFTS.slice((shiftPage - 1) * shiftPageSize, shiftPage * shiftPageSize), [shiftPage, shiftPageSize])

  const totalDrugPages = Math.max(1, Math.ceil(filteredDrugs.length / drugPageSize))
  const paginatedDrugs = useMemo(() => filteredDrugs.slice((drugPage - 1) * drugPageSize, drugPage * drugPageSize), [filteredDrugs, drugPage, drugPageSize])

  const getLoadColor = (current: number, capacity: number) => {
    const pct = current / capacity
    if (pct >= 0.95) return 'bg-sptt-red-border'
    if (pct >= 0.85) return 'bg-sptt-yellow-border'
    return 'bg-sptt-stable-border'
  }

  const totalBeds = BEDS.reduce((a, b) => a + b.total, 0)
  const occupiedBeds = BEDS.reduce((a, b) => a + b.occupied, 0)

  const TABS = [
    { id: 'clinics', label: 'Hàng đợi phòng khám' },
    { id: 'beds', label: 'Công suất giường bệnh' },
    { id: 'shifts', label: 'Ca trực bác sĩ' },
    { id: 'formulary', label: 'Danh mục thuốc' },
    { id: 'reports', label: 'Báo cáo & Thống kê' },
    { id: 'audit', label: 'Nhật ký kiểm toán' },
  ] as const

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-text-primary">
      <TopNav user={user} onLogout={onLogout} title="Quản trị bệnh viện" />

      <div className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6">
        {/* Stats */}
        {tab !== 'audit' && tab !== 'reports' && (
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Tổng lượt khám hôm nay', value: '312', sub: '+18 so với hôm qua', color: 'text-brand-deep', bg: 'bg-brand-surface border-brand-primary/25', tooltip: 'Tổng số lượt khám bệnh đã được tiếp đón và kích hoạt trên toàn viện từ 00:00 hôm nay' },
              { label: 'Công suất giường', value: `${Math.round(occupiedBeds / totalBeds * 100)}%`, sub: `${occupiedBeds}/${totalBeds} giường`, color: 'text-sptt-yellow', bg: 'bg-sptt-yellow-bg border-sptt-yellow-border/35', tooltip: 'Tỷ lệ số giường bệnh đang điều trị trên tổng số giường khả dụng toàn viện' },
              { label: 'Phòng khám quá tải', value: '2', sub: '≥ 95% công suất', color: 'text-sptt-red', bg: 'bg-sptt-red-bg border-sptt-red-border/35', tooltip: 'Số phòng khám đạt hoặc vượt ngưỡng cảnh báo tải >= 95% công suất thiết kế' },
              { label: 'Bác sĩ đang trực', value: '3', sub: '6 ca trong ngày', color: 'text-sptt-stable', bg: 'bg-sptt-stable-bg border-sptt-stable-border/35', tooltip: 'Số lượng bác sĩ đang trong ca trực hoạt động (Active Shift) tính theo phân ca trực nhật' },
            ].map(s => (
              <Tooltip key={s.label} content={s.tooltip} className="w-full">
                <div className={`w-full rounded-xl border p-4 shadow-clinical-xs interactive-peek cursor-help ${s.bg}`}>
                  <div className={`font-mono text-[28px] font-bold leading-[1.2] tabular-nums ${s.color}`}>{s.value}</div>
                  <div className="mt-1 font-heading text-xs font-semibold text-text-secondary">{s.label}</div>
                  <div className="mt-0.5 text-xs text-text-muted">{s.sub}</div>
                </div>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border-subtle">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 cursor-pointer border-b-2 px-4 py-2.5 font-heading text-sm font-semibold transition-colors duration-150 ${
                tab === t.id
                  ? 'border-brand-primary text-brand-deep'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Clinics Table */}
        {tab === 'clinics' && (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-clinical-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border-strong bg-subsurface">
                  <tr>
                    {['Phòng khám / Chuyên khoa', 'Hiện tại / Công suất', 'Tỷ lệ tải', 'Bác sĩ trực', 'Trạng thái'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-heading text-xs font-semibold text-text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedClinics.map(c => {
                    const pct = Math.round(c.current / c.capacity * 100)
                    return (
                      <tr key={c.name} className="border-b border-border-subtle transition-colors hover:bg-canvas">
                        <td className="px-4 py-3 font-medium text-text-primary">{c.name}</td>
                        <td className="px-4 py-3 font-mono tabular-nums text-text-secondary">
                          <strong className="text-text-primary">{c.current}</strong> / {c.capacity}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-subsurface">
                              <div className={`h-1.5 rounded-full ${getLoadColor(c.current, c.capacity)}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-mono text-xs tabular-nums text-text-muted">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-text-secondary">{c.doctors} bác sĩ</td>
                        <td className="px-4 py-3">
                          {c.status === 'critical' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sptt-red-border/50 bg-sptt-red-bg px-2.5 py-0.5 font-heading text-xs font-semibold text-sptt-red">
                              Quá tải
                            </span>
                          ) : c.status === 'warning' ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sptt-yellow-border/50 bg-sptt-yellow-bg px-2.5 py-0.5 font-heading text-xs font-semibold text-sptt-yellow">
                              Cảnh báo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sptt-stable-border/50 bg-sptt-stable-bg px-2.5 py-0.5 font-heading text-xs font-semibold text-sptt-stable">
                              Bình thường
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={clinicPage}
              totalPages={totalClinicPages}
              totalItems={CLINICS.length}
              pageSize={clinicPageSize}
              onPageChange={setClinicPage}
              onPageSizeChange={setClinicPageSize}
              pageSizeOptions={[2, 4, 8]}
              itemLabel="phòng khám"
            />
          </div>
        )}

        {/* Beds */}
        {tab === 'beds' && (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-clinical-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border-strong bg-subsurface">
                  <tr>
                    {['Khoa / Phòng', 'Tổng giường', 'Đang dùng', 'Còn trống', 'Công suất'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-heading text-xs font-semibold text-text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedBeds.map(b => {
                    const pct = Math.round(b.occupied / b.total * 100)
                    return (
                      <tr key={b.ward} className="border-b border-border-subtle transition-colors hover:bg-canvas">
                        <td className="px-4 py-3 font-medium text-text-primary">{b.ward}</td>
                        <td className="px-4 py-3 font-mono tabular-nums text-text-secondary">{b.total}</td>
                        <td className="px-4 py-3 font-mono tabular-nums text-text-secondary">{b.occupied}</td>
                        <td className="px-4 py-3 font-mono tabular-nums">
                          <span className={b.available <= 2 ? 'font-bold text-sptt-red' : 'font-semibold text-sptt-stable'}>{b.available}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-subsurface">
                              <div className={`h-1.5 rounded-full ${getLoadColor(b.occupied, b.total)}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-10 font-mono text-xs tabular-nums text-text-muted">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={bedPage}
              totalPages={totalBedPages}
              totalItems={BEDS.length}
              pageSize={bedPageSize}
              onPageChange={setBedPage}
              onPageSizeChange={setBedPageSize}
              pageSizeOptions={[2, 4, 8]}
              itemLabel="khoa"
            />
          </div>
        )}

        {/* Shifts */}
        {tab === 'shifts' && (
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-clinical-xs">
            <div className="flex items-center justify-between border-b border-border-subtle p-4">
              <h3 className="font-heading text-sm font-semibold text-text-primary">Lịch trực ngày 30/09/2024</h3>
              <button type="button" className="cursor-pointer rounded-lg bg-brand-deep px-3 py-1.5 font-heading text-xs font-semibold text-surface transition-colors hover:bg-brand-dark">
                + Thêm ca trực
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border-strong bg-subsurface">
                  <tr>
                    {['Bác sĩ', 'Chuyên khoa', 'Ca trực', 'Trạng thái'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-heading text-xs font-semibold text-text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedShifts.map(s => (
                    <tr key={s.name} className="border-b border-border-subtle transition-colors hover:bg-canvas">
                      <td className="px-4 py-3 font-medium text-text-primary">{s.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.dept}</td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-text-secondary">{s.shift}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-heading text-xs font-semibold ${
                          s.status === 'on'
                            ? 'border-sptt-stable-border/40 bg-sptt-stable-bg text-sptt-stable'
                            : 'border-border-strong bg-subsurface text-text-muted'
                        }`}>
                          <span className={`size-1.5 rounded-full ${s.status === 'on' ? 'bg-sptt-stable-border' : 'bg-border-strong'}`} />
                          {s.status === 'on' ? 'Đang trực' : 'Chờ ca'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={shiftPage}
              totalPages={totalShiftPages}
              totalItems={SHIFTS.length}
              pageSize={shiftPageSize}
              onPageChange={setShiftPage}
              onPageSizeChange={setShiftPageSize}
              pageSizeOptions={[2, 4, 8]}
              itemLabel="ca trực"
            />
          </div>
        )}

        {/* Formulary */}
        {tab === 'formulary' && (
          <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-clinical-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-sm font-semibold text-text-primary">Danh mục thuốc bệnh viện</h3>
              <div className="flex gap-2">
                <input
                  className="rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs text-text-primary placeholder:text-text-disabled focus:border-brand-primary focus:outline-none focus:ring-3 focus:ring-brand-primary/20"
                  placeholder="Tìm thuốc..." value={drugSearch} onChange={e => { setDrugSearch(e.target.value); setDrugPage(1); }}
                />
                <button type="button" className="cursor-pointer rounded-lg bg-brand-deep px-3 py-1.5 font-heading text-xs font-semibold text-surface transition-colors hover:bg-brand-dark">
                  + Thêm thuốc
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border-strong bg-subsurface">
                  <tr>
                    {['Tên hoạt chất', 'Nhóm thuốc', 'Đơn vị', 'Tồn kho', 'Trạng thái'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-heading text-xs font-semibold text-text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedDrugs.map(d => (
                    <tr key={d.name} className="border-b border-border-subtle transition-colors hover:bg-canvas">
                      <td className="px-3 py-2.5 font-medium text-text-primary">{d.name}</td>
                      <td className="px-3 py-2.5 text-xs text-text-secondary">{d.group}</td>
                      <td className="px-3 py-2.5 text-xs text-text-secondary">{d.unit}</td>
                      <td className="px-3 py-2.5 font-mono text-sm tabular-nums text-text-primary">{d.stock.toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-heading text-xs font-semibold ${
                          d.ok
                            ? 'border-sptt-stable-border/40 bg-sptt-stable-bg text-sptt-stable'
                            : 'border-sptt-red-border/40 bg-sptt-red-bg text-sptt-red'
                        }`}>
                          {d.ok ? (
                            <>
                              <NamedIcon name="check" className="size-3.5" />
                              Đủ hàng
                            </>
                          ) : (
                            <>
                              <NamedIcon name="alert" className="size-3.5" />
                              Sắp hết
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={drugPage}
              totalPages={totalDrugPages}
              totalItems={filteredDrugs.length}
              pageSize={drugPageSize}
              onPageChange={setDrugPage}
              onPageSizeChange={setDrugPageSize}
              pageSizeOptions={[2, 4, 8]}
              itemLabel="thuốc"
            />
          </div>
        )}

        {tab === 'reports' && <ReportsPage user={user} />}
        {tab === 'audit' && <AuditLogPage />}
      </div>
    </div>
  )
}
