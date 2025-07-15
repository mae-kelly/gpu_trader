"use client"

import { useEffect, useState } from 'react'
import { useRealtimeStore } from '@/lib/realtime-store'

export default function GPUDashboard() {
  const { 
    isConnected, 
    tokens,
    totalScanned,
    getFilteredTokens,
    startRealTimeScanning
  } = useRealtimeStore()

  const [gpuStatus, setGpuStatus] = useState('INITIALIZING')

  useEffect(() => {
    startRealTimeScanning()
    setGpuStatus('GPU_ONLINE')
  }, [startRealTimeScanning])

  const filteredTokens = getFilteredTokens()

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* GPU Status Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            🔥 FORCE GPU SCANNER
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <div className={`px-4 py-2 rounded font-bold ${
              gpuStatus === 'GPU_ONLINE' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
            }`}>
              {gpuStatus}
            </div>
            <div className="text-green-400">
              {isConnected ? '⚡ CONNECTED' : '❌ OFFLINE'}
            </div>
            <div className="text-blue-400">
              📊 {totalScanned.toLocaleString()} SCANNED
            </div>
          </div>
        </div>

        {/* Tokens Grid */}
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold text-green-400">
            🎯 MOMENTUM TOKENS ({filteredTokens.length})
          </h2>
          
          {filteredTokens.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-xl text-gray-400">
                GPU SCANNING FOR MOMENTUM...
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTokens.map((token, i) => (
                <div key={i} className="bg-gray-900 p-4 rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      +{token.priceChange24h?.toFixed(2)}%
                    </div>
                    <div className="text-gray-400 text-sm">
                      ${token.price?.toFixed(8)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
