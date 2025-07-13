export interface PricePoint {
  timestamp: number
  price: number
}

export interface AccelerationData {
  velocity: number
  acceleration: number
  momentum: number
  trend: 'increasing' | 'decreasing' | 'stable'
  strength: number
}

export class AccelerationCalculator {
  calculateAcceleration(priceHistory: PricePoint[]): AccelerationData {
    if (priceHistory.length < 3) {
      return {
        velocity: 0,
        acceleration: 0,
        momentum: 0,
        trend: 'stable',
        strength: 0
      }
    }

    const sortedHistory = [...priceHistory].sort((a, b) => a.timestamp - b.timestamp)
    const velocities = this.calculateVelocities(sortedHistory)
    const accelerations = this.calculateAccelerations(velocities)
    
    const currentVelocity = velocities[velocities.length - 1]?.value || 0
    const currentAcceleration = accelerations[accelerations.length - 1]?.value || 0
    
    return {
      velocity: currentVelocity,
      acceleration: currentAcceleration,
      momentum: this.calculateMomentum(velocities),
      trend: this.determineTrend(accelerations),
      strength: this.calculateStrength(velocities, accelerations)
    }
  }

  private calculateVelocities(priceHistory: PricePoint[]): Array<{ timestamp: number; value: number }> {
    const velocities: Array<{ timestamp: number; value: number }> = []
    
    for (let i = 1; i < priceHistory.length; i++) {
      const current = priceHistory[i]
      const previous = priceHistory[i - 1]
      
      const timeDiff = (current.timestamp - previous.timestamp) / 1000
      const priceDiff = current.price - previous.price
      
      if (timeDiff > 0) {
        const velocity = priceDiff / timeDiff
        velocities.push({
          timestamp: current.timestamp,
          value: velocity
        })
      }
    }
    
    return velocities
  }

  private calculateAccelerations(velocities: Array<{ timestamp: number; value: number }>): Array<{ timestamp: number; value: number }> {
    const accelerations: Array<{ timestamp: number; value: number }> = []
    
    for (let i = 1; i < velocities.length; i++) {
      const current = velocities[i]
      const previous = velocities[i - 1]
      
      const timeDiff = (current.timestamp - previous.timestamp) / 1000
      const velocityDiff = current.value - previous.value
      
      if (timeDiff > 0) {
        const acceleration = velocityDiff / timeDiff
        accelerations.push({
          timestamp: current.timestamp,
          value: acceleration
        })
      }
    }
    
    return accelerations
  }

  private calculateMomentum(velocities: Array<{ timestamp: number; value: number }>): number {
    if (velocities.length === 0) return 0
    
    const weights = velocities.map((_, index) => Math.pow(0.9, velocities.length - 1 - index))
    const weightedSum = velocities.reduce((sum, vel, index) => sum + vel.value * weights[index], 0)
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
    
    return weightSum > 0 ? weightedSum / weightSum : 0
  }

  private determineTrend(accelerations: Array<{ timestamp: number; value: number }>): 'increasing' | 'decreasing' | 'stable' {
    if (accelerations.length === 0) return 'stable'
    
    const recentAccelerations = accelerations.slice(-5)
    const avgAcceleration = recentAccelerations.reduce((sum, acc) => sum + acc.value, 0) / recentAccelerations.length
    
    if (avgAcceleration > 0.001) return 'increasing'
    if (avgAcceleration < -0.001) return 'decreasing'
    return 'stable'
  }

  private calculateStrength(velocities: Array<{ timestamp: number; value: number }>, accelerations: Array<{ timestamp: number; value: number }>): number {
    if (velocities.length === 0 || accelerations.length === 0) return 0
    
    const avgVelocity = Math.abs(velocities.reduce((sum, vel) => sum + vel.value, 0) / velocities.length)
    const avgAcceleration = Math.abs(accelerations.reduce((sum, acc) => sum + acc.value, 0) / accelerations.length)
    
    return Math.min(100, (avgVelocity * 10 + avgAcceleration * 100) * 100)
  }

  calculateRealTimeMetrics(priceHistory: PricePoint[], currentPrice: number): AccelerationData & { 
    priceVelocity: number
    volumeAcceleration: number
    momentum: number
  } {
    const baseMetrics = this.calculateAcceleration(priceHistory)
    
    if (priceHistory.length === 0) {
      return {
        ...baseMetrics,
        priceVelocity: 0,
        volumeAcceleration: 0,
        momentum: 0
      }
    }

    const latestPoint = priceHistory[priceHistory.length - 1]
    const timeWindow = 60000
    const recentPoints = priceHistory.filter(p => latestPoint.timestamp - p.timestamp <= timeWindow)
    
    const priceVelocity = recentPoints.length > 1 
      ? (currentPrice - recentPoints[0].price) / ((latestPoint.timestamp - recentPoints[0].timestamp) / 1000)
      : 0

    return {
      ...baseMetrics,
      priceVelocity,
      volumeAcceleration: baseMetrics.acceleration,
      momentum: baseMetrics.momentum
    }
  }
}

export const accelerationCalculator = new AccelerationCalculator()
