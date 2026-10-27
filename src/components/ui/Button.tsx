import type { ButtonHTMLAttributes } from "react"

const variants = {
  primary:
    "bg-brand-primary text-surface shadow-sm hover:bg-brand-deep disabled:bg-subsurface disabled:text-text-muted",
  ghost: "text-text-secondary hover:bg-subsurface",
  danger:
    "border border-critical-border bg-surface text-critical hover:bg-critical-bg",
  destructive:
    "bg-critical text-surface shadow-sm hover:bg-critical/90 disabled:bg-subsurface disabled:text-text-muted",
  success:
    "bg-normal text-surface shadow-sm hover:bg-normal/90 disabled:bg-subsurface disabled:text-text-muted",
}

export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}) {
  return (
    <button
      type={type}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
