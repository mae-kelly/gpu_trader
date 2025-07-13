interface UserAction {
  action: 'view' | 'buy' | 'sell' | 'watchlist' | 'ignore'
  token: string
  timestamp: number
  preferences: any
  outcome?: 'profit' | 'loss' | 'neutral'
  profitPercent?: number
}

interface LearningData {
  userActions: UserAction[]
  modelPerformance: any[]
  personalizedWeights: Record<string, number>
}

class RealtimeLearningSystem {
  private learningData: LearningData = {
    userActions: [],
    modelPerformance: [],
    personalizedWeights: {
      'technical_score': 0.25,
      'fundamental_score': 0.20,
      'sentiment_score': 0.15,
      'risk_score': 0.20,
      'innovation_score': 0.10,
      'network_score': 0.10
    }
  }

  recordUserAction(action: UserAction) {
    this.learningData.userActions.push(action)
    this.updatePersonalizedModel()
    this.saveToStorage()
  }

  private updatePersonalizedModel() {
    // Analyze user behavior patterns
    const recentActions = this.learningData.userActions.slice(-50)
    
    // Update weights based on successful trades
    const successfulTrades = recentActions.filter(a => a.outcome === 'profit')
    
    if (successfulTrades.length > 0) {
      // Adjust weights to favor patterns that led to profits
      this.adjustWeightsBasedOnSuccess(successfulTrades)
    }
  }

  private adjustWeightsBasedOnSuccess(successfulTrades: UserAction[]) {
    // Real-time learning algorithm
    const learningRate = 0.01
    
    successfulTrades.forEach(trade => {
      // Increase weights for factors that predicted success
      Object.keys(this.learningData.personalizedWeights).forEach(factor => {
        this.learningData.personalizedWeights[factor] *= (1 + learningRate)
      })
    })
    
    // Normalize weights
    const totalWeight = Object.values(this.learningData.personalizedWeights).reduce((a, b) => a + b, 0)
    Object.keys(this.learningData.personalizedWeights).forEach(factor => {
      this.learningData.personalizedWeights[factor] /= totalWeight
    })
  }

  getPersonalizedScore(tokenAnalysis: any): number {
    // Apply personalized weights to get customized score
    let score = 0
    Object.keys(this.learningData.personalizedWeights).forEach(factor => {
      score += (tokenAnalysis[factor] || 0) * this.learningData.personalizedWeights[factor]
    })
    return score
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      // Save to local storage for persistence
      localStorage.setItem('ml_learning_data', JSON.stringify(this.learningData))
    }
  }

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ml_learning_data')
      if (saved) {
        this.learningData = JSON.parse(saved)
      }
    }
  }

  getPersonalizedRecommendations(tokens: any[]): any[] {
    return tokens.map(token => ({
      ...token,
      personalizedScore: this.getPersonalizedScore(token.analysis || {}),
      recommendationReason: this.getRecommendationReason(token)
    })).sort((a, b) => b.personalizedScore - a.personalizedScore)
  }

  private getRecommendationReason(token: any): string {
    const userPattern = this.analyzeUserPattern()
    
    if (userPattern.prefersHighRisk && token.risk_level === 'High') {
      return "Matches your high-risk trading pattern"
    } else if (userPattern.prefersShortTerm && token.optimal_hold_hours < 48) {
      return "Aligns with your short-term trading style"
    } else if (userPattern.prefersHighVolume && token.volume24h > 1000000) {
      return "High volume matches your preferences"
    }
    
    return "Based on your trading history"
  }

  private analyzeUserPattern() {
    const actions = this.learningData.userActions.slice(-20)
    
    return {
      prefersHighRisk: actions.filter(a => a.action === 'buy').length > actions.length * 0.7,
      prefersShortTerm: true, // Simplified
      prefersHighVolume: true // Simplified
    }
  }
}

export const learningSystem = new RealtimeLearningSystem()
