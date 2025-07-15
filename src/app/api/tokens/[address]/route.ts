import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    
    // Mock token data for now
    const token = {
      address,
      symbol: 'TOKEN',
      price: 1.25,
      change: 0.85,
      volume: 125000,
      marketCap: 1500000,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(token)
  } catch (error) {
    console.error('Token API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    )
  }
}
