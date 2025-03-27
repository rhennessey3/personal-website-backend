// import * as functions from "firebase-functions"; // Remove this
import * as admin from "firebase-admin";
import { z } from "zod";
// Import the V1 onCall handler and HttpsError
import { onCall, HttpsError } from "firebase-functions/v1/https";
// Import functions for typing if needed
import * as functions from "firebase-functions";

// Validation schema for blog post
const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().min(1, "Summary is required"),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().optional(),
  publishedDate: z.string().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

// Create a new blog post
// Import the specific type for CallableRequest if needed (optional but good practice)
// import { CallableRequest } from "firebase-functions/v2/https";

// Use imported onCall and change type hint to any
export const create = onCall(async (request: any) => {
  // Verify authentication using request.auth
  if (!request.auth) {
    throw new HttpsError( // Use imported HttpsError
      "unauthenticated",
      "User must be authenticated"
    );
  }
  
  // Verify admin role using request.auth.uid
  try {
    const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new HttpsError( // Use imported HttpsError
        "permission-denied",
        "User must be an admin"
      );
    }
  } catch (error) {
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error verifying user permissions",
      error
    );
  }
  
  try {
    // Validate input data using request.data
    const validatedData = blogPostSchema.parse(request.data);
    
    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
    
    // Check for slug uniqueness
    const existingDoc = await admin.firestore()
      .collection("blog_posts")
      .where("slug", "==", slug)
      .get();
      
    if (!existingDoc.empty) {
      throw new HttpsError( // Use imported HttpsError
        "already-exists",
        "A blog post with this title already exists"
      );
    }
    
    // Create the blog post
    const blogPostData = {
      ...validatedData,
      slug,
      publishedDate: validatedData.publishedDate ? new Date(validatedData.publishedDate) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await admin.firestore().collection("blog_posts").add(blogPostData);
    
    return {
      id: docRef.id,
      ...blogPostData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid blog post data: " + JSON.stringify(error.errors)
      );
    }
    
    // Log the detailed error before throwing
    functions.logger.error("Detailed error creating blog post:", error);
    
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error creating blog post",
      error // Keep the original error for potential structured logging
    );
  }
});

// Update an existing blog post
// Use imported onCall and change type hint to any
export const update = onCall(async (request: any) => {
  // Verify authentication using request.auth
  if (!request.auth) {
    throw new HttpsError( // Use imported HttpsError
      "unauthenticated",
      "User must be authenticated"
    );
  }
  
  // Verify admin role using request.auth.uid
  try {
    const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new HttpsError( // Use imported HttpsError
        "permission-denied",
        "User must be an admin"
      );
    }
  } catch (error) {
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error verifying user permissions",
      error
    );
  }
  
  try {
    // Check if id is provided in request.data
    if (!request.data.id) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Blog post ID is required"
      );
    }
    
    // Validate input data using request.data
    const validatedData = blogPostSchema.parse(request.data);
    
    // Check if blog post exists using request.data.id
    const blogPostRef = admin.firestore().collection("blog_posts").doc(request.data.id);
    const blogPostDoc = await blogPostRef.get();
    
    if (!blogPostDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
        "not-found",
        "Blog post not found"
      );
    }
    
    // If title changed, update slug and check for uniqueness
    let slug = blogPostDoc.data()?.slug;
    if (validatedData.title !== blogPostDoc.data()?.title) {
      slug = validatedData.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
      
      // Check for slug uniqueness
      const existingDoc = await admin.firestore()
        .collection("blog_posts")
        .where("slug", "==", slug)
        .get();
        
      // Compare against request.data.id
      if (!existingDoc.empty && existingDoc.docs[0].id !== request.data.id) {
        throw new HttpsError( // Use imported HttpsError
          "already-exists",
          "A blog post with this title already exists"
        );
      }
    }
    
    // Update the blog post
    const blogPostData = {
      ...validatedData,
      slug,
      publishedDate: validatedData.publishedDate ? new Date(validatedData.publishedDate) : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await blogPostRef.update(blogPostData);
    
    return {
      id: request.data.id, // Return the id from request.data
      ...blogPostData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid blog post data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error updating blog post",
      error
    );
  }
});

// Delete a blog post
// Use imported onCall and change type hint to any
export const deletePost = onCall(async (request: any) => {
  // Verify authentication using request.auth
  if (!request.auth) {
    throw new HttpsError( // Use imported HttpsError
      "unauthenticated",
      "User must be authenticated"
    );
  }
  
  // Verify admin role using request.auth.uid
  try {
    const userDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new HttpsError( // Use imported HttpsError
        "permission-denied",
        "User must be an admin"
      );
    }
  } catch (error) {
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error verifying user permissions",
      error
    );
  }
  
  try {
    // Check if id is provided in request.data
    if (!request.data.id) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Blog post ID is required"
      );
    }
    
    // Check if blog post exists using request.data.id
    const blogPostRef = admin.firestore().collection("blog_posts").doc(request.data.id);
    const blogPostDoc = await blogPostRef.get();
    
    if (!blogPostDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
        "not-found",
        "Blog post not found"
      );
    }
    
    // Delete the blog post
    await blogPostRef.delete();
    
    return { success: true };
  } catch (error) {
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error deleting blog post",
      error
    );
  }
});