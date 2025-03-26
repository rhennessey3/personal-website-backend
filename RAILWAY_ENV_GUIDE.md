# Railway Environment Variables Guide

This guide will help you troubleshoot environment variable issues in your Railway deployment.

## Checking Environment Variables in Railway

1. Log in to your [Railway dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on the "Variables" tab
4. Verify that the following variables are set:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_KEY` - Your Supabase service role API key
   - `NODE_ENV` - Should be set to "production"
   - `PORT` - Should be set to "8080"
   - `CORS_ORIGIN` - Your frontend URL

## Common Issues and Solutions

### 1. Variable Names Are Case-Sensitive

Make sure the variable names are exactly as shown above. Railway is case-sensitive, so `SUPABASE_URL` is different from `Supabase_URL` or `supabase_url`.

### 2. Variables Not Being Applied to Deployment

After setting or changing environment variables in Railway:

1. Go to the "Deployments" tab
2. Click "Deploy now" to trigger a new deployment
3. This ensures your new variables are applied to the application

### 3. Checking Logs for Environment Variable Issues

After deployment:

1. Go to the "Logs" tab
2. Look for the output from our test script:
   ```
   === Railway Environment Variables Test ===
   ```
3. Check if it shows:
   ```
   SUPABASE_URL defined: YES
   SUPABASE_SERVICE_KEY defined: YES
   ```
4. If it shows "NO" for either, the variables are not being passed correctly

### 4. Using Railway CLI to Set Variables

If the web interface isn't working, you can use the Railway CLI:

1. Install the Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Link to your project: `railway link`
4. Set variables:
   ```
   railway variables set SUPABASE_URL=your-url
   railway variables set SUPABASE_SERVICE_KEY=your-key
   railway variables set NODE_ENV=production
   railway variables set PORT=8080
   railway variables set CORS_ORIGIN=your-frontend-url
   ```

## Testing After Deployment

After deploying, you can test your API using the provided `test-api.sh` script:

```bash
./test-api.sh
```

This will make requests to your API endpoints and show the responses.