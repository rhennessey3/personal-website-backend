#!/bin/sh
set -e  # Exit immediately if a command exits with a non-zero status

# Create log file
LOG_FILE="/app/logs/startup.log"
touch $LOG_FILE
echo "=== Starting application $(date) ===" | tee -a $LOG_FILE

# Function to log messages
log() {
  echo "$1" | tee -a $LOG_FILE
}

# Debug environment variables
log "=== Debugging environment variables ==="
log "SUPABASE_URL exists: $(if [ -n "$SUPABASE_URL" ]; then echo "YES - $SUPABASE_URL"; else echo "NO"; fi)"
log "SUPABASE_SERVICE_KEY exists: $(if [ -n "$SUPABASE_SERVICE_KEY" ]; then echo "YES - First 10 chars: ${SUPABASE_SERVICE_KEY:0:10}..."; else echo "NO"; fi)"
log "NODE_ENV: $NODE_ENV"
log "PORT: $PORT"
log "HOST: $HOST"

log "=== All environment variables ==="
printenv | sort | tee -a $LOG_FILE

log "=== Railway-specific variables ==="
printenv | grep -i railway | tee -a $LOG_FILE || log "No Railway variables found"
printenv | grep -i supabase | tee -a $LOG_FILE || log "No Supabase variables found"

log "=== System information ==="
log "Current directory: $(pwd)"
log "Directory contents:"
ls -la | tee -a $LOG_FILE
log "Node version: $(node --version)"
log "NPM version: $(npm --version)"
log "Checking dist directory:"
ls -la dist | tee -a $LOG_FILE || log "dist directory not found"
log "Checking if server.js exists:"
ls -la dist/server.js | tee -a $LOG_FILE || log "server.js not found"

# Check if environment variables are already set (from Railway)
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
  log "=== Environment variables already set (likely from Railway) ==="
  log "Using existing environment variables"
# Try to load from .env file only if environment variables are not already set
elif [ -f ".env" ]; then
  log "=== Found .env file, loading variables ==="
  set -a
  . ./.env
  set +a
  log "SUPABASE_URL after loading .env: $(if [ -n "$SUPABASE_URL" ]; then echo "YES - $SUPABASE_URL"; else echo "NO"; fi)"
  log "SUPABASE_SERVICE_KEY after loading .env: $(if [ -n "$SUPABASE_SERVICE_KEY" ]; then echo "YES - First 10 chars: ${SUPABASE_SERVICE_KEY:0:10}..."; else echo "NO"; fi)"
else
  log "=== WARNING: No environment variables or .env file found ==="
  log "The application may not function correctly without Supabase credentials"
  log "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in Railway's Variables tab"
fi

# Ensure PORT is set
if [ -z "$PORT" ]; then
  log "PORT environment variable not set, defaulting to 8080"
  export PORT=8080
fi

# Ensure HOST is set
if [ -z "$HOST" ]; then
  log "HOST environment variable not set, defaulting to 0.0.0.0"
  export HOST="0.0.0.0"
fi

# Comment out debug script execution as it's causing issues
log "=== Debug script execution disabled ==="
# node tests/debug-env.js 2>&1 | tee -a $LOG_FILE || log "Failed to run debug-env.js"

# Verify dist directory exists
if [ ! -d "dist" ]; then
  log "ERROR: dist directory not found. Build may have failed."
  exit 1
fi

# Verify server.js exists
if [ ! -f "dist/server.js" ]; then
  log "ERROR: dist/server.js not found. Build may have failed."
  exit 1
fi

# Start the application with error handling
log "=== Starting server ==="
log "Command: node dist/server.js"
log "PORT: $PORT"
log "HOST: $HOST"

# Start the server and redirect output to log file
node dist/server.js 2>&1 | tee -a $LOG_FILE