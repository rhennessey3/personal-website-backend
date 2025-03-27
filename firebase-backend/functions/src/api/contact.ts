import * as functions from "firebase-functions"; // Keep for typing
// Remove explicit https import
// import { https } from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";
// Import the V1 onCall handler and HttpsError
import { onCall, HttpsError } from "firebase-functions/v1/https";

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

// Submit contact form
// Use imported onCall and add V1 CallableRequest type
export const submit = onCall(async (request: functions.https.CallableRequest) => {
  try {
    // Validate input data using request.data
    const validatedData = contactFormSchema.parse(request.data);
    
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
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid contact form data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error submitting contact form",
      error
    );
  }
});

// Mark contact submission as read
// Use imported onCall and add V1 CallableRequest type
export const markAsRead = onCall(async (request: functions.https.CallableRequest) => {
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
        "Contact submission ID is required"
      );
    }
    
    // Check if contact submission exists using request.data.id
    const contactRef = admin.firestore().collection("contact_submissions").doc(request.data.id);
    const contactDoc = await contactRef.get();
    
    if (!contactDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
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
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error marking contact submission as read",
      error
    );
  }
});

// Delete contact submission
// Use imported onCall and add V1 CallableRequest type
export const deleteSubmission = onCall(async (request: functions.https.CallableRequest) => {
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
        "Contact submission ID is required"
      );
    }
    
    // Check if contact submission exists using request.data.id
    const contactRef = admin.firestore().collection("contact_submissions").doc(request.data.id);
    const contactDoc = await contactRef.get();
    
    if (!contactDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
        "not-found",
        "Contact submission not found"
      );
    }
    
    // Delete the contact submission
    await contactRef.delete();
    
    return { success: true };
  } catch (error) {
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error deleting contact submission",
      error
    );
  }
});