import { NextRequest, NextResponse } from 'next/server'
import { tokenRepository } from '@/lib/repositories/token.repository'
import { withAuth } from '@/middleware/auth'
import { rateLimit, securityHeaders } from '@/middleware/security'

export const GET = withAuth(async (req: NextRequest) => {
  const rateLimitResponse = rateLimit(60, 60000)(req)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const url = new URL(req.url)
    const min = parseFloat(url.searchParams.get('min') || '9')
    const max = parseFloat(url.searchParams.get('max') || '13')
    
    const tokens = await tokenRepository.findInMomentumRange(min, max)
    
    const response = NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      timestamp: Date.now()
    })

    return securityHeaders(response)
  } catch (error) {
    console.error('Tokens API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tokens'
    }, { status: 500 })
  }
})
