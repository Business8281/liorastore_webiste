"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowRight, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function OfferBar() {
  const [offerSettings, setOfferSettings] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Listen for live updates from Firestore
    const unsubscribe = onSnapshot(doc(db, "config", "settings"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setOfferSettings(data);
        setIsVisible(data.offerBar_active);
      } else {
        // Fallback for first-time use
        setIsVisible(false);
      }
    }, (error) => {
      console.error("OfferBar Firestore Error:", error);
      setIsVisible(false);
    });

    return () => unsubscribe();
  }, []);

  if (!isVisible || !offerSettings) return null;

  return (
    <div className="bg-[#1A1A1A] text-white overflow-hidden py-3 relative border-b border-white/10 font-inter select-none z-[60]">
      {/* Admin Shortcut Overlay */}
      {isAdmin && (
        <Link 
          href="/admin/settings"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-[70] bg-white/10 hover:bg-primary p-2 rounded-full backdrop-blur-md transition-all duration-300 group shadow-xl"
          title="Edit Offer Bar"
        >
          <Settings className="w-3.5 h-3.5 text-white group-hover:rotate-90 transition-transform duration-500" />
        </Link>
      )}

      <motion.div 
        className="flex whitespace-nowrap"
        animate={{
          x: ["0%", "-50%"]
        }}
        transition={{
          duration: 40,
          ease: "linear",
          repeat: Infinity
        }}
      >
        {/* Multiplying content for an infinite, seamless marquee scroll */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-16 px-10 shrink-0">
            <div className="flex items-center gap-4">
              <span className="bg-primary text-on-primary text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-[2px] shadow-[0_2px_10px_rgba(36,51,26,0.5)]">
                {offerSettings.offerBar_offerName || "OFFER"}
              </span>
              <span className="text-[11px] font-black tracking-widest text-white italic uppercase">
                {offerSettings.offerBar_discountLabel}
              </span>
            </div>
            
            <p className="text-[11px] font-medium tracking-[0.08em] text-white/50 lowercase first-letter:uppercase">
              {offerSettings.offerBar_text}
            </p>

            {offerSettings.offerBar_link && (
              <Link 
                href={offerSettings.offerBar_link}
                className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:text-white transition-all duration-500 group"
              >
                Access Collection
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-2" />
              </Link>
            )}
            
            {/* Visual Continuity Marker */}
            <div className="w-1.5 h-1.5 rounded-full bg-primary/20 mx-4"></div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
