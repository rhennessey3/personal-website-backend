// Script to check for TypeScript errors
const { execSync } = require('child_process');

console.log('Checking for TypeScript errors...');

try {
  // Run TypeScript compiler in noEmit mode to check for errors
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8' });
  console.log('No TypeScript errors found!');
  console.log(output);
} catch (error) {
  console.error('TypeScript errors found:');
  console.error(error.stdout);
  process.exit(1);
}