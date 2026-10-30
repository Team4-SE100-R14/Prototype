import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bed,
  Calendar,
  Check,
  ChevronRight,
  Download,
  FileText,
  FlaskConical,
  HeartPulse,
  IdCard,
  Info,
  Lock,
  MoreVertical,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react"

export type IconName =
  | "activity"
  | "alert"
  | "arrow"
  | "bed"
  | "calendar"
  | "check"
  | "chevron"
  | "close"
  | "document"
  | "download"
  | "flask"
  | "heart-pulse"
  | "id-card"
  | "info"
  | "lock"
  | "more-vertical"
  | "search"
  | "shield-check"
  | "sparkles"
  | "stethoscope"
  | "user"
  | "user-check"

const ICONS: Record<IconName, LucideIcon> = {
  activity: Activity,
  alert: AlertTriangle,
  arrow: ArrowRight,
  bed: Bed,
  calendar: Calendar,
  check: Check,
  chevron: ChevronRight,
  close: X,
  document: FileText,
  download: Download,
  flask: FlaskConical,
  "heart-pulse": HeartPulse,
  "id-card": IdCard,
  info: Info,
  lock: Lock,
  "more-vertical": MoreVertical,
  search: Search,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  stethoscope: Stethoscope,
  user: User,
  "user-check": UserCheck,
}

export default function NamedIcon({
  name,
  className = "size-5",
}: {
  name: IconName
  className?: string
}) {
  const Component = ICONS[name]
  return <Component aria-hidden="true" strokeWidth={1.75} className={className} />
}
