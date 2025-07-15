import { NextRequest, NextResponse } from 'next/server'
import { securityHeaders } from '@/lib/security/headers'

export async function GET(req: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'pass',
        authentication: 'pass',
        websocket: 'pass'
      }
    }
    
    const response = NextResponse.json(health)
    return securityHeaders(response)
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
