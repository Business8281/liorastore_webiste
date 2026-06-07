"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { adminDb as db } from "@/lib/firebase";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    storeName: "LIORA",
    supportEmail: "studio@liora-editorial.com",
    shiprocketAutoPush: false,
    liveInventorySync: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "config", "settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            ...settings,
            ...data,
            // Ensure default values for new fields
            offerBar_active: data.offerBar_active ?? false,
            offerBar_text: data.offerBar_text ?? "Welcome to Liora. Handcrafted culinary tools for the modern kitchen.",
            offerBar_offerName: data.offerBar_offerName ?? "GRAND OPENING",
            offerBar_discountLabel: data.offerBar_discountLabel ?? "FLAT 20% OFF",
            offerBar_link: data.offerBar_link ?? "/shop",
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "config", "settings"), settings);
      alert("Protocols updated successfully.");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to update protocols.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="font-headline text-2xl italic animate-pulse">Accessing protocols...</p>
      </div>
    );
  }

  return (
    <>
      <header className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-headline italic tracking-tight text-primary mb-4">Editorial Settings</h2>
          <p className="text-on-surface-variant font-body leading-relaxed max-w-lg text-sm md:text-base">
            Configure the core parameters of your culinary ecosystem. Fine-tune your studio's digital presence and operational protocols.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl">
        <div className="space-y-12">
          <section className="bg-white p-6 md:p-10 rounded-xl border border-stone-100 shadow-sm">
            <h3 className="font-headline text-2xl mb-6 italic">Studio Profile</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-2">Store Name</label>
                <input 
                  type="text" 
                  value={settings.storeName} 
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full bg-stone-50 border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-2">Support Email</label>
                <input 
                  type="email" 
                  value={settings.supportEmail} 
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full bg-stone-50 border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 md:p-10 rounded-xl border border-stone-100 shadow-sm">
            <h3 className="font-headline text-2xl mb-6 italic">Operational Protocols</h3>
            <div className="flex items-center justify-between py-4 border-b border-stone-100">
              <div>
                <p className="text-sm font-bold text-primary">Enable Shiprocket Auto-Push</p>
                <p className="text-xs text-stone-500">Automatically push 'processing' orders once per hour.</p>
              </div>
              <button 
                  onClick={() => setSettings({ ...settings, shiprocketAutoPush: !settings.shiprocketAutoPush })}
                  className={`w-10 h-6 rounded-full relative transition-colors ${settings.shiprocketAutoPush ? 'bg-primary' : 'bg-stone-200'}`}
              >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.shiprocketAutoPush ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-bold text-primary">Live Inventory Sync</p>
                <p className="text-xs text-stone-500">Synchronize stock levels across all digital channels.</p>
              </div>
              <button 
                  onClick={() => setSettings({ ...settings, liveInventorySync: !settings.liveInventorySync })}
                  className={`w-10 h-6 rounded-full relative transition-colors ${settings.liveInventorySync ? 'bg-primary' : 'bg-stone-200'}`}
              >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.liveInventorySync ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-12">
          <section className="bg-white p-6 md:p-10 rounded-xl border border-stone-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline text-2xl italic">Dynamic Offer Bar</h3>
              <button 
                onClick={() => setSettings({ ...settings, offerBar_active: !settings.offerBar_active })}
                className={`w-12 h-7 rounded-full relative transition-all duration-500 ${settings.offerBar_active ? 'bg-primary' : 'bg-stone-200'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-500 ${settings.offerBar_active ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-[0.2em] text-stone-400 mb-2">Offer Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., SEASONAL SALE"
                  value={settings.offerBar_offerName} 
                  onChange={(e) => setSettings({ ...settings, offerBar_offerName: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-[0.2em] text-stone-400 mb-2">Discount Label</label>
                <input 
                  type="text" 
                  placeholder="e.g., FLAT 20% OFF"
                  value={settings.offerBar_discountLabel} 
                  onChange={(e) => setSettings({ ...settings, offerBar_discountLabel: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-[0.2em] text-stone-400 mb-2">Scrolling Announcement</label>
                <textarea 
                  rows="3"
                  placeholder="Enter the message that will scroll below the header..."
                  value={settings.offerBar_text} 
                  onChange={(e) => setSettings({ ...settings, offerBar_text: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none" 
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-[0.2em] text-stone-400 mb-2">Action Link (URL)</label>
                <input 
                  type="text" 
                  placeholder="/shop or https://..."
                  value={settings.offerBar_link} 
                  onChange={(e) => setSettings({ ...settings, offerBar_link: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all" 
                />
              </div>
            </div>
            
            {!settings.offerBar_active && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Note: The offer bar is currently inactive and will not appear on the live website.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-stone-100 flex flex-col sm:flex-row sm:justify-end gap-4">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-12 py-5 bg-primary text-on-primary rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-300"
        >
          {saving ? "Deploying Updates..." : "Save Configuration"}
        </button>
      </div>
    </>
  );
}

