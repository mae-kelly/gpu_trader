#!/bin/bash

echo "🚀 Starting GPU Swarm Trader with Security"
echo "🔒 Starting secure WebSocket server..."
echo "🌐 Starting Next.js application..."

# Start WebSocket server in background
node server/secure-websocket.js &
WEBSOCKET_PID=$!

# Start Next.js app in background
npm run dev &
NEXTJS_PID=$!

echo "✅ Services started:"
echo "   - WebSocket Server (PID: $WEBSOCKET_PID)"
echo "   - Next.js App (PID: $NEXTJS_PID)"
echo ""
echo "🔗 Application: http://localhost:3000"
echo "🔒 WebSocket: ws://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping WebSocket server..."
    kill $WEBSOCKET_PID 2>/dev/null || true
    echo "🛑 Stopping Next.js app..."
    kill $NEXTJS_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
