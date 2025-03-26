import { Router } from 'express';
import caseStudiesRouter from './case-studies';
import blogPostsRouter from './blog-posts';
import profileRouter from './profile';
import contactRouter from './contact';
import adminRouter from './admin';

const router = Router();

// Mount routes
router.use('/case-studies', caseStudiesRouter);
router.use('/blog-posts', blogPostsRouter);
router.use('/profile', profileRouter);
router.use('/contact', contactRouter);
router.use('/admin', adminRouter);

// Health check endpoint
router.get('/health', async (req, res) => {
  // Define the health object with proper TypeScript interface
  interface SupabaseHealth {
    configured: boolean;
    status: string;
    error?: {
      message: string;
      code?: string;
      stack?: string;
    };
  }

  interface HealthCheck {
    status: string;
    timestamp: string;
    environment: string;
    supabase: SupabaseHealth;
  }

  const health: HealthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase: {
      configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
      status: 'unknown'
    }
  };

  // Check Supabase connection if credentials are available
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      // Simple query to test connection
      const { error } = await import('../services/supabase')
        .then(({ default: supabase }) =>
          supabase.from('profiles').select('id').limit(1)
        );
      
      health.supabase.status = error ? 'error' : 'connected';
      
      if (error) {
        health.supabase.error = {
          message: error.message,
          code: error.code
        };
      }
    } catch (error: any) {
      health.supabase.status = 'error';
      health.supabase.error = {
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  res.json(health);
});

export default router;