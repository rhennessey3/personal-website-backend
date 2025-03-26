#!/bin/sh
# Debug environment variables
echo "=== Debugging environment variables ==="
echo "SUPABASE_URL exists: $(if [ -n "$SUPABASE_URL" ]; then echo "YES - $SUPABASE_URL"; else echo "NO"; fi)"
echo "SUPABASE_SERVICE_KEY exists: $(if [ -n "$SUPABASE_SERVICE_KEY" ]; then echo "YES - First 10 chars: ${SUPABASE_SERVICE_KEY:0:10}..."; else echo "NO"; fi)"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

echo "=== All environment variables ==="
printenv | sort

echo "=== Railway-specific variables ==="
printenv | grep -i railway || echo "No Railway variables found"
printenv | grep -i supabase || echo "No Supabase variables found"

echo "=== System information ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Checking dist directory:"
ls -la dist || echo "dist directory not found"
echo "Checking if server.js exists:"
ls -la dist/server.js || echo "server.js not found"

# Check if environment variables are already set (from Railway)
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
  echo "=== Environment variables already set (likely from Railway) ==="
  echo "Using existing environment variables"
# Try to load from .env file only if environment variables are not already set
elif [ -f ".env" ]; then
  echo "=== Found .env file, loading variables ==="
  set -a
  . ./.env
  set +a
  echo "SUPABASE_URL after loading .env: $(if [ -n "$SUPABASE_URL" ]; then echo "YES - $SUPABASE_URL"; else echo "NO"; fi)"
  echo "SUPABASE_SERVICE_KEY after loading .env: $(if [ -n "$SUPABASE_SERVICE_KEY" ]; then echo "YES - First 10 chars: ${SUPABASE_SERVICE_KEY:0:10}..."; else echo "NO"; fi)"
else
  echo "=== WARNING: No environment variables or .env file found ==="
  echo "The application may not function correctly without Supabase credentials"
  echo "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in Railway's Variables tab"
fi

# Check for debug-env.js in various locations and copy it to /app if needed
if [ -f "debug-env.js" ]; then
  echo "=== Found debug-env.js in current directory ==="
  cp debug-env.js /app/debug-env.js 2>/dev/null || echo "Could not copy to /app"
elif [ -f "./debug-env.js" ]; then
  echo "=== Found debug-env.js in ./ ==="
  cp ./debug-env.js /app/debug-env.js 2>/dev/null || echo "Could not copy to /app"
elif [ -f "../debug-env.js" ]; then
  echo "=== Found debug-env.js in ../ ==="
  cp ../debug-env.js /app/debug-env.js 2>/dev/null || echo "Could not copy to /app"
fi

# Create debug-env.js if it doesn't exist
if [ ! -f "/app/debug-env.js" ]; then
  echo "=== Creating debug-env.js in /app ==="
  echo "console.log('Debug script created by start.sh');" > /app/debug-env.js
  echo "console.log('Environment variables:');" >> /app/debug-env.js
  echo "console.log(process.env);" >> /app/debug-env.js
fi

# Run debug script
echo "=== Running debug-env.js ==="
node /app/debug-env.js || echo "Failed to run debug-env.js"

# Start the application
echo "=== Starting server ==="
node dist/server.js