# Railway Deployment Guide

This guide provides detailed instructions for deploying this application to Railway using the Dockerfile approach.

## Prerequisites

- A Railway account
- Your GitHub repository connected to Railway
- Supabase project with credentials (URL and service key)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository has the following files:
- `Dockerfile` - For building the application
- `railway.json` - With `"builder": "DOCKERFILE"` set

### 2. Create a New Project in Railway

1. Log in to your [Railway dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will detect the Dockerfile and use it for deployment

### 3. Configure Environment Variables

In your Railway project:
1. Go to the "Variables" tab
2. Add the following environment variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_KEY` - Your Supabase service role API key
   - `NODE_ENV` - Set to "production"
   - `PORT` - Set to "8080" (or your preferred port)
   - `CORS_ORIGIN` - Your frontend URL

### 4. Deploy Your Application

1. Go to the "Deployments" tab
2. Click "Deploy now" to manually trigger a deployment
3. Railway will build your application using the Dockerfile
4. Once deployed, you can view the logs to verify everything is working correctly

### 5. Verify Supabase Connection

After deployment:
1. Go to the "Logs" tab
2. Check for any Supabase connection errors
3. Verify that the application is connecting to Supabase successfully
4. Look for log messages like "Supabase Service Debug: SUPABASE_URL defined: YES"

## Troubleshooting

### Environment Variables Not Being Recognized

If your application can't access environment variables:
1. Verify they are correctly set in Railway's Variables tab
2. Check that the variable names match exactly what your application expects
3. Redeploy the application after making any changes to environment variables

### Supabase Connection Issues

If you're still having Supabase connection issues:
1. Verify your Supabase project is active
2. Check if your Supabase project has IP restrictions
3. Ensure your Supabase credentials are correct
4. Try testing the connection locally with the same credentials

### Dockerfile Build Failures

If the Dockerfile build fails:
1. Check the build logs for specific errors
2. Verify that all dependencies are correctly specified in package.json
3. Ensure the Node.js version in the Dockerfile is compatible with your application

## Benefits of the Dockerfile Approach

Using a Dockerfile for deployment provides several advantages:

1. **Direct Environment Variable Access**: Environment variables set in Railway are passed directly to your application without any intermediate scripts.

2. **No Hardcoded Credentials**: The Dockerfile approach eliminates the need for hardcoded credentials in scripts like start.sh.

3. **Consistent Builds**: The multi-stage build process ensures consistent builds across different environments.

4. **Smaller Image Size**: By using a multi-stage build, the final image only contains what's needed for production.

5. **Explicit Control**: You have explicit control over how your application is built and run.

## Reverting to Nixpacks (If Needed)

If you need to revert to Nixpacks for any reason:
1. Change `"builder": "DOCKERFILE"` back to `"builder": "NIXPACKS"` in railway.json
2. Update your start script in package.json if you modified it
3. Redeploy your application