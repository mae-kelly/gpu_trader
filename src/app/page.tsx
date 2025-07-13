"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Zap } from 'lucide-react'
export default function HomePage() {
  const router = useRouter()
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="dashboard-card max-w-md w-full p-8 text-center space-y-6">
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">GPU Swarm Trader</h1>
          <p className="text-muted-foreground">High-frequency momentum scanner</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-500">System Online</span>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-3000 ease-out"
              style={{width: '100%'}}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Initializing trading dashboard...
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 shadow-lg"
        >
          <Activity className="w-4 h-4 mr-2" />
          Enter Dashboard
        </Button>
        <p className="text-xs text-muted-foreground">
          Auto-redirect in 3 seconds
        </p>
      </Card>
    </div>
  )
}
