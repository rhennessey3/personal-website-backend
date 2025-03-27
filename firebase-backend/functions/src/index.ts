// import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
import * as caseStudies from "./api/case-studies";
import * as blogPosts from "./api/blog-posts";
import * as profile from "./api/profile";
import * as contact from "./api/contact";
import * as imageProcessing from "./storage/image-processing";
import * as adminAuth from "./auth/admin";

// Export all functions
export const createCaseStudy = caseStudies.create;
export const updateCaseStudy = caseStudies.update;
export const deleteCaseStudy = caseStudies.deleteCase;

export const createBlogPost = blogPosts.create;
export const updateBlogPost = blogPosts.update;
export const deleteBlogPost = blogPosts.deletePost;

export const updateProfile = profile.update;
export const addWorkExperience = profile.addWorkExperience;
export const addEducation = profile.addEducation;
export const addSkill = profile.addSkill;

export const submitContactForm = contact.submit;
export const markContactAsRead = contact.markAsRead;
export const deleteContactSubmission = contact.deleteSubmission;

export const processImage = imageProcessing.process;
export const autoProcessUploadedImage = imageProcessing.autoProcess;

// Auth functions
export const createAdmin = adminAuth.createAdmin;
export const updateAdminRole = adminAuth.updateAdminRole;