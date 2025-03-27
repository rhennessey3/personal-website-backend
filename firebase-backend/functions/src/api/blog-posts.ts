import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

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
export const create = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }
  
  // Verify admin role
  try {
    const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "User must be an admin"
      );
    }
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "Error verifying user permissions",
      error
    );
  }
  
  try {
    // Validate input data
    const validatedData = blogPostSchema.parse(data);
    
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
      throw new functions.https.HttpsError(
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
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid blog post data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Error creating blog post",
      error
    );
  }
});

// Update an existing blog post
export const update = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }
  
  // Verify admin role
  try {
    const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "User must be an admin"
      );
    }
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "Error verifying user permissions",
      error
    );
  }
  
  try {
    // Check if id is provided
    if (!data.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Blog post ID is required"
      );
    }
    
    // Validate input data
    const validatedData = blogPostSchema.parse(data);
    
    // Check if blog post exists
    const blogPostRef = admin.firestore().collection("blog_posts").doc(data.id);
    const blogPostDoc = await blogPostRef.get();
    
    if (!blogPostDoc.exists) {
      throw new functions.https.HttpsError(
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
        
      if (!existingDoc.empty && existingDoc.docs[0].id !== data.id) {
        throw new functions.https.HttpsError(
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
      id: data.id,
      ...blogPostData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid blog post data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Error updating blog post",
      error
    );
  }
});

// Delete a blog post
export const deletePost = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }
  
  // Verify admin role
  try {
    const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "User must be an admin"
      );
    }
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "Error verifying user permissions",
      error
    );
  }
  
  try {
    // Check if id is provided
    if (!data.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Blog post ID is required"
      );
    }
    
    // Check if blog post exists
    const blogPostRef = admin.firestore().collection("blog_posts").doc(data.id);
    const blogPostDoc = await blogPostRef.get();
    
    if (!blogPostDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Blog post not found"
      );
    }
    
    // Delete the blog post
    await blogPostRef.delete();
    
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "Error deleting blog post",
      error
    );
  }
});