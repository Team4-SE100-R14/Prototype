import type { ReactNode } from "react"
import Icon from "./Icon"

export type IconName =
  | "activity"
  | "alert"
  | "arrow"
  | "bed"
  | "calendar"
  | "chevron"
  | "close"
  | "document"
  | "download"
  | "info"
  | "lock"
  | "search"
  | "stethoscope"
  | "user"

const PATHS: Record<IconName, ReactNode> = {
  activity: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  alert: (
    <>
      <path d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2L12 3Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
  bed: (
    <>
      <path d="M4 5v14M20 10v9M4 15h16M6 10h12a2 2 0 0 1 2 2v3H4v-3a2 2 0 0 1 2-2Z" />
      <path d="M7 10V8h4v2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  document: (
    <>
      <path d="M6 3h9l4 4v14H6Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M6 3v5a5 5 0 0 0 10 0V3M4 3h4M14 3h4" />
      <path d="M11 13v2a5 5 0 0 0 10 0v-1" />
      <circle cx="21" cy="12" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
}

export default function NamedIcon({
  name,
  className = "size-5",
}: {
  name: IconName
  className?: string
}) {
  return <Icon className={className}>{PATHS[name]}</Icon>
}
