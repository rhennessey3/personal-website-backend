import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

/**
 * Verifies that the user is authenticated and has admin role
 * @param context The Firebase functions context
 * @throws HttpsError if user is not authenticated or not an admin
 */
export async function verifyAdmin(context: functions.https.CallableContext): Promise<void> {
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
}

/**
 * Generates a slug from a title
 * @param title The title to generate a slug from
 * @returns The generated slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

/**
 * Checks if a slug is unique in a collection
 * @param collection The collection to check
 * @param slug The slug to check
 * @param excludeId Optional ID to exclude from the check (for updates)
 * @returns True if the slug is unique, false otherwise
 */
export async function isSlugUnique(
  collection: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const query = admin.firestore().collection(collection).where("slug", "==", slug);
  const snapshot = await query.get();
  
  if (snapshot.empty) {
    return true;
  }
  
  // If we're updating an existing document, exclude it from the check
  if (excludeId && snapshot.size === 1 && snapshot.docs[0].id === excludeId) {
    return true;
  }
  
  return false;
}

/**
 * Handles Zod validation errors
 * @param error The error to handle
 * @throws HttpsError with the validation errors
 */
export function handleZodError(error: unknown): never {
  if (error instanceof z.ZodError) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Validation error",
      error.errors
    );
  }
  
  throw new functions.https.HttpsError(
    "internal",
    "Unknown error",
    error
  );
}

/**
 * Gets the next order value for a collection
 * @param collection The collection to get the next order value for
 * @param filter Optional filter to apply to the query
 * @returns The next order value
 */
export async function getNextOrder(
  collection: string,
  filter?: { field: string; value: any }
): Promise<number> {
  let query = admin.firestore().collection(collection).orderBy("order", "desc").limit(1);
  
  if (filter) {
    query = query.where(filter.field, "==", filter.value) as any;
  }
  
  const snapshot = await query.get();
  
  if (snapshot.empty) {
    return 1;
  }
  
  return (snapshot.docs[0].data().order || 0) + 1;
}