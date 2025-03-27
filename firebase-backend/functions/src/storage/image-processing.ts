import * as functions from "firebase-functions"; // Keep for typing
// Remove explicit https import
// import { https } from "firebase-functions";
import * as admin from "firebase-admin";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import sharp from "sharp";
import { v4 as uuid } from "uuid";
// Import the V1 onCall handler and HttpsError
import { onCall, HttpsError } from "firebase-functions/v1/https";

// Process uploaded image
// Use imported onCall and add V1 CallableRequest type
export const process = onCall(async (request: functions.https.CallableRequest) => {
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
    // Destructure from request.data
    const {
      tempPath,
      destinationFolder,
      fileName,
      generateThumbnail = true,
      optimizeImage = true,
      thumbnailWidth = 300,
      thumbnailHeight = 300,
      quality = 80,
    } = request.data;
    
    if (!tempPath || !destinationFolder || !fileName) {
      throw new HttpsError( // Use imported HttpsError
        "invalid-argument",
        "Missing required parameters: tempPath, destinationFolder, or fileName"
      );
    }
    
    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), uuid());
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    try {
      // Get storage bucket
      const bucket = admin.storage().bucket();
      
      // Download the temporary file
      const tempFilePath = path.join(tempDir, fileName);
      await bucket.file(tempPath).download({ destination: tempFilePath });
      
      // Define paths for processed images
      const originalDestination = `images/${destinationFolder}/original/${fileName}`;
      const optimizedDestination = `images/${destinationFolder}/optimized/${fileName}`;
      const thumbnailDestination = `images/${destinationFolder}/thumbnails/${fileName}`;
      
      // Process and upload original image
      await bucket.upload(tempFilePath, {
        destination: originalDestination,
        metadata: {
          contentType: `image/${path.extname(fileName).substring(1)}`,
          metadata: {
            firebaseStorageDownloadTokens: uuid(),
          },
        },
      });
      
      // Get download URL for original image
      const originalFile = bucket.file(originalDestination);
      const [originalUrl] = await originalFile.getSignedUrl({
        action: "read",
        expires: "01-01-2500", // Far future expiration
      });
      
      let optimizedUrl = "";
      let thumbnailUrl = "";
      
      // Optimize image if requested
      if (optimizeImage) {
        const optimizedFilePath = path.join(tempDir, `optimized-${fileName}`);
        await sharp(tempFilePath)
          .jpeg({ quality })
          .toFile(optimizedFilePath);
        
        await bucket.upload(optimizedFilePath, {
          destination: optimizedDestination,
          metadata: {
            contentType: "image/jpeg",
            metadata: {
              firebaseStorageDownloadTokens: uuid(),
            },
          },
        });
        
        const optimizedFile = bucket.file(optimizedDestination);
        [optimizedUrl] = await optimizedFile.getSignedUrl({
          action: "read",
          expires: "01-01-2500",
        });
      }
      
      // Generate thumbnail if requested
      if (generateThumbnail) {
        const thumbnailFilePath = path.join(tempDir, `thumbnail-${fileName}`);
        await sharp(tempFilePath)
          .resize(thumbnailWidth, thumbnailHeight, {
            fit: "cover",
            position: "center",
          })
          .jpeg({ quality })
          .toFile(thumbnailFilePath);
        
        await bucket.upload(thumbnailFilePath, {
          destination: thumbnailDestination,
          metadata: {
            contentType: "image/jpeg",
            metadata: {
              firebaseStorageDownloadTokens: uuid(),
            },
          },
        });
        
        const thumbnailFile = bucket.file(thumbnailDestination);
        [thumbnailUrl] = await thumbnailFile.getSignedUrl({
          action: "read",
          expires: "01-01-2500",
        });
      }
      
      // Delete the temporary file from uploads folder
      await bucket.file(tempPath).delete();
      
      // Return the URLs and paths
      return {
        originalUrl,
        originalPath: originalDestination,
        optimizedUrl: optimizeImage ? optimizedUrl : originalUrl,
        optimizedPath: optimizeImage ? optimizedDestination : originalDestination,
        thumbnailUrl: generateThumbnail ? thumbnailUrl : "",
        thumbnailPath: generateThumbnail ? thumbnailDestination : "",
      };
    } finally {
      // Clean up temporary files
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error("Error processing image:", error);
    throw new HttpsError("internal", "Error processing image", error); // Use imported HttpsError
  }
});

// Auto-process images uploaded directly to certain folders
// Converted to HTTP callable function instead of Storage trigger
// Use imported onCall and change type hint to any
export const autoProcess = onCall(async (request: any) => {
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
  
  // Validate input data from request.data
  const { filePath, contentType, fileName } = request.data;
  
  if (!filePath || !contentType || !fileName) {
    throw new HttpsError( // Use imported HttpsError
      "invalid-argument",
      "Missing required parameters: filePath, contentType, or fileName"
    );
  }
  
  // Process the image
  const tempDir = path.join(os.tmpdir(), uuid());
  await fs.promises.mkdir(tempDir, { recursive: true });
  
  try {
    // Get storage bucket
    const bucket = admin.storage().bucket();
    
    // Download the uploaded file
    const tempFilePath = path.join(tempDir, fileName);
    await bucket.file(filePath).download({ destination: tempFilePath });
    
    // Determine destination folder based on file name or metadata
    // This is a simple example - you might want to use more sophisticated logic
    let destinationFolder = "misc";
    if (fileName.includes("case-study")) {
      destinationFolder = "case-studies";
    } else if (fileName.includes("blog")) {
      destinationFolder = "blog-posts";
    } else if (fileName.includes("profile")) {
      destinationFolder = "profile";
    }
    
    // Define paths for processed images
    const originalDestination = `images/${destinationFolder}/original/${fileName}`;
    const optimizedDestination = `images/${destinationFolder}/optimized/${fileName}`;
    const thumbnailDestination = `images/${destinationFolder}/thumbnails/${fileName}`;
    
    // Upload original image
    await bucket.upload(tempFilePath, {
      destination: originalDestination,
      metadata: {
        contentType: contentType,
        metadata: {
          firebaseStorageDownloadTokens: uuid(),
        },
      },
    });
    
    // Create optimized version
    const optimizedFilePath = path.join(tempDir, `optimized-${fileName}`);
    await sharp(tempFilePath)
      .jpeg({ quality: 80 })
      .toFile(optimizedFilePath);
    
    await bucket.upload(optimizedFilePath, {
      destination: optimizedDestination,
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: uuid(),
        },
      },
    });
    
    // Create thumbnail
    const thumbnailFilePath = path.join(tempDir, `thumbnail-${fileName}`);
    await sharp(tempFilePath)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailFilePath);
    
    await bucket.upload(thumbnailFilePath, {
      destination: thumbnailDestination,
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: uuid(),
        },
      },
    });
    
    // Delete the original uploaded file
    await bucket.file(filePath).delete();
    
    // Store image metadata in Firestore
    await admin.firestore().collection("images").add({
      originalPath: originalDestination,
      optimizedPath: optimizedDestination,
      thumbnailPath: thumbnailDestination,
      contentType: contentType,
      folder: destinationFolder,
      uploadedBy: request.auth.uid, // Use request.auth.uid
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return {
      success: true,
      originalPath: originalDestination,
      optimizedPath: optimizedDestination,
      thumbnailPath: thumbnailDestination
    };
  } catch (error) {
    console.error("Error auto-processing image:", error);
    throw new HttpsError( // Use imported HttpsError
      "internal",
      "Error processing image",
      error
    );
  } finally {
    // Clean up temporary files
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

// Original Storage trigger function (commented out for now)
/*
export const autoProcessStorage = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  if (!filePath) return;
  
  // Only process images uploaded to specific directories
  if (!filePath.startsWith("uploads/")) return;
  
  // Only process image files
  const contentType = object.contentType || "";
  if (!contentType.startsWith("image/")) return;
  
  // Extract user ID and filename from path
  const pathParts = filePath.split("/");
  if (pathParts.length < 3) return;
  
  const userId = pathParts[1];
  const fileName = pathParts[2];
  
  // Call the HTTP callable function with the same parameters
  // This is just a placeholder - in a real implementation, you would need to
  // call the function differently or implement the processing logic here
  console.log(`Storage trigger detected for ${filePath}`);
});
*/