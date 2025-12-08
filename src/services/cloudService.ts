import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SavedDesign } from "../types";

export const cloudService = {
  /**
   * Saves a design to the user's Firestore collection.
   */
  async saveDesign(userId: string, design: SavedDesign): Promise<void> {
    if (!userId || !design) return;
    
    try {
      // We create a reference to: users -> {userId} -> designs -> {designId}
      const designRef = doc(db, "users", userId, "designs", design.housePlan.id);
      
      // We explicitly save the userId inside the document as well for easier querying if needed later
      const dataToSave = {
        ...design,
        userId: userId,
        lastSynced: Date.now()
      };

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
