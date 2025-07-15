"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRealtimeStore } from '@/lib/realtime-store'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

export default function RealtimeMomentumTable() {
  const { 
    tokens,
    isConnected, 
    lastUpdate,
    totalScanned,
    updateTrigger,
    startRealTimeScanning,
    getFilteredTokens
  } = useRealtimeStore()

  // Force re-render when updateTrigger changes
  const [renderKey, setRenderKey] = useState(0)

  useEffect(() => {
    console.log('🚀 Table component mounted')
    startRealTimeScanning()
  }, [startRealTimeScanning])

  // Update render key when store updates
  useEffect(() => {
    setRenderKey(prev => prev + 1)
    console.log('🔄 Store updated, forcing re-render')
  }, [updateTrigger, tokens, lastUpdate])

  const filteredTokens = getFilteredTokens()

  console.log('🎨 Table render:', {
    renderKey,
    isConnected,
    totalTokens: tokens.length,
    filteredTokens: filteredTokens.length,
    lastUpdate: new Date(lastUpdate).toLocaleTimeString()
  })

  return (
    <Card className="bg-black border-gray-800" key={renderKey}>
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Real-Time Momentum Scanner
            </h2>
            <p className="text-sm text-gray-400">
              Live tracking • {filteredTokens.length} tokens in 9-13% range • {tokens.length} total • Render: {renderKey}
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
              Last: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredTokens.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-lg mb-2">
              {isConnected ? 'Scanning for real tokens...' : 'Connecting...'}
            </div>
            <div className="text-sm">
              {isConnected ? 
                `Scanner active • ${tokens.length} tokens tracked • Looking for 9-13% gains` : 
                'Waiting for WebSocket connection...'
              }
            </div>
            <div className="text-xs mt-2 text-yellow-400">
              Render key: {renderKey} • Update trigger: {updateTrigger}
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/20">
                <th className="text-left p-3 text-xs font-medium text-gray-400">Token</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Change</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Price</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Volume</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Chain</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token, index) => (
                <tr key={`${token.chain}-${token.address}-${index}-${renderKey}`} className="border-b border-gray-800 hover:bg-gray-900/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.name}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {token.priceChange24h > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span className={`font-semibold ${token.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(token.priceChange24h)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="p-3 font-mono text-sm text-white">
                    {formatCurrency(token.price)}
                  </td>
                  
                  <td className="p-3 text-white">
                    {formatCurrency(token.volume24h)}
                  </td>
                  
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      {token.chain}
                    </span>
                  </td>
                  
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700">
                        Buy
                      </Button>
                      <Button size="sm" variant="outline" className="px-2 py-1 text-xs">
                        Sell
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  )
}
