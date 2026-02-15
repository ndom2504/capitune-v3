import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Debug: Log de la configuration (sans exposer les clés complètes)
console.log('[Firebase] Config Check:', {
  hasApiKey: !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId
});

// Initialisation unique et sécurisée
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

console.log('[Firebase] Initialization complete');

const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');

googleProvider.setCustomParameters({ prompt: 'select_account' });
microsoftProvider.setCustomParameters({ prompt: 'select_account' });

export { 
  auth, 
  db,
  googleProvider, 
  microsoftProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
};
export type { FirebaseUser };