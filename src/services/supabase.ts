import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Check for missing credentials
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase credentials. Some features may not work properly.');
}

// Create Supabase client
const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      persistSession: false,
    },
  }
);

export default supabase;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error.code === 'PGRST116') {
    return {
      status: 404,
      message: 'Resource not found',
    };
  }
  
  if (error.code === '23505') {
    return {
      status: 409,
      message: 'Resource already exists',
    };
  }
  
  if (error.code === '23503') {
    return {
      status: 400,
      message: 'Invalid reference',
    };
  }
  
  return {
    status: 500,
    message: 'Internal server error',
  };
};

// Helper function to format Supabase response
export const formatSupabaseResponse = <T>(data: T | null, error: any) => {
  if (error) {
    const { status, message } = handleSupabaseError(error);
    return {
      status,
      body: {
        error: {
          message,
        },
      },
    };
  }

  return {
    status: 200,
    body: data,
  };
};