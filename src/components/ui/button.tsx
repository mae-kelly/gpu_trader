import * as React from "react"
export const Button = React.forwardRef<HTMLButtonElement, any>(({ className, children, ...props }, ref) => (
  <button ref={ref} className={`inline-flex items-center justify-center rounded-md text-sm font-medium ${className || ''}`} {...props}>
    {children}
  </button>
))
Button.displayName = "Button"
