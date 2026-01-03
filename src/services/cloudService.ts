
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, addDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { SavedDesign, AccessLevel } from "../types";

/**
 * Compresses a Data URI or Base64 string to a JPEG under specific dimensions and quality.
 */
const compressImage = (source: string, mimeType: string = 'image/jpeg', maxWidth: number = 1280, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    // Handle both Data URI and raw Base64 inputs
    img.src = source.startsWith('data:') ? source : `data:${mimeType};base64,${source}`;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(img.src); // Fallback to original if context fails
        return;
      }

      // Fill white background (handles transparency conversion to JPEG)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG to save space
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      // Fallback to original on error
      resolve(img.src);
    };
  });
};

export const cloudService = {
  /**
   * Saves a design to the user's Firestore collection.
   * Compresses images before saving to ensure the document stays under the 1MB Firestore limit.
   */
  async saveDesign(userId: string, design: SavedDesign): Promise<void> {
    if (!userId || !design) return;
    
    try {
      // Deep clone the design to avoid modifying the local high-res state
      const designToSave = JSON.parse(JSON.stringify(design)) as SavedDesign;
      
      // Threshold: Increased threshold for high-quality images (~300KB)
      const SIZE_THRESHOLD = 400000; 

      // 1. Compress Renderings
      if (designToSave.renderings && designToSave.renderings.length > 0) {
        designToSave.renderings = await Promise.all(designToSave.renderings.map(async (r) => {
          if (r.imageUrl && r.imageUrl.length > SIZE_THRESHOLD) { 
             // Using higher quality defaults: 1280px width, 0.8 quality
             const compressedDataUri = await compressImage(r.imageUrl, 'image/jpeg', 1280, 0.8);
             return { ...r, imageUrl: compressedDataUri };
          }
          return r;
        }));
      }

      // 2. Compress Uploaded Plans/Images
      if (designToSave.uploadedImages) {
        const keys = ['frontPlan', 'backPlan', 'facadeImage'] as const;
        for (const key of keys) {
            const imgData = designToSave.uploadedImages[key];
            if (imgData && imgData.base64 && imgData.base64.length > SIZE_THRESHOLD) {
                const compressedDataUri = await compressImage(imgData.base64, imgData.mimeType, 1024, 0.7);
                // Split back into base64 and update mimetype to jpeg
                designToSave.uploadedImages[key] = {
                    base64: compressedDataUri.split(',')[1],
                    mimeType: 'image/jpeg'
                };
            }
        }
      }

      // 3. Emergency Size Check
      // Firestore limit is 1,048,576 bytes. We check estimate JSON size.
      const jsonString = JSON.stringify(designToSave);
      const estimatedSize = new TextEncoder().encode(jsonString).length;

      if (estimatedSize >= 1000000) { // If still close to 1MB
          console.warn(`Design size ${estimatedSize} exceeds safe limit. Applying emergency compression.`);
          
          // Emergency pass: Compress renderings more aggressively to fit the 1MB limit
          if (designToSave.renderings) {
             designToSave.renderings = await Promise.all(designToSave.renderings.map(async (r) => {
                 const compressedDataUri = await compressImage(r.imageUrl, 'image/jpeg', 1024, 0.6);
                 return { ...r, imageUrl: compressedDataUri };
             }));
          }
      }

      // We create a reference to: users -> {userId} -> designs -> {designId}
      const designRef = doc(db, "users", userId, "designs", design.housePlan.id);
      
      const dataToSave = {
        ...designToSave,
        userId: userId, // Ensure owner ID is stamped on the doc
        lastSynced: Date.now()
      };
      
      // Remove transient fields if present before saving
      delete (dataToSave as any).accessLevel;

      await setDoc(designRef, dataToSave);
      console.log("Design saved to cloud successfully");
    } catch (error) {
      console.error("Error saving design to cloud:", error);
      throw error;
    }
  },

  /**
   * Retrieves all designs for a specific user from Firestore.
   */
  async getUserDesigns(userId: string): Promise<SavedDesign[]> {
    if (!userId) return [];

    try {
      const designsRef = collection(db, "users", userId, "designs");
      const querySnapshot = await getDocs(designsRef);
      
      const designs: SavedDesign[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SavedDesign;
        // Owned designs have 'owner' access level by default
        designs.push({ ...data, ownerId: userId, accessLevel: 'owner' });
      });
      
      return designs;
    } catch (error) {
      console.error("Error fetching designs from cloud:", error);
      throw error;
    }
  },

  /**
   * Deletes a design from the cloud.
   */
  async deleteDesign(userId: string, designId: string): Promise<void> {
    if (!userId || !designId) return;

    try {
      const designRef = doc(db, "users", userId, "designs", designId);
      await deleteDoc(designRef);
    } catch (error) {
      console.error("Error deleting design from cloud:", error);
      throw error;
    }
  },

  /**
   * Shares a design with another user by email.
   */
  async shareDesign(ownerId: string, designId: string, targetEmail: string, permission: AccessLevel): Promise<void> {
      try {
          // Normalize email
          const email = targetEmail.trim().toLowerCase();
          
          // Add to 'shared_projects' collection
          await addDoc(collection(db, "shared_projects"), {
              ownerId,
              designId,
              targetEmail: email,
              permission,
              createdAt: Date.now()
          });
      } catch (error) {
          console.error("Error sharing design:", error);
          throw error;
      }
  },

  /**
   * Fetches designs shared with the given email address.
   */
  async getSharedDesigns(userEmail: string): Promise<SavedDesign[]> {
      try {
          const email = userEmail.trim().toLowerCase();
          const q = query(collection(db, "shared_projects"), where("targetEmail", "==", email));
          const querySnapshot = await getDocs(q);

          const sharedDesigns: SavedDesign[] = [];

          for (const shareDoc of querySnapshot.docs) {
              const { ownerId, designId, permission } = shareDoc.data();
              
              // Fetch the actual design
              try {
                const designRef = doc(db, "users", ownerId, "designs", designId);
                const designSnap = await getDoc(designRef);

                if (designSnap.exists()) {
                    const designData = designSnap.data() as SavedDesign;
                    sharedDesigns.push({
                        ...designData,
                        ownerId: ownerId,
                        accessLevel: permission as AccessLevel
                    });
                } else {
                    console.warn(`Shared design not found: ${designId} owned by ${ownerId}`);
                }
              } catch (err) {
                  console.error(`Failed to fetch shared design ${designId}`, err);
              }
          }
          return sharedDesigns;

      } catch (error) {
          console.error("Error fetching shared designs:", error);
          return [];
      }
  },

  /**
   * Removes a share record (stop sharing or remove from 'Shared with me')
   */
  async removeShare(userEmail: string, designId: string): Promise<void> {
      try {
        const email = userEmail.trim().toLowerCase();
        const q = query(
            collection(db, "shared_projects"), 
            where("targetEmail", "==", email),
            where("designId", "==", designId)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
      } catch (error) {
          console.error("Error removing share:", error);
      }
  }
};
