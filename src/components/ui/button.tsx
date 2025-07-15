import * as React from "react"

const Button = React.forwardRef<HTMLButtonElement, any>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
)
Button.displayName = "Button"

export { Button }
