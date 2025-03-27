// Simple script to test Railway environment variables
console.log('=== Railway Environment Variables Test ===');

// Print all environment variables (masking sensitive values)
const envVars = process.env;
const safeEnvVars = { ...envVars };

// Mask sensitive values
if (safeEnvVars.SUPABASE_SERVICE_KEY) {
  safeEnvVars.SUPABASE_SERVICE_KEY = safeEnvVars.SUPABASE_SERVICE_KEY.substring(0, 10) + '...';
}

// Print Railway-specific variables
console.log('\nRailway-specific variables:');
Object.keys(safeEnvVars)
  .filter(key => key.includes('RAILWAY'))
  .forEach(key => {
    console.log(`${key}: ${safeEnvVars[key]}`);
  });

// Check specific Supabase variables
console.log('\nSupabase variables check:');
console.log(`SUPABASE_URL defined: ${typeof process.env.SUPABASE_URL !== 'undefined' ? 'YES' : 'NO'}`);
console.log(`SUPABASE_URL value: ${process.env.SUPABASE_URL || 'NOT SET'}`);
console.log(`SUPABASE_SERVICE_KEY defined: ${typeof process.env.SUPABASE_SERVICE_KEY !== 'undefined' ? 'YES' : 'NO'}`);
console.log(`SUPABASE_SERVICE_KEY starts with: ${process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 10) + '...' : 'NOT SET'}`);

// Check for similar variable names that might be used instead
console.log('\nChecking for similar variable names:');
const possibleVariants = [
  'SUPABASE_URL', 'SUPABASEURL', 'SUPABASE_API_URL', 'SUPABASE_ENDPOINT',
  'SUPABASE_SERVICE_KEY', 'SUPABASESERVICEKEY', 'SUPABASE_KEY', 'SUPABASE_API_KEY', 'SUPABASE_SECRET'
];

possibleVariants.forEach(variant => {
  if (typeof process.env[variant] !== 'undefined') {
    console.log(`Found: ${variant}`);
  }
});

// Print all environment variables (for debugging)
console.log('\nAll environment variables:');
Object.keys(safeEnvVars).sort().forEach(key => {
  console.log(`${key}: ${safeEnvVars[key]}`);
});