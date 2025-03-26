# Use Node.js 18 Alpine as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create a simple health check script
RUN echo '#!/bin/sh\necho "Health check script running"\necho "Environment variables:"\nprintenv | grep -E "PORT|NODE_ENV|SUPABASE"\necho "Checking if server.js exists:"\nls -la dist/server.js || echo "server.js not found"\necho "Directory listing:"\nls -la\necho "dist directory listing:"\nls -la dist || echo "dist directory not found"' > health-check.sh && chmod +x health-check.sh

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["sh", "-c", "./health-check.sh && node dist/server.js"]