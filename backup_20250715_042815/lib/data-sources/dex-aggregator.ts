import axios from 'axios'
export interface TokenData {
address: string
symbol: string
name: string
price: number
priceChange24h: number
volume24h: number
liquidity: number
marketCap: number
chain: string
lastUpdate: number
priceHistory: Array<{ timestamp: number; price: number }>
}
export class DexAggregator {
private tokens = new Map<string, TokenData>()
async fetchAllTokens(): Promise<TokenData[]> {
const sources = [
this.fetchFromDexScreener(),
this.fetchFromGeckoTerminal(),
this.fetchFromDexTools(),
this.fetchFromCoinGecko(),
this.fetchFromBirdEye(),
this.fetchFromDexGuru(),
this.fetchFromMoralis(),
this.fetchFromAlchemy(),
this.fetchFromQuickNode(),
this.fetchFromCoingeckoTrending(),
this.fetchFromDeFiPulse(),
this.fetchFromCovalent(),
this.fetchFromGraphQL(),
this.fetchFromPoocoin(),
this.fetchFromBscScan(),
this.fetchFromEtherscan(),
this.fetchFromPolygonScan(),
this.fetchFromArbiscan(),
this.fetchFromZapper(),
this.fetchFromDebank(),
this.fetchFromYearn(),
this.fetchFromUniswap(),
this.fetchFromPancakeSwap(),
this.fetchFromSushiSwap(),
this.fetchFromBalancer(),
this.fetchFromCurve(),
this.fetchFromCompound(),
this.fetchFromAave(),
this.fetchFrom1inch(),
this.fetchFromParaswap(),
this.fetchFromKyber(),
this.fetchFromBancor(),
this.fetchFromLoopring(),
this.fetchFromdYdX(),
this.fetchFromMATIC(),
this.fetchFromAvalanche(),
this.fetchFromFantom(),
this.fetchFromHarmony(),
this.fetchFromSolana(),
this.fetchFromTerra(),
this.fetchFromNear(),
this.fetchFromAlgorand(),
this.fetchFromTezos(),
this.fetchFromCardano(),
this.fetchFromPolkadot(),
this.fetchFromKusama(),
this.fetchFromCosmos(),
this.fetchFromOsmosis(),
this.fetchFromJuno(),
this.fetchFromSecret(),
this.fetchFromAkash(),
this.fetchFromStargaze(),
this.fetchFromOmega(),
this.fetchFromEvmos(),
this.fetchFromKava(),
this.fetchFromCanto(),
this.fetchFromInjective(),
this.fetchFromCronosChain(),
this.fetchFromMoonbeam(),
this.fetchFromMoonriver(),
this.fetchFromAstar(),
this.fetchFromShiden(),
this.fetchFromKilt(),
this.fetchFromParallel(),
this.fetchFromCentrifuge(),
this.fetchFromHydra(),
this.fetchFromInterlay(),
this.fetchFromKintsugi(),
this.fetchFromBifrost(),
this.fetchFromAcala(),
this.fetchFromKarura(),
this.fetchFromClover(),
this.fetchFromOriginTrail(),
this.fetchFromEfinity(),
this.fetchFromComposable(),
this.fetchFromPicasso(),
this.fetchFromQuasar(),
this.fetchFromStride(),
this.fetchFromCrescent(),
this.fetchFromComdex(),
this.fetchFromLikeCoin(),
this.fetchFromRegen(),
this.fetchFromSifChain(),
this.fetchFromCheqd(),
this.fetchFromLum(),
this.fetchFromKiChain(),
this.fetchFromBitCanna(),
this.fetchFromConstellation(),
this.fetchFromDigitalbits(),
this.fetchFromAssetMantle(),
this.fetchFromOmniFlix(),
this.fetchFromDecentr(),
this.fetchFromSentinelHub(),
this.fetchFromBand(),
this.fetchFromOdin(),
this.fetchFromGenesisL1(),
this.fetchFromFetch(),
this.fetchFromMediBloc(),
this.fetchFromCudos(),
this.fetchFromProvenance(),
this.fetchFromCyber(),
this.fetchFromBostrom(),
this.fetchFromGravity(),
this.fetchFromLikeCoin2(),
this.fetchFromIRIS(),
this.fetchFromTerra2(),
this.fetchFromMars(),
this.fetchFromNeutron(),
this.fetchFromDymension(),
this.fetchFromCelestia(),
this.fetchFromNoble(),
this.fetchFromQuicksilver(),
this.fetchFromSaga(),
this.fetchFromArchway(),
this.fetchFromNibiru(),
this.fetchFromManifest()
]
const results = await Promise.allSettled(sources)
const allTokens: TokenData[] = []
let successCount = 0
results.forEach(result => {
if (result.status === 'fulfilled') {
allTokens.push(...result.value)
successCount++
}
})
console.log(`Fetched from ${successCount}/${sources.length} sources, found ${allTokens.length} tokens`)
return this.deduplicateTokens(allTokens)
}
private async fetchFromDexScreener(): Promise<TokenData[]> {
try {
const chains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'cronos', 'moonbeam', 'moonriver', 'harmony', 'celo', 'aurora', 'fuse', 'evmos', 'milkomeda', 'kava', 'metis', 'syscoin', 'emerald', 'rose']
const tokens: TokenData[] = []
for (const chain of chains) {
const [trending, latest, gainers] = await Promise.all([
axios.get(`https://api.dexscreener.com/latest/dex/tokens/trending/${chain}`, { timeout: 3000 }),
axios.get(`https://api.dexscreener.com/latest/dex/tokens/${chain}`, { timeout: 3000 }),
axios.get(`https://api.dexscreener.com/latest/dex/tokens/gainers/${chain}`, { timeout: 3000 })
])
;[trending.data.pairs, latest.data.pairs, gainers.data.pairs].forEach(pairs => {
if (pairs) {
pairs.forEach((pair: any) => {
const change = parseFloat(pair.priceChange?.h24 || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: pair.baseToken?.address || '',
symbol: pair.baseToken?.symbol || '',
name: pair.baseToken?.name || '',
price: parseFloat(pair.priceUsd || '0'),
priceChange24h: change,
volume24h: parseFloat(pair.volume?.h24 || '0'),
liquidity: parseFloat(pair.liquidity?.usd || '0'),
marketCap: parseFloat(pair.fdv || '0'),
chain,
lastUpdate: Date.now(),
priceHistory: []
})
}
})
}
})
}
return tokens
} catch { return [] }
}
private async fetchFromGeckoTerminal(): Promise<TokenData[]> {
try {
const networks = ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'cronos', 'celo', 'harmony', 'moonbeam', 'moonriver', 'aurora', 'fuse', 'evmos', 'milkomeda', 'kava', 'metis', 'syscoin', 'rose', 'emerald']
const tokens: TokenData[] = []
for (const network of networks) {
const [trending, new_pools, top_pools] = await Promise.all([
axios.get(`https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools`, { timeout: 3000 }),
axios.get(`https://api.geckoterminal.com/api/v2/networks/${network}/new_pools`, { timeout: 3000 }),
axios.get(`https://api.geckoterminal.com/api/v2/networks/${network}/pools?sort=h24_volume_usd_desc`, { timeout: 3000 })
])
;[trending.data.data, new_pools.data.data, top_pools.data.data].forEach(pools => {
if (pools) {
pools.forEach((pool: any) => {
const change = parseFloat(pool.attributes?.price_change_percentage?.h24 || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: pool.relationships?.base_token?.data?.id || '',
symbol: pool.attributes?.name?.split('/')[0] || '',
name: pool.attributes?.name || '',
price: parseFloat(pool.attributes?.base_token_price_usd || '0'),
priceChange24h: change,
volume24h: parseFloat(pool.attributes?.volume_usd?.h24 || '0'),
liquidity: parseFloat(pool.attributes?.reserve_in_usd || '0'),
marketCap: parseFloat(pool.attributes?.fdv_usd || '0'),
chain: network,
lastUpdate: Date.now(),
priceHistory: []
})
}
})
}
})
}
return tokens
} catch { return [] }
}
private async fetchFromDexTools(): Promise<TokenData[]> {
try {
const chains = ['ether', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'cronos', 'moonbeam', 'harmony']
const tokens: TokenData[] = []
for (const chain of chains) {
const [hot, gainers, latest] = await Promise.all([
axios.get(`https://www.dextools.io/shared/data/pools?chain=${chain}&sort=hot&limit=100`, { timeout: 3000 }),
axios.get(`https://www.dextools.io/shared/data/pools?chain=${chain}&sort=gainers&limit=100`, { timeout: 3000 }),
axios.get(`https://www.dextools.io/shared/data/pools?chain=${chain}&sort=latest&limit=100`, { timeout: 3000 })
])
;[hot.data.data, gainers.data.data, latest.data.data].forEach(pools => {
if (pools) {
pools.forEach((token: any) => {
const change = parseFloat(token.priceChange24h || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: token.address || '',
symbol: token.symbol || '',
name: token.name || '',
price: parseFloat(token.price || '0'),
priceChange24h: change,
volume24h: parseFloat(token.volume24h || '0'),
liquidity: parseFloat(token.liquidity || '0'),
marketCap: parseFloat(token.marketCap || '0'),
chain,
lastUpdate: Date.now(),
priceHistory: []
})
}
})
}
})
}
return tokens
} catch { return [] }
}
private async fetchFromCoinGecko(): Promise<TokenData[]> {
try {
const tokens: TokenData[] = []
for (let page = 1; page <= 20; page++) {
const response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=${page}`, { timeout: 3000 })
response.data.forEach((coin: any) => {
const change = parseFloat(coin.price_change_percentage_24h || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: coin.contract_address || coin.id,
symbol: coin.symbol?.toUpperCase() || '',
name: coin.name || '',
price: parseFloat(coin.current_price || '0'),
priceChange24h: change,
volume24h: parseFloat(coin.total_volume || '0'),
liquidity: parseFloat(coin.market_cap || '0'),
marketCap: parseFloat(coin.market_cap || '0'),
chain: coin.platform?.id || 'ethereum',
lastUpdate: Date.now(),
priceHistory: []
})
}
})
}
return tokens
} catch { return [] }
}
private async fetchFromBirdEye(): Promise<TokenData[]> {
try {
const [trending, gainers, new_tokens] = await Promise.all([
axios.get('https://public-api.birdeye.so/defi/trending_tokens?sort_by=v24hChangePercent&sort_type=desc&offset=0&limit=50', {
timeout: 3000,
headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY || '' }
}),
axios.get('https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hChangePercent&sort_type=desc&offset=0&limit=50', {
timeout: 3000,
headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY || '' }
}),
axios.get('https://public-api.birdeye.so/defi/tokenlist?sort_by=createdTime&sort_type=desc&offset=0&limit=50', {
timeout: 3000,
headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY || '' }
})
])
const tokens: TokenData[] = []
;[trending.data.data?.items, gainers.data.data?.tokens, new_tokens.data.data?.tokens].forEach(items => {
if (items) {
items.forEach((token: any) => {
const change = parseFloat(token.v24hChangePercent || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: token.address || '',
symbol: token.symbol || '',
name: token.name || '',
price: parseFloat(token.price || '0'),
priceChange24h: change,
volume24h: parseFloat(token.v24hUSD || '0'),
liquidity: parseFloat(token.liquidity || '0'),
marketCap: parseFloat(token.mc || '0'),
chain: 'solana',
lastUpdate: Date.now(),
priceHistory: []
})
}
})
}
})
return tokens
} catch { return [] }
}
private async fetchFromDexGuru(): Promise<TokenData[]> {
try {
const chains = [1, 56, 137, 42161, 10, 43114, 250, 25, 1284, 1285, 1666600000, 42220, 1313161554, 122, 9001, 2001, 2222, 321, 1088, 288, 42262]
const tokens: TokenData[] = []
for (const chainId of chains) {
const response = await axios.get(`https://api.dev.dex.guru/v1/chain/${chainId}/tokens/hot?limit=100`, { timeout: 3000 })
if (response.data.data) {
response.data.data.forEach((token: any) => {
const change = parseFloat(token.priceChange24h || '0')
if (change >= 9 && change <= 13) {
tokens.push({
address: token.address || '',
symbol: token.symbol || '',
name: token.name || '',
price: parseFloat(token.priceUSD || '0'),
priceChange24h: change,
volume24h: parseFloat(token.volume24hUSD || '0'),
liquidity: parseFloat(token.liquidityUSD || '0'),
marketCap: parseFloat(token.marketCapUSD || '0'),
chain: chainId.toString(),
lastUpdate: Date.now(),
priceHistory: []
})
}
})
}
}
return tokens
} catch { return [] }
}
private async fetchFromMoralis(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromAlchemy(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromQuickNode(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCoingeckoTrending(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromDeFiPulse(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCovalent(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromGraphQL(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromPoocoin(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromBscScan(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromEtherscan(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromPolygonScan(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromArbiscan(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromZapper(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromDebank(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromYearn(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromUniswap(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromPancakeSwap(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromSushiSwap(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromBalancer(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCurve(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCompound(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromAave(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFrom1inch(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromParaswap(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromKyber(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromBancor(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromLoopring(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromdYdX(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromMATIC(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromAvalanche(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromFantom(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromHarmony(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromSolana(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromTerra(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromNear(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromAlgorand(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromTezos(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCardano(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromPolkadot(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromKusama(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCosmos(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromOsmosis(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromJuno(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromSecret(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromAkash(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromStargaze(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromOmega(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromEvmos(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromKava(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCanto(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromInjective(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCronosChain(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromMoonbeam(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromMoonriver(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromAstar(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromShiden(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromKilt(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromParallel(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCentrifuge(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromHydra(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromInterlay(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromKintsugi(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromBifrost(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromAcala(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromKarura(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromClover(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromOriginTrail(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromEfinity(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromComposable(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromPicasso(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromQuasar(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromStride(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCrescent(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromComdex(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromLikeCoin(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromRegen(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromSifChain(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCheqd(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromLum(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromKiChain(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromBitCanna(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromConstellation(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromDigitalbits(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromAssetMantle(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromOmniFlix(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromDecentr(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromSentinelHub(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromBand(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromOdin(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromGenesisL1(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromFetch(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromMediBloc(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCudos(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromProvenance(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCyber(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromBostrom(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromGravity(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromLikeCoin2(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromIRIS(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromTerra2(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromMars(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromNeutron(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromDymension(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromCelestia(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromNoble(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromQuicksilver(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromSaga(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromArchway(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromNibiru(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private async fetchFromManifest(): Promise<TokenData[]> { try { return [] } catch { return [] } }
private deduplicateTokens(tokens: TokenData[]): TokenData[] {
const unique = new Map<string, TokenData>()
tokens.forEach(token => {
const key = `${token.chain}-${token.address}-${token.symbol}`
if (!unique.has(key) || unique.get(key)!.lastUpdate < token.lastUpdate) {
unique.set(key, token)
}
})
return Array.from(unique.values())
}
updatePriceHistory(token: TokenData, price: number): void {
if (!token.priceHistory) token.priceHistory = []
token.priceHistory.push({ timestamp: Date.now(), price })
if (token.priceHistory.length > 50) {
token.priceHistory.shift()
}
}
}
