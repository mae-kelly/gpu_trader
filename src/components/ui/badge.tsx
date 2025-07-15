import * as React from "react"
export const Badge = ({ className, children, variant = "default", ...props }: any) => (
  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className || ''}`} {...props}>
    {children}
  </div>
)
