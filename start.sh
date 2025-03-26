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

# Try to manually set the variables from a .env file if it exists
if [ -f ".env" ]; then
  echo "=== Found .env file, loading variables ==="
  set -a
  . ./.env
  set +a
  echo "SUPABASE_URL after loading .env: $(if [ -n "$SUPABASE_URL" ]; then echo "YES - $SUPABASE_URL"; else echo "NO"; fi)"
  echo "SUPABASE_SERVICE_KEY after loading .env: $(if [ -n "$SUPABASE_SERVICE_KEY" ]; then echo "YES - First 10 chars: ${SUPABASE_SERVICE_KEY:0:10}..."; else echo "NO"; fi)"
else
  echo "=== No .env file found ==="
  # Create a temporary .env file with the credentials
  echo "Creating temporary .env file with credentials"
  echo "SUPABASE_URL=https://imfmubnxmgxntqhjyqav.supabase.co" > .env
  echo "SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZm11Ym54bWd4bnRxaGp5cWF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjkzODk3MywiZXhwIjoyMDU4NTE0OTczfQ.vNblEfuqHjzdYhgymu1EHA2ptMJRYpcefIevdBPA0h0" >> .env
  echo "NODE_ENV=production" >> .env
  echo "PORT=8080" >> .env
  
  # Load the temporary .env file
  set -a
  . ./.env
  set +a
  
  echo "SUPABASE_URL after creating temp .env: $(if [ -n "$SUPABASE_URL" ]; then echo "YES - $SUPABASE_URL"; else echo "NO"; fi)"
fi

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