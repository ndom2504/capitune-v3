import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { User, UserRole, VerificationStatus } from '../types';

export const USERS_COLLECTION = 'users';

/**
 * Récupère le profil utilisateur depuis Firestore
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snapshot = await getDoc(userRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as User;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return null;
  }
}

/**
 * Crée ou met à jour un profil utilisateur
 */
export async function createUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.id);
    // On utilise setDoc avec merge: true pour ne pas écraser les données existantes si on appelle cette fonction plusieurs fois
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Erreur lors de la création du profil:", error);
    throw error;
  }
}

/**
 * Met à jour partiellement un profil utilisateur
 */
export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  console.log(`Updating user ${uid} with data:`, data);
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log("Firestore update success");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    throw error;
  }
}

/**
 * Récupère tous les utilisateurs publics (pour l'Annuaire par exemple)
 */
export async function getPublicUsers(): Promise<User[]> {
  try {
    const q = query(
      collection(db, USERS_COLLECTION), 
      where("isPublic", "==", true),
      where("status", "==", "ACTIF")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs publics:", error);
    return [];
  }
}
