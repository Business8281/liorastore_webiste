"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OfferBar from "@/components/OfferBar";
import CartSidebar from "@/components/CartSidebar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith("/admin");

  return (
    <>
      {isAdminPath ? (
        <>{children}</>
      ) : (
        <>
          <div className="sticky top-0 w-full z-50">
            <OfferBar />
            <Navbar />
          </div>
          <main className="w-full relative overflow-x-clip px-0 md:px-0">
            {children}
          </main>
          <Footer />
          <CartSidebar />

          {/* Floating WhatsApp Button */}
          <a
            href="https://wa.me/919966334330"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-[90] hover:scale-110 transition-transform duration-300 group flex items-center justify-center rounded-full"
            aria-label="Chat on WhatsApp"
          >
            <img 
              src="/walogo1.png" 
              alt="WhatsApp Chat" 
              className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-xl" 
            />
            <span className="hidden md:flex absolute right-full mr-4 bg-white text-stone-800 text-xs font-bold px-4 py-3 rounded-2xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-stone-100 items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]"></span>
              </span>
              Need help? Chat with us!
            </span>
          </a>
        </>
      )}
    </>
  );
}
