import { useEffect, useRef } from 'react'

export function usePolling(callback: () => void, interval: number, enabled = true) {
  const savedCallback = useRef<() => void>()

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current()
      }
    }

    if (enabled && interval > 0) {
      const id = setInterval(tick, interval)
      return () => clearInterval(id)
    }
  }, [interval, enabled])
}
