"use client"

import { useEffect } from 'react'
import { useDashboardStore } from '@/lib/store'
import { usePolling } from '@/hooks/use-polling'
import { fetchMomentumCoins, fetchWalletData, fetchMomentumMetrics } from '@/lib/api'
import { MetricsCard } from '@/components/ui/metrics-card'
import { MiniChart } from '@/components/ui/mini-chart'
import { MomentumTableClean } from '@/components/dashboard/momentum-table-clean'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Target,
  Settings,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
  const { 
    filters, 
    coins, 
    wallet, 
    metrics, 
    isLoading,
    error,
    setCoins, 
    setWallet, 
    setMetrics, 
    setLoading,
    setFilters,
    setError
  } = useDashboardStore()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching dashboard data...')
      
      const [coinsData, walletData, metricsData] = await Promise.all([
        fetchMomentumCoins(filters),
        fetchWalletData(),
        fetchMomentumMetrics()
      ])
      
      setCoins(coinsData)
      setWallet(walletData)
      setMetrics(metricsData)
      
      console.log('✅ Dashboard data loaded successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data'
      console.error('❌ Dashboard data fetch failed:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🚀 Dashboard component mounted')
    fetchData()
  }, [filters.thresholdPercentage, filters.timeWindowMinutes, filters.selectedChains])

  usePolling(fetchData, 10000, !error)

  const roiChartData = wallet.roiGraphData.slice(-12).map(d => ({ value: d.roi }))
  const volumeChartData = Array.from({ length: 12 }, (_, i) => ({ 
    value: 50000 + Math.random() * 100000 
  }))

  const handleAutoTradeToggle = (checked: boolean) => {
    try {
      console.log(`🎛️ Auto-trade toggled: ${checked}`)
      setFilters({ autoTradeEnabled: checked })
      setError(null)
    } catch (error) {
      console.error('❌ Failed to toggle auto-trade:', error)
      setError('Failed to update auto-trade setting')
    }
  }

  const handleThresholdChange = (value: number[]) => {
    try {
      console.log(`📊 Threshold changed: ${value[0]}% - ${value[1]}%`)
      setFilters({ thresholdPercentage: value as [number, number] })
      setError(null)
    } catch (error) {
      console.error('❌ Failed to update threshold:', error)
      setError('Failed to update threshold')
    }
  }

  const handleTimeWindowChange = (value: number[]) => {
    try {
      console.log(`⏱️ Time window changed: ${value[0]} minutes`)
      setFilters({ timeWindowMinutes: value[0] })
      setError(null)
    } catch (error) {
      console.error('❌ Failed to update time window:', error)
      setError('Failed to update time window')
    }
  }

  const handleChainToggle = (chain: string) => {
    try {
      const newChains = filters.selectedChains.includes(chain)
        ? filters.selectedChains.filter(c => c !== chain)
        : [...filters.selectedChains, chain]
      console.log(`⛓️ Chains updated:`, newChains)
      setFilters({ selectedChains: newChains })
      setError(null)
    } catch (error) {
      console.error('❌ Failed to update chains:', error)
      setError('Failed to update chain selection')
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">GPU Swarm Trader</h1>
              <p className="text-muted-foreground">
                Real-time momentum scanner • {coins.length} tokens in range
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                GPU Cluster Online
              </Badge>
              <div className="text-sm text-muted-foreground">
                Processing {metrics.totalScanned}/sec
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="p-4 border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </Card>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricsCard
              title="Portfolio Balance"
              value={`$${wallet.balance.toFixed(2)}`}
              change={{
                value: wallet.totalProfit.toFixed(2),
                percentage: `${wallet.totalROI.toFixed(1)}%`,
                isPositive: wallet.totalROI > 0
              }}
              chart={<MiniChart data={roiChartData} color="#10b981" />}
            />
            
            <MetricsCard
              title="Active Positions"
              value={wallet.activePositions.toString()}
              change={{
                value: "3",
                percentage: "+12.5%",
                isPositive: true
              }}
            />
            
            <MetricsCard
              title="Coins in Range"
              value={metrics.coinsInRange.toString()}
              change={{
                value: "5",
                percentage: "+15.2%",
                isPositive: true
              }}
            />
            
            <MetricsCard
              title="24h Volume"
              value="$2.4M"
              change={{
                value: "240K",
                percentage: "+8.7%",
                isPositive: true
              }}
              chart={<MiniChart data={volumeChartData} color="#3b82f6" />}
            />
          </div>

          {/* Controls Panel */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Trading Controls
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Auto Trading</span>
                  <Switch 
                    checked={filters.autoTradeEnabled}
                    onCheckedChange={handleAutoTradeToggle}
                  />
                  {filters.autoTradeEnabled ? (
                    <Play className="h-4 w-4 text-green-500" />
                  ) : (
                    <Pause className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Threshold Range (%)</label>
                <div className="px-3">
                  <Slider
                    value={filters.thresholdPercentage}
                    onValueChange={handleThresholdChange}
                    min={5}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {filters.thresholdPercentage[0]}% - {filters.thresholdPercentage[1]}%
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Window (minutes)</label>
                <div className="px-3">
                  <Slider
                    value={[filters.timeWindowMinutes]}
                    onValueChange={handleTimeWindowChange}
                    min={5}
                    max={30}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {filters.timeWindowMinutes} minutes
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Chains</label>
                <div className="flex flex-wrap gap-2">
                  {['ETH', 'BSC', 'ARB', 'MATIC'].map((chain) => (
                    <Button
                      key={chain}
                      size="sm"
                      variant={filters.selectedChains.includes(chain) ? "default" : "outline"}
                      onClick={() => handleChainToggle(chain)}
                    >
                      {chain}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card className="p-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Loading momentum data...</span>
              </div>
            </Card>
          )}

          {/* Momentum Table */}
          {!isLoading && <MomentumTableClean coins={coins} />}
        </div>
      </div>
    </ErrorBoundary>
  )
}
