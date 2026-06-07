"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { 
  MinusIcon, 
  PlusIcon, 
  TrashIcon, 
  LockClosedIcon, 
  GlobeAltIcon 
} from "@heroicons/react/24/outline";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, isHydrated } = useCart();

  const handleCheckout = () => {
    if (!user) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  if (!isHydrated) {
    return (
      <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto min-h-screen text-center flex items-center justify-center">
        <div className="animate-pulse text-outline tracking-widest uppercase font-bold text-sm">Loading Cart...</div>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto min-h-screen text-center">
        <h1 className="text-4xl italic font-medium text-primary mb-8">Your Cart is Empty</h1>
        <p className="text-on-surface-variant mb-12">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/shop" className="px-10 py-5 bg-primary text-on-primary rounded-xl font-medium text-sm tracking-widest uppercase hover:bg-primary-container transition-all editorial-shadow active:scale-95 duration-200">
          Start Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-24 px-6 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Shopping Cart Items */}
        <section className="lg:col-span-8">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-12">
            <h1 className="text-3xl md:text-4xl italic font-medium text-primary">Your Cart</h1>
            <Link className="text-[10px] md:text-sm font-label tracking-widest uppercase text-outline hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-1 w-fit" href="/shop">Continue Shopping</Link>
          </div>
          <div className="space-y-12">
            {cart.items.map((item) => (
              <div key={item.id} className="group flex flex-col md:flex-row gap-6 md:gap-8 pb-12 items-start transition-all border-b border-surface-container/50 last:border-none">
                <div className="w-full md:w-48 aspect-square bg-surface-container rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    src={item.featuredImage} 
                    alt={item.title} 
                  />
                </div>
                <div className="flex-grow py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl md:text-2xl text-on-background mb-1 font-headline">{item.title}</h3>
                      <p className="text-outline font-body text-xs md:text-sm mb-4 italic">{item.category}</p>
                    </div>
                    <span className="text-lg md:text-xl font-medium text-primary">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex items-center mt-8">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="ml-auto text-outline hover:text-error transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sticky Order Summary */}
        <aside className="lg:col-span-4 sticky top-32">
          <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0_12px_40px_rgba(28,27,27,0.03)] border border-surface-container/30">
            <h2 className="text-3xl italic text-primary mb-8">Summary</h2>
            <div className="space-y-6 mb-10 pb-10 border-b border-surface-container">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span className="text-sm font-body">Subtotal</span>
                <span className="text-sm font-medium">{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span className="text-sm font-body">Shipping</span>
                <span className="text-sm font-label tracking-widest text-emerald-700">COMPLIMENTARY</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-10">
              <span className="text-lg font-headline italic">Total</span>
              <span className="text-2xl font-medium text-primary">{formatPrice(cart.totalAmount)}</span>
            </div>
            <button 
              onClick={handleCheckout} 
              className="block w-full text-center bg-primary text-on-primary py-5 rounded-xl font-label tracking-widest uppercase text-xs hover:bg-primary-container transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Proceed to Checkout
            </button>
            <p className="text-[10px] text-outline mt-4 flex items-center justify-center gap-2 italic uppercase font-bold tracking-widest">
              <LockClosedIcon className="w-3 h-3" />
              Secure Checkout
            </p>
          </div>
          <div className="mt-8 p-6 bg-secondary-container/10 rounded-xl flex items-center gap-4">
            <GlobeAltIcon className="w-6 h-6 text-on-secondary-container" />
            <p className="text-xs text-on-secondary-container font-medium italic">Your investment supports plastic-free logistics and artisan craftsmanship.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
