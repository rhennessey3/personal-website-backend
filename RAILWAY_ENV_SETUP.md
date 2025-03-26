# Railway Environment Variables Setup Guide

This guide will help you set up the environment variables in Railway for your deployment.

## Setting Environment Variables in Railway

1. Log in to your [Railway dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on the "Variables" tab
4. Add the following variables:
   - `SUPABASE_URL` - Your Supabase project URL (use the value from your `.env` file: `https://imfmubnxmgxntqhjyqav.supabase.co`)
   - `SUPABASE_SERVICE_KEY` - Your Supabase service role API key (use the value from your `.env` file)
   - `NODE_ENV` - Set to "production"
   - `PORT` - Set to "8080"
   - `CORS_ORIGIN` - Your frontend URL (e.g., your production frontend URL)

## Ensuring Dockerfile is Used

Your `railway.json` file is already configured to use the Dockerfile with `"builder": "DOCKERFILE"`. However, the Railway UI shows Nixpacks is selected. To ensure the Dockerfile is used:

1. Make sure your `railway.json` file is committed to your repository
2. Try setting an environment variable to specify the Dockerfile path:
   ```
   RAILWAY_DOCKERFILE_PATH=./Dockerfile
   ```
3. If that doesn't work, you can try using the Railway CLI:
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Link to your project
   railway link
   
   # Set the builder to Dockerfile
   railway variables set RAILWAY_BUILDER=DOCKERFILE
   ```

## Deploying Your Application

After setting the environment variables:

1. Go to the "Deployments" tab
2. Click "Deploy now" to trigger a new deployment
3. Railway will build your application using the Dockerfile (if properly configured)
4. Once deployed, you can view the logs to verify everything is working correctly

## Verifying Environment Variables

After deployment:

1. Go to the "Logs" tab
2. Look for these log messages:
   ```
   === Environment variables already set (likely from Railway) ===
   Using existing environment variables
   ```
   
   And later in the logs:
   ```
   Supabase Service Debug: SUPABASE_URL defined: YES
   Supabase Service Debug: SUPABASE_SERVICE_KEY defined: YES
   ```

3. If you see "NO" instead of "YES", it means your environment variables are not being correctly passed to the application

## Testing Your API

After successful deployment, you can test your API using the provided `test-railway-deployment.sh` script:

1. Update the `BASE_URL` in the script with your Railway URL
2. Run the script:
   ```bash
   ./test-railway-deployment.sh
   ```

This will make requests to your API endpoints and show the responses.