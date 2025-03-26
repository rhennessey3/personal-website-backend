# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including TypeScript
RUN npm ci && npm install -g typescript

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Railway will provide these environment variables
# We're not hardcoding any values here

# Copy package files
COPY package*.json ./

# Install production dependencies and TypeScript globally
RUN npm ci --only=production && npm install -g typescript

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy debug scripts
COPY test-railway-env.js ./
COPY debug-env.js ./

# Expose the port the app runs on
EXPOSE 8080

# Create a simple health check script
RUN echo '#!/bin/sh\necho "Health check script running"\necho "Environment variables:"\nprintenv | grep -E "PORT|NODE_ENV|SUPABASE"\necho "Checking if server.js exists:"\nls -la dist/server.js || echo "server.js not found"\necho "Directory listing:"\nls -la\necho "dist directory listing:"\nls -la dist || echo "dist directory not found"' > health-check.sh && chmod +x health-check.sh

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Start the application with the start.sh script
CMD ["sh", "-c", "./health-check.sh && ./start.sh"]