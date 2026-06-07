"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { XMarkIcon, StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

export default function ReviewModal({ isOpen, onClose, product, user, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !product || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        productId: product.id,
        userId: user.uid,
        userName: user.displayName || "Liora Customer",
        userPhoto: user.photoURL || "",
        rating: rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        orderItemTitle: product.title // Optional: store what they were reviewing in the context of an order
      });

      onReviewSubmitted(product.id);
      onClose();
      setComment("");
      setRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[4px] animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-stone-100">
        <div className="relative p-8 lg:p-12">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 hover:bg-stone-50 rounded-full transition-colors group"
          >
            <XMarkIcon className="w-5 h-5 text-stone-400 group-hover:text-primary transition-colors" />
          </button>

          {/* Header */}
          <div className="mb-8">
            <h3 className="text-3xl font-headline italic tracking-tight text-primary mb-2">
              Share Your Chronicle
            </h3>
            <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold">
              Product: {product.title}
            </p>
          </div>

          {/* Product Preview */}
          <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl mb-8 border border-stone-100">
            <div className="w-16 h-16 bg-white rounded-xl p-2 border border-stone-100 overflow-hidden flex-shrink-0">
              <img 
                src={product.image || product.featuredImage} 
                alt={product.title} 
                className="w-full h-full object-contain grayscale"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-600">You are reviewing an heirloom piece.</p>
              <p className="text-[10px] text-stone-400 italic mt-1">Your feedback helps our artisans maintain excellence.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Rating */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block text-center">
                Select Rating
              </label>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="group focus:outline-none transition-transform active:scale-90"
                  >
                    {rating >= star ? (
                      <StarIconSolid className="w-10 h-10 text-secondary drop-shadow-sm transition-all group-hover:scale-110" />
                    ) : (
                      <StarIconOutline className="w-10 h-10 text-stone-200 transition-all group-hover:text-secondary/40" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block">
                Your Experience
              </label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe the texture, the weight, the way it transforms your kitchen..."
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-5 text-sm font-light text-stone-600 focus:ring-4 focus:ring-secondary/5 focus:border-secondary outline-none h-32 resize-none transition-all placeholder:italic placeholder:text-stone-300 shadow-inner"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-primary text-white text-[11px] font-bold uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-900 transition-all shadow-xl hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? "Syncing Chronicle..." : "Publish Experience"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
