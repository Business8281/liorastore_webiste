"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, adminAuth, db, adminDb } from "@/lib/firebase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    // 1. Customer Session (Storefront - Google)
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. Administrator Session (Portal - Email/Password)
    const [adminUser, setAdminUser] = useState(null);
    const [adminData, setAdminData] = useState(null);
    const [adminLoading, setAdminLoading] = useState(true);

    // --- Customer Auth Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    const docRef = doc(db, "users", firebaseUser.uid);
                    const userDoc = await getDoc(docRef);
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    } else {
                        const newData = {
                            email: firebaseUser.email,
                            role: "user",
                            displayName: firebaseUser.displayName || "",
                            photoURL: firebaseUser.photoURL || "",
                            createdAt: new Date().toISOString(),
                        };
                        await setDoc(docRef, newData);
                        setUserData(newData);
                    }
                } catch (error) {
                    console.error("[AuthContext] Customer Data Error:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setUser(null);
                setUserData(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- Admin Auth Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(adminAuth, async (firebaseUser) => {
            if (firebaseUser) {
                setAdminUser(firebaseUser);
                try {
                    // Critical: Must use adminDb to utilize the admin's auth token
                    const docRef = doc(adminDb, "users", firebaseUser.uid);
                    const userDoc = await getDoc(docRef);
                    if (userDoc.exists()) {
                        setAdminData(userDoc.data());
                    }
                } catch (error) {
                    console.error("[AuthContext] Admin Data Error:", error);
                } finally {
                    setAdminLoading(false);
                }
            } else {
                setAdminUser(null);
                setAdminData(null);
                setAdminLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const logout = async () => auth.signOut();
    const adminLogout = async () => adminAuth.signOut();

    const isAdmin = adminData?.role === "admin";

    return (
        <AuthContext.Provider value={{ 
            user, 
            userData, 
            loading, 
            adminUser, 
            adminData, 
            adminLoading, 
            isAdmin, 
            logout, 
            adminLogout 
        }}>
            {!loading && !adminLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
