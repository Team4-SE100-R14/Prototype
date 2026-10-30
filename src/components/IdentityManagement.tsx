import { useMemo, useState, type ReactNode } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldPlus,
  X,
} from 'lucide-react'
import Modal from './ui/Modal'

type AdminStatus = 'Đang hoạt động' | 'Đã khóa'

interface AdminAccount {
  id: string
  name: string
  email: string
  role: 'Admin cơ sở'
  scope: string
  scopeFilter: string
  lastLogin: string
  status: AdminStatus
  isRoot?: boolean
}

const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'ADM-002',
    name: 'Phan Huỳnh Hưng',
    email: 'hung.phan@hpms.med.vn',
    role: 'Admin cơ sở',
    scope: 'Bệnh viện Đa khoa',
    scopeFilter: 'Toàn bệnh viện',
    lastLogin: '05/10/2026 10:08:42',
    status: 'Đang hoạt động',
  },
  {
    id: 'ADM-003',
    name: 'Lê Thị Minh Anh',
    email: 'anh.le@hpms.med.vn',
    role: 'Admin cơ sở',
    scope: 'Khoa Cấp cứu',
    scopeFilter: 'Khoa Cấp cứu',
    lastLogin: '04/10/2026 21:35:09',
    status: 'Đang hoạt động',
  },
  {
    id: 'ADM-004',
    name: 'Trần Quốc Bảo',
    email: 'bao.tran@hpms.med.vn',
    role: 'Admin cơ sở',
    scope: 'Khoa CLS',
    scopeFilter: 'Khoa CLS',
    lastLogin: '28/09/2026 08:11:30',
    status: 'Đã khóa',
  },
]

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-700">{children}</label>
}

function CreateAdminModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal titleId="create-admin-title" onClose={onClose}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="create-admin-title" className="text-lg font-semibold text-slate-900">
              Cấp mới tài khoản quản trị (Admin)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Tài khoản sẽ nhận liên kết kích hoạt và thiết lập mật khẩu qua email bệnh viện.
            </p>
          </div>
          <button
            aria-label="Đóng hộp thoại"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onClose()
          }}
        >
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div>
              <FieldLabel>Mã quản trị</FieldLabel>
              <input
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-500"
                disabled
                value="ADM-005"
              />
            </div>
            <div>
              <FieldLabel>Họ và tên quản trị viên</FieldLabel>
              <input
                autoFocus
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
                placeholder="Nhập họ và tên"
                required
              />
            </div>
            <div>
              <FieldLabel>Tên đăng nhập</FieldLabel>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
                placeholder="Ví dụ: kiet.nguyen"
                required
              />
            </div>
            <div>
              <FieldLabel>Email bệnh viện</FieldLabel>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
                placeholder="kiet.nguyen@hpms.med.vn"
                required
                type="email"
              />
            </div>
            <div>
              <FieldLabel>Phạm vi phụ trách</FieldLabel>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
                defaultValue="Toàn bệnh viện"
              >
                <option>Toàn bệnh viện</option>
                <option>Khối Lâm sàng</option>
                <option>Khối Cận lâm sàng &amp; Dược</option>
              </select>
            </div>
            <div>
              <FieldLabel>Vai trò</FieldLabel>
              <div className="relative">
                <select
                  aria-label="Vai trò được khóa cố định"
                  className="w-full cursor-not-allowed appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-600"
                  disabled
                >
                  <option>Admin - Quản trị viên cơ sở</option>
                </select>
                <Lock aria-hidden="true" strokeWidth={1.75} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Vai trò mặc định cho tài khoản quản trị mới.</p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              onClick={onClose}
              type="button"
            >
              Hủy bỏ
            </button>
            <button
              className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700"
              type="submit"
            >
              Cấp tài khoản &amp; Gửi liên kết kích hoạt
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default function IdentityManagement() {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('Tất cả')
  const [status, setStatus] = useState('Tất cả')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const accounts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    return ADMIN_ACCOUNTS.filter((account) => {
      const matchesQuery =
        !normalizedQuery ||
        [account.id, account.name, account.email].some((value) =>
          value.toLocaleLowerCase('vi').includes(normalizedQuery),
        )
      const matchesScope = scope === 'Tất cả' || account.scopeFilter === scope
      const matchesStatus = status === 'Tất cả' || account.status === status
      return matchesQuery && matchesScope && matchesStatus
    })
  }, [query, scope, status])

  return (
    <>
      <section>
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-700">
            <ShieldCheck aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
            Kiểm soát truy cập quản trị
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Quản trị danh tính &amp; Phân quyền quản trị
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cấp tài khoản, giới hạn phạm vi và kiểm soát quyền truy cập hệ thống.
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-3 xl:flex-row">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1 xl:max-w-sm">
                <Search aria-hidden="true" strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Tìm kiếm quản trị viên"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm kiếm quản trị viên..."
                  value={query}
                />
              </div>
              <select
                aria-label="Phạm vi quản trị"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 sm:min-w-48"
                onChange={(event) => setScope(event.target.value)}
                value={scope}
              >
                <option>Tất cả</option>
                <option>Toàn bệnh viện</option>
                <option>Khoa Cấp cứu</option>
                <option>Khoa Khám bệnh</option>
                <option>Khoa CLS</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                aria-label="Trạng thái tài khoản"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 sm:min-w-44"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option>Tất cả</option>
                <option>Đang hoạt động</option>
                <option>Đã khóa</option>
              </select>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700"
                onClick={() => setIsModalOpen(true)}
                type="button"
              >
                <Plus aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                Cấp tài khoản quản trị mới
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {[
                    'Mã quản trị',
                    'Họ và tên',
                    'Email / Username',
                    'Vai trò',
                    'Phạm vi quản lý',
                    'Đăng nhập lần cuối',
                    'Trạng thái',
                    'Thao tác',
                  ].map((heading) => (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70" key={account.id}>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-cyan-700">{account.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{account.name}</div>
                      {account.isRoot && <div className="mt-0.5 text-xs text-slate-400">Tài khoản đang đăng nhập</div>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{account.email}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {account.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">
                        {account.scope}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-600">{account.lastLogin}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium ${
                        account.status === 'Đang hoạt động'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${account.status === 'Đang hoạt động' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {account.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          aria-label={`Phân quyền cho ${account.name}`}
                          className="rounded-md border border-slate-200 p-2 text-slate-500 transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                          title="Phân quyền"
                          type="button"
                        >
                          <ShieldPlus aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                        </button>
                        <span
                          className="inline-flex"
                          title={account.isRoot
                            ? 'Không thể tự giáng quyền hoặc khóa tài khoản root (Self-Demotion Guard)'
                            : undefined}
                        >
                          <button
                            aria-label={`${account.status === 'Đã khóa' ? 'Mở khóa' : 'Khóa'} tài khoản ${account.name}`}
                            className={`rounded-md border p-2 transition-colors ${
                              account.isRoot
                                ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                                : account.status === 'Đã khóa'
                                  ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                  : 'border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                            }`}
                            disabled={account.isRoot}
                            title={account.isRoot
                              ? undefined
                              : account.status === 'Đã khóa' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            type="button"
                          >
                            {account.status === 'Đã khóa' ? (
                              <LockOpen aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                            ) : (
                              <Lock aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                            )}
                          </button>
                        </span>
                        <button
                          aria-label={`Đặt lại mật khẩu cho ${account.name}`}
                          className="rounded-md border border-slate-200 p-2 text-slate-500 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                          title="Đặt lại mật khẩu"
                          type="button"
                        >
                          <RotateCcw aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={8}>
                      Không tìm thấy quản trị viên phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3">
            <p className="text-xs text-slate-500">Hiển thị {accounts.length} trong tổng số 16 tài khoản</p>
            <div className="flex items-center gap-2">
              <button
                aria-label="Trang trước"
                className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-400 hover:bg-slate-50"
                type="button"
              >
                <ChevronLeft aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-slate-600">Trang 1 / 4</span>
              <button
                aria-label="Trang sau"
                className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                type="button"
              >
                <ChevronRight aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && <CreateAdminModal onClose={() => setIsModalOpen(false)} />}
    </>
  )
}
