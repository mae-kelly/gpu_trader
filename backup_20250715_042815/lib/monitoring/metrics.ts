import { redis } from '@/lib/database'

interface SystemMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

export class MetricsCollector {
  private metrics: Map<string, SystemMetric[]> = new Map()

  async recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: SystemMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    }

    const key = `metrics:${name}`
    const existing = this.metrics.get(name) || []
    existing.push(metric)
    
    if (existing.length > 1000) {
      existing.shift()
    }
    
    this.metrics.set(name, existing)

    try {
      await redis.lpush(key, JSON.stringify(metric))
      await redis.ltrim(key, 0, 999)
      await redis.expire(key, 86400)
    } catch (error) {
      console.error('Failed to store metric in Redis:', error)
    }
  }

  async getMetrics(name: string, limit: number = 100): Promise<SystemMetric[]> {
    try {
      const data = await redis.lrange(`metrics:${name}`, 0, limit - 1)
      return data.map(item => JSON.parse(item))
    } catch (error) {
      console.error('Failed to retrieve metrics:', error)
      return this.metrics.get(name)?.slice(-limit) || []
    }
  }

  async recordApiCall(endpoint: string, method: string, statusCode: number, duration: number) {
    await this.recordMetric('api_calls_total', 1, {
      endpoint,
      method,
      status: statusCode.toString()
    })
    
    await this.recordMetric('api_response_time', duration, {
      endpoint,
      method
    })
  }

  async recordTokenUpdate(chain: string, count: number) {
    await this.recordMetric('tokens_updated', count, { chain })
  }

  async recordError(type: string, source: string) {
    await this.recordMetric('errors_total', 1, { type, source })
  }

  async recordWebSocketConnection() {
    await this.recordMetric('websocket_connections', 1)
  }

  async recordWebSocketDisconnection() {
    await this.recordMetric('websocket_disconnections', 1)
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    uptime: number
    memory: NodeJS.MemoryUsage
    activeConnections: number
    lastTokenUpdate: number
    errorRate: number
  }> {
    const now = Date.now()
    const oneHourAgo = now - 3600000
    
    const errors = await this.getMetrics('errors_total')
    const recentErrors = errors.filter(m => m.timestamp > oneHourAgo)
    const errorRate = recentErrors.length / 60
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (errorRate > 10) status = 'unhealthy'
    else if (errorRate > 5) status = 'degraded'

    return {
      status,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      activeConnections: 0,
      lastTokenUpdate: now,
      errorRate
    }
  }
}

export const metricsCollector = new MetricsCollector()
