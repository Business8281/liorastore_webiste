"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { adminAuth, adminDb as db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAdmin, adminLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, adminLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(adminAuth, email, password);
      const user = userCredential.user;
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      console.log("[AdminLogin] Attempting login for:", user.email);

      // First check: designated admin email in environment variables
      const isAdminByEmail = 
        user.email?.toLowerCase() === adminEmail?.toLowerCase() ||
        user.email?.toLowerCase() === "praneeth0105@gmail.com";

      let role = null;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        role = userDoc.exists() ? userDoc.data().role : null;
      } catch (e) {
        console.warn("[AdminLogin] Could not fetch Firestore role:", e.message);
      }

      if (isAdminByEmail || role === "admin") {
        // Explicitly persist the admin role to Firestore document
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: "admin",
          lastAdminLogin: new Date().toISOString()
        }, { merge: true });

        router.push("/admin/dashboard");
      } else {
        await adminAuth.signOut();
        setError("Unauthorized access. Admin privileges required.");
      }
    } catch (err) {
      console.error("[AdminLogin] Auth Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid credentials. Please try again.");
      } else {
        setError(err.message || "An error occurred during authorization.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-6 lg:px-8">

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center mb-10 text-center">
          <img src="/logo200BR.png" alt="Liora Logo" className="h-16 w-auto object-contain mb-8" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container mb-6">
            <LockClosedIcon className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Secure Portal</span>
          </div>
          <h1 className="font-headline text-4xl italic text-primary mb-2">Admin Portal</h1>
          <p className="text-on-surface-variant text-sm tracking-tight opacity-70">Enter your credentials to manage the culinary collection.</p>
        </div>

        <div className="bg-white py-10 px-10 shadow-[0_12px_40px_rgba(28,27,27,0.05)] border border-stone-100 rounded-xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="w-full bg-surface-container-highest border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-3 text-on-surface transition-all placeholder:text-outline-variant/60"
                placeholder="editor@liora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-surface-container-highest border-b-2 border-primary/20 focus:border-primary focus:ring-0 px-0 py-3 text-on-surface transition-all placeholder:text-outline-variant/60 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-white py-4 px-6 rounded-xl font-bold tracking-wide hover:bg-primary transition-all duration-300 active:scale-95 shadow-lg shadow-primary/10 disabled:opacity-50"
              >
                {loading ? "Authorizing..." : "Authorize Access"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
