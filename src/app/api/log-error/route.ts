import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data, timestamp, url, userAgent } = body

    // Format the error message for terminal
    const timeStr = new Date(timestamp).toLocaleTimeString()
    const urlStr = url.replace('http://localhost:3000', '')
    
    // Color codes for terminal
    const colors = {
      error: '\x1b[31m',      // Red
      warn: '\x1b[33m',       // Yellow
      log: '\x1b[36m',        // Cyan
      'uncaught-error': '\x1b[91m',     // Bright Red
      'unhandled-rejection': '\x1b[95m', // Bright Magenta
      'react-error': '\x1b[93m',        // Bright Yellow
      reset: '\x1b[0m'        // Reset
    }

    const color = colors[type as keyof typeof colors] || colors.log
    const resetColor = colors.reset

    // Log to terminal
    console.log(`${color}[BROWSER ${type.toUpperCase()}]${resetColor} ${timeStr} ${urlStr}`)
    
    data.forEach((item: string, index: number) => {
      if (index === 0) {
        console.log(`${color}│${resetColor} ${item}`)
      } else {
        console.log(`${color}│${resetColor}   ${item}`)
      }
    })
    
    console.log(`${color}└${resetColor} User Agent: ${userAgent.split(' ')[0]}...`)
    console.log('') // Empty line for separation

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in log-error endpoint:', error)
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 })
  }
}
