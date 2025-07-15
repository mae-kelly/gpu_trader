import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const tokens = [] // Placeholder for now
    
    return NextResponse.json({
      success: true,
      data: tokens,
      count: tokens.length,
      timestamp: Date.now()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tokens'
    }, { status: 500 })
  }
}
