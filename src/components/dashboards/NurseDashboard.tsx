import { useState } from 'react'
import type { AuthUser } from '../../App'
import WardVitalWorkspace from '../clinical/WardVitalWorkspace'
import EmergencyArrivalBanner from '../intake/EmergencyArrivalBanner'
import IntakeQueueBoard from '../intake/IntakeQueueBoard'
import TopNav from '../TopNav'
import Button from '../ui/Button'

interface Props { user: AuthUser; onLogout: () => void }

type Workspace = 'beds' | 'alerts' | 'intake'

const TABS: Array<{ id: Workspace; label: string }> = [
  { id: 'beds', label: 'Giường bệnh & Sinh hiệu' },
  { id: 'alerts', label: 'Danh sách cảnh báo' },
  { id: 'intake', label: 'Hàng đợi tiếp nhận' },
]

export default function NurseDashboard({ user, onLogout }: Props) {
  const [workspace, setWorkspace] = useState<Workspace>('beds')
  return (
    <div className="min-h-screen bg-canvas text-text-primary">
      <TopNav user={user} onLogout={onLogout} title="Không gian Điều dưỡng" />
      <EmergencyArrivalBanner user={user} />
      <div className="border-b border-border-subtle bg-surface px-4 py-2 sm:px-6">
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Chức năng Điều dưỡng">
          {TABS.map(tab => (
            <Button
              key={tab.id}
              variant="ghost"
              role="tab"
              aria-selected={workspace === tab.id}
              onClick={() => setWorkspace(tab.id)}
              className={`shrink-0 ${workspace === tab.id ? 'bg-brand-surface text-brand-deep' : ''}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
      <div className={workspace === 'intake' ? 'hidden' : 'block'}>
        <WardVitalWorkspace
          user={user}
          onLogout={onLogout}
          embedded
          requestedView={workspace === 'alerts' ? 'alerts' : 'beds'}
          onRequestedViewChange={view => setWorkspace(view)}
        />
      </div>
      {workspace === 'intake' && (
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <IntakeQueueBoard user={user} />
        </main>
      )}
    </div>
  )
}
