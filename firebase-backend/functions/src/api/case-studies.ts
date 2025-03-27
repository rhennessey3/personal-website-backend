// import * as functions from "firebase-functions"; // Remove this
import * as admin from "firebase-admin";
import { z } from "zod";
// Import the V1 onCall handler and HttpsError
import { onCall, HttpsError } from "firebase-functions/v1/https";
// Import logger explicitly
import { logger } from "firebase-functions";

// Validation schema for case study
const caseStudySchema = z.object({
  title: z.string().min(1, "Title is required"),
  summary: z.string().min(1, "Summary is required"),
  coverImage: z.string().optional(),
  thumbnailImage: z.string().optional(),
  publishedDate: z.string().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

// Create a new case study
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
    const validatedData = caseStudySchema.parse(request.data);
    
    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
    
    // Check for slug uniqueness
    const existingDoc = await admin.firestore()
      .collection("case_studies")
      .where("slug", "==", slug)
      .get();
      
    if (!existingDoc.empty) {
      throw new HttpsError( // Use imported HttpsError
        "already-exists",
        "A case study with this title already exists"
      );
    }
    
    // Create the case study
    const caseStudyData = {
      ...validatedData,
      slug,
      publishedDate: validatedData.publishedDate ? new Date(validatedData.publishedDate) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await admin.firestore().collection("case_studies").add(caseStudyData);
    
    return {
      id: docRef.id,
      ...caseStudyData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid case study data: " + JSON.stringify(error.errors)
      );
    }
    
    
    // Log the detailed error before throwing
    logger.error("Detailed error creating case study:", error); // Use imported logger

    throw new HttpsError( // Use imported HttpsError
      "internal", // Add the 'internal' error code
      "Error creating case study", // Error message
      error // Optional details
    );
  }
});

// Update an existing case study
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
        "Case study ID is required"
      );
    }
    
    // Validate input data using request.data
    const validatedData = caseStudySchema.parse(request.data);
    
    // Check if case study exists using request.data.id
    const caseStudyRef = admin.firestore().collection("case_studies").doc(request.data.id);
    const caseStudyDoc = await caseStudyRef.get();
    
    if (!caseStudyDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
        "not-found",
        "Case study not found"
      );
    }
    
    // If title changed, update slug and check for uniqueness
    let slug = caseStudyDoc.data()?.slug;
    if (validatedData.title !== caseStudyDoc.data()?.title) {
      slug = validatedData.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
      
      // Check for slug uniqueness
      const existingDoc = await admin.firestore()
        .collection("case_studies")
        .where("slug", "==", slug)
        .get();
        
      // Compare against request.data.id
      if (!existingDoc.empty && existingDoc.docs[0].id !== request.data.id) {
        throw new HttpsError( // Use imported HttpsError
          "already-exists",
          "A case study with this title already exists"
        );
      }
    }
    
    // Update the case study
    const caseStudyData = {
      ...validatedData,
      slug,
      publishedDate: validatedData.publishedDate ? new Date(validatedData.publishedDate) : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await caseStudyRef.update(caseStudyData);
    
    return {
      id: request.data.id, // Return the id from request.data
      ...caseStudyData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid case study data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error updating case study",
      error
    );
  }
});

// Delete a case study
// Use imported onCall and change type hint to any
export const deleteCase = onCall(async (request: any) => {
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
        "Case study ID is required"
      );
    }
    
    // Check if case study exists using request.data.id
    const caseStudyRef = admin.firestore().collection("case_studies").doc(request.data.id);
    const caseStudyDoc = await caseStudyRef.get();
    
    if (!caseStudyDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
        "not-found",
        "Case study not found"
      );
    }
    
    // Delete related sections and metrics
    const batch = admin.firestore().batch();
    
    // Delete sections using request.data.id
    const sectionsSnapshot = await admin.firestore()
      .collection("case_study_sections")
      .where("caseStudyId", "==", request.data.id)
      .get();
      
    sectionsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete metrics using request.data.id
    const metricsSnapshot = await admin.firestore()
      .collection("case_study_metrics")
      .where("caseStudyId", "==", request.data.id)
      .get();
      
    metricsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the case study
    batch.delete(caseStudyRef);
    
    // Commit the batch
    await batch.commit();
    
    return { success: true };
  } catch (error) {
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error deleting case study",
      error
    );
  }
});