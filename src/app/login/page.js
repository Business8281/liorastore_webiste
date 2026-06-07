"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, Suspense, useRef } from "react";

import { LeafIcon } from "lucide-react"; // Using lucide-react as it's in package.json

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const signInInProgress = useRef(false);

  useEffect(() => {
    // If we have a user ID, force the redirect immediately.
    // We only depend on the primitive UID to ensure hook stability between renders.
    if (user?.uid) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/dashboard";
      console.log("[Login] Definitive session detected. Redirecting to:", redirect);
      setIsRedirecting(true);
      router.replace(redirect);
    }
  }, [user?.uid, router]);

  const getFriendlyErrorMessage = (errObj) => {
    const code = errObj.code;
    switch (code) {
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled or the window closed unexpectedly. Please try again.";
      case "auth/cancelled-popup-request":
        return "A previous sign-in request was cancelled by a new one. Please wait for the window to load.";
      case "auth/popup-blocked":
        return "The sign-in popup was blocked by your browser. Please allow popups for this site.";
      case "auth/network-request-failed":
        return "Connection error. Please check your internet and try again.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized for Google Sign-in. Please contact support.";
      case "auth/operation-not-allowed":
        return "Google sign-in is not enabled. Please contact support.";
      default:
        return errObj.message || "Authentication failed. Please try again.";
    }
  };

  const handleGoogleSignIn = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (signInInProgress.current) return;
    
    signInInProgress.current = true;
    setLoading(true);
    setError("");
    
    const provider = new GoogleAuthProvider();
    // Force account selection to avoid automatic silent login failures
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      console.log("[Login] Initiating Google Sign-In Popup...");
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        console.log("[Login] Popup success for:", result.user.email);
        // The useEffect hook will detect result.user changes and handle the internal redirect
        setIsRedirecting(true);
      }
    } catch (err) {
      console.error("[Login] Google Sign-In Popup Error:", err);
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
      signInInProgress.current = false;
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center font-headline italic">Loading...</div>;

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Column: Branding & Login */}
      <section className="flex flex-col justify-between px-8 py-12 md:px-20 lg:px-24 bg-white relative">
        {/* Top Spacer to maintain flex layout */}
        <div></div>

        <div className="max-w-md w-full mx-auto py-12 text-center flex flex-col items-center">
          <Link href="/" className="outline-none block mb-10">
            <img src="/logo200BR.png" alt="Liora Logo" className="h-20 md:h-24 w-auto object-contain mx-auto" />
          </Link>

          <header className="mb-10 text-center">
            <h1 className="font-headline text-4xl lg:text-5xl mb-4 text-on-surface">Welcome</h1>
            <p className="text-on-surface-variant font-body leading-relaxed">Curate your culinary sanctuary with toxin-free essentials designed for the modern home.</p>
          </header>

          <div className="space-y-6 w-full">
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium">
                {error}
                {error.includes("auth/unauthorized-domain") && (
                  <p className="mt-2 text-xs opacity-80">
                    Fix: Add this website's domain to the "Authorized Domains" list in Firebase Console &gt; Authentication &gt; Settings.
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || isRedirecting}
              className="w-full flex items-center justify-center gap-3 bg-white border border-outline/30 px-6 py-4 rounded-xl hover:bg-surface-container-low transition-all duration-300 group editorial-shadow disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="font-label text-sm uppercase tracking-widest font-semibold text-primary">
                {isRedirecting ? "Checking your invitation..." : (loading ? "Authenticating..." : "Sign in with Google")}
              </span>
            </button>

            <div className="pt-8 border-t border-outline/10">
              <Link 
                href="/admin/login" 
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline hover:text-primary transition-colors duration-300"
              >
                Staff & Editorial Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="flex justify-between text-[0.65rem] font-label uppercase tracking-widest text-outline">
          <span>© 2024 LIORA</span>
          <div className="flex gap-6">
            <Link className="hover:text-primary transition-colors" href="/privacy">Privacy</Link>
            <Link className="hover:text-primary transition-colors" href="/support">Support</Link>
          </div>
        </div>
      </section>

      {/* Right Column: Visual Editorial */}
      <section className="hidden lg:block relative overflow-hidden bg-surface-container-low p-12">
        <div className="h-full w-full rounded-xl overflow-hidden relative editorial-shadow group">
          <img
            className="absolute inset-0 h-full w-full object-cover grayscale-[20%] transition-transform duration-700 group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAN3x2e4gXGwZw5jRDCTGj2Rdl8-ZLDW8WyqcClByD6dL1BHKIw_FUwV5_GRWziG2Y35j5mVWhCpP8EIFfPZvDT3NHcvn1cOrwiBubHljomBm6iXXuQaZl1PgRFB5x4ixtVc1rfE6OjC30V-SQEVG5Yi4UeXFuZoJ-XzECYXNZghu6lILzcxjdJ_tYfcoDZAS_J9a584jQozzM1RYlKrJ1r7iltQ41sjUpoc75nspxIY5lROSPb1jd9vuHBWk3zTYi9CooE7YOvMPFW"
            alt="Editorial visual"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent flex flex-col justify-end p-16">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 p-8 rounded-xl max-w-sm">
              <div className="mb-4">
                <span className="bg-secondary-container text-on-secondary-container text-[0.6rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Toxin-Free Living</span>
              </div>
              <h2 className="font-headline text-3xl text-white mb-4 italic">"The kitchen is the soul of the curated home."</h2>
              <p className="text-white/80 font-body text-sm leading-relaxed mb-6">Explore our collection of PFOA-free essentials, crafted for those who value health as much as heritage.</p>
              <div className="flex items-center gap-4 text-white">
                <div className="h-[1px] w-8 bg-white/50"></div>
                <span className="font-label text-[0.7rem] uppercase tracking-widest">Discover The Collection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Asymmetric Floating Element */}
        <div className="absolute top-20 right-20 w-48 h-64 bg-white editorial-shadow rounded-xl p-6 hidden xl:block translate-y-4">
          <div className="aspect-square bg-surface-container-low rounded-lg mb-4 flex items-center justify-center">
            <LeafIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-headline text-lg italic text-primary">Sustainably Sourced</h3>
          <p className="text-[0.65rem] text-on-surface-variant leading-tight mt-2 uppercase tracking-tighter">Every material is vetted for environmental impact and longevity.</p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-headline italic">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
