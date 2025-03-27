// Simple debug script for environment variables
console.log('=== Debug Environment Variables ===');

// Print all environment variables (masking sensitive values)
const envVars = process.env;
const safeEnvVars = { ...envVars };

// Mask sensitive values
if (safeEnvVars.SUPABASE_SERVICE_KEY) {
  safeEnvVars.SUPABASE_SERVICE_KEY = safeEnvVars.SUPABASE_SERVICE_KEY.substring(0, 10) + '...';
}
if (safeEnvVars.JWT_SECRET) {
  safeEnvVars.JWT_SECRET = safeEnvVars.JWT_SECRET.substring(0, 10) + '...';
}

// Print all environment variables
console.log('\nAll environment variables:');
Object.keys(safeEnvVars).sort().forEach(key => {
  console.log(`${key}: ${safeEnvVars[key]}`);
});

// Check specific Supabase variables
console.log('\nSupabase variables check:');
console.log(`SUPABASE_URL defined: ${typeof process.env.SUPABASE_URL !== 'undefined'}`);
console.log(`SUPABASE_URL value: ${process.env.SUPABASE_URL || 'NOT SET'}`);
console.log(`SUPABASE_SERVICE_KEY defined: ${typeof process.env.SUPABASE_SERVICE_KEY !== 'undefined'}`);
console.log(`SUPABASE_SERVICE_KEY starts with: ${process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 10) + '...' : 'NOT SET'}`);

console.log('\nDebug script completed successfully');