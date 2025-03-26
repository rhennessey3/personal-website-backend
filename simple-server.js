// Simple Express server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Log all environment variables
console.log('=== Environment Variables ===');
Object.keys(process.env).forEach(key => {
  const value = key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD') 
    ? '******' 
    : process.env[key];
  console.log(`${key}: ${value}`);
});

// Simple root route
app.get('/', (req, res) => {
  res.send('Hello from Railway! Simple server is working.');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
});