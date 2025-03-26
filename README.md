# Personal Website Backend

## Required Environment Variables

This application requires the following environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role API key
- `NODE_ENV`: Set to "production" for deployment
- `PORT`: The port to run the server on (defaults to 8080)
- `CORS_ORIGIN`: The allowed origin for CORS

## Deployment on Railway

This project uses Railway's Nixpacks build system for deployment:

1. Create a new project in Railway
2. Connect your GitHub repository
3. Set the required environment variables in the Variables tab:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `NODE_ENV`: production
   - `PORT`: 8080
   - `CORS_ORIGIN`: Your frontend URL
4. Railway will automatically detect and build the Node.js application

The deployment process:
- Nixpacks detects Node.js from package.json
- Dependencies are installed with `npm install`
- The application is built with `npm run build`
- The application is started with `npm start`

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