"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  CheckCircleIcon, 
  EnvelopeIcon, 
  TruckIcon, 
  ArchiveBoxIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="pt-32 pb-24 px-6 md:px-8 max-w-4xl mx-auto min-h-screen flex flex-col items-center">
      {/* Hero Success Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          className="bg-primary text-on-primary w-24 h-24 rounded-full flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(36,51,26,0.3)] mx-auto relative cursor-default"
        >
          <CheckCircleIcon className="w-12 h-12" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 bg-primary/20 rounded-full -z-10"
          />
        </motion.div>
        
        <h1 className="font-headline text-5xl md:text-7xl italic mb-6 tracking-tight text-on-surface">
          Order Confirmed
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
          Thank you for your order! We are preparing your items with great care.
        </p>
      </motion.div>

      {/* Order Info Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="w-full bg-surface-container-low rounded-3xl p-8 md:p-12 mb-16 border border-outline-variant/10 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-outline-variant/20 pb-10">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary mb-2 block">Order Number</span>
            <h2 className="text-3xl md:text-4xl font-headline italic text-on-surface tabular-nums">
              {orderId || "L-PROCESSING..."}
            </h2>
          </div>
          <div className="bg-surface-container-high px-6 py-3 rounded-full border border-outline-variant/10">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-on-surface-variant">Status: Paid & Preparing</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
          <div className="group">
            <div className="bg-white/50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <EnvelopeIcon className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-3">Confirmation</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">
              A detailed confirmation receipt and invoice have been sent to your registered email address.
            </p>
          </div>

          <div className="group">
            <div className="bg-white/50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <TruckIcon className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-3">Shipping</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">
              Our delivery partners will ensure your items reach you safely.
            </p>
          </div>

          <div className="group">
            <div className="bg-white/50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <ArchiveBoxIcon className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-3">Safe Packaging</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed opacity-70">
              Your items are packed using strong and eco-friendly materials to keep them safe.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-md mx-auto"
      >
        <Link 
          href="/dashboard/orders" 
          className="flex-1 px-8 py-5 bg-primary text-on-primary rounded-2xl font-bold text-[10px] tracking-[0.25em] uppercase hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 duration-200 flex items-center justify-center gap-3"
        >
          Track Order <ArrowRightIcon className="w-4 h-4" />
        </Link>
        <Link 
          href="/shop" 
          className="flex-1 px-8 py-5 bg-surface-container-high text-on-surface rounded-2xl font-bold text-[10px] tracking-[0.25em] uppercase hover:bg-surface-container-highest transition-all active:scale-95 duration-200 flex items-center justify-center"
        >
          Explore More
        </Link>
      </motion.div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
