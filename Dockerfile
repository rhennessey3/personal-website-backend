# Use Node.js 18 Alpine as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only express
RUN npm install express

# Copy simple server
COPY simple-server.js ./

# Expose the port the app runs on
EXPOSE 8080

# Start the simple server
CMD ["node", "simple-server.js"]