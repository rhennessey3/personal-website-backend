import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

// Submit contact form
export const submit = functions.https.onCall(async (data, context) => {
  try {
    // Validate input data
    const validatedData = contactFormSchema.parse(data);
    
    // Store in Firestore
    const contactData = {
      ...validatedData,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await admin.firestore().collection("contact_submissions").add(contactData);
    
    // Optional: Send email notification to admin
    // This would use a service like Nodemailer or SendGrid
    // You would need to add the necessary dependencies and configuration
    
    return {
      success: true,
      id: docRef.id,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid contact form data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Error submitting contact form",
      error
    );
  }
});

// Mark contact submission as read
export const markAsRead = functions.https.onCall(async (data, context) => {
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
        "Contact submission ID is required"
      );
    }
    
    // Check if contact submission exists
    const contactRef = admin.firestore().collection("contact_submissions").doc(data.id);
    const contactDoc = await contactRef.get();
    
    if (!contactDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Contact submission not found"
      );
    }
    
    // Update the contact submission
    await contactRef.update({
      read: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "Error marking contact submission as read",
      error
    );
  }
});

// Delete contact submission
export const deleteSubmission = functions.https.onCall(async (data, context) => {
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
        "Contact submission ID is required"
      );
    }
    
    // Check if contact submission exists
    const contactRef = admin.firestore().collection("contact_submissions").doc(data.id);
    const contactDoc = await contactRef.get();
    
    if (!contactDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Contact submission not found"
      );
    }
    
    // Delete the contact submission
    await contactRef.delete();
    
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "Error deleting contact submission",
      error
    );
  }
});