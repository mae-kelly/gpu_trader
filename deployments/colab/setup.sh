#!/bin/bash
echo "🔧 Setting up Colab environment..."
pip install aiohttp websockets nest_asyncio
python -c "
import nest_asyncio
nest_asyncio.apply()
exec(open('scanner.py').read())
"
