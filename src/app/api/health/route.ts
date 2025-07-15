import { NextRequest, NextResponse } from 'next/server'
import { healthChecker } from '@/lib/monitoring/health-check'
import { securityHeaders } from '@/middleware/security'

export async function GET(req: NextRequest) {
  try {
    const health = await healthChecker.performFullHealthCheck()
    
    const status = health.status === 'healthy' ? 200 : 503
    const response = NextResponse.json(health, { status })
    
    return securityHeaders(response)
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
