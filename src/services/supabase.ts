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

// Create a mock Supabase client if credentials are missing
let supabase;

if (supabaseUrl && supabaseServiceKey) {
  // Create real Supabase client if credentials are available
  supabase = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
} else {
  // Create a mock client that returns empty data for all operations
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
        limit: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      signIn: () => Promise.resolve({ user: null, session: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
}

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