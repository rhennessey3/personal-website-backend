#!/bin/sh
# Debug environment variables
echo "=== Debugging environment variables ==="
echo "SUPABASE_URL exists: $(if [ -n "$SUPABASE_URL" ]; then echo "YES - $SUPABASE_URL"; else echo "NO"; fi)"
echo "SUPABASE_SERVICE_KEY exists: $(if [ -n "$SUPABASE_SERVICE_KEY" ]; then echo "YES - First 10 chars: ${SUPABASE_SERVICE_KEY:0:10}..."; else echo "NO"; fi)"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "All environment variables:"
env | sort

# Run debug script if it exists
if [ -f "debug-env.js" ]; then
  echo "=== Running debug-env.js ==="
  node debug-env.js
else
  echo "debug-env.js not found"
fi

# Start the application
echo "=== Starting server ==="
node dist/server.js