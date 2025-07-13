"use client"

import { useEffect } from 'react'
import { setupErrorLogging } from '@/lib/error-logger'

export function ErrorLogger() {
  useEffect(() => {
    setupErrorLogging()
  }, [])

  return null // This component doesn't render anything
}
