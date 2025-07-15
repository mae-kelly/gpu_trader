"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, TrendingUp, TrendingDown, Brain, Target, Clock, Shield, Zap, Activity, DollarSign, Users, BarChart3, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { mlTrading } from '@/lib/ml-integration'

interface TokenData {
  address: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  chain: string
  timestamp: number
  ml?: any
}

interface TokenDetailModalProps {
  token: TokenData
  isOpen: boolean
  onClose: () => void
}

export default function TokenDetailModal({ token, isOpen, onClose }: TokenDetailModalProps) {
  const [mlAnalysis, setMlAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [userPreferences, setUserPreferences] = useState({
    riskTolerance: 'medium',
    timeHorizon: 'medium',
    investmentSize: 'small'
  })

  useEffect(() => {
    if (isOpen && token) {
      fetchDetailedAnalysis()
    }
  }, [isOpen, token])

  const fetchDetailedAnalysis = async () => {
    setLoading(true)
    try {
      const analysis = await mlTrading.analyzeTokens([token])
      if (analysis.length > 0) {
        setMlAnalysis(analysis[0])
      }
    } catch (error) {
      console.error('Failed to fetch detailed analysis:', error)
    }
    setLoading(false)
  }

  const getPersonalizedRecommendation = () => {
    if (!mlAnalysis) return null

    const { riskTolerance, timeHorizon, investmentSize } = userPreferences
    const baseScore = mlAnalysis.buy_score
    
    // Adjust recommendation based on user preferences
    let adjustedScore = baseScore
    let personalizedAdvice = []

    // Risk tolerance adjustment
    if (riskTolerance === 'low' && mlAnalysis.risk_level === 'High') {
      adjustedScore *= 0.5
      personalizedAdvice.push("⚠️ High risk doesn't match your low risk tolerance")
    } else if (riskTolerance === 'high' && mlAnalysis.risk_level === 'Low') {
      adjustedScore *= 1.2
      personalizedAdvice.push("🎯 Good match for your high risk appetite")
    }

    // Time horizon adjustment
    const optimalHours = mlAnalysis.optimal_hold_hours
    if (timeHorizon === 'short' && optimalHours > 168) {
      adjustedScore *= 0.7
      personalizedAdvice.push("⏰ Long hold time doesn't match your short-term strategy")
    } else if (timeHorizon === 'long' && optimalHours < 24) {
      adjustedScore *= 0.8
      personalizedAdvice.push("⚡ Very short-term play - may not suit long-term goals")
    }

    // Investment size adjustment
    const positionSizes = {
      small: { min: 0.5, max: 2 },
      medium: { min: 2, max: 5 },
      large: { min: 5, max: 10 }
    }

    personalizedAdvice.push(`💰 Suggested position: ${positionSizes[investmentSize as keyof typeof positionSizes].min}-${positionSizes[investmentSize as keyof typeof positionSizes].max}% of portfolio`)

    return {
      adjustedScore: Math.min(1, Math.max(0, adjustedScore)),
      personalizedAdvice,
      riskMatch: getRiskMatch(),
      timeMatch: getTimeMatch(),
      sizeMatch: getSizeMatch()
    }
  }

  const getRiskMatch = () => {
    const riskLevels = { low: 1, medium: 2, high: 3 }
    const userRisk = riskLevels[userPreferences.riskTolerance as keyof typeof riskLevels]
    const tokenRisk = riskLevels[mlAnalysis?.risk_level.toLowerCase() as keyof typeof riskLevels] || 2
    return Math.abs(userRisk - tokenRisk) <= 1 ? 'good' : 'poor'
  }

  const getTimeMatch = () => {
    const hours = mlAnalysis?.optimal_hold_hours || 24
    if (userPreferences.timeHorizon === 'short' && hours <= 48) return 'good'
    if (userPreferences.timeHorizon === 'medium' && hours <= 168) return 'good'
    if (userPreferences.timeHorizon === 'long' && hours > 168) return 'good'
    return 'poor'
  }

  const getSizeMatch = () => {
    return 'good' // Simplified for now
  }

  const generateMockChartData = () => {
    const data = []
    const basePrice = token.price
    for (let i = 0; i < 24; i++) {
      const variance = (Math.random() - 0.5) * 0.1
      data.push({
        time: `${i}:00`,
        price: basePrice * (1 + variance),
        volume: Math.random() * 1000000
      })
    }
    return data
  }

  const chartData = generateMockChartData()
  const personalizedRec = getPersonalizedRecommendation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {token.symbol.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{token.symbol}</h2>
              <p className="text-gray-400">{token.name}</p>
            </div>
            <Badge className={`${token.priceChange24h > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
              {formatPercentage(token.priceChange24h)}
            </Badge>
            {mlAnalysis && (
              <Badge variant={mlAnalysis.recommendation === 'STRONG BUY' ? 'default' : 'secondary'}>
                🤖 {mlAnalysis.recommendation}
              </Badge>
            )}
          </div>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-800 flex gap-4">
          {['overview', 'analysis', 'personalized', 'trading'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card className="p-4 bg-gray-800 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Price Action</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => [formatCurrency(value as number, 6), 'Price']} />
                        <Area type="monotone" dataKey="price" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-4 bg-gray-800 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <div>
                        <p className="text-xs text-gray-400">Price</p>
                        <p className="font-semibold text-white">{formatCurrency(token.price, 6)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-400">Volume 24h</p>
                        <p className="font-semibold text-white">{formatCurrency(token.volume24h)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Chain</p>
                        <p className="font-semibold text-white">{token.chain}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="text-xs text-gray-400">Last Update</p>
                        <p className="font-semibold text-white">{new Date(token.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <Card className="p-8 bg-gray-800 border-gray-700 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading AI analysis...</p>
                  </Card>
                ) : mlAnalysis ? (
                  <Card className="p-4 bg-gray-800 border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-400" />
                      AI Analysis
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Buy Score</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-700 rounded-full">
                            <div 
                              className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                              style={{ width: `${mlAnalysis.buy_score * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-semibold">{(mlAnalysis.buy_score * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level</span>
                        <Badge variant={mlAnalysis.risk_level === 'Low' ? 'default' : 'destructive'}>
                          {mlAnalysis.risk_level}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Expected Profit</span>
                        <span className="text-green-400 font-semibold">+{mlAnalysis.expected_profit_percent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hold Time</span>
                        <span className="text-white">{mlAnalysis.optimal_hold_readable}</span>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4 bg-gray-800 border-gray-700">
                    <p className="text-gray-400">AI analysis not available</p>
                  </Card>
                )}

                <Card className="p-4 bg-gray-800 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Target className="h-4 w-4 mr-2" />
                      Buy Now
                    </Button>
                    <Button variant="outline" className="border-gray-600">
                      <Activity className="h-4 w-4 mr-2" />
                      Add to Watchlist
                    </Button>
                    <Button variant="outline" className="border-gray-600">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Explorer
                    </Button>
                    <Button variant="outline" className="border-gray-600">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Advanced Chart
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && mlAnalysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-gray-800 border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Risk Assessment</span>
                  </div>
                  <div className="text-xl font-bold text-white">{mlAnalysis.risk_level}</div>
                  <div className="text-xs text-gray-400">Confidence: {(mlAnalysis.risk_confidence * 100).toFixed(1)}%</div>
                </Card>

                <Card className="p-4 bg-gray-800 border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-gray-400">Profit Potential</span>
                  </div>
                  <div className="text-xl font-bold text-green-400">+{mlAnalysis.expected_profit_percent}%</div>
                  <div className="text-xs text-gray-400">Expected return</div>
                </Card>

                <Card className="p-4 bg-gray-800 border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm text-gray-400">Time Horizon</span>
                  </div>
                  <div className="text-xl font-bold text-white">{mlAnalysis.optimal_hold_readable}</div>
                  <div className="text-xs text-gray-400">Optimal hold period</div>
                </Card>
              </div>

              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">Market Intelligence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Market Maturity</h4>
                    <p className="text-gray-300">{mlAnalysis.market_maturity}</p>
                    <p className="text-sm text-gray-400">{mlAnalysis.market_age_days} days in market</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Liquidity Analysis</h4>
                    <p className="text-gray-300">Ratio: {mlAnalysis.liquidity_ratio}</p>
                    <p className="text-sm text-gray-400">
                      {mlAnalysis.liquidity_ratio > 0.5 ? 'High liquidity' : 'Moderate liquidity'}
                    </p>
                  </div>
                </div>
              </Card>

              {mlAnalysis.advice && mlAnalysis.advice.length > 0 && (
                <Card className="p-4 bg-gray-800 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">AI Insights</h3>
                  <div className="space-y-2">
                    {mlAnalysis.advice.map((advice: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{advice}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'personalized' && (
            <div className="space-y-6">
              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Your Trading Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Risk Tolerance</label>
                    <select 
                      value={userPreferences.riskTolerance}
                      onChange={(e) => setUserPreferences(prev => ({ ...prev, riskTolerance: e.target.value }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="low">Low Risk</option>
                      <option value="medium">Medium Risk</option>
                      <option value="high">High Risk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time Horizon</label>
                    <select 
                      value={userPreferences.timeHorizon}
                      onChange={(e) => setUserPreferences(prev => ({ ...prev, timeHorizon: e.target.value }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="short">Short-term (< 2 days)</option>
                      <option value="medium">Medium-term (< 1 week)</option>
                      <option value="long">Long-term (> 1 week)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Position Size</label>
                    <select 
                      value={userPreferences.investmentSize}
                      onChange={(e) => setUserPreferences(prev => ({ ...prev, investmentSize: e.target.value }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="small">Small (0.5-2%)</option>
                      <option value="medium">Medium (2-5%)</option>
                      <option value="large">Large (5-10%)</option>
                    </select>
                  </div>
                </div>
              </Card>

              {personalizedRec && (
                <>
                  <Card className="p-4 bg-gray-800 border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Personalized Recommendation</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Your Score:</span>
                        <div className="w-32 h-3 bg-gray-700 rounded-full">
                          <div 
                            className="h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                            style={{ width: `${personalizedRec.adjustedScore * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold">{(personalizedRec.adjustedScore * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${personalizedRec.riskMatch === 'good' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-300">Risk Match</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${personalizedRec.timeMatch === 'good' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-300">Time Match</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${personalizedRec.sizeMatch === 'good' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-300">Size Match</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {personalizedRec.personalizedAdvice.map((advice: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{advice}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {activeTab === 'trading' && (
            <div className="space-y-6">
              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Trading Interface</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Buy Order</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Amount (USD)</label>
                        <input 
                          type="number" 
                          placeholder="100.00"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Order Type</label>
                        <select className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white">
                          <option>Market Order</option>
                          <option>Limit Order</option>
                          <option>Stop Loss</option>
                        </select>
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700 py-3">
                        Place Buy Order
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Risk Management</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Stop Loss (%)</label>
                        <input 
                          type="number" 
                          placeholder="5"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Take Profit (%)</label>
                        <input 
                          type="number" 
                          placeholder="15"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                        />
                      </div>
                      <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-md">
                        <p className="text-sm text-blue-300">
                          🤖 AI suggests: 5% stop loss, 12% take profit based on analysis
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-800 border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">Portfolio Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">+2.3%</p>
                    <p className="text-sm text-gray-400">Expected portfolio impact</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">Medium</p>
                    <p className="text-sm text-gray-400">Risk level</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">4.2%</p>
                    <p className="text-sm text-gray-400">Position allocation</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
