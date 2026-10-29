import { useState } from 'react'
import type { AuthUser } from '../../App'
import TopNav from '../TopNav'
import AuditLogPage from '../AuditLogPage'
import ReportsPage from '../reports/ReportsPage'

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

  const getLoadColor = (current: number, capacity: number) => {
    const pct = current / capacity
    if (pct >= 0.95) return 'bg-red-500'
    if (pct >= 0.85) return 'bg-amber-400'
    return 'bg-emerald-500'
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <TopNav user={user} onLogout={onLogout} title="Quản trị bệnh viện" />

      <div className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {/* Stats */}
        {tab !== 'audit' && tab !== 'reports' && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tổng lượt khám hôm nay', value: '312', sub: '+18 so với hôm qua', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-100' },
            { label: 'Công suất giường', value: `${Math.round(occupiedBeds/totalBeds*100)}%`, sub: `${occupiedBeds}/${totalBeds} giường`, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Phòng khám quá tải', value: '2', sub: '≥ 95% công suất', color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
            { label: 'Bác sĩ đang trực', value: '3', sub: '6 ca trong ngày', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
          ].map(s => (
            <div key={s.label} className={`p-4 rounded-xl border ${s.bg}`}>
              <div className={`text-2xl font-bold font-mono ${s.color}`} style={{fontFamily:'JetBrains Mono,monospace'}}>{s.value}</div>
              <div className="text-xs font-semibold text-slate-700 mt-1" style={{fontFamily:'Figtree,sans-serif'}}>{s.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              style={{fontFamily:'Figtree,sans-serif'}}>{t.label}
            </button>
          ))}
        </div>

        {/* Clinics */}
        {tab === 'clinics' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CLINICS.map(c => {
              const pct = Math.round(c.current / c.capacity * 100)
              return (
                <div key={c.name} className={`bg-white border rounded-xl p-4 ${c.status === 'critical' ? 'border-red-200' : c.status === 'warning' ? 'border-amber-200' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-sm font-semibold text-slate-800" style={{fontFamily:'Figtree,sans-serif'}}>{c.name}</div>
                    {c.status === 'critical' && <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded">⚠ Quá tải</span>}
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-2xl font-bold font-mono text-slate-900" style={{fontFamily:'JetBrains Mono,monospace'}}>{c.current}</span>
                    <span className="text-sm text-slate-400 mb-0.5">/ {c.capacity}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                    <div className={`h-1.5 rounded-full transition-all ${getLoadColor(c.current, c.capacity)}`} style={{width:`${pct}%`}} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{pct}% công suất</span>
                    <span>{c.doctors} bác sĩ</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Beds */}
        {tab === 'beds' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Khoa / Phòng', 'Tổng giường', 'Đang dùng', 'Còn trống', 'Công suất'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600" style={{fontFamily:'Figtree,sans-serif'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BEDS.map(b => {
                  const pct = Math.round(b.occupied / b.total * 100)
                  return (
                    <tr key={b.ward} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{b.ward}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{b.total}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{b.occupied}</td>
                      <td className="px-4 py-3 font-mono">
                        <span className={b.available <= 2 ? 'text-red-600 font-bold' : 'text-emerald-600'}>{b.available}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${getLoadColor(b.occupied, b.total)}`} style={{width:`${pct}%`}} />
                          </div>
                          <span className="text-xs font-mono text-slate-500 w-10">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Shifts */}
        {tab === 'shifts' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800" style={{fontFamily:'Figtree,sans-serif'}}>Lịch trực ngày 30/09/2024</h3>
              <button className="text-xs px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">+ Thêm ca trực</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Bác sĩ', 'Chuyên khoa', 'Ca trực', 'Trạng thái'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600" style={{fontFamily:'Figtree,sans-serif'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SHIFTS.map(s => (
                  <tr key={s.name} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.dept}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.shift}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'on' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {s.status === 'on' ? '● Đang trực' : '○ Chờ ca'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Formulary */}
        {tab === 'formulary' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800" style={{fontFamily:'Figtree,sans-serif'}}>Danh mục thuốc bệnh viện</h3>
              <div className="flex gap-2">
                <input className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50" placeholder="Tìm thuốc..." />
                <button className="text-xs px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">+ Thêm thuốc</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Tên hoạt chất', 'Nhóm thuốc', 'Đơn vị', 'Tồn kho', 'Trạng thái'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600" style={{fontFamily:'Figtree,sans-serif'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Amoxicillin 500mg', group: 'Kháng sinh', unit: 'Viên', stock: 2400, ok: true },
                  { name: 'Metformin 500mg', group: 'Tiểu đường', unit: 'Viên', stock: 800, ok: true },
                  { name: 'Amlodipine 5mg', group: 'Tim mạch', unit: 'Viên', stock: 120, ok: false },
                  { name: 'Pantoprazole 40mg', group: 'Tiêu hóa', unit: 'Ống/Lọ', stock: 450, ok: true },
                  { name: 'Ceftriaxone 1g', group: 'Kháng sinh', unit: 'Lọ tiêm', stock: 60, ok: false },
                  { name: 'Salbutamol 2.5mg', group: 'Hô hấp', unit: 'Ống khí dung', stock: 200, ok: true },
                ].map(d => (
                  <tr key={d.name} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{d.name}</td>
                    <td className="px-3 py-2.5 text-slate-600 text-xs">{d.group}</td>
                    <td className="px-3 py-2.5 text-slate-600 text-xs">{d.unit}</td>
                    <td className="px-3 py-2.5 font-mono text-sm">{d.stock.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {d.ok ? 'Đủ hàng' : '⚠ Sắp hết'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reports' && <ReportsPage user={user} />}
        {tab === 'audit' && <AuditLogPage />}
      </div>
    </div>
  )
}
