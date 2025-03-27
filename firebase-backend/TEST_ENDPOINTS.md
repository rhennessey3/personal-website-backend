# Testing Firebase Cloud Functions Endpoints

This guide explains how to use the `test-endpoints.js` script to test all your Firebase Cloud Functions endpoints and ensure they return 200 status codes.

## Prerequisites

Before running the test script, you need:

1. A Firebase service account key
2. Your Firebase API key
3. Node.js installed on your machine
4. The `axios` npm package installed

## Step 1: Generate a Firebase Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service accounts
4. Click "Generate new private key"
5. Save the JSON file as `service-account-key.json` in the root of your project
   - **IMPORTANT**: Never commit this file to version control!
   - Add it to your `.gitignore` file

## Step 2: Get Your Firebase API Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Under "Your apps", find your Web app
5. Copy the `apiKey` value

## Step 3: Install Required Dependencies

```bash
npm install axios
```

## Step 4: Run the Test Script

```bash
FIREBASE_API_KEY=your-api-key node test-endpoints.js
```

Replace `your-api-key` with the API key you copied in Step 2.

## Understanding the Results

The script will:

1. Create a test admin user (or use an existing one)
2. Test each Cloud Function with appropriate test data
3. Print the results, showing which functions passed (200 status code) and which failed

Example output:

```
Testing function: updateProfile
✅ updateProfile: 200 OK
Testing function: addWorkExperience
✅ addWorkExperience: 200 OK
...
Testing function: submitContactForm
✅ submitContactForm: 200 OK

--- Test Summary ---
Passed: 17/17
```

## Troubleshooting

### Authentication Issues

If you see authentication errors:
- Verify your service account key is correct and has the necessary permissions
- Ensure your Firebase API key is correct
- Check that the test user has admin privileges in your Firestore database

### Function Errors

If specific functions fail:
- Check the error message for details
- Verify the function exists and is deployed
- Ensure the test data matches the expected format for the function
- Check your Firebase logs for more detailed error information

### Network Issues

If you see network errors:
- Verify your internet connection
- Check if the Firebase region in the script matches your deployed functions
- Ensure your Firebase project ID is correct

## Customizing the Tests

You can modify the `testData` object in the script to provide different test data for each function. Make sure the test data matches the expected format for each function.

## Security Considerations

- **NEVER** commit your service account key to version control
- Use this script only in development or testing environments
- Consider creating a separate Firebase project for testing
- Limit the permissions of your service account key to only what's necessary for testing