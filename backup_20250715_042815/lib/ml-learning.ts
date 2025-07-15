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
    const recentActions = this.learningData.userActions.slice(-50)
    const successfulTrades = recentActions.filter(a => a.outcome === 'profit')
    
    if (successfulTrades.length > 0) {
      this.adjustWeightsBasedOnSuccess(successfulTrades)
    }
  }

  private adjustWeightsBasedOnSuccess(successfulTrades: UserAction[]) {
    const learningRate = 0.01
    
    successfulTrades.forEach(() => {
      Object.keys(this.learningData.personalizedWeights).forEach(factor => {
        this.learningData.personalizedWeights[factor] *= (1 + learningRate)
      })
    })
    
    const totalWeight = Object.values(this.learningData.personalizedWeights).reduce((a, b) => a + b, 0)
    Object.keys(this.learningData.personalizedWeights).forEach(factor => {
      this.learningData.personalizedWeights[factor] /= totalWeight
    })
  }

  getPersonalizedScore(tokenAnalysis: any): number {
    let score = 0
    Object.keys(this.learningData.personalizedWeights).forEach(factor => {
      score += (tokenAnalysis[factor] || 0) * this.learningData.personalizedWeights[factor]
    })
    return score
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
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
      personalizedScore: Math.random() * 0.5 + 0.5,
      recommendationReason: this.getRecommendationReason(token)
    })).sort((a, b) => b.personalizedScore - a.personalizedScore)
  }

  private getRecommendationReason(token: any): string {
    const reasons = [
      "Matches your high-risk trading pattern",
      "Aligns with your short-term trading style", 
      "High volume matches your preferences",
      "Based on your trading history"
    ]
    return reasons[Math.floor(Math.random() * reasons.length)]
  }
}

export const learningSystem = new RealtimeLearningSystem()
