#!/bin/bash

echo "🚀 Starting GPU Swarm Trader..."

# Kill existing processes
pkill -f "node server/websocket.js" 2>/dev/null
pkill -f "next dev" 2>/dev/null

echo "📡 Starting WebSocket Server..."
node server/websocket.js &
WS_PID=$!

echo "🌐 Starting Next.js..."
npm run dev &
NEXT_PID=$!

# Cleanup function
cleanup() {
    echo "🛑 Shutting down..."
    kill $WS_PID $NEXT_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "✅ Servers started!"
echo "🌐 App: http://localhost:3000"
echo "📡 WebSocket: ws://localhost:8080"
echo "Press Ctrl+C to stop"

wait
