"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { toggleWishlist } from "@/lib/data";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  StarIcon,
  GlobeAltIcon,
  FireIcon,
  HeartIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

const renderFormattedText = (text) => {
  if (!text) return null;

  const blocks = text.split('\n\n');
  return blocks.map((block, i) => {
    // Check if block starts with a bullet point
    if (block.trim().startsWith('•') || block.trim().startsWith('-')) {
      const items = block.split('\n').filter(item => item.trim());
      return (
        <ul key={i} className="space-y-4 my-6 list-none">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-4 text-stone-600 text-lg font-light leading-relaxed">
              <span className="w-2 h-2 rounded-full bg-primary mt-2.5 flex-shrink-0"></span>
              <span>{item.replace(/^[•-]\s*/, '').trim()}</span>
            </li>
          ))}
        </ul>
      );
    }

    // Regular paragraph
    return (
      <p key={i} className="text-stone-600 leading-relaxed text-lg font-light mb-6 whitespace-pre-line">
        {block}
      </p>
    );
  });
};

export default function ProductDetailPage() {
  const { user } = useAuth();
  const { handle } = useParams();
  const router = useRouter();
  const { addToCart, setBuyNowItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("details");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", isEditing: false });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!handle) return;

    const q = query(
      collection(db, "products"),
      where("handle", "==", handle),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const productDoc = snapshot.docs[0];
        setProduct({ id: productDoc.id, ...productDoc.data() });
        setLoading(false);
      } else {
        // Fallback: Try fetching by ID if no handle found
        const { getProductById } = await import("@/lib/data");
        const data = await getProductById(handle); // 'handle' might be an ID
        if (data) {
          setProduct(data);
        } else {
          setProduct(null);
        }
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching product live:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle]);

  // Real-time Reviews Listener
  useEffect(() => {
    if (!product?.id) return;

    // Using a simpler query to avoid index requirements
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", product.id),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid needing a composite index
      const sorted = data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setReviews(sorted);
    }, (error) => {
      console.error("Error fetching reviews:", error);
    });

    return () => unsubscribe();
  }, [product?.id]);

  // Prefill review form if user has an existing review within 6h window
  useEffect(() => {
    if (!user || reviews.length === 0 || reviewForm.isEditing) return;

    const userReview = reviews.find(r => r.userId === user.uid);
    if (userReview) {
      const canEdit = userReview.createdAt?.toMillis && (Date.now() - userReview.createdAt.toMillis()) < 6 * 60 * 60 * 1000;
      if (canEdit) {
        setReviewForm({
          rating: userReview.rating,
          comment: userReview.comment,
          isEditing: true
        });
      }
    }
  }, [user, reviews, reviewForm.isEditing]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to leave a review.");
      return;
    }
    if (!reviewForm.comment.trim()) return;

    setSubmittingReview(true);
    try {
      const existingReview = reviews.find(r => r.userId === user.uid);

      if (existingReview) {
        // Update existing within 6h window
        const canEdit = existingReview.createdAt?.toMillis && (Date.now() - existingReview.createdAt.toMillis()) < 6 * 60 * 60 * 1000;
        if (!canEdit) {
          alert("This chronicle is now permanent and cannot be edited.");
          setSubmittingReview(false);
          return;
        }

        await updateDoc(doc(db, "reviews", existingReview.id), {
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new
        await addDoc(collection(db, "reviews"), {
          productId: product.id,
          userId: user.uid,
          userName: user.displayName || "Liora Customer",
          userPhoto: user.photoURL || "",
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
          createdAt: serverTimestamp()
        });
      }

      setReviewForm({ rating: 5, comment: "", isEditing: false });
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to sync your chronicle. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  const handleBuyNow = () => {
    setBuyNowItem({ ...product, quantity: 1 });
    if (!user) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 pt-24 pb-32 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 bg-surface-container rounded-xl aspect-[4/5]"></div>
          <div className="lg:col-span-5 space-y-8">
            <div className="h-10 bg-surface-container rounded w-3/4"></div>
            <div className="h-6 bg-surface-container rounded w-1/4"></div>
            <div className="h-32 bg-surface-container rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 pt-24 pb-32 text-center">
        <h1 className="text-4xl font-headline mb-4">Product Not Found</h1>
        <p className="text-on-surface-variant mb-8">The product you are looking for does not exist or has been removed.</p>
        <Link href="/shop" className="text-primary font-bold underline">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FCFBFA] min-h-screen">
      <main className="pt-24 pb-32 max-w-[1440px] mx-auto px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-8 text-xs uppercase tracking-[0.1em] text-outline">
          <Link className="hover:text-primary transition-colors" href="/shop">Shop</Link>
          <ChevronRightIcon className="w-3 h-3" />
          <Link className="hover:text-primary transition-colors" href={`/shop?category=${product.category}`}>{product.category}</Link>
          <ChevronRightIcon className="w-3 h-3" />
          <span className="text-on-surface">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left Side: Gallery */}
          <div className="lg:col-span-6 flex gap-6 h-auto lg:h-[600px]">
            <div className="flex flex-col gap-4 w-16 lg:w-24 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
              {product.images?.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-surface-container rounded-xl overflow-hidden cursor-pointer flex-shrink-0 transition-all ${selectedImage === index ? "ring-2 ring-primary shadow-md" : "hover:opacity-80 opacity-60"}`}
                >
                  <img className="w-full h-full object-cover" src={img} alt={`${product.title} ${index + 1}`} />
                </div>
              ))}
            </div>
            <div className="flex-1 bg-[#F9F8F6] rounded-2xl overflow-hidden relative group border border-stone-200/50 shadow-sm transition-all duration-500 hover:shadow-xl flex items-center justify-center">
              <img
                className="w-full h-full object-contain p-4 transition-transform duration-1000 group-hover:scale-105"
                src={product.images?.[selectedImage] || product.featuredImage}
                alt={product.title}
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <button className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-white transition-all transform hover:scale-110 active:scale-95">
                <MagnifyingGlassPlusIcon className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>

          {/* Right Side: Details */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="mb-2">
              {product.tags?.includes("Limited Edition") && (
                <span className="inline-block bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Limited Edition
                </span>
              )}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="ml-2 inline-block bg-error-container text-on-error-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight mb-4 tracking-tighter text-primary">
              {product.title}
            </h1>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex text-secondary">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIconSolid
                    key={s}
                    className={`w-4 h-4 ${(reviews.length > 0 && Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) >= s)
                      ? "text-secondary"
                      : "text-stone-100"
                      }`}
                  />
                ))}
              </div>
              <button
                onClick={() => document.getElementById('chronicles')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-outline font-medium border-b border-transparent hover:border-outline transition-all"
              >
                ({reviews.length} {reviews.length === 1 ? 'Reviews' : 'Reviews'})
              </button>
            </div>
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-3xl font-headline font-bold text-on-surface">{formatPrice(product.price)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xl text-outline line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
                <GlobeAltIcon className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-tight">Toxin-Free</p>
                  <p className="text-[10px] text-outline">PFOA & Lead Free</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
                <FireIcon className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-tight">Induction</p>
                  <p className="text-[10px] text-outline">All Cooktops Ready</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-12">
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-on-primary py-4 px-8 rounded-xl font-bold tracking-wide hover:bg-primary-container transition-all active:scale-95 duration-200"
                >
                  ADD TO CART
                </button>
                <WishlistButton product={product} />
              </div>
              <button
                onClick={handleBuyNow}
                className="w-full bg-[#735b24] text-white py-4 px-8 rounded-xl font-bold tracking-wide hover:opacity-90 transition-all active:scale-95 duration-200"
              >
                BUY IT NOW
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Technical Details & Description */}
        <div className="mt-20 border-t border-outline-variant/10 pt-20">
          <div className="w-full">
            <div className="flex gap-12 mb-10 border-b border-outline-variant/5">
              {[
                { id: 'details', label: 'Product Details' },
                { id: 'features', label: 'Key Features' },
                { id: 'care', label: 'Care Instructions' },
                { id: 'shipping', label: 'Shipping & Returns' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-sm tracking-wide transition-all duration-300 border-b-2 ${activeTab === tab.id
                    ? "font-bold border-primary text-primary"
                    : "font-medium text-stone-400 border-transparent hover:text-primary"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[200px] animate-in fade-in duration-500">
              {activeTab === 'details' && (
                <div className="prose prose-stone max-w-none">
                  {renderFormattedText(product.description || "No description available for this artifact.")}
                </div>
              )}

              {activeTab === 'features' && (
                <div className="prose prose-stone max-w-none">
                  {renderFormattedText(product.features || "No specific features listed.")}
                </div>
              )}

              {activeTab === 'care' && (
                <div className="prose prose-stone max-w-none">
                  {renderFormattedText(product.instructions || "Handcrafted items require gentle care. Avoid abrasive scrubbers and maintain with natural oils where applicable.")}
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="prose prose-stone max-w-none">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-stone-900 font-bold text-sm uppercase tracking-widest mb-2">Delivery</h4>
                      <p className="text-stone-600 leading-relaxed">Usually dispatched within 48 hours. Delivery takes 5-7 business days depending on location.</p>
                    </div>
                    <div>
                      <h4 className="text-stone-900 font-bold text-sm uppercase tracking-widest mb-2">Returns</h4>
                      <p className="text-stone-600 leading-relaxed">We accept returns within 7 days of delivery for unused products in original packaging.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="mt-40 border-t border-outline-variant/10 pt-20 pb-32 bg-[#FCFBFA]">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <header className="mb-20 text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 italic tracking-tight">Voices of the Curated Home</h2>
              <p className="text-stone-500 font-light text-lg max-w-2xl leading-relaxed">Hear from our community of collectors who value health, heritage, and the art of fine living.</p>
            </header>

            {/* Unified Chronicle Hub */}
            <div className="bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(28,27,27,0.05)] border border-stone-100 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">

                {/* Sidebar Scoreboard */}
                <div className="lg:col-span-4 bg-[#F9F8F7] p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-stone-100 flex flex-col items-center justify-center text-center">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400 mb-8">Review Score</h3>
                  <span className="text-8xl font-headline font-bold text-primary leading-none">
                    {reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                      : "5.0"}
                  </span>
                  <div className="flex text-secondary mt-6 gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarIconSolid key={s} className="w-6 h-6" />
                    ))}
                  </div>
                  <p className="text-stone-500 font-medium mt-6 text-sm italic">Based on {reviews.length} Revie shared by our community.</p>

                  {/* Visual Distribution Mini */}
                  <div className="w-full mt-12 space-y-3 px-4">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-4">
                          <span className="text-[9px] font-bold w-3 text-stone-400">{rating}</span>
                          <div className="flex-1 h-1 bg-stone-200/50 rounded-full overflow-hidden">
                            <div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Main Content Area: Form + Live Scroll */}
                <div className="lg:col-span-8 flex flex-col">
                  {/* Form Top Section */}
                  <div className="p-12 lg:p-16 border-b border-stone-50 bg-[#FCFBFA]/50">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                      <div className="md:w-1/3">
                        <h3 className="font-headline text-3xl font-bold text-primary mb-3 italic">Share Your Story</h3>
                        <p className="text-stone-500 text-sm font-light leading-relaxed">Join the archive of collectors who have transformed their culinary sanctuary.</p>
                      </div>

                      <div className="md:w-2/3 w-full">
                        {user ? (() => {
                          const userReview = reviews.find(r => r.userId === user.uid);
                          const canEdit = !userReview || (userReview.createdAt?.toMillis && (Date.now() - userReview.createdAt.toMillis()) < 6 * 60 * 60 * 1000);

                          return (
                            <div className="space-y-6">
                              {(userReview && !canEdit) ? (
                                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-8 flex flex-col items-center">
                                  <p className="text-secondary font-headline italic text-lg mb-2">Your Chronicle is Permanent</p>
                                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest text-center">
                                    Thank you for sharing your experience. As part of our commitment to authenticity, chronicles become part of the archive after 6 hours.
                                  </p>
                                </div>
                              ) : (
                                <form onSubmit={handleReviewSubmit} className="space-y-6">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex gap-2.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                          className={`transition-all duration-300 transform hover:scale-125 ${reviewForm.rating >= star ? "text-secondary" : "text-stone-200"}`}
                                        >
                                          <StarIconSolid className="w-8 h-8" />
                                        </button>
                                      ))}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300">
                                      {userReview ? "Updating Review" : "Submit Review"}
                                    </span>
                                  </div>
                                  <div className="relative group">
                                    <textarea
                                      required
                                      value={reviewForm.comment}
                                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                      className="w-full bg-white border border-stone-100 rounded-[1.5rem] p-6 focus:ring-4 focus:ring-secondary/5 focus:border-secondary outline-none transition-all resize-none font-light text-stone-600 text-lg placeholder:text-stone-300 shadow-sm"
                                      rows={3}
                                      placeholder="Describe the texture, the weight, the feeling..."
                                    />
                                    <div className="absolute bottom-4 right-4 flex items-center gap-4">
                                      {userReview && (
                                        <p className="hidden md:block text-[8px] font-bold uppercase tracking-widest text-orange-400 italic">
                                          Window closes in {Math.round((6 * 60 - (Date.now() - userReview.createdAt.toMillis()) / 60000))} min
                                        </p>
                                      )}
                                      <button
                                        type="submit"
                                        disabled={submittingReview}
                                        className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50"
                                      >
                                        {submittingReview ? "Syncing..." : (userReview ? "Revise Experience" : "Publish Experience")}
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              )}
                            </div>
                          );
                        })() : (
                          <div className="py-12 text-center border-2 border-dashed border-stone-100 rounded-[2rem] bg-stone-50/30">
                            <p className="text-stone-400 text-sm uppercase tracking-widest font-bold">Please sign in to join the chronicles</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Scroll Bottom Section */}
                  <div className="flex-1 bg-stone-50/30">
                    {reviews.length > 0 ? (
                      <div className="p-8 lg:p-12 overflow-hidden">
                        <div className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-none">
                          {reviews.map((review) => (
                            <div
                              key={review.id}
                              className="flex-shrink-0 w-[300px] md:w-[380px] snap-center bg-white p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgba(28,27,27,0.02)] border border-stone-100 transition-all hover:shadow-[0_15px_50px_rgba(28,27,27,0.05)] flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex flex-col gap-2 mb-8">
                                  <h4 className="font-headline font-bold text-primary italic leading-tight truncate text-xl">{review.userName}</h4>
                                  <div className="flex text-secondary gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <StarIconSolid key={s} className={`w-3 h-3 ${review.rating >= s ? "text-secondary" : "text-stone-100"}`} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-stone-600 text-lg font-light italic leading-relaxed mb-8 line-clamp-4">
                                  "{review.comment}"
                                </p>
                              </div>
                              <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 italic">
                                  {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-IN', { month: 'short' }) : "Recently"}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-secondary/30"></div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Verified</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* Final Spacer */}
                          <div className="flex-shrink-0 w-8"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-center p-12">
                        <p className="font-headline text-2xl text-stone-300 italic">The Reviews await your voice.</p>
                        <p className="text-stone-300 text-[10px] font-bold uppercase tracking-widest mt-2">Become the first to shared an experience</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function WishlistButton({ product }) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !product?.id) return;

    const q = query(
      collection(db, "wishlist"),
      where("userId", "==", user.uid),
      where("productId", "==", product.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsWishlisted(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [user, product?.id]);

  const handleToggle = async () => {
    if (!user) {
      alert("Please sign in to add to wishlist.");
      return;
    }

    setLoading(true);
    try {
      await toggleWishlist(user.uid, product);
    } catch (error) {
      console.error("Wishlist error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-4 rounded-xl border transition-all duration-300 active:scale-90 ${isWishlisted
        ? "bg-secondary/10 border-secondary text-secondary shadow-inner"
        : "border-outline-variant/30 text-primary hover:bg-surface-container-low"
        }`}
    >
      {isWishlisted ? (
        <HeartIconSolid className="w-6 h-6 animate-in zoom-in duration-300" />
      ) : (
        <HeartIcon className="w-6 h-6" />
      )}
    </button>
  );
}
