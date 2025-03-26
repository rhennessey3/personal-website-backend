// Simple script to debug environment variables
console.log('=== Environment Variables Debug ===');

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
console.log(`SUPABASE_URL length: ${(process.env.SUPABASE_URL || '').length}`);
console.log(`SUPABASE_SERVICE_KEY defined: ${typeof process.env.SUPABASE_SERVICE_KEY !== 'undefined'}`);
console.log(`SUPABASE_SERVICE_KEY starts with: ${process.env.SUPABASE_SERVICE_KEY ? process.env.SUPABASE_SERVICE_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`SUPABASE_SERVICE_KEY length: ${(process.env.SUPABASE_SERVICE_KEY || '').length}`);

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

// Add this to the start.sh script
console.log('\nTo use this debug script, add this line to your start.sh:');
console.log('node debug-env.js && node dist/server.js');