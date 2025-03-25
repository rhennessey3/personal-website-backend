# Use Node.js LTS as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy the temporary package.json file
COPY package.json.railway ./package.json

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app will run on
EXPOSE 8080

# Make the start script executable
RUN chmod +x start.sh

# Start the application
CMD ["./start.sh"]