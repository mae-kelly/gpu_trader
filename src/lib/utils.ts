export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
export function formatCurrency(value: number, decimals: number = 2): string {
  if (value < 0.01) return `$${value.toFixed(6)}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
export function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}
