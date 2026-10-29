import type { ReactNode } from "react"

export default function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: ReactNode
  required?: boolean
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-text-secondary"
    >
      {children} {required && <span className="text-critical">*</span>}
    </label>
  )
}
