"use client";

import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    limit,
    getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
    ChevronRightIcon,
    MagnifyingGlassPlusIcon,
    GiftIcon,
    CheckBadgeIcon,
    ShieldCheckIcon,
    TruckIcon
} from "@heroicons/react/24/outline";

export default function ComboDetailPage() {
    const { user } = useAuth();
    const { handle } = useParams();
    const router = useRouter();
    const { addToCart, setBuyNowItem } = useCart();

    const [combo, setCombo] = useState(null);
    const [includedProducts, setIncludedProducts] = useState([]);
    const [freeProducts, setFreeProducts] = useState([]);
    const [selectedFreeProductId, setSelectedFreeProductId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        if (!handle) return;

        const q = query(
            collection(db, "combos"),
            where("handle", "==", handle),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (!snapshot.empty) {
                const comboDoc = snapshot.docs[0];
                const comboData = { id: comboDoc.id, ...comboDoc.data() };
                setCombo(comboData);

                // Fetch included and free products details
                if (comboData.selectedProducts?.length > 0) {
                    const productsRef = collection(db, "products");
                    const qInc = query(productsRef, where("__name__", "in", comboData.selectedProducts));
                    const incSnap = await getDocs(qInc);
                    setIncludedProducts(incSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }

                if (comboData.freeProducts?.length > 0) {
                    const productsRef = collection(db, "products");
                    const qFree = query(productsRef, where("__name__", "in", comboData.freeProducts));
                    const freeSnap = await getDocs(qFree);
                    setFreeProducts(freeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }

                setLoading(false);
            } else {
                setCombo(null);
                setLoading(false);
            }
        }, (error) => {
            console.error("Error fetching combo live:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [handle]);

    const handleAddToCart = () => {
        if (freeProducts.length > 0 && !selectedFreeProductId) {
            alert("Please select your complimentary gift first.");
            return;
        }

        // Only pass the selected gift
        const finalFreeProducts = selectedFreeProductId ? [selectedFreeProductId] : [];

        addToCart({
            ...combo,
            type: 'combo',
            isCombo: true,
            freeProducts: finalFreeProducts
        }, 1);
    };

    const handleBuyNow = () => {
        if (freeProducts.length > 0 && !selectedFreeProductId) {
            alert("Please select your complimentary gift first.");
            return;
        }

        const finalFreeProducts = selectedFreeProductId ? [selectedFreeProductId] : [];

        setBuyNowItem({
            ...combo,
            quantity: 1,
            type: 'combo',
            isCombo: true,
            freeProducts: finalFreeProducts
        });

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

    if (!combo) {
        return (
            <div className="max-w-[1440px] mx-auto px-8 pt-24 pb-32 text-center">
                <h1 className="text-4xl font-headline mb-4">Combo Not Found</h1>
                <p className="text-on-surface-variant mb-8">This curated bundle may have been archived or is no longer available.</p>
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
                    <Link className="hover:text-primary transition-colors" href="/shop?category=Combos">Combos</Link>
                    <ChevronRightIcon className="w-3 h-3" />
                    <span className="text-on-surface">{combo.title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                    {/* Left Side: Gallery */}
                    <div className="lg:col-span-6 flex gap-6 h-auto lg:h-[600px]">
                        <div className="flex flex-col gap-4 w-16 lg:w-24 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-200">
                            {combo.images?.map((img, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`aspect-square bg-surface-container rounded-xl overflow-hidden cursor-pointer flex-shrink-0 transition-all ${selectedImage === index ? "ring-2 ring-primary shadow-md" : "hover:opacity-80 opacity-60"}`}
                                >
                                    <img className="w-full h-full object-cover" src={img} alt={`${combo.title} ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 bg-white rounded-2xl overflow-hidden relative group border border-stone-200/50 shadow-sm flex items-center justify-center">
                            <img
                                className="w-full h-full object-contain p-4 transition-transform duration-1000 group-hover:scale-105"
                                src={combo.images?.[selectedImage] || combo.featuredImage}
                                alt={combo.title}
                            />
                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                <span className="bg-primary text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">Premium Bundle</span>
                                {combo.originalPrice > combo.price && (
                                    <span className="bg-secondary text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-pulse">Save {Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)}%</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Primary Info */}
                    <div className="lg:col-span-6 flex flex-col">
                        <div className="mb-4">
                            <span className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">The Curator's Selection</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight mb-4 tracking-tighter text-primary italic">
                            {combo.title}
                        </h1>

                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-4xl font-headline font-bold text-on-surface">{formatPrice(combo.price)}</span>
                            {combo.originalPrice && combo.originalPrice > combo.price && (
                                <span className="text-xl text-outline line-through">{formatPrice(combo.originalPrice)}</span>
                            )}
                        </div>

                        <div className="p-6 bg-secondary/5 rounded-2xl border border-secondary/10 mb-8">
                            <div className="flex items-center gap-3 text-secondary mb-2">
                                <CheckBadgeIcon className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Guaranteed Synergy</span>
                            </div>
                            <p className="text-stone-600 text-sm leading-relaxed font-light italic">
                                "{combo.description}"
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 mb-12">
                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={freeProducts.length > 0 && !selectedFreeProductId}
                                    className="flex-1 bg-primary text-on-primary py-4 px-8 rounded-xl font-bold tracking-wide hover:bg-stone-900 transition-all active:scale-95 duration-200 uppercase text-xs disabled:opacity-50"
                                >
                                    {freeProducts.length > 0 && !selectedFreeProductId ? "Select a Gift to Add" : "Add to cart"}
                                </button>
                            </div>
                            <button
                                onClick={handleBuyNow}
                                disabled={freeProducts.length > 0 && !selectedFreeProductId}
                                className="w-full bg-secondary text-white py-4 px-8 rounded-xl font-bold tracking-wide hover:opacity-90 transition-all active:scale-95 duration-200 uppercase text-xs disabled:opacity-50"
                            >
                                {freeProducts.length > 0 && !selectedFreeProductId ? "Select a Gift Above" : "Buy Now"}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-stone-100">
                            <div className="text-center">
                                <ShieldCheckIcon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <p className="text-[10px] font-bold uppercase text-stone-400">Authentic</p>
                            </div>
                            <div className="text-center">
                                <GiftIcon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <p className="text-[10px] font-bold uppercase text-stone-400">Bonus Gifts</p>
                            </div>
                            <div className="text-center">
                                <TruckIcon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <p className="text-[10px] font-bold uppercase text-stone-400">Insured Delivery</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Bundle Composition */}
                <div className="mt-32 pt-20 border-t border-outline-variant/10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                        <div className="lg:col-span-8">
                            <h2 className="text-3xl font-headline font-bold text-primary mb-12 italic">The Composition</h2>

                            {/* Included Items */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 border-b border-stone-100 pb-4">
                                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold font-label">01</span>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Main Items</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    {includedProducts.map(product => (
                                        <Link key={product.id} href={`/product/${product.handle}`} className="flex gap-6 group hover:translate-x-1 transition-transform">
                                            <div className="w-24 h-24 bg-surface-container rounded-xl overflow-hidden flex-shrink-0 border border-stone-100 group-hover:shadow-lg transition-all">
                                                <img src={product.featuredImage} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-primary group-hover:text-secondary transition-colors mb-1">{product.title}</h4>
                                                <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-2">{product.category}</p>
                                                <span className="text-xs font-body text-stone-600 font-medium">Standard Item</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Gift Options */}
                            {freeProducts.length > 0 && (
                                <div className="mt-20 space-y-6">
                                    <div className="flex items-center gap-4 border-b border-secondary/20 pb-4">
                                        <span className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-bold font-label">02</span>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Complimentary Gifts</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                        {freeProducts.map(product => (
                                            <div
                                                key={product.id}
                                                onClick={() => setSelectedFreeProductId(product.id)}
                                                className={`flex gap-6 group cursor-pointer p-4 rounded-2xl border transition-all duration-300 ${selectedFreeProductId === product.id
                                                        ? "bg-secondary/10 border-secondary shadow-lg scale-[1.02] ring-2 ring-secondary/20"
                                                        : "bg-secondary/5 border-secondary/10 hover:border-secondary/40 hover:bg-secondary/[0.08]"
                                                    }`}
                                            >
                                                <div className="w-24 h-24 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-secondary/10 group-hover:shadow-lg transition-all relative">
                                                    <img src={product.featuredImage} className="w-full h-full object-cover" />
                                                    {selectedFreeProductId === product.id && (
                                                        <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                                                            <CheckBadgeIcon className="w-8 h-8 text-white drop-shadow-md" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-primary mb-1">{product.title}</h4>
                                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-2">{product.category}</p>
                                                    <div className="flex items-center gap-2">
                                                        <GiftIcon className={`w-3 h-3 ${selectedFreeProductId === product.id ? "text-secondary" : "text-stone-400"}`} />
                                                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${selectedFreeProductId === product.id ? "text-secondary" : "text-stone-400"}`}>
                                                            {selectedFreeProductId === product.id ? "Selected Gift" : "Pick as Gift"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4 bg-surface-container-low p-10 rounded-[2.5rem] border border-outline-variant/10 self-start sticky top-32">
                            <h3 className="font-headline text-2xl font-bold text-primary mb-8 italic">Bundle Metrics</h3>
                            <div className="space-y-6 text-sm">
                                <div className="flex justify-between border-b border-stone-100 pb-4">
                                    <span className="text-stone-500">Total Items</span>
                                    <span className="font-bold text-primary">{combo.selectedProducts?.length || 0}</span>
                                </div>
                                <div className="flex justify-between border-b border-stone-100 pb-4">
                                    <span className="text-stone-500">Free Bonus Items</span>
                                    <span className="font-bold text-secondary">+{combo.freeProducts?.length || 0}</span>
                                </div>
                                <div className="flex justify-between border-b border-stone-100 pb-4">
                                    <span className="text-stone-500 text-xs">Total Market Value</span>
                                    <span className="font-medium text-stone-400 line-through">{formatPrice(combo.originalPrice)}</span>
                                </div>
                                <div className="flex justify-between pt-4">
                                    <span className="font-bold text-lg text-primary">Your Investment</span>
                                    <span className="font-bold text-lg text-secondary">{formatPrice(combo.price)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
