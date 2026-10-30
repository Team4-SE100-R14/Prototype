import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"

const field =
  "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 font-sans text-sm text-text-primary placeholder:text-text-disabled transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand-primary focus:outline-none focus:ring-3 focus:ring-brand-primary/20 aria-[invalid=true]:border-[1.5px] aria-[invalid=true]:border-critical aria-[invalid=true]:bg-critical-bg disabled:cursor-not-allowed disabled:bg-subsurface disabled:text-text-muted"

export const TextInput =
  forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className = "", ...props }, ref) => (
      <input ref={ref} className={`${field} ${className}`} {...props} />
    ),
  )
TextInput.displayName = "TextInput"

export function TextArea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${field} ${className}`} {...props} />
}
