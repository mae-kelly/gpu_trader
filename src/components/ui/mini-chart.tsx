"use client"
import { Line, LineChart, ResponsiveContainer } from "recharts"
interface MiniChartProps {
  data: Array<{ value: number }>
  color?: string
}
export function MiniChart({ data, color = "#10b981" }: MiniChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2.5} 
          dot={false}
          activeDot={false}
          strokeLinecap="round"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
