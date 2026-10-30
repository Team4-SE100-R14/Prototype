import type { ButtonHTMLAttributes } from "react"

const variants = {
  primary:
    "bg-brand-deep text-surface shadow-clinical-xs hover:bg-brand-dark disabled:bg-subsurface disabled:text-text-disabled",
  cta:
    "bg-cta text-surface shadow-clinical-xs hover:bg-cta-hover disabled:bg-subsurface disabled:text-text-disabled",
  ghost:
    "text-text-secondary hover:bg-subsurface disabled:opacity-48",
  secondary:
    "border border-border-strong bg-surface text-text-secondary shadow-clinical-xs hover:border-brand-primary hover:bg-canvas hover:text-brand-deep disabled:opacity-48",
  report:
    "bg-cta text-surface shadow-clinical-xs hover:bg-cta-hover disabled:bg-subsurface disabled:text-text-disabled",
  danger:
    "border border-cpoe-block-border/40 bg-surface text-cpoe-block hover:bg-cpoe-block-bg disabled:opacity-48",
  destructive:
    "bg-critical text-surface shadow-clinical-xs hover:bg-sptt-red disabled:bg-subsurface disabled:text-text-disabled",
  success:
    "bg-cta text-surface shadow-clinical-xs hover:bg-cta-hover disabled:bg-subsurface disabled:text-text-disabled",
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
      className={`cursor-pointer rounded-lg px-4 py-2.5 font-heading text-sm font-semibold transition-all duration-150 ease-out active:scale-[0.98] select-none hover:shadow-clinical-sm disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
