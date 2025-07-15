import { prisma, redis } from '@/lib/database'
import { logInfo, logError } from './logger'

interface HealthCheck {
  name: string
  status: 'healthy' | 'unhealthy'
  responseTime: number
  error?: string
}

export class HealthChecker {
  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now()
    try {
      await prisma.$queryRaw`SELECT 1`
      return {
        name: 'database',
        status: 'healthy',
        responseTime: Date.now() - start
      }
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: (error as Error).message
      }
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    const start = Date.now()
    try {
      await redis.ping()
      return {
        name: 'redis',
        status: 'healthy',
        responseTime: Date.now() - start
      }
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: (error as Error).message
      }
    }
  }

  async checkExternalAPIs(): Promise<HealthCheck[]> {
    const apis = [
      'https://api.dexscreener.com/latest/dex/search?q=ethereum',
      'https://api.geckoterminal.com/api/v2/networks/eth/trending_pools'
    ]

    const checks = await Promise.all(
      apis.map(async (url) => {
        const start = Date.now()
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          })
          
          return {
            name: new URL(url).hostname,
            status: response.ok ? 'healthy' : 'unhealthy' as const,
            responseTime: Date.now() - start
          }
        } catch (error) {
          return {
            name: new URL(url).hostname,
            status: 'unhealthy' as const,
            responseTime: Date.now() - start,
            error: (error as Error).message
          }
        }
      })
    )

    return checks
  }

  async performFullHealthCheck() {
    logInfo('Starting health check')
    
    const [database, redis, ...apis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      ...await this.checkExternalAPIs()
    ])

    const allChecks = [database, redis, ...apis]
    const unhealthyChecks = allChecks.filter(check => check.status === 'unhealthy')
    
    const overall = {
      status: unhealthyChecks.length === 0 ? 'healthy' : 'degraded' as const,
      timestamp: new Date().toISOString(),
      checks: allChecks,
      summary: {
        total: allChecks.length,
        healthy: allChecks.length - unhealthyChecks.length,
        unhealthy: unhealthyChecks.length
      }
    }

    if (unhealthyChecks.length > 0) {
      logError(new Error('Health check failed'), { unhealthyChecks })
    } else {
      logInfo('Health check passed', { responseTime: Math.max(...allChecks.map(c => c.responseTime)) })
    }

    return overall
  }
}

export const healthChecker = new HealthChecker()
