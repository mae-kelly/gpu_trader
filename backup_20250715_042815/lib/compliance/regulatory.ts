interface ComplianceRule {
  id: string
  name: string
  description: string
  region: string[]
  check: (data: any) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class RegulatoryCompliance {
  private rules: ComplianceRule[] = [
    {
      id: 'aml_transaction_limit',
      name: 'AML Transaction Limit',
      description: 'Transactions above $10,000 require additional verification',
      region: ['US', 'EU'],
      check: (trade) => trade.amount * trade.price < 10000,
      severity: 'critical'
    },
    {
      id: 'kyc_verification',
      name: 'KYC Verification Required',
      description: 'Users must complete KYC for trading',
      region: ['US', 'EU', 'UK'],
      check: (user) => user.kycCompleted === true,
      severity: 'critical'
    },
    {
      id: 'data_retention_gdpr',
      name: 'GDPR Data Retention',
      description: 'Personal data must not be kept longer than necessary',
      region: ['EU'],
      check: (user) => {
        const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
        return !user.lastLogin || new Date(user.lastLogin) > twoYearsAgo
      },
      severity: 'high'
    },
    {
      id: 'sanctions_screening',
      name: 'Sanctions List Screening',
      description: 'Users must be screened against sanctions lists',
      region: ['US', 'EU', 'UK'],
      check: (user) => user.sanctionsScreened === true,
      severity: 'critical'
    },
    {
      id: 'trading_hours_restriction',
      name: 'Trading Hours Restriction',
      description: 'Some regions restrict trading hours',
      region: ['US'],
      check: (trade) => {
        const hour = new Date(trade.createdAt).getUTCHours()
        return hour >= 14 && hour < 21 // NYSE hours in UTC
      },
      severity: 'medium'
    }
  ]

  async checkCompliance(data: any, region: string): Promise<{
    compliant: boolean
    violations: Array<{
      rule: string
      severity: string
      description: string
    }>
  }> {
    const applicableRules = this.rules.filter(rule => rule.region.includes(region))
    const violations = []

    for (const rule of applicableRules) {
      try {
        if (!rule.check(data)) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            description: rule.description
          })
        }
      } catch (error) {
        console.error(`Compliance check failed for rule ${rule.id}:`, error)
      }
    }

    return {
      compliant: violations.length === 0,
      violations
    }
  }

  async generateComplianceReport(): Promise<any> {
    return {
      generatedAt: new Date().toISOString(),
      regions: ['US', 'EU', 'UK'],
      totalRules: this.rules.length,
      criticalRules: this.rules.filter(r => r.severity === 'critical').length,
      rules: this.rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        regions: rule.region,
        severity: rule.severity
      }))
    }
  }
}

export const regulatoryCompliance = new RegulatoryCompliance()
