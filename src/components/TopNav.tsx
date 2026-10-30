import { HeartPulse, LogOut } from 'lucide-react'
import type { AuthUser, UserRole } from '../App'
import SessionSecurityMenu from './SessionSecurityMenu'
import Tooltip from './ui/Tooltip'
import NamedIcon, { type IconName } from './ui/NamedIcon'

interface Props {
  user: AuthUser
  onLogout: () => void
  title?: string
  actions?: React.ReactNode
}

const ROLE_META: Record<UserRole, { label: string; badge: string; icon: IconName; desc: string }> = {
  admin: {
    label: 'Quản trị BV',
    badge: 'bg-role-admin-bg text-role-admin border-role-admin-border',
    icon: 'shield-check',
    desc: 'Vai trò Quản trị: Quản lý người dùng, phân ca trực, theo dõi công suất và nhật ký kiểm toán.',
  },
  physician: {
    label: 'Bác sĩ',
    badge: 'bg-role-doctor-bg text-role-doctor border-role-doctor-border',
    icon: 'stethoscope',
    desc: 'Vai trò Bác sĩ: Khám bệnh, chẩn đoán ICD-10, ra y lệnh CLS và kê đơn thuốc.',
  },
  nurse: {
    label: 'Điều dưỡng',
    badge: 'bg-role-nurse-bg text-role-nurse border-role-nurse-border',
    icon: 'heart-pulse',
    desc: 'Vai trò Điều dưỡng: Nhập và theo dõi sinh hiệu tại giường, quản lý giường bệnh.',
  },
  paraclinical_tech: {
    label: 'KTV Cận lâm sàng',
    badge: 'bg-role-paraclinical-bg text-role-paraclinical border-role-paraclinical-border',
    icon: 'flask',
    desc: 'Vai trò KTV: Tiếp nhận mẫu, phân tích xét nghiệm, tải ảnh chẩn đoán và trả kết quả.',
  },
  receptionist: {
    label: 'Tiếp đón',
    badge: 'bg-role-receptionist-bg text-role-receptionist border-role-receptionist-border',
    icon: 'id-card',
    desc: 'Vai trò Tiếp đón: Tiếp nhận bệnh nhân, phân loại ưu tiên cấp cứu và điều phối hàng đợi.',
  },
  patient: {
    label: 'Bệnh nhân',
    badge: 'bg-role-patient-bg text-role-patient border-role-patient-border',
    icon: 'user-check',
    desc: 'Cổng Bệnh nhân: Xem hồ sơ sức khỏe cá nhân và lịch sử khám (Chỉ đọc).',
  },
}

export default function TopNav({ user, onLogout, title, actions }: Props) {
  const meta = ROLE_META[user.role]
  const now = new Date()
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <header className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center gap-4 border-b border-border-subtle bg-surface px-4">
      {/* Logo */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-deep text-surface shadow-clinical-xs">
          <HeartPulse aria-hidden="true" strokeWidth={2} className="h-4 w-4 text-surface" />
        </div>
        <span className="font-heading text-sm font-bold tracking-tight text-text-primary">HPMS</span>
        {title && (
          <>
            <span className="mx-0.5 text-border-strong">/</span>
            <span className="hidden truncate font-heading text-sm font-medium text-text-secondary sm:block">{title}</span>
          </>
        )}
      </div>

      {/* Center actions */}
      {actions && <div className="flex flex-1 items-center gap-2">{actions}</div>}
      {!actions && <div className="flex-1" />}

      {/* Right side */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <SessionSecurityMenu />
        {/* Clock */}
        <div className="hidden text-right md:block">
          <div className="font-mono text-xs font-semibold tabular-nums text-text-secondary">{timeStr}</div>
          <div className="text-xs tabular-nums text-text-muted">{dateStr}</div>
        </div>

        {/* Role badge */}
        <Tooltip content={meta.desc}>
          <span className={`hidden cursor-help items-center gap-1.5 rounded-full border px-2.5 py-1 font-heading text-xs font-semibold sm:inline-flex ${meta.badge}`}>
            <NamedIcon name={meta.icon} className="size-3.5" />
            {meta.label}
          </span>
        </Tooltip>

        {/* User avatar */}
        <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-surface font-heading text-sm font-semibold text-brand-deep">
            {user.name.split(' ').pop()?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="font-heading text-xs font-semibold leading-tight text-text-primary">{user.name}</div>
            {user.department && <div className="max-w-36 truncate text-xs leading-tight text-text-muted">{user.department}</div>}
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Đăng xuất"
            className="ml-1 cursor-pointer rounded-md p-1.5 text-text-muted transition-colors duration-150 hover:bg-subsurface hover:text-text-primary"
            title="Đăng xuất"
          >
            <LogOut aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
