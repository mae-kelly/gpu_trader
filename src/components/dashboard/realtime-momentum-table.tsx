import { useEffect, useMemo } from 'react'
import { FixedSizeList } from 'react-window'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtimeStore } from '@/lib/realtime-store'
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface TokenRowProps {
  index: number
  style: React.CSSProperties
  data: any[]
}

const TokenRow = ({ index, style, data }: TokenRowProps) => {
  const token = data[index]
  if (!token) return null

  const { acceleration, honeypot } = token
  
  const getAccelerationColor = (acc: number) => {
    if (acc > 0.1) return 'text-green-400'
    if (acc < -0.1) return 'text-red-400'
    return 'text-yellow-400'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div style={style} className="flex items-center px-4 py-2 border-b border-gray-800 hover:bg-gray-900/50">
      <div className="flex-1 grid grid-cols-9 gap-3 items-center text-sm">
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {token.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-medium text-white">{token.symbol}</div>
            <div className="text-xs text-gray-400">{token.chain.toUpperCase()}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {token.priceChange24h > 0 ? (
            <TrendingUp className="w-3 h-3 text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
          <span className={token.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}>
            {formatPercentage(token.priceChange24h)}
          </span>
        </div>

        <div className="font-mono text-white">
          {formatCurrency(token.price, 6)}
        </div>

        <div className="text-white">
          {formatCurrency(token.volume24h)}
        </div>

        <div className="text-white">
          {formatCurrency(token.liquidity)}
        </div>

        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-blue-400" />
          <span className={getAccelerationColor(acceleration.acceleration)}>
            {acceleration.acceleration.toFixed(4)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-white">
            {acceleration.momentum.toFixed(2)}
          </span>
        </div>

        <Badge 
          variant={honeypot.isHoneypot ? 'destructive' : 'default'}
          className={`text-xs ${getRiskColor(honeypot.riskLevel)}`}
        >
          {honeypot.riskLevel}
        </Badge>

        <div className="flex gap-1">
          <Button size="sm" className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700">
            Buy
          </Button>
          <Button size="sm" variant="outline" className="px-2 py-1 text-xs">
            Sell
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function RealtimeMomentumTable() {
  const { 
    getFilteredTokens, 
    startRealTimeScanning, 
    isConnected, 
    lastUpdate,
    totalScanned,
    getTokenWithMetrics 
  } = useRealtimeStore()

  useEffect(() => {
    startRealTimeScanning()
  }, [startRealTimeScanning])

  const tokens = useMemo(() => {
    const filtered = getFilteredTokens({
      chains: ['ethereum', 'bsc', 'arbitrum', 'polygon'],
      minVolume: 10000,
      minLiquidity: 50000,
      excludeHoneypots: false
    })
    
    return filtered.map(token => getTokenWithMetrics(token.address)).filter(Boolean)
  }, [getFilteredTokens, getTokenWithMetrics, lastUpdate])

  const sortedTokens = useMemo(() => {
    return tokens.sort((a, b) => {
      const aAccel = a?.acceleration?.acceleration || 0
      const bAccel = b?.acceleration?.acceleration || 0
      return bAccel - aAccel
    })
  }, [tokens])

  return (
    <Card className="bg-black border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Real-Time Momentum Scanner
            </h2>
            <p className="text-sm text-gray-400">
              Live tracking of all tokens with 9-13% gains • {tokens.length} active
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Scanned: {totalScanned.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-800 bg-gray-900/20">
        <div className="grid grid-cols-9 gap-3 text-xs font-medium text-gray-400">
          <div>Token</div>
          <div>Change</div>
          <div>Price</div>
          <div>Volume</div>
          <div>Liquidity</div>
          <div>Acceleration</div>
          <div>Momentum</div>
          <div>Risk</div>
          <div>Actions</div>
        </div>
      </div>

      <FixedSizeList
        height={600}
        itemCount={sortedTokens.length}
        itemSize={60}
        itemData={sortedTokens}
        width="100%"
      >
        {TokenRow}
      </FixedSizeList>
    </Card>
  )
}
