#!/bin/bash

echo "🔧 QUICK FIX - Installing Missing Dependencies"
echo "============================================="

# Clean install to fix dependency issues
echo "🧹 Cleaning previous installation..."
rm -rf node_modules package-lock.json .next 2>/dev/null || true

echo "📦 Installing all required dependencies..."
npm install

# Verify critical packages are installed
echo "✅ Verifying installations..."

declare -a critical_deps=(
    "next"
    "react" 
    "react-dom"
    "ws"
    "axios"
    "gpu.js"
    "tailwindcss"
    "typescript"
)

ALL_INSTALLED=true

for dep in "${critical_deps[@]}"; do
    if [ -d "node_modules/$dep" ]; then
        echo "✅ $dep - INSTALLED"
    else
        echo "❌ $dep - MISSING"
        ALL_INSTALLED=false
    fi
done

if $ALL_INSTALLED; then
    echo ""
    echo "🎉 ALL DEPENDENCIES INSTALLED SUCCESSFULLY!"
    echo ""
    echo "🧪 Testing GPU.js..."
    
    # Test GPU.js
    cat > /tmp/gpu_test.js << 'GPUTEST'
try {
    const { GPU } = require('gpu.js');
    const gpu = new GPU();
    console.log('✅ GPU.js working in mode:', gpu.mode);
    process.exit(0);
} catch (error) {
    console.log('❌ GPU.js error:', error.message);
    process.exit(1);
}
GPUTEST

    if node /tmp/gpu_test.js; then
        echo "✅ GPU.js is working!"
    else
        echo "❌ GPU.js still has issues"
    fi
    
    rm -f /tmp/gpu_test.js
    
    echo ""
    echo "🚀 Testing Trading Bot..."
    
    # Test trading bot startup
    timeout 5s node server/trading-bot.js >/dev/null 2>&1 &
    BOT_PID=$!
    sleep 2
    
    if kill -0 $BOT_PID 2>/dev/null; then
        echo "✅ Trading bot starts successfully!"
        kill $BOT_PID 2>/dev/null
    else
        echo "❌ Trading bot startup failed"
    fi
    
    echo ""
    echo "🎯 READY TO LAUNCH!"
    echo "==================="
    echo ""
    echo "Run the complete trading bot:"
    echo "  ./complete_trading_bot_setup.sh"
    echo ""
    echo "Or re-run health check:"
    echo "  ./system_check_script.sh"
    
else
    echo ""
    echo "❌ SOME DEPENDENCIES STILL MISSING"
    echo "Try manual installation:"
    echo "  npm install --force"
    echo "  npm install gpu.js --force"
fi