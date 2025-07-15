import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock metrics data for now
    const metrics = {
      totalTrades: 1247,
      totalVolume: 2847593.42,
      activeStrategies: 8,
      profitLoss: 15847.23,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
