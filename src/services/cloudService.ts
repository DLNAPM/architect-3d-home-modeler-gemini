
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
   * Saves or updates a user profile in Firestore.
   */
  async saveUser(user: { uid: string; name: string; email: string; picture: string }): Promise<void> {
    if (!user.email || !user.uid) return;
    try {
      // Save to users/{email} for backward compatibility with existing designs
      const userEmailRef = doc(db, "users", user.email);
      try {
        const userEmailSnap = await getDoc(userEmailRef);
        
        const userData = {
          uid: user.uid,
          name: user.name,
          email: user.email,
          picture: user.picture,
          subscriptionLevel: user.email === 'dlaniger.napm.consulting@gmail.com' ? 'premium' : 'basic',
          role: user.email === 'dlaniger.napm.consulting@gmail.com' ? 'admin' : 'user',
          lastLogin: Date.now()
        };

        if (!userEmailSnap.exists()) {
          await setDoc(userEmailRef, { ...userData, createdAt: Date.now() });
        } else {
          const updateData: any = { ...userData };
          if (user.email === 'dlaniger.napm.consulting@gmail.com') {
            if (userEmailSnap.data()?.subscriptionLevel !== 'premium') updateData.subscriptionLevel = 'premium';
            if (userEmailSnap.data()?.role !== 'admin') updateData.role = 'admin';
          } else {
            delete updateData.subscriptionLevel; // preserve existing
            delete updateData.role; // preserve existing
          }
          await setDoc(userEmailRef, updateData, { merge: true });
        }
      } catch (err) {
        console.error(`Failed to save user profile to users/${user.email}:`, err);
      }
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  },

  /**
   * Retrieves a user profile from Firestore.
   */
  async getUserProfile(uid: string, email: string): Promise<{ subscriptionLevel: 'basic' | 'premium'; isFrozen?: boolean } | null> {
    if (!uid && !email) return null;
    try {
      let userSnap = null;
      if (uid) {
        const userUidRef = doc(db, "users", uid);
        userSnap = await getDoc(userUidRef).catch(() => null);
      }
      
      if (!userSnap || !userSnap.exists()) {
        if (email) {
          const userEmailRef = doc(db, "users", email);
          userSnap = await getDoc(userEmailRef).catch(() => null);
        }
      }

      if (userSnap && userSnap.exists()) {
        const data = userSnap.data() as { subscriptionLevel: 'basic' | 'premium'; isFrozen?: boolean };
        if (email === 'dlaniger.napm.consulting@gmail.com' && data.subscriptionLevel !== 'premium') {
          return { ...data, subscriptionLevel: 'premium' };
        }
        return data;
      }
      if (email === 'dlaniger.napm.consulting@gmail.com') {
        return { subscriptionLevel: 'premium' };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  /**
   * Retrieves all users (Admin only).
   */
  async getAllUsers(): Promise<any[]> {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        // Only include documents where the ID is an email to avoid duplicates
        // since we now save to both {uid} and {email}
        if (doc.id.includes('@')) {
          const data = doc.data();
          if (doc.id === 'dlaniger.napm.consulting@gmail.com' && data.subscriptionLevel !== 'premium') {
            data.subscriptionLevel = 'premium';
          }
          users.push({ email: doc.id, ...data });
        }
      });
      return users;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  },

  /**
   * Updates a user's subscription level (Admin only).
   */
  async updateUserSubscription(email: string, level: 'basic' | 'premium'): Promise<void> {
    try {
      const userRef = doc(db, "users", email);
      await setDoc(userRef, { subscriptionLevel: level }, { merge: true });
      
      // Also try to find and update the uid document if it exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        if (document.id !== email) { // This is the uid document
           await setDoc(doc(db, "users", document.id), { subscriptionLevel: level }, { merge: true });
        }
      });
    } catch (error) {
      console.error("Error updating user subscription:", error);
      throw error;
    }
  },

  /**
   * Deletes a user and all their associated documents (Admin only).
   */
  async deleteUser(email: string): Promise<void> {
    try {
      // 1. Find all documents associated with this email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      const deletePromises: Promise<void>[] = [];
      
      querySnapshot.forEach((document) => {
        // Delete the user document itself
        deletePromises.push(deleteDoc(doc(db, "users", document.id)));
      });
      
      await Promise.all(deletePromises);
      console.log(`User ${email} deleted successfully`);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  /**
   * Toggles the frozen status of a user's account (Admin only).
   */
  async toggleUserFreeze(email: string, isFrozen: boolean): Promise<void> {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      const updatePromises: Promise<void>[] = [];
      
      querySnapshot.forEach((document) => {
        updatePromises.push(setDoc(doc(db, "users", document.id), { isFrozen }, { merge: true }));
      });
      
      await Promise.all(updatePromises);
      console.log(`User ${email} freeze status updated to ${isFrozen}`);
    } catch (error) {
      console.error("Error toggling user freeze status:", error);
      throw error;
    }
  },

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
      let jsonString = JSON.stringify(designToSave);
      let estimatedSize = new TextEncoder().encode(jsonString).length;

      let quality = 0.6;
      let maxWidth = 1024;

      while (estimatedSize >= 900000 && maxWidth >= 400) {
          console.warn(`Design size ${estimatedSize} exceeds safe limit. Applying emergency compression (width: ${maxWidth}, quality: ${quality}).`);
          
          if (designToSave.renderings) {
             designToSave.renderings = await Promise.all(designToSave.renderings.map(async (r) => {
                 const compressedDataUri = await compressImage(r.imageUrl, 'image/jpeg', maxWidth, quality);
                 return { ...r, imageUrl: compressedDataUri };
             }));
          }

          if (designToSave.uploadedImages) {
            const keys = ['frontPlan', 'backPlan', 'facadeImage'] as const;
            for (const key of keys) {
                const imgData = designToSave.uploadedImages[key];
                if (imgData && imgData.base64) {
                    const compressedDataUri = await compressImage(imgData.base64, imgData.mimeType, maxWidth, quality);
                    designToSave.uploadedImages[key] = {
                        base64: compressedDataUri.split(',')[1],
                        mimeType: 'image/jpeg'
                    };
                }
            }
          }

          jsonString = JSON.stringify(designToSave);
          estimatedSize = new TextEncoder().encode(jsonString).length;
          
          maxWidth = Math.floor(maxWidth * 0.75);
          quality = Math.max(0.1, quality - 0.1);
      }
      
      // If still too large, we might have to drop some renderings
      while (estimatedSize >= 900000 && designToSave.renderings && designToSave.renderings.length > 1) {
          console.warn(`Design size ${estimatedSize} still too large. Dropping oldest rendering.`);
          // Drop the first (oldest) rendering that isn't favorited/liked if possible, otherwise just the oldest
          const dropIndex = designToSave.renderings.findIndex(r => !r.favorited && !r.liked);
          if (dropIndex >= 0) {
              designToSave.renderings.splice(dropIndex, 1);
          } else {
              designToSave.renderings.shift();
          }
          jsonString = JSON.stringify(designToSave);
          estimatedSize = new TextEncoder().encode(jsonString).length;
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
          const shareId = `${email}_${designId}`;
          
          // Add to 'shared_projects' collection with a predictable ID for security rules
          await setDoc(doc(db, "shared_projects", shareId), {
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
              } catch (err: any) {
                  if (err.message && err.message.includes("Missing or insufficient permissions")) {
                      console.warn(`Could not access shared design ${designId}. This is likely an old share record that needs to be re-shared by the owner to work with the new security rules.`);
                  } else {
                      console.error(`Failed to fetch shared design ${designId}`, err);
                  }
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
  },

  /**
   * Saves an item to the user's wish list.
   */
  async saveWishListItem(userId: string, item: Omit<import('../types').WishListItem, 'id' | 'addedAt'>): Promise<string> {
    if (!userId || !item) throw new Error("Missing userId or item");
    try {
      const wishListRef = collection(db, "users", userId, "wishlist");
      const newItem = {
        ...item,
        addedAt: Date.now()
      };
      const docRef = await addDoc(wishListRef, newItem);
      return docRef.id;
    } catch (error) {
      console.error("Error saving wish list item:", error);
      throw error;
    }
  },

  /**
   * Retrieves the user's wish list.
   */
  async getWishList(userId: string): Promise<import('../types').WishListItem[]> {
    if (!userId) return [];
    try {
      const wishListRef = collection(db, "users", userId, "wishlist");
      const querySnapshot = await getDocs(wishListRef);
      const items: import('../types').WishListItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as import('../types').WishListItem);
      });
      return items.sort((a, b) => b.addedAt - a.addedAt);
    } catch (error) {
      console.error("Error fetching wish list:", error);
      throw error;
    }
  },

  /**
   * Deletes an item from the user's wish list.
   */
  async deleteWishListItem(userId: string, itemId: string): Promise<void> {
    if (!userId || !itemId) return;
    try {
      const itemRef = doc(db, "users", userId, "wishlist", itemId);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error("Error deleting wish list item:", error);
      throw error;
    }
  },

  /**
   * Saves the delivery address for the wish list.
   */
  async saveWishListAddress(userId: string, address: string): Promise<void> {
    if (!userId) return;
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { wishlistDeliveryAddress: address }, { merge: true });
    } catch (error) {
      console.error("Error saving wish list address:", error);
      throw error;
    }
  },

  /**
   * Retrieves the delivery address for the wish list.
   */
  async getWishListAddress(userId: string): Promise<string | null> {
    if (!userId) return null;
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data().wishlistDeliveryAddress || null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching wish list address:", error);
      return null;
    }
  }
};
