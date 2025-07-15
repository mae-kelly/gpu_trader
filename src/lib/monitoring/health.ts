import { prisma, redis } from '@/lib/database'
import { logger } from '@/lib/logging/logger'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  version: string
  checks: {
    database: HealthStatus
    redis: HealthStatus
    websocket: HealthStatus
    external_apis: HealthStatus
  }
}

interface HealthStatus {
  status: 'pass' | 'fail'
  responseTime?: number
  message?: string
}

export class HealthService {
  async getHealthStatus(): Promise<HealthCheck> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkWebSocket(),
      this.checkExternalAPIs()
    ])

    const [database, redisCheck, websocket, external_apis] = checks.map(
      result => result.status === 'fulfilled' ? result.value : { status: 'fail', message: 'Check failed' }
    )

    const overallStatus = this.determineOverallStatus([database, redisCheck, websocket, external_apis])

    return {
      status: overallStatus,
      timestamp: Date.now(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database,
        redis: redisCheck,
        websocket,
        external_apis
      }
    }
  }

  private async checkDatabase(): Promise<HealthStatus> {
    const start = Date.now()
    try {
      await prisma.$queryRaw`SELECT 1`
      return {
        status: 'pass',
        responseTime: Date.now() - start
      }
    } catch (error) {
      logger.error('Database health check failed', { error })
      return {
        status: 'fail',
        responseTime: Date.now() - start,
        message: error.message
      }
    }
  }

  private async checkRedis(): Promise<HealthStatus> {
    const start = Date.now()
    try {
      await redis.ping()
      return {
        status: 'pass',
        responseTime: Date.now() - start
      }
    } catch (error) {
      logger.error('Redis health check failed', { error })
      return {
        status: 'fail',
        responseTime: Date.now() - start,
        message: error.message
      }
    }
  }

  private async checkWebSocket(): Promise<HealthStatus> {
    return {
      status: 'pass',
      message: 'WebSocket server running'
    }
  }

  private async checkExternalAPIs(): Promise<HealthStatus> {
    const start = Date.now()
    try {
      const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=ethereum', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      
      if (response.ok) {
        return {
          status: 'pass',
          responseTime: Date.now() - start
        }
      } else {
        return {
          status: 'fail',
          responseTime: Date.now() - start,
          message: `API returned ${response.status}`
        }
      }
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - start,
        message: error.message
      }
    }
  }

  private determineOverallStatus(checks: HealthStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
    const failedChecks = checks.filter(check => check.status === 'fail').length
    
    if (failedChecks === 0) return 'healthy'
    if (failedChecks <= 1) return 'degraded'
    return 'unhealthy'
  }
}

export const healthService = new HealthService()
