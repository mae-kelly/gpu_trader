import axios from 'axios'
import { Worker } from 'worker_threads'
import WebSocket from 'ws'
interface GPUTask {
id: string
endpoint: string
headers?: Record<string, string>
params?: Record<string, any>
chain: string
}
interface TokenResult {
address: string
symbol: string
name: string
price: number
priceChange24h: number
volume24h: number
liquidity: number
marketCap: number
chain: string
timestamp: number
}
export class GPUAcceleratedScanner {
private workers: Worker[] = []
private wsClients = new Set<WebSocket>()
private wss: WebSocket.Server
private results = new Map<string, TokenResult>()
private isScanning = false
constructor() {
this.wss = new WebSocket.Server({ port: 8080 })
this.setupWebSocketServer()
this.initializeWorkers()
this.startRealtimeScanning()
}
private setupWebSocketServer() {
this.wss.on('connection', (ws) => {
this.wsClients.add(ws)
console.log(`🔗 Client connected. Total: ${this.wsClients.size}`)
ws.on('close', () => this.wsClients.delete(ws))
ws.on('message', (data) => {
try {
const message = JSON.parse(data.toString())
if (message.type === 'subscribe') {
this.sendAllTokens(ws)
}
} catch (error) {
console.error('WebSocket message error:', error)
}
})
})
}
private initializeWorkers() {
const workerCount = 24
for (let i = 0; i < workerCount; i++) {
const worker = new Worker(`
const { parentPort } = require('worker_threads')
const axios = require('axios')
parentPort.on('message', async (task) => {
try {
const response = await axios.get(task.endpoint, {
headers: task.headers || {},
params: task.params || {},
timeout: 1500
})
parentPort.postMessage({
taskId: task.id,
success: true,
data: response.data,
chain: task.chain
})
} catch (error) {
parentPort.postMessage({
taskId: task.id,
success: false,
error: error.message,
chain: task.chain
})
}
})
`, { eval: true })
worker.on('message', (result) => this.handleWorkerResult(result))
this.workers.push(worker)
}
console.log(`⚡ Initialized ${workerCount} FREE GPU workers`)
}
private generateFreeTasks(): GPUTask[] {
const tasks: GPUTask[] = []
const chains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'cronos', 'moonbeam', 'moonriver', 'harmony', 'celo', 'aurora', 'fuse', 'evmos', 'milkomeda', 'kava', 'metis', 'syscoin', 'emerald', 'rose']
chains.forEach(chain => {
tasks.push({
id: `dexscreener-search-${chain}`,
endpoint: `https://api.dexscreener.com/latest/dex/search`,
params: { q: chain },
chain
})
tasks.push({
id: `dexscreener-tokens-${chain}`,
endpoint: `https://api.dexscreener.com/latest/dex/tokens/${chain}`,
chain
})
tasks.push({
id: `geckoterminal-trending-${chain}`,
endpoint: `https://api.geckoterminal.com/api/v2/networks/${chain}/trending_pools`,
chain
})
tasks.push({
id: `geckoterminal-new-${chain}`,
endpoint: `https://api.geckoterminal.com/api/v2/networks/${chain}/new_pools`,
chain
})
tasks.push({
id: `geckoterminal-top-${chain}`,
endpoint: `https://api.geckoterminal.com/api/v2/networks/${chain}/pools`,
params: { sort: 'h24_volume_usd_desc', limit: 100 },
chain
})
})
const cgPages = 15
for (let page = 1; page <= cgPages; page++) {
tasks.push({
id: `coingecko-free-${page}`,
endpoint: 'https://api.coingecko.com/api/v3/coins/markets',
params: {
vs_currency: 'usd',
order: 'volume_desc',
per_page: 250,
page
},
chain: 'multi'
})
}
const coinCapPages = 10
for (let offset = 0; offset < coinCapPages * 100; offset += 100) {
tasks.push({
id: `coincap-${offset}`,
endpoint: 'https://api.coincap.io/v2/assets',
params: { limit: 100, offset },
chain: 'multi'
})
}
tasks.push({
id: 'coinpaprika-tickers',
endpoint: 'https://api.coinpaprika.com/v1/tickers',
params: { limit: 1000 },
chain: 'multi'
})
tasks.push({
id: 'coinlore-global',
endpoint: 'https://api.coinlore.net/api/tickers/',
params: { start: 0, limit: 100 },
chain: 'multi'
})
const nomicsPages = 5
for (let page = 1; page <= nomicsPages; page++) {
tasks.push({
id: `nomics-${page}`,
endpoint: 'https://api.nomics.com/v1/currencies/ticker',
params: {
key: 'demo-26240835',
interval: '1d',
per_page: 100,
page
},
chain: 'multi'
})
}
tasks.push({
id: 'messari-assets',
endpoint: 'https://data.messari.io/api/v1/assets',
params: { limit: 500 },
chain: 'multi'
})
const liveCoinWatchPages = 5
for (let offset = 0; offset < liveCoinWatchPages * 100; offset += 100) {
tasks.push({
id: `livecoinwatch-${offset}`,
endpoint: 'https://api.livecoinwatch.com/coins/list',
headers: { 'content-type': 'application/json' },
params: { currency: 'USD', sort: 'rank', order: 'ascending', offset, limit: 100 },
chain: 'multi'
})
}
tasks.push({
id: 'cryptocompare-top',
endpoint: 'https://min-api.cryptocompare.com/data/top/mktcapfull',
params: { limit: 100, tsym: 'USD' },
chain: 'multi'
})
tasks.push({
id: 'lunarcrush-feeds',
endpoint: 'https://api.lunarcrush.com/v2',
params: { data: 'feeds', type: 'shared', limit: 100 },
chain: 'multi'
})
const jupiterChains = ['solana']
jupiterChains.forEach(chain => {
tasks.push({
id: `jupiter-${chain}`,
endpoint: 'https://price.jup.ag/v4/price',
params: { ids: 'all' },
chain
})
})
const raydiumTasks = [
{
id: 'raydium-pools',
endpoint: 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json',
chain: 'solana'
}
]
tasks.push(...raydiumTasks)
const orcaTasks = [
{
id: 'orca-pools',
endpoint: 'https://api.orca.so/v1/whirlpool/list',
chain: 'solana'
}
]
tasks.push(...orcaTasks)
const osmosisChains = ['osmosis']
osmosisChains.forEach(chain => {
tasks.push({
id: `osmosis-pools-${chain}`,
endpoint: 'https://api-osmosis.imperator.co/pools/v2/all',
params: { low_liquidity: false },
chain
})
})
const terraChains = ['terra', 'terra2']
terraChains.forEach(chain => {
tasks.push({
id: `terraswap-${chain}`,
endpoint: 'https://fcd.terra.dev/v1/market/swaprate/all',
chain
})
})
return tasks
}
private handleWorkerResult(result: any) {
if (!result.success) return
const tokens = this.parseTokenData(result.data, result.chain)
tokens.forEach(token => {
if (token.priceChange24h >= 9 && token.priceChange24h <= 13) {
this.results.set(`${token.chain}-${token.address}-${token.symbol}`, token)
this.broadcastToken(token)
}
})
}
private parseTokenData(data: any, chain: string): TokenResult[] {
const tokens: TokenResult[] = []
try {
if (data.pairs) {
data.pairs.forEach((pair: any) => {
const change = parseFloat(pair.priceChange?.h24 || pair.priceChange?.h1 || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: pair.baseToken?.address || pair.pairAddress || '',
symbol: pair.baseToken?.symbol || '',
name: pair.baseToken?.name || '',
price: parseFloat(pair.priceUsd || '0'),
priceChange24h: change,
volume24h: parseFloat(pair.volume?.h24 || '0'),
liquidity: parseFloat(pair.liquidity?.usd || '0'),
marketCap: parseFloat(pair.fdv || '0'),
chain,
timestamp: Date.now()
})
}
})
}
if (data.data) {
if (Array.isArray(data.data)) {
data.data.forEach((item: any) => {
let change = parseFloat(item.attributes?.price_change_percentage?.h24 || item.price_change_percentage_24h || item.percent_change_24h || item.quotes?.USD?.percent_change_24h || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: item.relationships?.base_token?.data?.id || item.contract_address || item.id || '',
symbol: (item.attributes?.name?.split('/')[0] || item.symbol || '').toUpperCase(),
name: item.attributes?.name || item.name || '',
price: parseFloat(item.attributes?.base_token_price_usd || item.current_price || item.priceUsd || item.quotes?.USD?.price || '0'),
priceChange24h: change,
volume24h: parseFloat(item.attributes?.volume_usd?.h24 || item.total_volume || item.quotes?.USD?.volume_24h || '0'),
liquidity: parseFloat(item.attributes?.reserve_in_usd || item.market_cap || item.quotes?.USD?.market_cap || '0'),
marketCap: parseFloat(item.attributes?.fdv_usd || item.market_cap || item.quotes?.USD?.market_cap || '0'),
chain,
timestamp: Date.now()
})
}
})
} else if (data.data.Data) {
data.data.Data.forEach((item: any) => {
const change = parseFloat(item.RAW?.USD?.CHANGEPCT24HOUR || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: item.CoinInfo?.Id || '',
symbol: item.CoinInfo?.Name || '',
name: item.CoinInfo?.FullName || '',
price: parseFloat(item.RAW?.USD?.PRICE || '0'),
priceChange24h: change,
volume24h: parseFloat(item.RAW?.USD?.VOLUME24HOUR || '0'),
liquidity: parseFloat(item.RAW?.USD?.MKTCAP || '0'),
marketCap: parseFloat(item.RAW?.USD?.MKTCAP || '0'),
chain: 'multi',
timestamp: Date.now()
})
}
})
}
}
if (Array.isArray(data)) {
data.forEach((item: any) => {
const change = parseFloat(item.changePercent24Hr || item.percent_change_24h || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: item.id || item.symbol || '',
symbol: (item.symbol || '').toUpperCase(),
name: item.name || '',
price: parseFloat(item.priceUsd || item.price || '0'),
priceChange24h: change,
volume24h: parseFloat(item.volumeUsd24Hr || item.volume_24h || '0'),
liquidity: parseFloat(item.marketCapUsd || item.market_cap || '0'),
marketCap: parseFloat(item.marketCapUsd || item.market_cap || '0'),
chain: chain === 'multi' ? 'ethereum' : chain,
timestamp: Date.now()
})
}
})
}
} catch (error) {
console.error('Parse error:', error)
}
return tokens
}
private broadcastToken(token: TokenResult) {
const message = JSON.stringify({
type: 'token_update',
data: token,
timestamp: Date.now()
})
this.wsClients.forEach(client => {
if (client.readyState === WebSocket.OPEN) {
client.send(message)
}
})
}
private sendAllTokens(ws: WebSocket) {
const allTokens = Array.from(this.results.values())
ws.send(JSON.stringify({
type: 'all_tokens',
data: allTokens,
count: allTokens.length,
timestamp: Date.now()
}))
}
startRealtimeScanning() {
if (this.isScanning) return
this.isScanning = true
console.log('🔥 Starting FREE GPU-accelerated real-time scanning...')
const scan = () => {
if (!this.isScanning) return
const tasks = this.generateFreeTasks()
let workerIndex = 0
tasks.forEach(task => {
this.workers[workerIndex % this.workers.length].postMessage(task)
workerIndex++
})
console.log(`📡 Dispatched ${tasks.length} FREE tasks across ${this.workers.length} GPU workers`)
setTimeout(scan, 1500)
}
scan()
setInterval(() => {
console.log(`📊 Active tokens: ${this.results.size}, Connected clients: ${this.wsClients.size}`)
}, 5000)
}
stop() {
this.isScanning = false
this.workers.forEach(worker => worker.terminate())
this.wss.close()
}
}
export const gpuScanner = new GPUAcceleratedScanner()
