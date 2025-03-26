import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Use require for modules with type issues
const helmet = require('helmet');
const dotenv = require('dotenv');

// Debug environment variables BEFORE dotenv
console.log('=== ENVIRONMENT VARIABLES BEFORE DOTENV ===');
console.log(`SUPABASE_URL exists: ${process.env.SUPABASE_URL ? 'YES' : 'NO'}`);
console.log(`SUPABASE_SERVICE_KEY exists: ${process.env.SUPABASE_SERVICE_KEY ? 'YES' : 'NO'}`);
console.log(`Railway-specific vars: ${Object.keys(process.env).filter(key => key.includes('RAILWAY')).join(', ')}`);

// Load environment variables
dotenv.config();

// Debug environment variables AFTER dotenv
console.log('=== ENVIRONMENT VARIABLES AFTER DOTENV ===');
console.log(`SUPABASE_URL exists: ${process.env.SUPABASE_URL ? 'YES' : 'NO'}`);
console.log(`SUPABASE_SERVICE_KEY exists: ${process.env.SUPABASE_SERVICE_KEY ? 'YES' : 'NO'}`);

// Import routes
import apiRouter from './routes/api';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route for health check
app.get('/', (req, res) => {
  res.status(200).send('Server is running');
});

// Routes
app.use('/api', apiRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: {
      message: 'Not found',
    },
  });
});

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

app.listen(PORT, HOST, () => {
  console.info(`Server running on ${HOST}:${PORT}`);
});

export default app;