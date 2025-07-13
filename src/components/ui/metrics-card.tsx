import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import type React from "react"

interface MetricsCardProps {
  title: string
  value: string
  change: {
    value: string
    percentage: string
    isPositive: boolean
  }
  chart?: React.ReactNode
}

export function MetricsCard({ title, value, change, chart }: MetricsCardProps) {
  return (
    <Card className="metric-card group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className={`p-1 rounded-full ${change.isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          {change.isPositive ? (
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            +{change.value}
          </span>
          <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
            change.isPositive 
              ? 'text-green-500 bg-green-500/10' 
              : 'text-red-500 bg-red-500/10'
          }`}>
            {change.percentage}
          </span>
        </div>
      </div>
      
      {chart && (
        <div className="mt-6 h-[60px] opacity-80 group-hover:opacity-100 transition-opacity">
          {chart}
        </div>
      )}
    </Card>
  )
}
