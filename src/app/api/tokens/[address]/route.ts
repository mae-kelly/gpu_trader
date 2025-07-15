import { NextRequest, NextResponse } from 'next/server'
import { tokenRepository } from '@/lib/repositories/token.repository'
import { honeypotService } from '@/lib/services/honeypot-service'
import { withAuth } from '@/middleware/auth'
import { securityHeaders } from '@/middleware/security'

export const GET = withAuth(async (req: NextRequest, { params }: { params: { address: string } }) => {
  try {
    const { address } = params
    const url = new URL(req.url)
    const chain = url.searchParams.get('chain') || 'ethereum'
    
    const token = await tokenRepository.findByAddress(address, chain)
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token not found'
      }, { status: 404 })
    }

    const honeypotResult = await honeypotService.checkToken(address, chain)
    
    const response = NextResponse.json({
      success: true,
      data: {
        ...token,
        honeypot: honeypotResult
      }
    })

    return securityHeaders(response)
  } catch (error) {
    console.error('Token detail API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch token details'
    }, { status: 500 })
  }
})
