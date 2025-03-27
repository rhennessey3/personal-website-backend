# Personal Website Backend Architecture

This document provides a comprehensive overview of the project architecture, including the build schema, deployment process, and application structure.

## Table of Contents

- [Personal Website Backend Architecture](#personal-website-backend-architecture)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Directory Structure](#directory-structure)
  - [Application Architecture](#application-architecture)
  - [Build Schema](#build-schema)
    - [Dockerfile Build](#dockerfile-build)
      - [Stage 1: Builder](#stage-1-builder)
      - [Stage 2: Production](#stage-2-production)
    - [Nixpacks Build](#nixpacks-build)
  - [Deployment Process](#deployment-process)
  - [Environment Configuration](#environment-configuration)
  - [Runtime Behavior](#runtime-behavior)

## Project Overview

This is a backend service for a personal website, built with Node.js, Express, and TypeScript. It connects to a Supabase database for data storage and provides API endpoints for blog posts, case studies, profile information, and contact functionality.

## Directory Structure

```
/
├── src/                    # Source code
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── routes/             # API route definitions
│   ├── schemas/            # Zod validation schemas
│   ├── services/           # External service integrations
│   ├── types/              # TypeScript type definitions
│   ├── server.ts           # Main application entry point
│   └── test.http           # HTTP request examples
├── tests/                  # Test scripts
├── .env.example            # Example environment variables
├── Dockerfile              # Docker build configuration
├── nixpacks.toml           # Nixpacks build configuration
├── package.json            # Project dependencies and scripts
├── railway.json            # Railway deployment configuration
├── start.sh                # Application startup script
└── tsconfig.json           # TypeScript configuration
```

## Application Architecture

The application follows a typical Express.js architecture:

1. **Entry Point**: `src/server.ts` initializes the Express application, sets up middleware, and defines the base routes.

2. **Routing**: Routes are organized in the `src/routes` directory, with separate files for different API sections.

3. **Controllers**: Business logic is implemented in controllers that handle requests and return responses.

4. **Middleware**: Custom middleware for authentication and request validation.

5. **Schemas**: Zod schemas for validating request data.

6. **Services**: External service integrations, particularly with Supabase.

## Build Schema

The application supports two build methods: Dockerfile (recommended) and Nixpacks.

### Dockerfile Build

The build process uses a multi-stage Docker build to create an optimized production image:

#### Stage 1: Builder

```dockerfile
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
```

This stage:
1. Uses Node.js 18 Alpine as the base image
2. Sets up the working directory
3. Installs all dependencies (including dev dependencies)
4. Copies the source code
5. Compiles TypeScript to JavaScript using `tsc`

#### Stage 2: Production

```dockerfile
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Create a directory for logs
RUN mkdir -p /app/logs

# Expose the port the app runs on
EXPOSE 8080

# Start the application using the start script
CMD ["./start.sh"]
```

This stage:
1. Creates a fresh Node.js 18 Alpine container
2. Installs only production dependencies
3. Copies the compiled JavaScript from the builder stage
4. Copies the start script and makes it executable
5. Creates a logs directory
6. Exposes port 8080
7. Sets the start script as the entry point

### Nixpacks Build

The alternative build method uses Railway's Nixpacks:

```toml
[phases.setup]
nixPkgs = ["nodejs", "nodejs.pkgs.typescript"]

[phases.install]
cmds = ["npm install --include=dev"]

[phases.build]
cmds = [
  "echo 'TypeScript version:'",
  "npx tsc --version",
  "echo 'Node version:'",
  "node --version",
  "npm run build"
]

[start]
cmd = "node dist/server.js"

[variables]
NODE_ENV = "production"
PORT = "8080"
```

This configuration:
1. Sets up Node.js and TypeScript
2. Installs all dependencies
3. Logs version information
4. Builds the application with TypeScript
5. Starts the application directly with Node.js
6. Sets environment variables

## Deployment Process

The application is deployed on Railway using the following process:

1. **Configuration**: The `railway.json` file specifies the build method and deployment settings:
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "DOCKERFILE"
     },
     "deploy": {
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10,
       "numReplicas": 1
     }
   }
   ```

2. **Environment Variables**: Required environment variables are set in Railway's Variables tab:
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Supabase service role API key
   - `NODE_ENV`: Set to "production"
   - `PORT`: Set to 8080
   - `CORS_ORIGIN`: Allowed CORS origin
   - `JWT_SECRET`: Secret for JWT authentication (optional)

3. **Build Process**: Railway automatically builds the application using the specified builder (Dockerfile or Nixpacks).

4. **Deployment**: The application is deployed with the specified restart policy and replica count.

## Environment Configuration

The application uses environment variables for configuration, loaded through:

1. **Railway Variables**: Set in the Railway dashboard
2. **Dotenv**: For local development using a `.env` file
3. **Start Script**: The `start.sh` script provides fallbacks and debugging

## Runtime Behavior

At runtime, the application:

1. Loads environment variables
2. Sets up Express middleware for security, logging, and request parsing
3. Initializes routes
4. Connects to Supabase
5. Starts the HTTP server on the specified port
6. Implements graceful shutdown for SIGTERM and SIGINT signals
7. Handles uncaught exceptions and unhandled promise rejections

The `start.sh` script provides additional functionality:
- Creates a log file
- Debugs environment variables
- Checks for required configuration
- Sets default values for PORT and HOST
- Verifies the build output exists
- Starts the Node.js application