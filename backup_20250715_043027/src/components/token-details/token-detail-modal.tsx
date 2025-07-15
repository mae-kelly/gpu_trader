"use client"
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TokenDetailModalProps {
  token: any
  isOpen: boolean
  onClose: () => void
}

export default function TokenDetailModal({ token, isOpen, onClose }: TokenDetailModalProps) {
  if (!isOpen || !token) return null
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{token.symbol}</h2>
          <Button onClick={onClose}>×</Button>
        </div>
        <p>Price: ${token.price}</p>
        <p>Change: {token.priceChange24h}%</p>
      </Card>
    </div>
  )
}
