// import * as functions from "firebase-functions"; // Remove this
import * as admin from "firebase-admin";
import { z } from "zod";
// Import the V1 onCall handler and HttpsError
import { onCall, HttpsError } from "firebase-functions/v1/https";
import { createAuthorizationError, createInternalError } from "../utils/error-handler";

/**
 * Creates a new admin user
 * @param email The email of the admin user
 * @param password The password of the admin user
 * @returns The created user
 */
// Use imported onCall and change type hint to any
export const createAdmin = onCall(async (request: any) => {
  // Only allow this function to be called by existing admins
  // Verify authentication using request.auth
  if (!request.auth) {
    throw new HttpsError( // Use imported HttpsError
      "unauthenticated",
      "User must be authenticated"
    );
  }
  
  try {
    // Check if the caller is a super admin using request.auth.uid
    const callerDoc = await admin.firestore().collection("users").doc(request.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "super_admin") {
      throw new HttpsError( // Use imported HttpsError
        "permission-denied",
        "Only super admins can create new admin users"
      );
    }
    
    // Validate input data using request.data
    const schema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      displayName: z.string().optional(),
    });
    
    const validatedData = schema.parse(request.data);
    
    // Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: validatedData.email,
      password: validatedData.password,
      displayName: validatedData.displayName,
    });
    
    // Store the user in Firestore with admin role
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      email: validatedData.email,
      role: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid, // Use request.auth.uid
    });
    
    return {
      success: true,
      uid: userRecord.uid,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid input data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error creating admin user",
      error
    );
  }
});

/**
 * Verifies that the user is authenticated and has admin role
 * @param auth The auth context from the request (request.auth)
 * @throws AppError if user is not authenticated or not an admin
 */
// Adjust signature to accept auth context directly (using 'any' for simplicity)
export async function verifyAdmin(auth: any): Promise<void> {
  // Verify authentication
  if (!auth) { // Check the passed auth object
    throw createAuthorizationError("User must be authenticated");
  }
  
  // Verify admin role
  try {
    // Use auth.uid directly
    const userDoc = await admin.firestore().collection("users").doc(auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw createAuthorizationError("User must be an admin");
    }
  } catch (error: any) {
    if (error.name === "AppError") {
      throw error;
    }
    throw createInternalError("Error verifying user permissions", error);
  }
}

/**
 * Verifies that the user is authenticated and has super admin role
 * @param context The Firebase functions context
 * @throws AppError if user is not authenticated or not a super admin
 */
// Adjust signature to accept auth context directly (using 'any' for simplicity)
export async function verifySuperAdmin(auth: any): Promise<void> {
  // Verify authentication
  if (!auth) { // Check the passed auth object
    throw createAuthorizationError("User must be authenticated");
  }
  
  // Verify super admin role
  try {
    // Use auth.uid directly
    const userDoc = await admin.firestore().collection("users").doc(auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "super_admin") {
      throw createAuthorizationError("User must be a super admin");
    }
  } catch (error: any) {
    if (error.name === "AppError") {
      throw error;
    }
    throw createInternalError("Error verifying user permissions", error);
  }
}

/**
 * Updates an admin user's role
 * @param uid The UID of the user to update
 * @param role The new role for the user
 * @returns Success status
 */
// Use imported onCall and change type hint to any
export const updateAdminRole = onCall(async (request: any) => {
  try {
    // Verify super admin - Pass request.auth to the updated verifySuperAdmin
    await verifySuperAdmin(request.auth);
    
    // Validate input data using request.data
    const schema = z.object({
      uid: z.string().min(1, "User ID is required"),
      role: z.enum(["admin", "super_admin"]),
    });
    
    const validatedData = schema.parse(request.data);
    
    // Update the user's role in Firestore
    await admin.firestore().collection("users").doc(validatedData.uid).update({
      role: validatedData.role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: request.auth?.uid, // Use request.auth?.uid
    });
    
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid input data: " + JSON.stringify(error.errors)
      );
    }
    
    // Also check for AppError from verifySuperAdmin if it throws HttpsError directly
    if (error instanceof HttpsError) {
        throw error;
    }

    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error updating admin role",
      error
    );
  }
});