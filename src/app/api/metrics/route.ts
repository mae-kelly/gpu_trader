import { NextRequest, NextResponse } from 'next/server'
import { metricsCollector } from '@/lib/monitoring/metrics'
import { withAuth } from '@/middleware/auth'
import { securityHeaders } from '@/middleware/security'

export const GET = withAuth(async (req: NextRequest, user: any) => {
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const url = new URL(req.url)
    const metric = url.searchParams.get('metric')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    if (metric) {
      const data = await metricsCollector.getMetrics(metric, limit)
      const response = NextResponse.json({ metric, data })
      return securityHeaders(response)
    }

    const systemHealth = await metricsCollector.getSystemHealth()
    const response = NextResponse.json(systemHealth)
    return securityHeaders(response)
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch metrics'
    }, { status: 500 })
  }
})
