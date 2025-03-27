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

# Create a simple inline debug script
log "=== Creating debug script ==="
cat > debug-script.js << 'EOF'
// Simple debug script for environment variables
console.log('=== Debug Environment Variables ===');

// Print all environment variables (masking sensitive values)
const envVars = process.env;
const safeEnvVars = { ...envVars };

// Mask sensitive values
if (safeEnvVars.SUPABASE_SERVICE_KEY) {
  safeEnvVars.SUPABASE_SERVICE_KEY = safeEnvVars.SUPABASE_SERVICE_KEY.substring(0, 10) + '...';
}
if (safeEnvVars.JWT_SECRET) {
  safeEnvVars.JWT_SECRET = safeEnvVars.JWT_SECRET.substring(0, 10) + '...';
}

// Print all environment variables
console.log('\nAll environment variables:');
Object.keys(safeEnvVars).sort().forEach(key => {
  console.log(`${key}: ${safeEnvVars[key]}`);
});

// Check specific Supabase variables
console.log('\nSupabase variables check:');
console.log(`SUPABASE_URL defined: ${typeof process.env.SUPABASE_URL !== 'undefined'}`);
console.log(`SUPABASE_URL value: ${process.env.SUPABASE_URL || 'NOT SET'}`);
console.log(`SUPABASE_SERVICE_KEY defined: ${typeof process.env.SUPABASE_SERVICE_KEY !== 'undefined'}`);
console.log(`SUPABASE_SERVICE_KEY starts with: ${process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 10) + '...' : 'NOT SET'}`);

console.log('\nDebug script completed successfully');
EOF

# Run debug script
log "=== Running debug script ==="
node debug-script.js 2>&1 | tee -a $LOG_FILE || log "Failed to run debug script"

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