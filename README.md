# Personal Website Backend

## Required Environment Variables

This application requires the following environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role API key
- `NODE_ENV`: Set to "production" for deployment
- `PORT`: The port to run the server on (defaults to 8080)
- `CORS_ORIGIN`: The allowed origin for CORS

## Deployment on Railway

This project uses a Dockerfile for deployment on Railway:

1. Create a new project in Railway
2. Connect your GitHub repository
3. Set the required environment variables in the Variables tab:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `NODE_ENV`: production
   - `PORT`: 8080
   - `CORS_ORIGIN`: Your frontend URL
4. Railway will use the Dockerfile to build and deploy the application

The deployment process:
- The Dockerfile uses a multi-stage build process
- Dependencies are installed with `npm ci`
- The application is built with `npm run build`
- Only production dependencies and built files are included in the final image
- The application is started directly with `node dist/server.js`

### Why Dockerfile instead of Nixpacks?

Using a Dockerfile instead of Nixpacks provides several advantages:
1. More control over the build and runtime environment
2. Avoids issues with environment variable handling
3. Eliminates the need for the start.sh script which had hardcoded credentials
4. Ensures Railway environment variables are properly passed to the application
5. Creates a more consistent deployment process

## Local Development

1. Create a `.env` file in the root directory
2. Add the required environment variables to the `.env` file
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server

## Troubleshooting

If you encounter connection issues with Supabase:

1. Verify your Supabase credentials are correct
2. Check if your Supabase project has IP restrictions
3. Ensure your Supabase project is active
4. Check Railway logs for any connection errors
5. Ensure environment variables are properly set in Railway's Variables tab
6. Verify that the Dockerfile is being used as the builder in railway.json

### Common Issues

#### Environment Variable Conflicts
The application now uses environment variables directly from Railway without relying on the start.sh script. This prevents conflicts that could occur when environment variables are loaded multiple times or overridden by hardcoded values.

#### Hardcoded Credentials
The previous deployment used hardcoded Supabase credentials in the start.sh script when a .env file wasn't found. This has been removed in favor of using Railway's environment variables system, which is more secure and flexible.

#### Deployment Builder
If you're still experiencing issues, verify that railway.json has `"builder": "DOCKERFILE"` set in the build configuration to ensure Railway is using the Dockerfile for deployment.