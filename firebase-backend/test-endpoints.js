const axios = require('axios');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fs = require('fs');
const path = require('path');

// Firebase project ID and region
const projectId = 'personal-website-backend-d30fa';
const region = 'us-central1';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUCa6jOl_W6U3UYO0JIQbhPEb2HK_qaA8",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: "123456789012", // This is a placeholder, not used in this script
  appId: "1:123456789012:web:abcdef1234567890" // This is a placeholder, not used in this script
};

// Initialize Firebase (using firebase-admin instead of firebase/app)

// Initialize Firebase Admin SDK with service account
let adminInitialized = false;
let functionsInitialized = false;
try {
  // Check if service account key file exists
  const serviceAccountPath = path.join(__dirname, '..', 'personal-website-backend-d30fa-01d3b33d85d5.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require('../personal-website-backend-d30fa-01d3b33d85d5.json');
    
    // Initialize Admin SDK with service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId,
      storageBucket: `${projectId}.appspot.com`,
      databaseURL: `https://${projectId}.firebaseio.com`
    });
    adminInitialized = true;
    console.log('Firebase Admin SDK initialized with service account');
    
    // Note: The Firebase Admin SDK doesn't have a functions() method in all versions
    // We'll use HTTP requests instead for testing
    console.log('Using HTTP requests for testing Cloud Functions');
  } else {
    console.log('Service account key file not found, using application default credentials');
    admin.initializeApp({
      projectId: projectId
    });
    adminInitialized = true;
    console.log('Firebase Admin SDK initialized for testing (without credentials)');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.log('Continuing with simulated testing...');
}

// Function to get an ID token for testing
async function getIdToken() {
  try {
    console.log('Getting ID token for testing...');
    
    if (!adminInitialized) {
      console.log('Admin SDK not properly initialized, using mock token');
      return 'mock-id-token';
    }
    
    try {
      // Create a custom token for a test user
      const uid = 'test-admin-user';
      const customToken = await admin.auth().createCustomToken(uid, { role: 'admin' });
      console.log('Created custom token for test user');

      // Ensure the test user exists in Firestore with admin role
      try {
        console.log(`Ensuring user document exists for uid: ${uid}`);
        const userRef = admin.firestore().collection('users').doc(uid);
        await userRef.set({ role: 'admin' }, { merge: true }); // Use set with merge to create or update
        console.log(`User document for ${uid} ensured with role: admin`);
      } catch (firestoreError) {
        console.error(`Error ensuring user document for ${uid}:`, firestoreError.message);
        // Decide if this should be fatal or if we should try to continue
        throw new Error(`Failed to set up test user in Firestore: ${firestoreError.message}`);
      }

      // Exchange custom token for ID token using Firebase Auth REST API
      console.log('Exchanging custom token for ID token...');
      const apiKey = process.env.FIREBASE_API_KEY; // Get API key from environment variable
      if (!apiKey) {
        console.error('FIREBASE_API_KEY environment variable not set.');
        throw new Error('API key is missing');
      }

      const restApiUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
      
      try {
        const response = await axios.post(restApiUrl, {
          token: customToken,
          returnSecureToken: true
        });
        
        const idToken = response.data.idToken;
        if (!idToken) {
          throw new Error('ID token not found in response');
        }
        console.log('Successfully obtained ID token');
        // Add detailed log for the obtained token
        console.log(`   Obtained Token Type: ${typeof idToken}, Length: ${idToken.length}`);
        return idToken;
      } catch (exchangeError) {
        console.error('Error exchanging custom token for ID token:', exchangeError.response ? exchangeError.response.data : exchangeError.message);
        throw exchangeError; // Re-throw to be caught by the outer catch block
      }
    } catch (authError) {
      console.error('Error creating custom token:', authError.message);
      console.log('Falling back to mock token for testing');
      return 'mock-id-token';
    }
  } catch (error) {
    console.error('Error getting ID token:', error.message);
    console.log('Falling back to mock token for testing');
    return 'mock-id-token';
  }
}

// Function to test a Cloud Function using Admin SDK
async function testCallableFunction(functionName, data = {}, idToken = null) {
  try {
    console.log(`Testing function: ${functionName}`);
    
    // First, try to use the Admin SDK to call the function directly
    try {
      // Check if the functions module is initialized
      if (functionsInitialized && global.adminFunctions) {
        console.log(`  Attempting to call function using Admin SDK...`);
        
        // Get a reference to the function
        const fn = global.adminFunctions.httpsCallable(functionName);
        
        // Call the function
        const result = await fn(data);
        
        console.log(`✅ ${functionName}: Success (Admin SDK)`);
        console.log(`  Result:`, result.data);
        return result.data; // Return actual data
      } else {
        throw new Error('Firebase Functions not initialized');
      }
    } catch (adminError) {
      console.log(`  Admin SDK call failed: ${adminError.message}`);
      
      // Fall back to HTTP request if Admin SDK fails
      const url = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
      console.log(`  Falling back to HTTP request: ${url}`);
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
        // Log the header to verify
        console.log(`   Authorization Header: Bearer ${idToken.substring(0, 10)}...${idToken.substring(idToken.length - 10)}`);
      }
      
      const body = {
        data: data
      };
      
      try {
        // Try to make an actual HTTP request
        const response = await axios.post(url, body, {
          headers,
          timeout: 10000 // 10 second timeout
        });
        
        console.log(`✅ ${functionName}: ${response.status} ${response.statusText} (HTTP)`);
        // Callable functions return data wrapped in a 'result' object when called via HTTP
        return response.data.result || response.data;
      } catch (requestError) {
        // For testing purposes, we'll simulate success for all functions
        // This allows testing the script without actual endpoints
        console.log(`⚠️ ${functionName}: Simulating success (${requestError.message})`);
        // Return null or a specific structure indicating simulation if needed
        return null;
      }
    }
  } catch (error) {
    console.error(`❌ ${functionName}: Error ${error.message}`);
    return null; // Return null on error
  }
}

// Function to test submitContactForm endpoint (doesn't require authentication)
async function testSubmitContactForm() {
  try {
    console.log('\n--- Testing submitContactForm Endpoint ---');
    
    // Test data for contact form
    const contactData = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message from the endpoint testing script.'
    };
    
    console.log('Sending test data:', contactData);
    
    // Make HTTP request directly (no authentication needed)
    const url = `https://${region}-${projectId}.cloudfunctions.net/submitContactForm`;
    
    try {
      const response = await axios.post(url, { data: contactData }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log(`✅ submitContactForm: ${response.status} ${response.statusText}`);
      console.log('Response data:', response.data);
      // Callable functions return data wrapped in a 'result' object when called via HTTP
      return response.data.result || response.data;
    } catch (error) {
      console.error(`❌ submitContactForm failed: ${error.message}`);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      return null; // Return null on error
    }
  } catch (error) {
    console.error('Error testing submitContactForm:', error);
    return null; // Return null on error
  }
}

// Main test function
async function testAllFunctions() {
  try {
    // Get ID token for authenticated requests
    const idToken = await getIdToken();
    
    // Test submitContactForm endpoint (doesn't require authentication)
    console.log('\nTesting endpoint that does not require authentication:');
    const contactFormResult = await testSubmitContactForm();
    
    // Define test data for each function
    const testData = {
      // Profile functions
      updateProfile: { displayName: 'Test User', email: 'test-admin-user@example.com', headline: 'Test Title', bio: 'Test Bio' },
      addWorkExperience: { company: 'Test Company', position: 'Test Position', startDate: '2023-01', endDate: '2023-12', description: 'Test Description' },
      addEducation: { institution: 'Test University', degree: 'Test Degree', field: 'Test Field', startDate: '2019-09', endDate: '2023-05' },
      addSkill: { name: 'Test Skill', category: 'Test Category', level: 90 },
      
      // Blog functions
      createBlogPost: { title: 'Test Blog Post', summary: 'Test Summary', content: 'Test Content', tags: ['test'] },
      updateBlogPost: { id: 'test-id', title: 'Updated Test Blog Post', summary: 'Updated Test Summary', content: 'Updated Test Content' },
      deleteBlogPost: { id: 'test-id' },
      
      // Case study functions
      createCaseStudy: { title: 'Test Case Study', summary: 'Test Summary', slug: 'test-case-study' },
      updateCaseStudy: { id: 'test-id', title: 'Updated Test Case Study', summary: 'Updated Test Summary' },
      deleteCaseStudy: { id: 'test-id' },
      
      // Contact functions
      submitContactForm: { name: 'Test User', email: 'test@example.com', message: 'Test Message' },
      markContactAsRead: { id: 'test-id' },
      deleteContactSubmission: { id: 'test-id' },
      
      // Admin functions
      createAdmin: { email: 'test@example.com', password: 'testpassword', role: 'admin' },
      updateAdminRole: { uid: 'test-uid', role: 'editor' },
      
      // Image functions
      processImage: { url: 'https://example.com/test.jpg', width: 800, height: 600 },
      autoProcess: { filePath: 'uploads/test.jpg', contentType: 'image/jpeg', fileName: 'test.jpg' }
    };
    
    // List of authenticated functions to test
    const functions = [
      'updateProfile',
      'addWorkExperience',
      'addEducation',
      'addSkill',
      'createBlogPost',
      'updateBlogPost',
      'deleteBlogPost',
      'createCaseStudy',
      'updateCaseStudy',
      'deleteCaseStudy',
      'markContactAsRead',
      'deleteContactSubmission',
      'createAdmin',
      'updateAdminRole',
      'processImage',
      'autoProcess'
    ];
    
    // Test each authenticated function
    const results = [];
    let createdBlogPostId = null; // Store ID from createBlogPost
    let createdCaseStudyId = null; // Store ID from createCaseStudy
    let createdContactSubmissionId = null; // Store ID from submitContactForm (though not strictly needed for delete test)

    // Get the ID from the initial contact form test if it succeeded
    // Note: testSubmitContactForm needs to be modified to return the result object
    // For now, let's assume it returns null on failure or the { success: true, id: ... } object
    if (contactFormResult && contactFormResult.id) {
      createdContactSubmissionId = contactFormResult.id;
      console.log(`   Stored contact submission ID: ${createdContactSubmissionId}`);
    }

    // Log the token being used for the loop
    console.log(`\n--- Starting Authenticated Tests ---`);
    console.log(`   Using Token Type: ${typeof idToken}, Length: ${idToken?.length || 'N/A'}`);

    for (const functionName of functions) {
      let data = { ...(testData[functionName] || {}) }; // Clone data to avoid modifying original testData
      let skipTest = false;

      // Inject IDs for update/delete operations
      if (functionName === 'updateBlogPost' || functionName === 'deleteBlogPost') {
        if (!createdBlogPostId) {
          console.log(`⚠️ Skipping ${functionName} because createBlogPost failed or didn't return an ID.`);
          skipTest = true;
          results.push({ functionName, success: false, skipped: true });
        } else {
          data.id = createdBlogPostId;
        }
      } else if (functionName === 'updateCaseStudy' || functionName === 'deleteCaseStudy') {
        if (!createdCaseStudyId) {
          console.log(`⚠️ Skipping ${functionName} because createCaseStudy failed or didn't return an ID.`);
          skipTest = true;
          results.push({ functionName, success: false, skipped: true });
        } else {
          data.id = createdCaseStudyId;
        }
      } else if (functionName === 'markContactAsRead' || functionName === 'deleteContactSubmission') {
         // Use the ID from the initial test if available, otherwise fallback to mock
         data.id = createdContactSubmissionId || testData[functionName]?.id || 'test-id';
         console.log(`   Using contact submission ID for ${functionName}: ${data.id}`);
      }
      // Add similar logic for other create/update/delete pairs if needed

      if (skipTest) {
        continue; // Move to the next function
      }

      const resultData = await testCallableFunction(
        functionName,
        data,
        idToken // All these functions require authentication
      );
      
      const success = resultData !== null;
      results.push({ functionName, success: success });

      // Store IDs from successful create operations
      if (success) {
        if (functionName === 'createBlogPost' && resultData.id) {
          createdBlogPostId = resultData.id;
          console.log(`   Stored blog post ID: ${createdBlogPostId}`);
        } else if (functionName === 'createCaseStudy' && resultData.id) {
          createdCaseStudyId = resultData.id;
          console.log(`   Stored case study ID: ${createdCaseStudyId}`);
        }
        // Add similar logic for other create operations if needed
      }
    }
    
    // Print summary
    console.log('\n--- Test Summary ---');
    const successCount = results.filter(r => r.success).length;
    console.log(`Authenticated endpoints: Passed ${successCount}/${results.length}`);
    console.log(`Non-authenticated endpoints: ${contactFormResult ? 'Passed' : 'Failed'} 1/1`);
    
    if (successCount < results.length) {
      console.log('\nFailed authenticated functions:');
      results.filter(r => !r.success).forEach(r => console.log(`- ${r.functionName}`));
    }
  } catch (error) {
    console.error('Error testing functions:', error);
  } finally {
    // Clean up Admin SDK resources
    try {
      await admin.app().delete();
      console.log('Firebase Admin SDK resources cleaned up');
    } catch (cleanupError) {
      console.error('Error cleaning up Admin SDK resources:', cleanupError.message);
    }
  }
}

// Run tests
console.log('Starting endpoint tests with Firebase Admin SDK...');
testAllFunctions().then(() => {
  console.log('Tests completed.');
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});