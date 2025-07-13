"use client"

import { useEffect } from 'react'
import RealtimeMomentumTable from '@/components/dashboard/realtime-momentum-table'
import { useRealtimeStore } from '@/lib/realtime-store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Zap, Target, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { 
    isConnected, 
    lastUpdate, 
    totalScanned,
    tokens,
    updateTrigger,
    getFilteredTokens
  } = useRealtimeStore()

  const filteredTokens = getFilteredTokens()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-6 space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              GPU Swarm Trader
            </h1>
            <p className="text-gray-400">
              Real-time scanning • {filteredTokens.length} tokens in 9-13% range
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2 border-green-500/20 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {isConnected ? 'Scanner Online' : 'Scanner Offline'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Tokens in Range</span>
            </div>
            <div className="text-2xl font-bold text-white">{filteredTokens.length}</div>
            <div className="text-xs text-green-400">9-13% gainers</div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Total Tracked</span>
            </div>
            <div className="text-2xl font-bold text-white">{tokens.length}</div>
            <div className="text-xs text-yellow-400">All tokens</div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Connection</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <div className="text-xs text-purple-400">
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'No updates'}
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Updates</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {updateTrigger}
            </div>
            <div className="text-xs text-green-400">Live trigger</div>
          </Card>
        </div>

        <RealtimeMomentumTable />
      </div>
    </div>
  )
}
