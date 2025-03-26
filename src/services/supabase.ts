import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Check for missing credentials
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase credentials. Some features may not work properly.');
}

// Define a type for our Supabase client
let supabase: SupabaseClient;

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
  console.error('Supabase error: Missing credentials');
  
  // Create a mock client that returns empty data for all operations
  // This mock implements the SupabaseClient interface to satisfy TypeScript
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key',
    {
      auth: {
        persistSession: false,
      },
    }
  );
  
  // Create a more comprehensive mock
  const mockQuery = {
    order: () => mockQuery,
    eq: () => mockQuery,
    limit: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    select: () => mockQuery,
    match: () => mockQuery,
    in: () => mockQuery,
    gte: () => mockQuery,
    lte: () => mockQuery,
    range: () => mockQuery,
    then: (callback: any) => Promise.resolve(callback({ data: [], error: null })),
  };
  
  const mockInsert = (data: any) => ({
    select: () => Promise.resolve({ data, error: null }),
    then: (callback: any) => Promise.resolve(callback({ data, error: null })),
  });
  
  const mockUpdate = (data: any) => ({
    eq: () => ({
      select: () => Promise.resolve({ data, error: null }),
      then: (callback: any) => Promise.resolve(callback({ data, error: null })),
    }),
    match: () => ({
      select: () => Promise.resolve({ data, error: null }),
    }),
  });
  
  const mockFrom = (table: string) => ({
    select: () => mockQuery,
    insert: (data: any) => mockInsert(data),
    update: (data: any) => mockUpdate(data),
    upsert: (data: any) => ({
      select: () => Promise.resolve({ data, error: null }),
      then: (callback: any) => Promise.resolve(callback({ data, error: null })),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
      match: () => Promise.resolve({ data: null, error: null }),
    }),
  });
  
  // @ts-ignore - Override the from method
  supabase.from = mockFrom;
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