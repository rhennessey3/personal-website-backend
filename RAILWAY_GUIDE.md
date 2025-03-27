# Railway Deployment Guide

This comprehensive guide provides step-by-step instructions for deploying this Node.js/Express/TypeScript application to Railway.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Environment Variables](#environment-variables)
4. [Deployment Steps](#deployment-steps)
5. [Verifying Deployment](#verifying-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Prerequisites

Before deploying to Railway, ensure you have:

- A [Railway account](https://railway.app/)
- Your GitHub repository connected to Railway
- A Supabase project with credentials (URL and service key)
- Node.js and npm installed locally for testing

## Deployment Options

This application supports two deployment methods on Railway:

### 1. Dockerfile Deployment (Recommended)

Uses the multi-stage Dockerfile in the repository for a clean, optimized build.

**Benefits:**
- Consistent builds across environments
- Smaller production image size
- Explicit control over the build and runtime environment
- Clear separation of build and runtime dependencies

### 2. Nixpacks Deployment

Uses Railway's built-in Nixpacks builder to automatically detect and build the application.

**Benefits:**
- Simpler configuration
- Automatic dependency detection
- No need to maintain a Dockerfile

## Environment Variables

The following environment variables must be configured in Railway:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SUPABASE_URL` | Your Supabase project URL | Yes | `https://abcdefghijklm.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role API key | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `PORT` | The port the application will listen on | Yes | `8080` |
| `NODE_ENV` | The environment mode | Yes | `production` |
| `CORS_ORIGIN` | Allowed CORS origin | No | `https://yourdomain.com` |
| `JWT_SECRET` | Secret for JWT authentication | No | `your-secret-key` |

## Deployment Steps

### Option 1: Dockerfile Deployment

1. **Ensure your railway.json is configured for Dockerfile:**

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

2. **Create a new project in Railway:**
   - Log in to your [Railway dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure environment variables:**
   - Go to the "Variables" tab in your Railway project
   - Add all required environment variables listed above
   - Click "Add" for each variable

4. **Ensure Dockerfile and start.sh alignment:**
   - Verify that the Dockerfile correctly copies and uses the start.sh script:
     ```dockerfile
     # Copy debug scripts and start script
     COPY tests/debug-env.js ./
     COPY start.sh ./
     RUN chmod +x start.sh
     
     # Start the application using the start script
     CMD ["./start.sh"]
     ```
   - Ensure start.sh handles environment variables and starts the application correctly

5. **Deploy your application:**
   - Railway will automatically detect the Dockerfile and start building
   - You can monitor the build progress in the "Deployments" tab

### Option 2: Nixpacks Deployment

1. **Ensure your railway.json is configured for Nixpacks:**

   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10,
       "numReplicas": 1
     }
   }
   ```

2. **Ensure your nixpacks.toml is properly configured:**

   ```toml
   [phases.setup]
   nixPkgs = ["nodejs", "nodejs.pkgs.typescript"]

   [phases.install]
   cmds = ["npm install --include=dev"]

   [phases.build]
   cmds = [
     "npm run build"
   ]

   [start]
   cmd = "node dist/server.js"

   [variables]
   NODE_ENV = "production"
   PORT = "8080"
   ```

3. **Follow steps 2-4 from the Dockerfile deployment section above.**

## Verifying Deployment

After deployment, verify that your application is running correctly:

1. **Check the deployment status:**
   - Go to the "Deployments" tab in your Railway project
   - Look for a green checkmark indicating successful deployment

2. **Check the logs:**
   - Click on the latest deployment
   - Go to the "Logs" tab
   - Look for messages indicating successful startup:
     ```
     Server running on 0.0.0.0:8080
     ```
   - Check for Supabase connection messages:
     ```
     Supabase Service Debug: SUPABASE_URL defined: YES
     Supabase Service Debug: SUPABASE_SERVICE_KEY defined: YES
     ```

3. **Test the API endpoints:**
   - Use the provided test scripts:
     ```bash
     ./tests/test-railway-deployment.sh
     ```
   - Or manually test endpoints using the generated Railway URL:
     ```
     https://your-app-name-production-xxxx.up.railway.app/api/health
     ```

## Troubleshooting

### Common Issues and Solutions

#### 1. 502 Bad Gateway Error

**Symptoms:**
- Browser shows "Application failed to respond"
- API endpoints return 502 status code

**Possible Causes and Solutions:**

a) **Application not binding to the correct host:**
   - Ensure the application binds to `0.0.0.0` instead of `localhost`:
   ```typescript
   app.listen(PORT, '0.0.0.0', () => {
     console.info(`Server running on 0.0.0.0:${PORT}`);
   });
   ```

b) **Incorrect PORT environment variable:**
   - Verify the PORT environment variable is set to 8080 in Railway
   - Ensure the application uses this environment variable:
   ```typescript
   const PORT = parseInt(process.env.PORT || '5000', 10);
   ```

c) **Application crashing on startup:**
   - Check the logs for error messages
   - Ensure all required environment variables are set
   - Verify the build process completed successfully

#### 2. Supabase Connection Issues

**Symptoms:**
- API endpoints return 500 errors
- Logs show Supabase connection errors

**Possible Causes and Solutions:**

a) **Missing environment variables:**
   - Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are set correctly
   - Check for typos in the variable names or values

b) **IP restrictions:**
   - Check if your Supabase project has IP restrictions enabled
   - Add Railway's IP ranges to the allowlist if necessary

c) **Invalid credentials:**
   - Regenerate the service key in Supabase
   - Update the environment variable in Railway

#### 3. Build Failures

**Symptoms:**
- Deployment fails during the build phase
- Logs show compilation errors

**Possible Causes and Solutions:**

a) **TypeScript errors:**
   - Fix TypeScript errors in your code
   - Consider using `--noEmitOnError false` for the TypeScript compiler

b) **Missing dependencies:**
   - Ensure all dependencies are correctly listed in package.json
   - Check for compatibility issues between packages

c) **Memory issues during build:**
   - Increase the memory allocation for the build process
   - Split large operations into smaller steps

#### 4. Dockerfile and start.sh Misalignment

**Symptoms:**
- Application starts but behaves unexpectedly
- Environment variables are not properly loaded
- Debug scripts are not found or not executed
- Application crashes with path-related errors

**Possible Causes and Solutions:**

a) **Inconsistent file paths:**
   - Ensure paths in Dockerfile match those in start.sh
   - Use absolute paths where appropriate
   - Verify working directory assumptions

b) **Script not being used:**
   - Ensure the Dockerfile uses the start.sh script as its entry point
   - Check that start.sh has executable permissions (`chmod +x start.sh`)

c) **Environment variable handling:**
   - Ensure both files handle environment variables consistently
   - Verify that required variables are passed through from Docker to the script

d) **File copying issues:**
   - Ensure all required files are copied into the Docker image
   - Check that file permissions are preserved

## Best Practices

1. **Use environment variables for all configuration:**
   - Never hardcode sensitive information
   - Use .env.example to document required variables

2. **Implement health checks:**
   - Add a `/` or `/api/health` endpoint that returns a 200 status
   - Railway uses this to determine if your application is healthy

3. **Set up proper logging:**
   - Log important events and errors
   - Include context information in logs
   - Avoid logging sensitive information

4. **Use a multi-stage Dockerfile:**
   - Separate build and runtime environments
   - Include only necessary files in the final image
   - Minimize image size for faster deployments

5. **Implement graceful shutdown:**
   - Handle SIGTERM signals to close connections properly
   - Ensure in-flight requests complete before shutting down

6. **Set up automatic restarts:**
   - Configure `restartPolicyType` and `restartPolicyMaxRetries` in railway.json
   - Implement retry logic for external service connections

7. **Monitor your application:**
   - Regularly check Railway logs for errors
   - Set up alerts for deployment failures
   - Monitor application performance metrics

8. **Ensure alignment between Dockerfile and start.sh:**
   - When using a start.sh script in a Docker-based deployment, it is critical to ensure the Dockerfile and the script are aligned in both build-time logic and runtime behavior
   - Misalignment may result in skipped tasks, failed startup, or silent runtime errors
   - The Dockerfile should copy the start.sh script and set it as the entry point
   - The start.sh script should handle environment setup, debugging, and application startup
   - Both files should reference the same paths, environment variables, and commands