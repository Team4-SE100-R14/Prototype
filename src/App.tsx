import { useEffect, useState } from 'react'
import LoginPage from './components/LoginPage'
import MfaModal from './components/MfaModal'
import SessionSecurity from './components/SessionSecurity'
import { SESSION_DURATION } from './lib/sessionSecurity'
import { completeMfaSetup, MFA_CHANGED_EVENT, MFA_STORAGE_KEY, readMfaState, type StaffAccount } from './lib/mfaLifecycle'
import AdminDashboard from './components/dashboards/AdminDashboard'
import PhysicianDashboard from './components/dashboards/PhysicianDashboard'
import NurseDashboard from './components/dashboards/NurseDashboard'
import ParaclinicalTechDashboard from './components/dashboards/ParaclinicalTechDashboard'
import ReceptionistDashboard from './components/dashboards/ReceptionistDashboard'
import PatientDashboard from './components/dashboards/PatientDashboard'

export type UserRole = 'admin' | 'physician' | 'nurse' | 'paraclinical_tech' | 'receptionist' | 'patient'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
  department?: string
  avatar?: string
}

const MFA_ROLES = new Set<UserRole>([
  'admin',
  'physician',
  'nurse',
  'paraclinical_tech',
  'receptionist',
  'patient',
])

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  'admin': {
    password: 'Admin@12345',
    user: { id: 'AD001', name: 'Trần Thị Quản Lý', role: 'admin', department: 'KHTH & Operations' }
  },
  'dat.nguyen': {
    password: 'Doctor@12345',
    user: { id: 'NV-26-004', name: 'BS. Trần Minh Khoa', role: 'physician', department: 'Khoa Nội tổng quát' }
  },
  'mai.le': {
    password: 'Nurse@12345',
    user: { id: 'NV-26-012', name: 'ĐD. Phạm Thị Lan', role: 'nurse', department: 'Khoa Nội tổng quát' }
  },
  'tuan.cls': {
    password: 'Tech@12345',
    user: { id: 'NV-26-025', name: 'KTV. Lê Quang Minh', role: 'paraclinical_tech', department: 'Xét nghiệm & CĐHA' }
  },
  'lan.tiepdon': {
    password: 'Reception@123',
    user: { id: 'NV-26-030', name: 'Phạm Thị Lan Anh', role: 'receptionist', department: 'Khoa Khám ngoại trú' }
  },
  'bn-26-0089': {
    password: 'Patient@1234',
    user: { id: 'BN-26-0089', name: 'Nguyễn Văn An', role: 'patient' }
  },
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('hpms-demo-session') || sessionStorage.getItem('hpms-demo-session')
      if (!saved) return null
      let session: { id?: string; mfaVerified?: boolean; expiresAt?: number; mfaEpoch?: number }
      try {
        session = JSON.parse(saved)
      } catch {
        session = { id: saved }
      }
      const restored = Object.values(DEMO_USERS).find(entry => entry.user.id === session?.id)?.user
      if (!restored) {
        localStorage.removeItem('hpms-demo-session')
        sessionStorage.removeItem('hpms-demo-session')
        return null
      }
      if (typeof session.expiresAt === 'number' && session.expiresAt <= Date.now()) return null
      const mfa = readMfaState(restored.id)
      if ((session.mfaEpoch || 0) !== mfa.sessionEpoch || mfa.needsSetup) return null
      const privileged = MFA_ROLES.has(restored.role)
      return !privileged || session.mfaVerified === true ? restored : null
    } catch {
      return null
    }
  })
  const [pendingMfa, setPendingMfa] = useState<{ user: AuthUser; remember: boolean; epoch: number } | null>(null)

  const completeLogin = (authenticatedUser: AuthUser, remember: boolean) => {
    try {
      localStorage.removeItem('hpms-demo-session')
      sessionStorage.removeItem('hpms-demo-session')
      sessionStorage.removeItem('hpms-patient-pii-unmasked')
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('hpms-demo-session', JSON.stringify({ id: authenticatedUser.id, mfaVerified: true, expiresAt: Date.now() + SESSION_DURATION, mfaEpoch: readMfaState(authenticatedUser.id).sessionEpoch }))
      sessionStorage.setItem(`hpms-last-activity-${authenticatedUser.id}`, String(Date.now()))
      sessionStorage.removeItem(`hpms-unlock-attempts-${authenticatedUser.id}`)
    } catch {
      // Browser storage is optional for the demonstration.
    }
    setUser(authenticatedUser)
    setPendingMfa(null)
  }

  const handleLogin = (username: string, password: string, remember: boolean): string | null => {
    const entry = Object.prototype.hasOwnProperty.call(DEMO_USERS, username) ? DEMO_USERS[username] : undefined
    if (!entry) return 'Tên đăng nhập không tồn tại.'
    if (entry.password !== password) return 'Mật khẩu không chính xác.'
    if (MFA_ROLES.has(entry.user.role)) {
      setPendingMfa({ user: entry.user, remember, epoch: readMfaState(entry.user.id).sessionEpoch })
    } else {
      completeLogin(entry.user, remember)
    }
    return null
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('hpms-demo-session')
      sessionStorage.removeItem('hpms-demo-session')
      sessionStorage.removeItem('hpms-patient-pii-unmasked')
      if (user) {
        sessionStorage.removeItem(`hpms-last-activity-${user.id}`)
        sessionStorage.removeItem(`hpms-unlock-attempts-${user.id}`)
      }
    } catch {
      // Allow sign-out even when browser storage is unavailable.
    }
    setUser(null)
  }

  useEffect(() => {
    if (!user) return
    const epoch = readMfaState(user.id).sessionEpoch
    const check = () => { if (readMfaState(user.id).sessionEpoch !== epoch) handleLogout() }
    const storage = (event: StorageEvent) => { if (event.key === MFA_STORAGE_KEY || event.key === null) check() }
    window.addEventListener(MFA_CHANGED_EVENT, check)
    window.addEventListener('storage', storage)
    return () => { window.removeEventListener(MFA_CHANGED_EVENT, check); window.removeEventListener('storage', storage) }
  }, [user])

  if (!user || !Object.values(DEMO_USERS).some(entry => entry.user.id === user.id)) {
    return <>
      <LoginPage onLogin={handleLogin} demoUsers={DEMO_USERS} />
      {pendingMfa && <MfaModal key={`${pendingMfa.user.id}:${pendingMfa.epoch}`} user={pendingMfa.user} requireSetup={readMfaState(pendingMfa.user.id).needsSetup} onSetupCompleted={() => completeMfaSetup(pendingMfa.user.id)} onCancel={() => setPendingMfa(null)} onVerified={() => {
        const current = readMfaState(pendingMfa.user.id)
        if (current.sessionEpoch !== pendingMfa.epoch || current.needsSetup) {
          setPendingMfa({ ...pendingMfa, epoch: current.sessionEpoch })
          return
        }
        completeLogin(pendingMfa.user, pendingMfa.remember)
      }} />}
    </>
  }

  const dashboardProps = { user, onLogout: handleLogout }
  const account = Object.entries(DEMO_USERS).find(([, entry]) => entry.user.id === user.id)
  const staff: StaffAccount[] = Object.entries(DEMO_USERS).filter(([, entry]) => entry.user.role !== 'patient').map(([username, entry]) => ({
    user: entry.user, username, employeeId: entry.user.id,
    department: entry.user.id === 'NV-26-004' ? 'Cấp cứu & Triage' : entry.user.department || 'Chưa phân khoa',
  })).sort((a, b) => Number(b.user.id === 'NV-26-004') - Number(a.user.id === 'NV-26-004'))
  const secure = (dashboard: React.ReactNode) => (
    <SessionSecurity key={user.id} user={user} staff={staff} username={account?.[0] || user.id} onLogout={handleLogout} validatePassword={password => !!account && account[1].password === password}>
      {dashboard}
    </SessionSecurity>
  )

  switch (user.role) {
    case 'admin': return secure(<AdminDashboard {...dashboardProps} />)
    case 'physician': return secure(<PhysicianDashboard {...dashboardProps} />)
    case 'nurse': return secure(<NurseDashboard {...dashboardProps} />)
    case 'paraclinical_tech': return secure(<ParaclinicalTechDashboard {...dashboardProps} />)
    case 'receptionist': return secure(<ReceptionistDashboard {...dashboardProps} />)
    case 'patient': return secure(<PatientDashboard {...dashboardProps} />)
    default: return <LoginPage onLogin={handleLogin} demoUsers={DEMO_USERS} />
  }
}
