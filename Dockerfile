# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

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

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy debug scripts
COPY test-railway-env.js ./
COPY debug-env.js ./

# Expose the port the app runs on
EXPOSE 8080

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Start the application with the start.sh script
CMD ["./start.sh"]