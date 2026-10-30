import type { LucideIcon, LucideProps } from "lucide-react"

export default function Icon({
  icon: Component,
  className = "h-5 w-5",
  strokeWidth = 1.75,
  ...props
}: LucideProps & {
  icon: LucideIcon
}) {
  return (
    <Component
      aria-hidden="true"
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  )
}
