"use client"

import { useState, useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ErrorToastProps {
  message: string
  onClose: () => void
}

export function ErrorToast({ message, onClose }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md bg-red-900/90 border border-red-500 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-100">Browser Error Detected</h4>
          <p className="text-xs text-red-200 mt-1 break-words">{message}</p>
          <p className="text-xs text-red-300 mt-1">Check terminal for full details</p>
        </div>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-200 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Global error toast manager
let toastContainer: HTMLDivElement | null = null
let activeToasts: Set<string> = new Set()

export function showErrorToast(message: string) {
  if (typeof window === 'undefined') return
  
  const toastId = Date.now().toString()
  if (activeToasts.has(message)) return // Prevent duplicates
  
  activeToasts.add(message)
  
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'error-toast-container'
    document.body.appendChild(toastContainer)
  }

  const toastElement = document.createElement('div')
  toastElement.className = 'fixed top-4 right-4 z-50 max-w-md bg-red-900/90 border border-red-500 rounded-lg p-4 backdrop-blur-sm animate-slide-up'
  
  toastElement.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-red-400 flex-shrink-0 mt-0.5">⚠️</div>
      <div class="flex-1">
        <h4 class="text-sm font-medium text-red-100">Browser Error</h4>
        <p class="text-xs text-red-200 mt-1 break-words">${message}</p>
        <p class="text-xs text-red-300 mt-1">→ Check terminal for details</p>
      </div>
      <button class="text-red-400 hover:text-red-200 flex-shrink-0" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `
  
  document.body.appendChild(toastElement)
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toastElement.parentElement) {
      toastElement.remove()
    }
    activeToasts.delete(message)
  }, 5000)
}
