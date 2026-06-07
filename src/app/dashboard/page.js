"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { PencilIcon } from "@heroicons/react/24/outline";
import { updateProfile } from "@/lib/data";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import OrderList from "@/components/dashboard/OrderList";

export default function UserDashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "" });
  const router = useRouter();

  useEffect(() => {
    let timeoutId;
    
    // Wait until auth is definitively NOT loading
    if (!authLoading) {
      if (user) {
        console.log("[Dashboard] Authentication confirmed. User:", user.email);
      } else {
        // If user is null, wait a generous grace period to ensure it's not a temporary persistence drop
        // while the browser restores the session. This prevents rapid redirect loops.
        console.log("[Dashboard] No session detected. Waiting 3s grace period for persistence...");
        timeoutId = setTimeout(() => {
          console.log("[Dashboard] Session not found after grace period. Redirecting to login.");
          router.replace("/login?redirect=/dashboard");
        }, 3000); // 3 seconds is usually enough for indexedDB to respond
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, authLoading, router]);

  useEffect(() => {
    if (userData) {
        console.log("[Dashboard] User data loaded for:", userData.email);
        setProfileForm({
            fullName: userData.fullName || userData.displayName || "",
            phone: userData.phone || ""
        });
    }
  }, [userData]);

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      try {
          await updateProfile(user.uid, profileForm);
          setEditingProfile(false);
      } catch (error) {
          alert("Failed to update profile.");
      }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center font-headline italic">Loading your collection...</div>;

  return (
    <main className="pt-24 pb-20 px-4 md:px-6 max-w-[1440px] mx-auto min-h-screen">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-20">
        <DashboardSidebar />

        {/* Main Content: Overview */}
        <div className="lg:col-span-9">
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
              <div className="flex justify-between items-center mb-6 lg:mb-8">
                <h2 className="font-headline text-2xl lg:text-3xl text-primary italic">Account Overview</h2>
                {!editingProfile && (
                  <button 
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-2 text-[10px] font-label uppercase tracking-widest text-primary border-b border-primary/20 hover:border-primary pb-1 transition-all"
                  >
                    <PencilIcon className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>

              {editingProfile ? (
                <form onSubmit={handleUpdateProfile} className="bg-surface-container-lowest p-6 md:p-12 rounded-xl shadow-sm border border-stone-100 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Full Name</label>
                      <input 
                        type="text" 
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-md">
                      Save Changes
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditingProfile(false)}
                      className="text-stone-400 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:text-stone-600 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-6 bg-white p-6 rounded-2xl border border-stone-100 shadow-sm shadow-stone-100/50">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Email</p>
                      <p className="text-primary font-bold text-xs truncate">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Phone</p>
                      <p className="text-primary font-bold text-xs">{userData?.phone || "Not provided"}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Status</p>
                      <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                        {userData?.role || "Collector"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-6 lg:p-8 rounded-2xl flex flex-col justify-center border border-stone-100/50">
                    <h4 className="font-headline text-lg lg:text-xl mb-3 italic">The Liora Promise</h4>
                    <p className="text-xs lg:text-sm text-stone-500 leading-relaxed font-light italic serif-italic">
                      "Your journey with us transcends a simple transaction. It is a shared appreciation for the heritage of the home."
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Active Order Summary (Live) */}
            <section>
                <div className="mb-8">
                  <h2 className="font-headline text-2xl text-primary">Active Selection</h2>
                </div>
                <OrderList showOnlyActive={true} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
