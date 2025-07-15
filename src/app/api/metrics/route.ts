import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const metrics = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tokens: 0,
      connections: 0
    }
    
    return NextResponse.json(metrics)
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch metrics'
    }, { status: 500 })
  }
}
