"use client"

import { Zap } from "lucide-react"
interface AccelerationMeterProps {
  value: number
  className?: string
}
export function AccelerationMeter({ value, className }: AccelerationMeterProps) {
  const normalizedValue = Math.max(-1, Math.min(1, value * 100))
  const rotation = normalizedValue * 90
  const getColor = () => {
    if (value > 0.01) return 'text-green-400'
    if (value < -0.01) return 'text-red-400'
    return 'text-yellow-400'
  }
  const getBgColor = () => {
    if (value > 0.01) return 'bg-green-500/20'
    if (value < -0.01) return 'bg-red-500/20'
    return 'bg-yellow-500/20'
  }
  return (
    <div className={`relative w-16 h-8 ${getBgColor()} rounded-lg flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`${getColor()}`}
      >
        <Zap className="h-4 w-4" />
      </motion.div>
      <div className={`absolute -bottom-1 text-xs font-mono ${getColor()}`}>
        {(value * 1000).toFixed(1)}
      </div>
    </div>
  )
}
