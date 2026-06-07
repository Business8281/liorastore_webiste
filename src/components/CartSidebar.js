"use client";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { XMarkIcon, ShoppingBagIcon, TrashIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] transition-opacity duration-500 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-white z-[101] shadow-2xl transition-transform duration-500 ease-out border-l border-stone-100 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-8 border-b border-stone-100 flex justify-between items-center">
          <div>
            <h2 className="font-headline text-2xl italic text-primary">Your Collection</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-[0.2em] font-bold mt-1">
              {cart.totalQuantity} {cart.totalQuantity === 1 ? 'Artifact' : 'Artifacts'} selected
            </p>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-stone-50 rounded-full transition-colors group"
          >
            <XMarkIcon className="w-5 h-5 text-stone-400 group-hover:text-primary transition-colors" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
          {cart.items.length > 0 ? (
            cart.items.map((item) => (
              <div key={item.id} className="flex gap-6 group animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="w-24 h-24 bg-stone-50 rounded-2xl overflow-hidden border border-stone-100 flex-shrink-0 p-2 flex items-center justify-center">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm tracking-tight text-primary leading-tight max-w-[180px]">
                        {item.title}
                      </h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-stone-300 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">
                      Unit: {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center bg-stone-50 rounded-lg p-1 border border-stone-100">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-white rounded transition-colors text-stone-500"
                      >
                        <MinusIcon className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-primary">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-white rounded transition-colors text-stone-500"
                      >
                        <PlusIcon className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-sm tracking-tight text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBagIcon className="w-8 h-8 text-stone-200" />
              </div>
              <p className="font-headline text-xl text-stone-300 italic">The archive is empty.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-primary border-b border-primary/20 pb-1 hover:border-primary transition-all"
              >
                Continue Curation
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="p-8 bg-stone-50 border-t border-stone-100 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Subtotal</span>
              <span className="text-2xl font-headline font-bold text-primary tracking-tight">
                {formatPrice(cart.totalAmount)}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 italic text-center">
              Complimentary shipping across the subcontinent for heirloom orders.
            </p>
            <div className="flex flex-col gap-3">
              <Link 
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-5 bg-primary text-white text-[11px] font-bold uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-900 transition-all shadow-xl hover:shadow-primary/20 text-center"
              >
                Proceed to Checkout
              </Link>
              <Link 
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-4 bg-white border border-stone-200 text-primary text-[10px] font-bold uppercase tracking-[0.3em] rounded-2xl hover:bg-stone-50 transition-all text-center"
              >
                View Detailed Cart
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
