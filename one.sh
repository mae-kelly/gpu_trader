#!/bin/bash

echo "🔍 Checking ALL TypeScript Errors"
echo "================================="

# Create output file with timestamp
OUTPUT_FILE="typescript-errors-$(date +%Y%m%d-%H%M%S).log"

# Function to both echo and write to file
log_and_echo() {
    echo "$1"
    echo "$1" >> "$OUTPUT_FILE"
}

# Start fresh output file
echo "TypeScript Error Analysis - $(date)" > "$OUTPUT_FILE"
echo "=======================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

log_and_echo "📋 This will show ALL type errors, not just the first one..."
log_and_echo ""

# Method 1: Use TypeScript compiler directly to see all errors
log_and_echo "🔧 Method 1: Running TypeScript compiler check..."
log_and_echo "================================================"
tsc_output=$(npx tsc --noEmit --pretty --listFiles false 2>&1)
if echo "$tsc_output" | grep -E "(error TS|Error:|Type error)" > /dev/null; then
    echo "$tsc_output" | grep -E "(error TS|Error:|Type error)" | while read -r line; do
        log_and_echo "❌ $line"
    done
else
    log_and_echo "✅ No TypeScript compiler errors found"
fi

log_and_echo ""
log_and_echo "🔧 Method 2: Running Next.js build with detailed output..."
log_and_echo "========================================================"

# Method 2: Try to build and capture all errors
export FORCE_COLOR=0  # Disable colors for cleaner log output
export NODE_ENV=development

# Build and capture ALL output
build_output=$(npm run build 2>&1)
echo "$build_output" >> "$OUTPUT_FILE"

log_and_echo ""
log_and_echo "🔧 Method 3: Extracting all type errors from build..."
log_and_echo "===================================================="

# Extract all type errors
log_and_echo "📝 All Type Errors Found:"
log_and_echo "========================"

echo "$build_output" | grep -n "Type error:" | while read -r line; do
    log_and_echo "❌ $line"
done

log_and_echo ""
log_and_echo "📝 All Module Not Found Errors:"
log_and_echo "==============================="

echo "$build_output" | grep -n "Module not found:" | while read -r line; do
    log_and_echo "❌ $line"
done

log_and_echo ""
log_and_echo "📝 All Import/Export Errors:"
log_and_echo "============================"

echo "$build_output" | grep -n "not exported\|Cannot find\|has no exported member" | while read -r line; do
    log_and_echo "❌ $line"
done

log_and_echo ""
log_and_echo "📊 Error Summary:"
log_and_echo "================"

type_errors=$(echo "$build_output" | grep -c "Type error:" 2>/dev/null || echo "0")
module_errors=$(echo "$build_output" | grep -c "Module not found:" 2>/dev/null || echo "0") 
import_errors=$(echo "$build_output" | grep -c "not exported\|Cannot find\|has no exported member" 2>/dev/null || echo "0")

log_and_echo "🔢 Type errors: $type_errors"
log_and_echo "🔢 Module not found: $module_errors"
log_and_echo "🔢 Import/export errors: $import_errors"

total_errors=$((type_errors + module_errors + import_errors))
log_and_echo "🔢 Total errors: $total_errors"

if [ "$total_errors" -eq 0 ]; then
    log_and_echo ""
    log_and_echo "🎉 No errors found! Your build should be successful!"
else
    log_and_echo ""
    log_and_echo "💡 All errors captured for comprehensive fixing!"
fi

log_and_echo ""
log_and_echo "🔧 Method 4: Quick file-by-file check..."
log_and_echo "========================================"

# Check specific files that commonly have issues
log_and_echo "📁 Checking common problem files:"

problem_files=(
    "src/app/dashboard/page.tsx"
    "src/components/dashboard/enhanced-realtime-table.tsx"
    "src/components/dashboard/realtime-momentum-table.tsx"
    "src/lib/realtime-store.ts"
    "middleware/auth.ts"
    "middleware/rate-limit.ts"
    "middleware/security.ts"
    "src/middleware/auth.ts"
    "src/middleware/rate-limit.ts"
    "src/middleware/security.ts"
)

for file in "${problem_files[@]}"; do
    if [ -f "$file" ]; then
        log_and_echo "🔍 $file:"
        # Quick syntax check
        file_check=$(npx tsc --noEmit "$file" 2>&1)
        if [ $? -eq 0 ]; then
            log_and_echo "   ✅ No obvious TypeScript errors"
        else
            log_and_echo "   ❌ Has TypeScript errors:"
            echo "$file_check" | head -10 | while read -r line; do
                log_and_echo "      $line"
            done
        fi
    else
        log_and_echo "🔍 $file: ⚠️  File not found"
    fi
    log_and_echo ""
done

log_and_echo ""
log_and_echo "🔍 Method 5: Finding all .tsx and .ts files with potential issues..."
log_and_echo "==================================================================="

# Find all TypeScript files and check them
ts_files=$(find src -name "*.ts" -o -name "*.tsx" | head -20)  # Limit to first 20 to avoid spam
log_and_echo "📁 Checking TypeScript files in src/:"

for file in $ts_files; do
    if [ -f "$file" ]; then
        file_errors=$(npx tsc --noEmit "$file" 2>&1 | grep -c "error TS" || echo "0")
        if [ "$file_errors" -gt 0 ]; then
            log_and_echo "❌ $file: $file_errors errors"
        else
            log_and_echo "✅ $file: No errors"
        fi
    fi
done

log_and_echo ""
log_and_echo "🎯 Analysis Complete!"
log_and_echo "===================="
log_and_echo "📄 Full analysis saved to: $OUTPUT_FILE"
log_and_echo "🔍 Review the file contents for all error details"
log_and_echo "💡 Share this file for comprehensive error fixing!"
log_and_echo ""
log_and_echo "📋 Next steps:"
log_and_echo "1. Review the errors in $OUTPUT_FILE"
log_and_echo "2. Share the file contents"
log_and_echo "3. Get a single comprehensive fix for ALL issues"

echo ""
echo "✅ Complete error analysis saved to: $OUTPUT_FILE"
echo "📂 File location: $(pwd)/$OUTPUT_FILE"
echo ""
echo "🔍 Quick preview of errors found:"
echo "================================="
if [ "$total_errors" -gt 0 ]; then
    echo "❌ Found $total_errors total errors"
    echo "📄 See $OUTPUT_FILE for complete details"
else
    echo "🎉 No errors found!"
fi