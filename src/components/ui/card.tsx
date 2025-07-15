import * as React from "react"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`trading-card ${className || ''}`}
      {...props}
    />
  )
)
Card.displayName = "Card"

export { Card }
