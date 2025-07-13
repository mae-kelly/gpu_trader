"use client"

export function setupErrorLogging() {
  if (typeof window === 'undefined') return

  // Log all console errors to the server
  const originalError = console.error
  const originalWarn = console.warn
  const originalLog = console.log

  console.error = (...args) => {
    originalError.apply(console, args)
    sendToServer('error', args)
  }

  console.warn = (...args) => {
    originalWarn.apply(console, args)
    sendToServer('warn', args)
  }

  console.log = (...args) => {
    originalLog.apply(console, args)
    sendToServer('log', args)
  }

  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    const errorInfo = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack || event.error?.toString() || 'Unknown error'
    }
    sendToServer('uncaught-error', [errorInfo])
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorInfo = {
      reason: event.reason?.stack || event.reason?.toString() || 'Unknown rejection',
      promise: 'Promise rejection'
    }
    sendToServer('unhandled-rejection', [errorInfo])
  })

  // Catch React errors
  const originalReactError = window.console.error
  window.console.error = (...args) => {
    // Check if it's a React error
    const message = args[0]?.toString() || ''
    if (message.includes('React') || message.includes('Warning:') || message.includes('Error:')) {
      sendToServer('react-error', args)
    }
    originalReactError.apply(console, args)
  }
}

function sendToServer(type: string, data: any[]) {
  try {
    // Send error to our custom endpoint
    fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data: data.map(item => 
          typeof item === 'object' ? JSON.stringify(item) : String(item)
        ),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(() => {
      // Silently fail if endpoint doesn't exist
    })
  } catch (error) {
    // Silently fail
  }
}
