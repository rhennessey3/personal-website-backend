#!/bin/sh
# Debug environment variables
echo "=== Debugging environment variables ==="
node debug-env.js

# Start the application
echo "=== Starting server ==="
node dist/server.js