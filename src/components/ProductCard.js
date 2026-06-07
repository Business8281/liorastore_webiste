"use client";

import Link from "next/link";
import { StarIcon, ShoppingCartIcon, TrashIcon } from "@heroicons/react/24/solid";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product, reviewStats, onRemove, removeLabel = "Remove" }) {
    const { addToCart } = useCart();
    
    // Normalize data (support both product objects and flattened wishlist/cart items)
    const id = product.id || product.productId;
    const title = product.title || product.productTitle;
    const price = product.price || product.productPrice;
    const originalPrice = product.originalPrice || product.productOriginalPrice;
    const image = product.featuredImage || product.productImage || product.image;
    const handle = product.handle || product.productHandle || product.id;
    const category = product.category || product.productCategory;
    const type = product.type || product.productType;

    const stats = reviewStats?.[id];

    return (
        <div className="group relative flex flex-col h-full bg-white rounded-2xl border border-stone-200/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
            {/* Image Section */}
            <Link 
                href={type === "combo" ? `/combo/${handle}` : `/product/${handle}`}
                className="relative aspect-square overflow-hidden bg-[#F9F8F6] block"
            >
                {type === "combo" && (
                    <span className="absolute top-4 right-4 z-10 px-3 py-1 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">Combo Offer</span>
                )}
                {product.tags?.includes("Bestseller") && (
                    <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">Editor's Choice</span>
                )}
                <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={image}
                    alt={title}
                />
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Remove Button (Optional) */}
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onRemove(product);
                        }}
                        className="absolute bottom-4 right-4 z-20 p-2 bg-white/90 backdrop-blur-md rounded-full text-stone-400 hover:text-red-500 transition-all shadow-lg active:scale-90"
                        title={removeLabel}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </Link>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex-grow space-y-1 mb-4">
                    <Link 
                        href={type === "combo" ? `/combo/${handle}` : `/product/${handle}`}
                        className="block group-hover:text-secondary transition-colors"
                    >
                        <h3 className="text-lg font-headline font-semibold text-primary line-clamp-3 leading-snug h-[4.2rem] overflow-hidden">
                            {title}
                        </h3>
                    </Link>
                    <p className="font-label text-[10px] uppercase text-on-surface-variant tracking-[0.15em] font-bold opacity-70">
                        {type === "combo" ? "Curated Bundle" : category}
                    </p>
                    
                    {/* Reviews & Price Row */}
                    <div className="flex items-center justify-between pt-3">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-body font-bold text-primary">{formatPrice(price)}</span>
                                {originalPrice && originalPrice > price && (
                                    <span className="text-xs font-body text-outline line-through opacity-50">{formatPrice(originalPrice)}</span>
                                )}
                            </div>
                        </div>

                        {stats ? (
                            <div className="flex items-center gap-1.5 bg-secondary/5 px-2 py-1 rounded-md border border-secondary/10">
                                <StarIcon className="w-3 h-3 text-secondary" />
                                <span className="text-[11px] font-bold text-secondary">{stats.avg}</span>
                                <span className="text-[10px] text-outline font-medium">({stats.count})</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-1 h-[24px]">
                                {/* Placeholder to maintain vertical alignment even without reviews */}
                                <div className="w-3 h-3 rounded-full bg-stone-100"></div>
                                <span className="text-[10px] text-stone-300 font-bold uppercase tracking-tighter">New Entry</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Direct Action Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        // Call addToCart with normalized product object
                        addToCart({ ...product, id, title, price, featuredImage: image, handle, category, type });
                    }}
                    className="w-full py-3 bg-stone-100 text-primary rounded-xl font-label text-[10px] items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all duration-300 transform md:absolute md:bottom-[-50px] md:left-5 md:right-5 md:w-[calc(100%-40px)] md:group-hover:bottom-5 md:group-hover:translate-y-0 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto hidden md:flex hover:bg-primary hover:text-white border border-outline-variant/10 md:shadow-xl md:shadow-stone-200/50"
                >
                    <ShoppingCartIcon className="w-4 h-4" />
                    Add to Cart
                </button>
            </div>

            {/* Mobile Only Action Button (always visible) */}
            <div className="md:hidden px-5 pb-5 mt-auto">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        addToCart({ ...product, id, title, price, featuredImage: image, handle, category, type });
                    }}
                    className="w-full py-4 bg-primary text-on-primary rounded-xl font-label text-[10px] flex items-center justify-center gap-2 font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                >
                    <ShoppingCartIcon className="w-4 h-4" />
                    Add To Cart
                </button>
            </div>
        </div>
    );
}
