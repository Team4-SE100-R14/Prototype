import type { AuthUser, UserRole } from '../App'
import SessionSecurityMenu from './SessionSecurityMenu'

interface Props {
  user: AuthUser
  onLogout: () => void
  title?: string
  actions?: React.ReactNode
}

const ROLE_META: Record<UserRole, { label: string; badge: string; icon: string }> = {
  admin: { label: 'Quản trị BV', badge: 'bg-slate-100 text-slate-800 border-slate-300', icon: '🏥' },
  physician: { label: 'Bác sĩ', badge: 'bg-cyan-50 text-cyan-800 border-cyan-300', icon: '🩺' },
  nurse: { label: 'Điều dưỡng', badge: 'bg-teal-50 text-teal-800 border-teal-300', icon: '❤️' },
  paraclinical_tech: { label: 'KTV Cận lâm sàng', badge: 'bg-sky-50 text-sky-800 border-sky-300', icon: '🧪' },
  receptionist: { label: 'Tiếp đón', badge: 'bg-blue-50 text-blue-800 border-blue-300', icon: '🪪' },
  patient: { label: 'Bệnh nhân', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: '👤' },
}

export default function TopNav({ user, onLogout, title, actions }: Props) {
  const meta = ROLE_META[user.role]
  const now = new Date()
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 flex-shrink-0 sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 bg-cyan-600 rounded-md flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <span className="font-bold text-slate-900 text-sm" style={{fontFamily:'Figtree,sans-serif'}}>HPMS</span>
        {title && (
          <>
            <span className="text-slate-300 mx-1">/</span>
            <span className="text-sm text-slate-600 truncate hidden sm:block">{title}</span>
          </>
        )}
      </div>

      {/* Center actions */}
      {actions && <div className="flex-1 flex items-center gap-2">{actions}</div>}
      {!actions && <div className="flex-1" />}

      {/* Right side */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <SessionSecurityMenu />
        {/* Clock */}
        <div className="hidden md:block text-right">
          <div className="text-xs font-mono font-semibold text-slate-700">{timeStr}</div>
          <div className="text-xs text-slate-400">{dateStr}</div>
        </div>

        {/* Role badge */}
        <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.badge}`}>
          <span>{meta.icon}</span>
          {meta.label}
        </span>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm" style={{fontFamily:'Figtree,sans-serif'}}>
            {user.name.split(' ').pop()?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight" style={{fontFamily:'Figtree,sans-serif'}}>{user.name}</div>
            {user.department && <div className="text-xs text-slate-400 leading-tight truncate max-w-36">{user.department}</div>}
          </div>
          <button
            onClick={onLogout}
            className="ml-1 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Đăng xuất"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
