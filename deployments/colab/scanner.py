import asyncio
import aiohttp
import json
import websockets
import threading
from concurrent.futures import ThreadPoolExecutor
import time

class ColabGPUScanner:
    def __init__(self):
        self.results = {}
        self.clients = set()
        self.endpoints = [
            "https://api.dexscreener.com/latest/dex/search?q=ethereum",
            "https://api.dexscreener.com/latest/dex/search?q=bsc",
            "https://api.dexscreener.com/latest/dex/search?q=polygon",
            "https://api.geckoterminal.com/api/v2/networks/eth/trending_pools",
            "https://api.geckoterminal.com/api/v2/networks/bsc/trending_pools",
            "https://api.geckoterminal.com/api/v2/networks/polygon/trending_pools",
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1",
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=2",
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=3",
            "https://api.coincap.io/v2/assets?limit=100&offset=0",
            "https://api.coinpaprika.com/v1/tickers?limit=500"
        ]
    
    async def fetch_endpoint(self, session, url):
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                data = await response.json()
                return self.parse_data(data, url)
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return []
    
    def parse_data(self, data, url):
        tokens = []
        try:
            if 'pairs' in data:
                for pair in data['pairs']:
                    change = float(pair.get('priceChange', {}).get('h24', 0))
                    if 9 <= change <= 13:
                        tokens.append({
                            'address': pair.get('baseToken', {}).get('address', ''),
                            'symbol': pair.get('baseToken', {}).get('symbol', ''),
                            'name': pair.get('baseToken', {}).get('name', ''),
                            'price': float(pair.get('priceUsd', 0)),
                            'priceChange24h': change,
                            'volume24h': float(pair.get('volume', {}).get('h24', 0)),
                            'chain': 'colab-gpu',
                            'timestamp': time.time()
                        })
            
            if isinstance(data, list):
                for item in data:
                    change = float(item.get('changePercent24Hr', item.get('percent_change_24h', 0)))
                    if 9 <= change <= 13:
                        tokens.append({
                            'address': item.get('id', ''),
                            'symbol': item.get('symbol', '').upper(),
                            'name': item.get('name', ''),
                            'price': float(item.get('priceUsd', item.get('price', 0))),
                            'priceChange24h': change,
                            'volume24h': float(item.get('volumeUsd24Hr', item.get('volume_24h', 0))),
                            'chain': 'colab-gpu',
                            'timestamp': time.time()
                        })
        except Exception as e:
            print(f"Parse error: {e}")
        
        return tokens
    
    async def scan_all(self):
        async with aiohttp.ClientSession() as session:
            tasks = [self.fetch_endpoint(session, url) for url in self.endpoints]
            results = await asyncio.gather(*tasks)
            
            all_tokens = []
            for token_list in results:
                all_tokens.extend(token_list)
            
            for token in all_tokens:
                key = f"{token['chain']}-{token['address']}"
                self.results[key] = token
            
            print(f"🔥 Colab GPU found {len(all_tokens)} tokens in range")
            return all_tokens
    
    async def websocket_handler(self, websocket, path):
        self.clients.add(websocket)
        try:
            await websocket.send(json.dumps({
                'type': 'colab_connected',
                'tokens': list(self.results.values()),
                'count': len(self.results)
            }))
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)
    
    async def broadcast_tokens(self, tokens):
        if self.clients:
            message = json.dumps({
                'type': 'colab_update',
                'tokens': tokens,
                'timestamp': time.time()
            })
            websockets.broadcast(self.clients, message)
    
    async def start_scanning(self):
        print("🚀 Starting Colab GPU scanner...")
        while True:
            try:
                tokens = await self.scan_all()
                await self.broadcast_tokens(tokens)
                await asyncio.sleep(2)
            except Exception as e:
                print(f"Scan error: {e}")
                await asyncio.sleep(5)

scanner = ColabGPUScanner()

async def main():
    server = await websockets.serve(scanner.websocket_handler, "0.0.0.0", 8765)
    print("🌐 Colab WebSocket server started on port 8765")
    
    await asyncio.gather(
        server.wait_closed(),
        scanner.start_scanning()
    )

if __name__ == "__main__":
    asyncio.run(main())
