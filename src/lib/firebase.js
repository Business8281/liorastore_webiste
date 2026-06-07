import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Default Firebase App (for Storefront/Google Auth)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Admin Firebase App (for Portal/Email Auth)
// Named instances have their own persistence/IndexedDB separation.
const adminApp = getApps().find(a => a.name === "adminPortal") || initializeApp(firebaseConfig, "adminPortal");
const adminAuth = getAuth(adminApp);

// Initialize Firestore handles for both parallel apps
let db;
let adminDb;

try {
    const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;
    if (dbId && dbId !== "(default)") {
        db = getFirestore(app, dbId);
        adminDb = getFirestore(adminApp, dbId);
    } else {
        db = getFirestore(app);
        adminDb = getFirestore(adminApp);
    }
} catch (error) {
    console.error("Firebase: Error initializing Firestore:", error);
    db = getFirestore(app);
    adminDb = getFirestore(adminApp);
}

const storage = getStorage(app);
const adminStorage = getStorage(adminApp);

export { app, auth, adminAuth, db, adminDb, storage, adminStorage };
