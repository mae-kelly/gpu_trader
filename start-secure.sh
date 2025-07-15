#!/bin/bash
echo "🚀 Starting GPU Swarm Trader with Security"

# Load environment variables
if [ -f .env.secure ]; then
    export $(cat .env.secure | grep -v '^#' | xargs)
fi

# Start WebSocket server in background
echo "🔒 Starting secure WebSocket server..."
node server/secure-websocket.js &
WS_PID=$!

# Start Next.js application
echo "🌐 Starting Next.js application..."
npm run dev &
NEXT_PID=$!

echo "✅ Services started:"
echo "   - WebSocket Server (PID: $WS_PID)"
echo "   - Next.js App (PID: $NEXT_PID)"
echo ""
echo "🔗 Application: http://localhost:3000"
echo "🔒 WebSocket: ws://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'kill $WS_PID $NEXT_PID 2>/dev/null; exit' INT
wait
