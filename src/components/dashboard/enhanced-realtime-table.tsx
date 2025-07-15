"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRealtimeStore } from '@/lib/realtime-store'
import { TrendingUp, TrendingDown, Brain, Eye, Star } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import TokenDetailModal from '../token-details/token-detail-modal'
import { learningSystem } from '@/lib/ml-learning'

export default function EnhancedRealtimeTable() {
  const { 
    getFilteredTokens, 
    startRealTimeScanning, 
    isConnected, 
    totalScanned,
    tokens
  } = useRealtimeStore()

  const [selectedToken, setSelectedToken] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [personalizedTokens, setPersonalizedTokens] = useState<any[]>([])

  useEffect(() => {
    startRealTimeScanning()
    learningSystem.loadFromStorage()
  }, [startRealTimeScanning])

  useEffect(() => {
    const filtered = getFilteredTokens()
    const personalized = learningSystem.getPersonalizedRecommendations(filtered)
    setPersonalizedTokens(personalized)
  }, [getFilteredTokens, tokens])

  const handleTokenClick = (token: any) => {
    setSelectedToken(token)
    setIsModalOpen(true)
    
    // Record user action for learning
    learningSystem.recordUserAction({
      action: 'view',
      token: token.address,
      timestamp: Date.now(),
      preferences: {} // Would include user preferences
    })
  }

  const handleQuickAction = (token: any, action: 'buy' | 'sell' | 'watchlist') => {
    // Record action for learning
    learningSystem.recordUserAction({
      action,
      token: token.address,
      timestamp: Date.now(),
      preferences: {}
    })
    
    // Handle the action
    console.log(`${action} action for ${token.symbol}`)
  }

  return (
    <>
      <Card className="bg-black border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                🤖 AI-Powered Real-Time Scanner
              </h2>
              <p className="text-sm text-gray-400">
                Personalized recommendations • {personalizedTokens.length} tokens in 9-13% range
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-400">
                  {isConnected ? 'AI Learning Active' : 'Disconnected'}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Scanned: {totalScanned}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/20">
                <th className="text-left p-3 text-xs font-medium text-gray-400">Token</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Change</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Price</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Volume</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">AI Score</th>
                <th className="text-left p-3 text-xs font-medium text-gray-400">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {personalizedTokens.map((token, index) => (
                <tr 
                  key={`${token.chain}-${token.address}-${index}`} 
                  className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer group"
                  onClick={() => handleTokenClick(token)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {token.symbol}
                          {token.personalizedScore > 0.8 && (
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{token.name}</div>
                        {token.recommendationReason && (
                          <div className="text-xs text-blue-400">{token.recommendationReason}</div>
                        )}
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
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3 text-blue-400" />
                      <div className="w-16 h-2 bg-gray-700 rounded-full">
                        <div 
                          className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                          style={{ width: `${(token.personalizedScore || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white">
                        {((token.personalizedScore || 0.5) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700"
                        onClick={() => handleQuickAction(token, 'buy')}
                      >
                        Buy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="px-2 py-1 text-xs"
                        onClick={() => handleQuickAction(token, 'watchlist')}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="px-2 py-1 text-xs"
                        onClick={() => handleTokenClick(token)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {personalizedTokens.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg mb-2">
                {isConnected ? 'AI is learning your preferences...' : 'Connecting to AI system...'}
              </div>
              <div className="text-sm">
                {isConnected ? 
                  'The system will personalize recommendations as you interact with tokens' : 
                  'Waiting for connection...'
                }
              </div>
            </div>
          )}
        </div>
      </Card>

      <TokenDetailModal 
        token={selectedToken}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
