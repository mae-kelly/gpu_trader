import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock token data for now
    const tokens = [
      { symbol: 'BTC', price: 43250.00, change: 2.45 },
      { symbol: 'ETH', price: 2580.00, change: -1.23 },
      { symbol: 'SOL', price: 98.50, change: 5.67 },
    ]
    
    return NextResponse.json(tokens)
  } catch (error) {
    console.error('Tokens API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}
