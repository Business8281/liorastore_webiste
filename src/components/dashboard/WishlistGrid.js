"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { toggleWishlist } from "@/lib/data";
import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import ProductCard from "@/components/ProductCard";

export default function WishlistGrid() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const wishlistQuery = query(
      collection(db, "wishlist"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(wishlistQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid composite index requirements
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0));
        const dateB = new Date(b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0));
        return dateB - dateA;
      });
      setWishlist(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching wishlist live:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRemoveFromWishlist = async (item) => {
    try {
      await toggleWishlist(user.uid, { id: item.productId });
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
    }
  };

  if (loading) return <div className="p-12 text-center text-primary font-headline italic animate-pulse">Syncing your collection...</div>;

  if (wishlist.length === 0) {
    return (
      <div className="py-24 text-center border-2 border-dashed border-stone-100 rounded-3xl">
        <HeartIcon className="w-8 h-8 text-stone-200 mx-auto mb-4" />
        <p className="text-stone-300 italic serif-italic">Your collection awaits its first artifact.</p>
        <Link href="/shop" className="inline-block mt-6 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-primary pb-1">Browse Sanctuary</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {wishlist.map((item) => (
        <ProductCard 
          key={item.id} 
          product={item} 
          onRemove={handleRemoveFromWishlist}
          removeLabel="Remove from Wishlist"
        />
      ))}
    </div>
  );
}
