import { useEffect, useState, type ReactNode } from 'react'
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { AUDIT_EVENT, AUDIT_KEY, readSecurityAudit } from '../lib/sessionSecurity'

interface Props {
  enableForensics?: boolean
}

interface AuditEntry {
  id: string
  time: string
  actor: string
  workstation: string
  action: string
  actionTone: 'amber' | 'blue' | 'slate' | 'cyan'
  object: string
  result: 'Thành công' | 'Thất bại'
}

const AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'LOG-92810',
    time: '05/10/2026 15:30:22',
    actor: 'BS. CK1 Nguyễn Hữu Đạt',
    workstation: '192.168.1.45 (Trạm 102)',
    action: 'Ghi đè cảnh báo thuốc CPOE',
    actionTone: 'amber',
    object: 'Đơn thuốc: DT-2026-0812',
    result: 'Thành công',
  },
  {
    id: 'LOG-92809',
    time: '05/10/2026 15:28:06',
    actor: 'KTV. Nguyễn Thị Mai',
    workstation: '192.168.2.18 (Phòng XN-03)',
    action: 'Xác nhận kết quả CLS',
    actionTone: 'blue',
    object: 'Phiếu CLS: CLS-2026-4419',
    result: 'Thành công',
  },
  {
    id: 'LOG-92808',
    time: '05/10/2026 15:25:41',
    actor: 'ĐD. Trần Thị Hoa',
    workstation: '192.168.3.77 (Trạm Nội A3)',
    action: 'Đăng nhập',
    actionTone: 'slate',
    object: 'Phiên: SESS-8809',
    result: 'Thành công',
  },
  {
    id: 'LOG-92807',
    time: '05/10/2026 15:21:13',
    actor: 'BS. Lê Minh Tuấn',
    workstation: '192.168.1.52 (Trạm 108)',
    action: 'Kê đơn thuốc',
    actionTone: 'cyan',
    object: 'Đơn thuốc: DT-2026-0811',
    result: 'Thành công',
  },
  {
    id: 'LOG-92806',
    time: '05/10/2026 15:18:54',
    actor: 'Quản trị viên Trần Thị Lan',
    workstation: '10.0.0.8 (Máy chủ quản trị)',
    action: 'Đăng nhập',
    actionTone: 'slate',
    object: 'Phiên: SESS-8806',
    result: 'Thất bại',
  },
  {
    id: 'LOG-92805',
    time: '05/10/2026 15:14:02',
    actor: 'BS. Phạm Quốc Anh',
    workstation: '192.168.1.44 (Trạm Tim mạch)',
    action: 'Tạo bệnh án',
    actionTone: 'cyan',
    object: 'Bệnh án: BA-2026-1140',
    result: 'Thành công',
  },
]

const EXPORTS = [
  {
    id: 'EXP-20261005-003',
    time: '05/10/2026 14:10:25',
    actor: 'Nguyễn Văn Hệ Thống',
    format: 'JSON ký số RSA',
    scope: '01/10/2026 - 05/10/2026',
    checksum: '8e91a34f…d410c2b8',
    status: 'Hoàn tất',
  },
  {
    id: 'EXP-20261003-002',
    time: '03/10/2026 09:42:18',
    actor: 'Nguyễn Văn Hệ Thống',
    format: 'ZIP mã hóa AES-256',
    scope: '01/09/2026 - 30/09/2026',
    checksum: 'b74c092d…83fc170a',
    status: 'Hoàn tất',
  },
  {
    id: 'EXP-20260930-001',
    time: '30/09/2026 17:05:44',
    actor: 'Phan Huỳnh Hưng',
    format: 'JSON ký số RSA',
    scope: '01/07/2026 - 30/09/2026',
    checksum: '4aa18b97…991d82ef',
    status: 'Hoàn tất',
  },
]

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-700">{children}</label>
}

function AuditDrawer({ entry, onClose }: { entry: AuditEntry; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30" role="presentation" onMouseDown={onClose}>
      <aside
        aria-labelledby="audit-drawer-title"
        aria-modal="true"
        className="ml-auto flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-cyan-700">
              <FileText aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
              Bản ghi kiểm toán bất biến
            </div>
            <h2 className="text-xl font-semibold text-slate-900" id="audit-drawer-title">
              Chi tiết nhật ký #{entry.id}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{entry.time} · {entry.actor}</p>
          </div>
          <button
            aria-label="Đóng ngăn chi tiết"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Mã phiên', 'SESS-8812'],
              ['Phân hệ', 'CPOE'],
              ['Quy tắc', 'BR-RX-02'],
              ['Băm', 'SHA256-VALID'],
            ].map(([label, value]) => (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={label}>
                <div className="text-xs font-medium text-slate-500">{label}</div>
                <div className={`mt-1 text-sm font-semibold ${label === 'Băm' ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">So sánh dữ liệu JSON</h3>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                Có thay đổi dữ liệu
              </span>
            </div>
            <div className="grid overflow-hidden rounded-xl border border-slate-200 lg:grid-cols-2">
              <div className="border-b border-slate-200 bg-red-50/40 p-4 lg:border-b-0 lg:border-r">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Dữ liệu trước (giá trị cũ)
                </div>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs leading-6 text-slate-200">
{`{
  "trangThai": "ChoDuyet",
  "canhBao": "Major"
}`}
                </pre>
              </div>
              <div className="bg-emerald-50/40 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Dữ liệu sau (giá trị mới)
                </div>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs leading-6 text-slate-200">
{`{
  "trangThai": "DaKyGhiDe",
  "lyDo": "Lợi ích lâm sàng vượt trội,
           theo dõi sát ECG"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>
        </div>
      </aside>
    </div>
  )
}

function AuditTable() {
  const [securityEntries, setSecurityEntries] = useState(readSecurityAudit)
  useEffect(() => {
    const refresh = () => setSecurityEntries(readSecurityAudit())
    const storage = (event: StorageEvent) => { if (event.key === AUDIT_KEY) refresh() }
    window.addEventListener(AUDIT_EVENT, refresh)
    window.addEventListener('storage', storage)
    return () => {
      window.removeEventListener(AUDIT_EVENT, refresh)
      window.removeEventListener('storage', storage)
    }
  }, [])
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [dateRange, setDateRange] = useState('01/10/2026 - 05/10/2026')
  const [actor, setActor] = useState('Tất cả')
  const [action, setAction] = useState('Tất cả')
  const [result, setResult] = useState('Tất cả')
  const [query, setQuery] = useState('')

  const resetFilters = () => {
    setDateRange('01/10/2026 - 05/10/2026')
    setActor('Tất cả')
    setAction('Tất cả')
    setResult('Tất cả')
    setQuery('')
  }

  return (
    <>
      <div className="mb-5">
        <div className="flex items-center gap-2 text-xs font-medium text-cyan-700">
          <FileText aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
          Báo cáo tuân thủ và truy vết
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Nhật ký kiểm toán hệ thống (RPT-05)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tra cứu toàn bộ hoạt động nghiệp vụ và sự kiện truy cập có lưu vết.
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <FieldLabel>Khoảng thời gian</FieldLabel>
            <div className="relative">
              <Calendar aria-hidden="true" strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700"
                onChange={(event) => setDateRange(event.target.value)}
                value={dateRange}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Người thực hiện</FieldLabel>
            <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" onChange={(event) => setActor(event.target.value)} value={actor}>
              <option>Tất cả</option>
              <option>Bác sĩ</option>
              <option>Điều dưỡng</option>
              <option>KTV CLS</option>
              <option>Admin</option>
            </select>
          </div>
          <div>
            <FieldLabel>Hành động</FieldLabel>
            <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" onChange={(event) => setAction(event.target.value)} value={action}>
              <option>Tất cả</option>
              <option>DangNhap</option>
              <option>TaoBenhAn</option>
              <option>KeDonThuoc</option>
              <option>GhiDeCanhBaoThuoc</option>
              <option>XacNhanKetQuaCLS</option>
            </select>
          </div>
          <div>
            <FieldLabel>Kết quả</FieldLabel>
            <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700" onChange={(event) => setResult(event.target.value)} value={result}>
              <option>Tất cả</option>
              <option>Thành công</option>
              <option>Thất bại</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <FieldLabel>Từ khóa / Mã đối tượng</FieldLabel>
            <div className="relative">
              <Search aria-hidden="true" strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nhập mã bệnh án, đơn thuốc, IP..."
                value={query}
              />
            </div>
          </div>
          <div className="flex h-10 items-center whitespace-nowrap rounded-lg bg-slate-50 px-3 text-xs text-slate-500">
            Tìm thấy: <strong className="ml-1 font-mono text-slate-800">1,482</strong> sự kiện
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={resetFilters} type="button">
              Đặt lại bộ lọc
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700" type="button">
              <Search aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
              Tra cứu nhật ký
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['Mã nhật ký', 'Thời gian ghi nhận', 'Người thực hiện', 'Địa chỉ IP / Máy trạm', 'Hành động', 'Đối tượng & Mã ID', 'Kết quả', 'Chi tiết'].map((heading) => (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...securityEntries, ...AUDIT_ENTRIES].map((entry) => (
                <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70" key={entry.id}>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-cyan-700">{entry.id}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-600">{entry.time}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{entry.actor}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{entry.workstation}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                      entry.actionTone === 'amber'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : entry.actionTone === 'blue'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : entry.actionTone === 'cyan'
                            ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                    }`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{entry.object}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${
                      entry.result === 'Thành công'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${entry.result === 'Thành công' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {entry.result}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                      onClick={() => setSelectedEntry(entry)}
                      type="button"
                    >
                      <Eye aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                      Xem Diff JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 border-t border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-800">
          <ShieldAlert aria-hidden="true" strokeWidth={1.75} className="h-4 w-4 flex-shrink-0" />
          <strong>Quy tắc an ninh:</strong> Nhật ký kiểm toán có tính bất biến Append-Only, không thể sửa xóa.
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3">
          <p className="text-xs text-slate-500">Hiển thị 6 sự kiện mới nhất</p>
          <div className="flex items-center gap-2">
            <button aria-label="Trang trước" className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-400" type="button">
              <ChevronLeft aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-slate-600">Trang 1 / 75</span>
            <button aria-label="Trang sau" className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50" type="button">
              <ChevronRight aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedEntry && <AuditDrawer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </>
  )
}

function ForensicExport() {
  const [exportType, setExportType] = useState('json')
  const [scanComplete, setScanComplete] = useState(true)

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2 text-xs font-medium text-purple-700">
          <ShieldCheck aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
          Công cụ pháp y dành cho Quản trị viên
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Giám định bảo mật chuỗi băm &amp; Xuất dữ liệu kiểm toán
        </h1>
        <p className="mt-1 text-sm text-slate-500">Xác minh tính toàn vẹn và tạo gói chứng cứ kiểm toán có ký số.</p>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Giám định chuỗi băm liên hoàn</h2>
            <p className="mt-1 text-xs text-slate-500">Đối chiếu từng khối nhật ký với mã băm của khối liền trước.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Calendar aria-hidden="true" strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700" defaultValue="01/10/2026 - 05/10/2026" aria-label="Khoảng thời gian quét chuỗi băm" />
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700"
              onClick={() => setScanComplete(true)}
              type="button"
            >
              <RefreshCw aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
              Bắt đầu quét toàn vẹn chuỗi
            </button>
          </div>
          {scanComplete && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="rounded-full bg-emerald-600 p-2 text-white">
                <Check aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-emerald-800">Trạng thái: 100% Chuỗi toàn vẹn</div>
                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Đã kiểm tra 34.520 khối liên hoàn theo công thức{' '}
                  <span className="font-mono text-xs font-semibold">Hash[n] = SHA256(Payload[n] || Hash[n-1])</span>.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Xuất gói dữ liệu pháp y</h2>
            <p className="mt-1 text-xs text-slate-500">Mọi lần xuất đều được ghi nhận và gắn mã kiểm tra SHA-256.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <FieldLabel>Định dạng bảo mật</FieldLabel>
              <div className="flex min-h-10 flex-wrap items-center gap-4 rounded-lg border border-slate-300 px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input checked={exportType === 'json'} name="export-type" onChange={() => setExportType('json')} type="radio" />
                  JSON có ký số RSA
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input checked={exportType === 'zip'} name="export-type" onChange={() => setExportType('zip')} type="radio" />
                  ZIP mã hóa AES-256
                </label>
              </div>
            </div>
            <div>
              <FieldLabel>Mục đích xuất</FieldLabel>
              <input className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400" placeholder="Nhập lý do hoặc mã yêu cầu..." />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700" type="button">
              <Download aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
              Ký số &amp; Tải về bảo mật
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Các gói xuất gần đây</h2>
            <p className="mt-1 text-xs text-slate-500">Lịch sử tệp kiểm toán đã ký số hoặc mã hóa.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {['Mã gói xuất', 'Thời gian', 'Người thực hiện', 'Định dạng', 'Khoảng dữ liệu', 'Mã kiểm tra SHA-256', 'Trạng thái'].map((heading) => (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600" key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXPORTS.map((item) => (
                  <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70" key={item.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-700">{item.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.time}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.actor}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{item.format}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.scope}</td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-700">{item.checksum}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function AuditLogPage({ enableForensics = false }: Props) {
  const [section, setSection] = useState<'logs' | 'forensic'>('logs')

  return (
    <section>
      {enableForensics && (
        <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${section === 'logs' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setSection('logs')}
            type="button"
          >
            Nhật ký kiểm toán
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${section === 'forensic' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setSection('forensic')}
            type="button"
          >
            Giám định &amp; Xuất pháp y
          </button>
        </div>
      )}
      {section === 'logs' ? <AuditTable /> : <ForensicExport />}
    </section>
  )
}
