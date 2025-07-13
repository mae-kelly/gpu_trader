"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, Shield, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface CoinData {
  id: string
  symbol: string
  name: string
  currentPrice: number
  percentChange: number
  marketCap: number
  tradingVolume: number
  honeypotStatus: 'safe' | 'unsafe' | 'unknown'
  chain: string
  contractAddress: string
  chartData: Array<{ timestamp: number; price: number; volume: number }>
  holders: number
  liquidity: number
}

export default function CoinDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [coin, setCoin] = useState<CoinData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for the coin detail page
    const mockCoin: CoinData = {
      id: params.id as string,
      symbol: 'PEPE',
      name: 'Pepe',
      currentPrice: 0.000001234,
      percentChange: 11.5,
      marketCap: 5200000,
      tradingVolume: 1200000,
      honeypotStatus: 'safe',
      chain: 'ETH',
      contractAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
      chartData: Array.from({ length: 24 }, (_, i) => ({
        timestamp: Date.now() - (23 - i) * 3600000,
        price: 0.000001234 * (1 + Math.random() * 0.2 - 0.1),
        volume: 50000 + Math.random() * 100000
      })),
      holders: 12543,
      liquidity: 850000
    }

    setTimeout(() => {
      setCoin(mockCoin)
      setLoading(false)
    }, 500)
  }, [params.id])

  const formatCurrency = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  const formatNumber = (value: number, decimals = 2) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`
    return value.toFixed(decimals)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading coin data...</p>
        </Card>
      </div>
    )
  }

  if (!coin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Coin Not Found</h2>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
              {coin.symbol.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{coin.symbol}</h1>
              <p className="text-muted-foreground">{coin.name}</p>
            </div>
            <Badge 
              variant={coin.honeypotStatus === 'safe' ? 'default' : coin.honeypotStatus === 'unsafe' ? 'destructive' : 'secondary'}
              className="capitalize"
            >
              {coin.honeypotStatus}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Price Chart</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={coin.chartData}>
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value, 6)}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value, 6), 'Price']}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Trading Panel */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Trading Simulation</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount ($)</label>
                  <input
                    type="number"
                    defaultValue="1.00"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                      Buy
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Sell
                    </Button>
                  </div>
                </div>
              </div>
              <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-2 rounded">
                Simulation mode active - no real trades executed
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Token Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Token Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">{formatCurrency(coin.currentPrice, 6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Change</span>
                  <div className="flex items-center gap-1">
                    {coin.percentChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`font-medium ${coin.percentChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {coin.percentChange > 0 ? '+' : ''}{coin.percentChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-medium">{formatCurrency(coin.marketCap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{formatCurrency(coin.tradingVolume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Holders</span>
                  <span className="font-medium">{formatNumber(coin.holders)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Liquidity</span>
                  <span className="font-medium">{formatCurrency(coin.liquidity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chain</span>
                  <span className="font-medium">{coin.chain}</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                View on Explorer
              </Button>
            </Card>

            {/* Contract Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contract Analysis</h3>
              <div className="space-y-3">
                {[
                  { label: 'Honeypot Check', status: 'PASS', safe: true },
                  { label: 'Ownership Renounced', status: 'PASS', safe: true },
                  { label: 'Liquidity Locked', status: 'PASS', safe: true },
                  { label: 'Contract Verified', status: 'PASS', safe: true },
                  { label: 'Buy Tax', status: '1.0%', safe: true },
                  { label: 'Sell Tax', status: '1.0%', safe: true }
                ].map((check) => (
                  <div key={check.label} className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">{check.label}</span>
                    <Badge variant={check.safe ? 'default' : 'destructive'} className="text-xs">
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
