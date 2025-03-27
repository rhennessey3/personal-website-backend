#!/bin/bash

# Exit on error
set -e

echo "Setting up Firebase Backend..."

# Install dependencies
echo "Installing root dependencies..."
npm install

# Install functions dependencies
echo "Installing functions dependencies..."
cd functions
npm install
# Install types for uuid
npm install --save-dev @types/uuid
cd ..

# Initialize Firebase project
echo "Initializing Firebase project..."
npx firebase login

# Select or create a Firebase project
echo "Please select or create a Firebase project:"
npx firebase use --add

# Deploy Firestore rules
echo "Deploying Firestore rules..."
npx firebase deploy --only firestore:rules

# Deploy Storage rules
echo "Deploying Storage rules..."
npx firebase deploy --only storage:rules

# Build functions
echo "Building functions..."
cd functions
npm run build
cd ..

echo "Setup complete! You can now deploy the Firebase backend with:"
echo "npm run deploy"