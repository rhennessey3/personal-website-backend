import * as functions from "firebase-functions"; // Keep for typing
// Remove explicit https import
// import { https } from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";
// Import the V1 onCall handler and HttpsError
import { onCall, HttpsError } from "firebase-functions/v1/https";

// Validation schema for profile
const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  headline: z.string().optional(),
  bio: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().nullable(),
  socialLinks: z.object({
    linkedin: z.string().url("Invalid LinkedIn URL").optional().nullable(),
    github: z.string().url("Invalid GitHub URL").optional().nullable(),
    twitter: z.string().url("Invalid Twitter URL").optional().nullable(),
  }).optional(),
});

// Update profile
// Use imported onCall and add V1 CallableRequest type
export const update = onCall(async (request: functions.https.CallableRequest) => {
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
    const validatedData = profileSchema.parse(request.data);
    
    // Check if profile exists
    const profileRef = admin.firestore().collection("profile").doc("main");
    const profileDoc = await profileRef.get();
    
    if (profileDoc.exists) {
      // Update existing profile
      await profileRef.update({
        ...validatedData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new profile
      await profileRef.set({
        ...validatedData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    return {
      success: true,
      profile: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid profile data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error updating profile",
      error
    );
  }
});

// Add work experience
// Use imported onCall and add V1 CallableRequest type
export const addWorkExperience = onCall(async (request: functions.https.CallableRequest) => {
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
    // Validate work experience data
    const workExperienceSchema = z.object({
      company: z.string().min(1, "Company is required"),
      position: z.string().min(1, "Position is required"),
      description: z.string().optional(),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      current: z.boolean().default(false),
      order: z.number().optional(),
    });
    
    // Validate using request.data
    const validatedData = workExperienceSchema.parse(request.data);
    
    // Get the profile ID
    const profileRef = admin.firestore().collection("profile").doc("main");
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
        "not-found",
        "Profile not found. Please create a profile first."
      );
    }
    
    // Get the highest order value
    const workExperiencesSnapshot = await admin.firestore()
      .collection("work_experiences")
      .orderBy("order", "desc")
      .limit(1)
      .get();
    
    let order = 1;
    if (!workExperiencesSnapshot.empty) {
      order = (workExperiencesSnapshot.docs[0].data().order || 0) + 1;
    }
    
    // Create work experience
    const workExperienceData = {
      ...validatedData,
      profileId: profileDoc.id,
      startDate: new Date(validatedData.startDate),
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      order: validatedData.order || order,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await admin.firestore().collection("work_experiences").add(workExperienceData);
    
    return {
      id: docRef.id,
      ...workExperienceData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid work experience data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error adding work experience",
      error
    );
  }
});

// Add education
// Use imported onCall and add V1 CallableRequest type
export const addEducation = onCall(async (request: functions.https.CallableRequest) => {
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
    // Validate education data
    const educationSchema = z.object({
      institution: z.string().min(1, "Institution is required"),
      degree: z.string().min(1, "Degree is required"),
      field: z.string().min(1, "Field of study is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      order: z.number().optional(),
    });
    
    // Validate using request.data
    const validatedData = educationSchema.parse(request.data);
    
    // Get the profile ID
    const profileRef = admin.firestore().collection("profile").doc("main");
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
        "not-found",
        "Profile not found. Please create a profile first."
      );
    }
    
    // Get the highest order value
    const educationSnapshot = await admin.firestore()
      .collection("education")
      .orderBy("order", "desc")
      .limit(1)
      .get();
    
    let order = 1;
    if (!educationSnapshot.empty) {
      order = (educationSnapshot.docs[0].data().order || 0) + 1;
    }
    
    // Create education
    const educationData = {
      ...validatedData,
      profileId: profileDoc.id,
      startDate: new Date(validatedData.startDate),
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      order: validatedData.order || order,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await admin.firestore().collection("education").add(educationData);
    
    return {
      id: docRef.id,
      ...educationData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid education data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error adding education",
      error
    );
  }
});

// Add skill
// Use imported onCall and add V1 CallableRequest type
export const addSkill = onCall(async (request: functions.https.CallableRequest) => {
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
    // Validate skill data
    const skillSchema = z.object({
      name: z.string().min(1, "Skill name is required"),
      category: z.string().min(1, "Category is required"),
      proficiency: z.number().min(1).max(5).default(3),
      order: z.number().optional(),
    });
    
    // Validate using request.data
    const validatedData = skillSchema.parse(request.data);
    
    // Get the profile ID
    const profileRef = admin.firestore().collection("profile").doc("main");
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
        "not-found",
        "Profile not found. Please create a profile first."
      );
    }
    
    // Get the highest order value
    const skillsSnapshot = await admin.firestore()
      .collection("skills")
      .orderBy("order", "desc")
      .limit(1)
      .get();
    
    let order = 1;
    if (!skillsSnapshot.empty) {
      order = (skillsSnapshot.docs[0].data().order || 0) + 1;
    }
    
    // Create skill
    const skillData = {
      ...validatedData,
      profileId: profileDoc.id,
      order: validatedData.order || order,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await admin.firestore().collection("skills").add(skillData);
    
    return {
      id: docRef.id,
      ...skillData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Invalid skill data: " + JSON.stringify(error.errors)
      );
    }
    
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error adding skill",
      error
    );
  }
});