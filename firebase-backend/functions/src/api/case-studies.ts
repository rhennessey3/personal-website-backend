import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

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
    const validatedData = caseStudySchema.parse(data);
    
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
      throw new functions.https.HttpsError(
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
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid case study data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Error creating case study",
      error
    );
  }
});

// Update an existing case study
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
        "Case study ID is required"
      );
    }
    
    // Validate input data
    const validatedData = caseStudySchema.parse(data);
    
    // Check if case study exists
    const caseStudyRef = admin.firestore().collection("case_studies").doc(data.id);
    const caseStudyDoc = await caseStudyRef.get();
    
    if (!caseStudyDoc.exists) {
      throw new functions.https.HttpsError(
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
        
      if (!existingDoc.empty && existingDoc.docs[0].id !== data.id) {
        throw new functions.https.HttpsError(
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
      id: data.id,
      ...caseStudyData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid case study data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Error updating case study",
      error
    );
  }
});

// Delete a case study
export const deleteCase = functions.https.onCall(async (data, context) => {
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
        "Case study ID is required"
      );
    }
    
    // Check if case study exists
    const caseStudyRef = admin.firestore().collection("case_studies").doc(data.id);
    const caseStudyDoc = await caseStudyRef.get();
    
    if (!caseStudyDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Case study not found"
      );
    }
    
    // Delete related sections and metrics
    const batch = admin.firestore().batch();
    
    // Delete sections
    const sectionsSnapshot = await admin.firestore()
      .collection("case_study_sections")
      .where("caseStudyId", "==", data.id)
      .get();
      
    sectionsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete metrics
    const metricsSnapshot = await admin.firestore()
      .collection("case_study_metrics")
      .where("caseStudyId", "==", data.id)
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
    throw new functions.https.HttpsError(
      "internal",
      "Error deleting case study",
      error
    );
  }
});