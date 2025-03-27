# Connecting Next.js Frontend to Firebase Backend

This guide provides comprehensive instructions for integrating your Next.js frontend with the Firebase backend, including authentication, Firestore database access, Cloud Functions, and Storage for file uploads. The frontend will be deployed on Vercel.

## Table of Contents

1. [Setting Up Firebase in Next.js](#setting-up-firebase-in-nextjs)
2. [Firebase Authentication](#firebase-authentication)
3. [Accessing Firestore Database](#accessing-firestore-database)
4. [Calling Cloud Functions](#calling-cloud-functions)
5. [Handling File Uploads with Firebase Storage](#handling-file-uploads-with-firebase-storage)
6. [Deploying to Vercel](#deploying-to-vercel)
7. [Security Best Practices](#security-best-practices)

## Setting Up Firebase in Next.js

### Step 1: Install Firebase SDK

```bash
npm install firebase
# Optional packages for specific features
npm install react-firebase-hooks
```

### Step 2: Create Firebase Config

Create a file at `src/lib/firebase.js`:

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1'); // Specify region if needed
const storage = getStorage(app);

export { app, db, auth, functions, storage, httpsCallable };
```

### Step 3: Set up Environment Variables

Create a `.env.local` file in your Next.js project root:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=personal-website-backend-d30fa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=personal-website-backend-d30fa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=personal-website-backend-d30fa.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

You can find these values in the Firebase Console under Project Settings > General > Your apps > Web app.

## Firebase Authentication

### Step 1: Create Auth Context

Create `src/contexts/AuthContext.js`:

```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const isAdmin = () => {
    return userRole === 'admin';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      resetPassword,
      isAdmin,
      userRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Step 2: Wrap Your App with AuthProvider

In `pages/_app.js`:

```javascript
import { AuthProvider } from '../contexts/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
```

### Step 3: Create Protected Route Component

Create `src/components/ProtectedRoute.js`:

```javascript
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (adminOnly && !isAdmin()) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, router, adminOnly, isAdmin]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (adminOnly && !isAdmin()) {
    return null;
  }

  return children;
}
```

### Step 4: Create Login Page

Create `pages/login.js`:

```javascript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      setError('Failed to log in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

### Step 5: Use Protected Routes

Example of using protected routes in a page:

```javascript
import ProtectedRoute from '../components/ProtectedRoute';

export default function AdminDashboard() {
  return (
    <ProtectedRoute adminOnly={true}>
      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin-only content */}
      </div>
    </ProtectedRoute>
  );
}
```

## Accessing Firestore Database

### Step 1: Create Firestore Hooks

Create `src/hooks/useFirestore.js`:

```javascript
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp
} from 'firebase/firestore';

export function useFirestore() {
  // Get all documents from a collection
  const getCollection = async (collectionName, options = {}) => {
    const { 
      whereConditions = [], 
      orderByField = null, 
      orderDirection = 'desc',
      limitCount = null,
      startAfterDoc = null
    } = options;
    
    let q = collection(db, collectionName);
    
    // Apply where conditions
    if (whereConditions.length > 0) {
      whereConditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
    }
    
    // Apply orderBy
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    // Apply pagination
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  // Get a single document by ID
  const getDocument = async (collectionName, id) => {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  };

  // Add a new document
  const addDocument = async (collectionName, data) => {
    // Add timestamp
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
    return docRef.id;
  };

  // Update a document
  const updateDocument = async (collectionName, id, data) => {
    // Add timestamp
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, dataWithTimestamp);
    return true;
  };

  // Delete a document
  const deleteDocument = async (collectionName, id) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  };

  return {
    getCollection,
    getDocument,
    addDocument,
    updateDocument,
    deleteDocument
  };
}
```

### Step 2: Use Firestore Hooks in Components

Example usage in a page:

```javascript
import { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import ProtectedRoute from '../components/ProtectedRoute';

export default function BlogPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getCollection } = useFirestore();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const options = {
          orderByField: 'createdAt',
          orderDirection: 'desc'
        };
        
        const blogPosts = await getCollection('blog-posts', options);
        setPosts(blogPosts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);

  return (
    <ProtectedRoute>
      <div>
        <h1>Blog Posts</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            {posts.map(post => (
              <div key={post.id}>
                <h2>{post.title}</h2>
                <p>{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

## Calling Cloud Functions

### Step 1: Create Functions Hook

Create `src/hooks/useFunctions.js`:

```javascript
import { functions, httpsCallable } from '../lib/firebase';

export function useFunctions() {
  const callFunction = async (functionName, data = {}) => {
    const functionRef = httpsCallable(functions, functionName);
    
    try {
      const result = await functionRef(data);
      return result.data;
    } catch (error) {
      console.error(`Error calling function ${functionName}:`, error);
      throw error;
    }
  };

  return { callFunction };
}
```

### Step 2: Use Functions Hook in Components

Example usage in a component:

```javascript
import { useState } from 'react';
import { useFunctions } from '../hooks/useFunctions';
import { useAuth } from '../contexts/AuthContext';

export default function CreateBlogPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { callFunction } = useFunctions();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      const result = await callFunction('createBlogPost', {
        title,
        content,
        authorId: user.uid
      });
      
      setSuccess(true);
      setTitle('');
      setContent('');
      console.log('Blog post created:', result);
    } catch (error) {
      setError('Error creating blog post: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Blog Post</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Blog post created successfully!</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows="10"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}
```

## Handling File Uploads with Firebase Storage

### Step 1: Create Storage Hook

Create `src/hooks/useStorage.js`:

```javascript
import { useState } from 'react';
import { storage } from '../lib/firebase';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useFunctions } from './useFunctions';

export function useStorage() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState(null);
  const { callFunction } = useFunctions();

  // Upload file to Firebase Storage
  const uploadFile = (file, path, metadata = {}) => {
    return new Promise((resolve, reject) => {
      // Reset states
      setProgress(0);
      setError(null);
      setUrl(null);
      
      // Create a unique filename
      const fileName = `${uuidv4()}-${file.name}`;
      const fullPath = `${path}/${fileName}`;
      const storageRef = ref(storage, fullPath);
      
      // Add content type to metadata
      const metadataWithType = {
        ...metadata,
        contentType: file.type
      };
      
      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file, metadataWithType);
      
      // Listen for state changes
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track progress
          const percentage = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(percentage);
        },
        (error) => {
          // Handle errors
          setError(error);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUrl(downloadURL);
          resolve({
            url: downloadURL,
            path: fullPath,
            fileName,
            contentType: file.type,
            size: file.size
          });
        }
      );
    });
  };

  // Process image using Cloud Function
  const processImage = async (file, options = {}) => {
    try {
      // First upload the original file to a temporary location
      const tempPath = 'uploads';
      const uploadResult = await uploadFile(file, tempPath);
      
      // Then call the autoProcess function to process the image
      const result = await callFunction('autoProcess', {
        filePath: uploadResult.path,
        contentType: uploadResult.contentType,
        fileName: uploadResult.fileName,
        ...options
      });
      
      return result;
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  // Delete file from Firebase Storage
  const deleteFile = async (path) => {
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      setError(error);
      throw error;
    }
  };

  return { 
    progress, 
    error, 
    url, 
    uploadFile, 
    processImage,
    deleteFile
  };
}
```

### Step 2: Create File Upload Component

Create `src/components/FileUpload.js`:

```javascript
import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';

export default function FileUpload({ 
  onUploadComplete, 
  folder = 'uploads',
  acceptedTypes = 'image/*',
  maxSizeMB = 5,
  processImage = false
}) {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const { uploadFile, processImage: processImageFn, progress, error, url } = useStorage();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    
    // Reset states
    setFileError(null);
    setFile(null);
    
    // Validate file
    if (!selected) return;
    
    // Check file type
    if (!selected.type.match(acceptedTypes)) {
      setFileError(`File type not supported. Please upload ${acceptedTypes}`);
      return;
    }
    
    // Check file size (convert maxSizeMB to bytes)
    if (selected.size > maxSizeMB * 1024 * 1024) {
      setFileError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }
    
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      let result;
      
      if (processImage && file.type.startsWith('image/')) {
        // Process image using Cloud Function
        result = await processImageFn(file);
      } else {
        // Regular file upload
        result = await uploadFile(file, folder);
      }
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  return (
    <div className="file-upload">
      <input 
        type="file" 
        onChange={handleFileChange} 
        accept={acceptedTypes}
      />
      
      {fileError && <div className="error">{fileError}</div>}
      {error && <div className="error">Upload error: {error.message}</div>}
      
      {file && (
        <div>
          <p>Selected file: {file.name}</p>
          <button 
            onClick={handleUpload} 
            disabled={progress > 0 && progress < 100}
          >
            {progress > 0 ? `Uploading: ${progress}%` : 'Upload'}
          </button>
        </div>
      )}
      
      {progress === 100 && !error && (
        <div className="success">Upload complete!</div>
      )}
      
      {url && (
        <div>
          <p>File URL: {url}</p>
          {url.match(/\.(jpeg|jpg|gif|png)$/) && (
            <img src={url} alt="Uploaded file" style={{ maxWidth: '300px' }} />
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 3: Use File Upload Component

Example usage in a page:

```javascript
import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProtectedRoute from '../components/ProtectedRoute';

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleUploadComplete = (fileData) => {
    setUploadedFiles(prev => [...prev, fileData]);
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <div>
        <h1>File Upload</h1>
        
        <h2>Upload Image (with processing)</h2>
        <FileUpload 
          onUploadComplete={handleUploadComplete}
          folder="case-studies"
          acceptedTypes="image/*"
          maxSizeMB={10}
          processImage={true}
        />
        
        <h2>Upload Document</h2>
        <FileUpload 
          onUploadComplete={handleUploadComplete}
          folder="documents"
          acceptedTypes=".pdf,.doc,.docx"
          maxSizeMB={20}
        />
        
        <h2>Uploaded Files</h2>
        {uploadedFiles.length > 0 ? (
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.fileName}
                </a>
                {file.thumbnailPath && (
                  <p>Thumbnail: {file.thumbnailPath}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No files uploaded yet</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

## Deploying to Vercel

### Step 1: Prepare for Deployment

1. Make sure your Next.js project is in a Git repository (GitHub, GitLab, or Bitbucket).
2. Ensure your `.env.local` variables are properly set up.

### Step 2: Set Up Vercel

1. Create an account on [Vercel](https://vercel.com) if you don't have one.
2. Connect your Git repository to Vercel.
3. Configure your project settings:
   - Framework Preset: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`

### Step 3: Configure Environment Variables

1. In the Vercel dashboard, go to your project settings.
2. Navigate to the "Environment Variables" tab.
3. Add all the Firebase environment variables from your `.env.local` file:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

### Step 4: Deploy

1. Commit and push your changes to your Git repository.
2. Vercel will automatically deploy your application.
3. Once deployed, Vercel will provide you with a URL for your application.

### Step 5: Configure CORS in Firebase

To allow your Vercel-hosted frontend to communicate with Firebase:

1. Go to the Firebase Console > Authentication > Settings > Authorized domains.
2. Add your Vercel domain (e.g., `your-app.vercel.app`).
3. For Cloud Functions, update your CORS configuration in the Firebase backend.

## Security Best Practices

### 1. Secure Firebase Rules

Ensure your Firestore and Storage security rules are properly configured:

**Firestore Rules Example:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authenticated users can read public data
    match /blog-posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

**Storage Rules Example:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public images can be read by anyone
    match /images/public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024;
    }
    
    // Admin-only uploads
    match /uploads/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2. Use Environment Variables

Never hardcode Firebase credentials in your code. Always use environment variables.

### 3. Implement Rate Limiting

For Cloud Functions that handle sensitive operations, implement rate limiting to prevent abuse.

### 4. Validate User Input

Always validate user input on both the client and server sides.

### 5. Use HTTPS

Ensure all communication with Firebase services is over HTTPS.

### 6. Implement Proper Authentication Flows

Use proper authentication flows and token management.

### 7. Regular Security Audits

Regularly audit your Firebase security rules and permissions.

## Troubleshooting

### CORS Issues

If you encounter CORS issues:

1. Check that your Firebase project has the correct authorized domains.
2. Ensure your Cloud Functions have proper CORS headers.

### Authentication Issues

If users can't authenticate:

1. Verify that the Firebase configuration is correct.
2. Check that the authorized domains include your Vercel domain.
3. Ensure the Firebase Authentication service is enabled in the Firebase Console.

### Deployment Issues

If deployment to Vercel fails:

1. Check the build logs for errors.
2. Verify that all environment variables are correctly set.
3. Ensure your Next.js project is properly configured.

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)