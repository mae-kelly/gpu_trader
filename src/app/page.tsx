"use client"

import { useEffect, useState } from 'react'

interface Token {
  address: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  tradingScore?: number
  honeypotSafe?: boolean
}

interface Position {
  symbol: string
  buyPrice: number
  currentPrice: number
  quantity: number
  pnl: number
  pnlPercent: number
  invested: number
}

export default function TradingDashboard() {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [botRunning, setBotRunning] = useState(false)
  const [balance, setBalance] = useState(10000)
  const [totalProfit, setTotalProfit] = useState(0)
  const [tokens, setTokens] = useState<Token[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [trades, setTrades] = useState<any[]>([])

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8080')
    
    websocket.onopen = () => {
      console.log('🤖 CONNECTED TO TRADING BOT')
      setIsConnected(true)
      setWs(websocket)
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch(data.type) {
          case 'connection':
            setBalance(data.balance || 10000)
            setBotRunning(data.isRunning || false)
            break
            
          case 'update':
            setTokens(data.tokens || [])
            setPositions(data.positions || [])
            setBalance(data.balance || balance)
            setTotalProfit(data.totalProfit || 0)
            setBotRunning(data.botRunning || false)
            break
            
          case 'trade_executed':
            setTrades(prev => [data, ...prev.slice(0, 9)])
            break
            
          case 'trading_started':
            setBotRunning(true)
            break
            
          case 'trading_stopped':
            setBotRunning(false)
            break
        }
      } catch (error) {}
    }

    websocket.onclose = () => {
      setIsConnected(false)
      setTimeout(() => window.location.reload(), 3000)
    }

    return () => websocket.close()
  }, [])

  const startTrading = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'start_trading' }))
    }
  }

  const stopTrading = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'stop_trading' }))
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
            🤖 ULTIMATE CRYPTO TRADING BOT
          </h1>
          <p className="text-gray-400">Automated day trading with GPU acceleration</p>
        </div>

        {/* Status & Controls */}
        <div className="trading-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{formatCurrency(balance)}</div>
              <div className="text-sm text-gray-400">Balance</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(totalProfit)}
              </div>
              <div className="text-sm text-gray-400">Total P&L</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{positions.length}</div>
              <div className="text-sm text-gray-400">Active Positions</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
              <div className="text-sm text-gray-400">Bot Status</div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            {!botRunning ? (
              <button
                onClick={startTrading}
                disabled={!isConnected}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2"
              >
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                START TRADING
              </button>
            ) : (
              <button
                onClick={stopTrading}
                className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2"
              >
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                STOP TRADING
              </button>
            )}
          </div>
        </div>

        {/* Active Positions */}
        {positions.length > 0 && (
          <div className="trading-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">🎯 Active Positions</h2>
            <div className="space-y-3">
              {positions.map((pos, i) => (
                <div key={i} className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{pos.symbol}</div>
                    <div className="text-sm text-gray-400">
                      Buy: {formatCurrency(pos.buyPrice)} | Qty: {pos.quantity.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${pos.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(pos.pnlPercent)}
                    </div>
                    <div className={`text-sm ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(pos.pnl)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Tokens */}
        <div className="trading-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">📊 Top Momentum Tokens</h2>
          <div className="space-y-3">
            {tokens.slice(0, 10).map((token, i) => (
              <div key={i} className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{token.symbol}</div>
                    <div className="text-xs text-gray-400">
                      {token.honeypotSafe && '🛡️ '} Score: {token.tradingScore?.toFixed(0) || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">
                    +{token.priceChange24h.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatCurrency(token.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trades */}
        {trades.length > 0 && (
          <div className="trading-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">📈 Recent Trades</h2>
            <div className="space-y-2">
              {trades.map((trade, i) => (
                <div key={i} className="bg-gray-800/50 p-3 rounded flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${trade.action === 'BUY' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="font-bold text-white">{trade.action} {trade.token}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white">{formatCurrency(trade.price)}</div>
                    {trade.profit && (
                      <div className={trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatCurrency(trade.profit)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
