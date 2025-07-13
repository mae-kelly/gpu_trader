"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MiniChart } from "@/components/ui/mini-chart"
import { MoreHorizontal, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { CoinData } from "@/types"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { useDashboardStore } from "@/lib/store"
import { executeTrade } from "@/lib/api"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface MomentumTableCleanProps {
  coins: CoinData[]
}

export function MomentumTableClean({ coins }: MomentumTableCleanProps) {
  const router = useRouter()
  const { wallet, setWallet, setError } = useDashboardStore()
  const [tradingStates, setTradingStates] = useState<Record<string, boolean>>({})

  const handleTrade = async (coin: CoinData, type: 'buy' | 'sell') => {
    if (coin.honeypotStatus === 'unsafe') {
      setError('Cannot trade unsafe tokens')
      return
    }

    const tradeKey = `${coin.id}-${type}`
    setTradingStates(prev => ({ ...prev, [tradeKey]: true }))

    try {
      const amount = type === 'buy' ? 1 : 0.5
      await executeTrade(coin.id, type, amount)
      
      if (type === 'buy') {
        setWallet({
          balance: wallet.balance - amount,
          activePositions: wallet.activePositions + 1
        })
      } else {
        const profit = amount * 1.1
        setWallet({
          balance: wallet.balance + profit,
          totalProfit: wallet.totalProfit + (profit - amount),
          activePositions: Math.max(0, wallet.activePositions - 1)
        })
      }
      
      setError(null)
    } catch (error) {
      console.error('Trade failed:', error)
      setError('Trade execution failed')
    } finally {
      setTradingStates(prev => ({ ...prev, [tradeKey]: false }))
    }
  }

  const handleRowClick = (coinId: string) => {
    router.push(`/coin/${coinId}`)
  }

  if (coins.length === 0) {
    return (
      <Card className="dashboard-card p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted/20 rounded-full flex items-center justify-center">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">No coins in range</h3>
            <p className="text-muted-foreground">
              Adjust your filters to see more opportunities
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="dashboard-card p-0 overflow-hidden">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">Momentum Scanner</h2>
            <p className="text-sm text-muted-foreground">
              Tokens gaining 9-13% in the last 15 minutes • Click rows for details
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-500">Live Feed</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-semibold text-foreground/80">Token</TableHead>
              <TableHead className="font-semibold text-foreground/80">Change</TableHead>
              <TableHead className="font-semibold text-foreground/80">Price</TableHead>
              <TableHead className="font-semibold text-foreground/80">Volume</TableHead>
              <TableHead className="font-semibold text-foreground/80">Safety</TableHead>
              <TableHead className="font-semibold text-foreground/80">Chart</TableHead>
              <TableHead className="font-semibold text-foreground/80">Actions</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coins.map((coin, index) => (
              <TableRow 
                key={coin.id} 
                className="table-hover border-border/30 group"
                onClick={() => handleRowClick(coin.id)}
              >
                <TableCell className="font-medium py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                      index % 3 === 0 ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                      index % 3 === 1 ? 'bg-gradient-to-br from-green-500 to-teal-600' :
                      'bg-gradient-to-br from-orange-500 to-red-600'
                    }`}>
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{coin.symbol}</div>
                      <div className="text-xs text-muted-foreground">{coin.name}</div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-full ${coin.percentChange > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {coin.percentChange > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <span className={`font-semibold ${coin.percentChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(coin.percentChange)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="font-mono text-sm font-medium">
                  {formatCurrency(coin.currentPrice, 6)}
                </TableCell>
                
                <TableCell className="font-medium">
                  {formatCurrency(coin.tradingVolume)}
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant={coin.honeypotStatus === 'safe' ? 'default' : coin.honeypotStatus === 'unsafe' ? 'destructive' : 'secondary'}
                    className="capitalize font-semibold"
                  >
                    {coin.honeypotStatus}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="w-24 h-8">
                    <MiniChart 
                      data={coin.chartData.slice(-10).map(d => ({ value: d.price }))}
                      color={coin.percentChange > 0 ? "#10b981" : "#ef4444"}
                    />
                  </div>
                </TableCell>
                
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      disabled={coin.honeypotStatus === 'unsafe' || tradingStates[`${coin.id}-buy`]}
                      className="trading-button-buy shadow-sm"
                      onClick={() => handleTrade(coin, 'buy')}
                    >
                      {tradingStates[`${coin.id}-buy`] ? 'Buying...' : 'Buy'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={coin.honeypotStatus === 'unsafe' || tradingStates[`${coin.id}-sell`]}
                      className="trading-button-sell border-red-600/20 text-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => handleTrade(coin, 'sell')}
                    >
                      {tradingStates[`${coin.id}-sell`] ? 'Selling...' : 'Sell'}
                    </Button>
                  </div>
                </TableCell>
                
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
