import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";
import { createAuthorizationError, createInternalError } from "../utils/error-handler";

/**
 * Creates a new admin user
 * @param email The email of the admin user
 * @param password The password of the admin user
 * @returns The created user
 */
export const createAdmin = functions.https.onCall(async (data, context) => {
  // Only allow this function to be called by existing admins
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }
  
  try {
    // Check if the caller is a super admin
    const callerDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "super_admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only super admins can create new admin users"
      );
    }
    
    // Validate input data
    const schema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      displayName: z.string().optional(),
    });
    
    const validatedData = schema.parse(data);
    
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
      createdBy: context.auth.uid,
    });
    
    return {
      success: true,
      uid: userRecord.uid,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid input data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Error creating admin user",
      error
    );
  }
});

/**
 * Verifies that the user is authenticated and has admin role
 * @param context The Firebase functions context
 * @throws AppError if user is not authenticated or not an admin
 */
export async function verifyAdmin(context: functions.https.CallableContext): Promise<void> {
  // Verify authentication
  if (!context.auth) {
    throw createAuthorizationError("User must be authenticated");
  }
  
  // Verify admin role
  try {
    const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
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
export async function verifySuperAdmin(context: functions.https.CallableContext): Promise<void> {
  // Verify authentication
  if (!context.auth) {
    throw createAuthorizationError("User must be authenticated");
  }
  
  // Verify super admin role
  try {
    const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
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
export const updateAdminRole = functions.https.onCall(async (data, context) => {
  try {
    // Verify super admin
    await verifySuperAdmin(context);
    
    // Validate input data
    const schema = z.object({
      uid: z.string().min(1, "User ID is required"),
      role: z.enum(["admin", "super_admin"]),
    });
    
    const validatedData = schema.parse(data);
    
    // Update the user's role in Firestore
    await admin.firestore().collection("users").doc(validatedData.uid).update({
      role: validatedData.role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth?.uid,
    });
    
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid input data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Error updating admin role",
      error
    );
  }
});