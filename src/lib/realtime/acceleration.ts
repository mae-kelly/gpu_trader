interface PricePoint {
  price: number
  timestamp: number
}

export class AccelerationCalculator {
  private priceHistory = new Map<string, PricePoint[]>()
  
  addPricePoint(tokenId: string, price: number): number {
    const now = Date.now()
    
    if (!this.priceHistory.has(tokenId)) {
      this.priceHistory.set(tokenId, [])
    }
    
    const history = this.priceHistory.get(tokenId)!
    history.push({ price, timestamp: now })
    
    const maxHistorySize = 100
    if (history.length > maxHistorySize) {
      history.splice(0, history.length - maxHistorySize)
    }
    
    return this.calculateAcceleration(tokenId)
  }
  
  calculateAcceleration(tokenId: string): number {
    const history = this.priceHistory.get(tokenId)
    if (!history || history.length < 3) return 0
    
    const recent = history.slice(-10)
    if (recent.length < 3) return 0
    
    const velocities: number[] = []
    
    for (let i = 1; i < recent.length; i++) {
      const timeDiff = (recent[i].timestamp - recent[i - 1].timestamp) / 1000
      const priceDiff = recent[i].price - recent[i - 1].price
      const velocity = timeDiff > 0 ? priceDiff / timeDiff : 0
      velocities.push(velocity)
    }
    
    if (velocities.length < 2) return 0
    
    let accelerationSum = 0
    for (let i = 1; i < velocities.length; i++) {
      const timeDiff = 1
      accelerationSum += (velocities[i] - velocities[i - 1]) / timeDiff
    }
    
    return accelerationSum / (velocities.length - 1)
  }
  
  getMomentumScore(tokenId: string): number {
    const history = this.priceHistory.get(tokenId)
    if (!history || history.length < 5) return 0
    
    const recent = history.slice(-5)
    const acceleration = this.calculateAcceleration(tokenId)
    const priceChange = (recent[recent.length - 1].price - recent[0].price) / recent[0].price
    
    return (priceChange * 100) + (acceleration * 10)
  }
}

export const accelerationCalculator = new AccelerationCalculator()
