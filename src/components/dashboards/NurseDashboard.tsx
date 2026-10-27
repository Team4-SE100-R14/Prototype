import type { AuthUser } from '../../App'
import WardVitalWorkspace from '../clinical/WardVitalWorkspace'

interface Props { user: AuthUser; onLogout: () => void }

export default function NurseDashboard(props: Props) {
  return <WardVitalWorkspace {...props} />
}
