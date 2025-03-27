const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK with service account
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'personal-website-backend-d30fa'
});

// Get Firebase project ID
const projectId = admin.app().options.projectId;
const region = 'us-central1';

// Get an ID token for testing authenticated endpoints
async function getIdToken() {
  try {
    // Create a test user or use an existing admin user
    // Note: In a real scenario, you would use a test user with appropriate permissions
    const uid = 'test-admin-user';
    const customToken = await admin.auth().createCustomToken(uid, { role: 'admin' });
    
    // Exchange custom token for ID token using Firebase Auth REST API
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );
    
    return response.data.idToken;
  } catch (error) {
    console.error('Error getting ID token:', error);
    throw error;
  }
}

// Test a callable function
async function testCallableFunction(functionName, data = {}, idToken = null) {
  try {
    const url = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    
    const body = {
      data: data
    };
    
    console.log(`Testing function: ${functionName}`);
    const response = await axios.post(url, body, { headers });
    
    console.log(`✅ ${functionName}: ${response.status} ${response.statusText}`);
    return true;
  } catch (error) {
    console.error(`❌ ${functionName}: ${error.response?.status || 'Error'} ${error.response?.statusText || error.message}`);
    return false;
  }
}

// Main test function
async function testAllFunctions() {
  try {
    // Get ID token for authenticated requests
    const idToken = await getIdToken();
    
    // Define test data for each function
    const testData = {
      // Profile functions
      updateProfile: { name: 'Test User', title: 'Test Title', bio: 'Test Bio' },
      addWorkExperience: { company: 'Test Company', position: 'Test Position', startDate: '2023-01', endDate: '2023-12', description: 'Test Description' },
      addEducation: { institution: 'Test University', degree: 'Test Degree', field: 'Test Field', startYear: 2019, endYear: 2023 },
      addSkill: { name: 'Test Skill', category: 'Test Category', level: 90 },
      
      // Blog functions
      createBlogPost: { title: 'Test Blog Post', content: 'Test Content', slug: 'test-blog-post', tags: ['test'] },
      updateBlogPost: { id: 'test-id', title: 'Updated Test Blog Post', content: 'Updated Test Content' },
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
    
    // List of all functions to test
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
      'submitContactForm',
      'markContactAsRead',
      'deleteContactSubmission',
      'createAdmin',
      'updateAdminRole',
      'processImage',
      'autoProcess'
    ];
    
    // Test each function
    const results = [];
    for (const functionName of functions) {
      const data = testData[functionName] || {};
      const requiresAuth = functionName !== 'submitContactForm'; // Only submitContactForm doesn't require auth
      
      const result = await testCallableFunction(
        functionName,
        data,
        requiresAuth ? idToken : null
      );
      
      results.push({ functionName, success: result });
    }
    
    // Print summary
    console.log('\n--- Test Summary ---');
    const successCount = results.filter(r => r.success).length;
    console.log(`Passed: ${successCount}/${results.length}`);
    
    if (successCount < results.length) {
      console.log('\nFailed functions:');
      results.filter(r => !r.success).forEach(r => console.log(`- ${r.functionName}`));
    }
  } catch (error) {
    console.error('Error testing functions:', error);
  } finally {
    // Clean up
    admin.app().delete();
  }
}

// Check if Firebase API key is provided
if (!process.env.FIREBASE_API_KEY) {
  console.error('Error: FIREBASE_API_KEY environment variable is required');
  console.log('Run the script with: FIREBASE_API_KEY=your-api-key node test-endpoints.js');
  process.exit(1);
}

// Run tests
testAllFunctions();