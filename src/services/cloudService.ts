import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SavedDesign } from "../types";

/**
 * Compresses a Data URI or Base64 string to a JPEG under specific dimensions and quality.
 */
const compressImage = (source: string, mimeType: string = 'image/jpeg', maxWidth: number = 1024, quality: number = 0.7): Promise<string> => {
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

      // 1. Compress Renderings
      if (designToSave.renderings && designToSave.renderings.length > 0) {
        designToSave.renderings = await Promise.all(designToSave.renderings.map(async (r) => {
          if (r.imageUrl && r.imageUrl.length > 500000) { // Only compress if > ~500KB
             const compressedDataUri = await compressImage(r.imageUrl);
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
            if (imgData && imgData.base64 && imgData.base64.length > 500000) {
                const compressedDataUri = await compressImage(imgData.base64, imgData.mimeType);
                // Split back into base64 and update mimetype to jpeg
                designToSave.uploadedImages[key] = {
                    base64: compressedDataUri.split(',')[1],
                    mimeType: 'image/jpeg'
                };
            }
        }
      }

      // We create a reference to: users -> {userId} -> designs -> {designId}
      const designRef = doc(db, "users", userId, "designs", design.housePlan.id);
      
      const dataToSave = {
        ...designToSave,
        userId: userId,
        lastSynced: Date.now()
      };

      await setDoc(designRef, dataToSave);
      console.log("Design saved to cloud successfully");
    } catch (error) {
      console.error("Error saving design to cloud:", error);
      // We throw specifically to let the UI know if the limit was still hit (unlikely with compression)
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
        designs.push(doc.data() as SavedDesign);
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
  }
};