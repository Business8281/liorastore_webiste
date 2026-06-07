"use client";

import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import ProductCard from "@/components/ProductCard";

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All Categories");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "Newest First");
  const [dbCategories, setDbCategories] = useState([]);
  const [reviewStats, setReviewStats] = useState({});
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [isSortExpanded, setIsSortExpanded] = useState(false);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
    const sort = searchParams.get("sort");
    if (sort) setSortBy(sort);
  }, [searchParams]);

  useEffect(() => {
    const q1 = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const q2 = query(collection(db, "combos"), orderBy("createdAt", "desc"));

    let isMounted = true;

    const unsubscribeProducts = onSnapshot(q1, (querySnapshot) => {
      const productData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'product' }));

      const unsubscribeCombos = onSnapshot(q2, (comboSnapshot) => {
        if (!isMounted) return;
        const comboData = comboSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'combo' }));
        const allData = [...productData, ...comboData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProducts(allData);
        setLoading(false);
      });
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribeProducts();
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data().name);
      setDbCategories(["All Categories", ...data]);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "reviews"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stats = {};
      snapshot.docs.forEach(doc => {
        const review = doc.data();
        const pId = review.productId;
        if (!stats[pId]) {
          stats[pId] = { total: 0, count: 0 };
        }
        stats[pId].total += (review.rating || 5);
        stats[pId].count += 1;
      });

      const computed = {};
      for (const pId in stats) {
        computed[pId] = {
          avg: (stats[pId].total / stats[pId].count).toFixed(1),
          count: stats[pId].count
        };
      }
      setReviewStats(computed);
    });
    return () => unsubscribe();
  }, []);

  // Derive categories from live items
  const derivedCategories = ["All Categories", "Combos", ...new Set(products.filter(p => p.type !== 'combo').map(p => p.category).filter(Boolean))];

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = !searchQuery || 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All Categories" ||
        (selectedCategory === "Combos" && product.type === "combo") ||
        (product.category?.toLowerCase() === selectedCategory?.toLowerCase());
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      return matchesCategory && matchesPrice && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "Price Low-High") return a.price - b.price;
      if (sortBy === "Price High-Low") return b.price - a.price;
      if (sortBy === "Newest First") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "Popular") return (b.popularity || 0) - (a.popularity || 0);
      return 0;
    });

  return (
    <main className="pt-20 pb-24 max-w-[1440px] mx-auto px-8 font-label">
      {/* Header Section */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary">The Curator's Choice</span>
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter text-primary">Premium Collections</h1>
          <p className="max-w-xl text-on-surface-variant text-lg leading-relaxed font-body">
            Thoughtfully designed, toxin-free culinary tools crafted for those who view cooking as an art form.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Category Dropdown (Moved to Header) */}
          <div className="relative group lg:hidden">
            <button 
              onClick={() => {
                setIsCategoryExpanded(!isCategoryExpanded);
                setIsSortExpanded(false);
              }}
              className="flex items-center gap-2 text-[10px] md:text-sm font-label uppercase tracking-widest text-primary font-bold bg-surface-container-low px-4 py-2.5 rounded-lg hover:bg-surface-container transition-all shadow-sm border border-black/5"
            >
              {selectedCategory}
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isCategoryExpanded ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute left-0 top-full mt-2 w-48 bg-white shadow-2xl rounded-xl transition-all z-40 p-2 border border-outline-variant/10 ${isCategoryExpanded ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
              {[...new Set(dbCategories)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsCategoryExpanded(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-xs font-bold rounded-lg transition-colors ${selectedCategory === cat ? "bg-primary text-white" : "hover:bg-stone-50 text-on-surface-variant"}`}
                >
                  {cat}
                </button>
              ))}
              {dbCategories.length === 0 && (
                ["All Categories", "Combos", ...new Set(products.filter(p => p.type !== 'combo').map(p => p.category).filter(Boolean))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsCategoryExpanded(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 text-xs font-bold rounded-lg transition-colors ${selectedCategory === cat ? "bg-primary text-white" : "hover:bg-stone-50 text-on-surface-variant"}`}
                  >
                    {cat}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="relative group">
            <button 
              onClick={() => {
                setIsSortExpanded(!isSortExpanded);
                setIsCategoryExpanded(false);
              }}
              className="flex items-center gap-2 text-[10px] md:text-sm font-label uppercase tracking-widest text-primary font-bold bg-surface-container-low px-4 py-2.5 rounded-lg hover:bg-surface-container transition-all shadow-sm border border-black/5"
            >
              {sortBy}
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isSortExpanded ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute right-0 top-full mt-2 w-48 bg-white shadow-2xl rounded-xl transition-all z-40 p-2 border border-outline-variant/10 ${isSortExpanded ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
              {["Popular", "Price Low-High", "Price High-Low", "Newest First"].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSortBy(option);
                    setIsSortExpanded(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-xs font-bold rounded-lg transition-colors ${sortBy === option ? "bg-primary text-white" : "hover:bg-stone-50 text-on-surface-variant"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-12">
          {/* Search Bar */}
          <div className="space-y-4">
            <h3 className="font-headline text-lg lg:text-xl uppercase tracking-widest font-bold text-primary">Search</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface-variant text-sm rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold placeholder:font-normal placeholder:text-outline"
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            </div>
          </div>

          {/* Category Filter - Desktop Only */}
          <div className="hidden lg:block space-y-8">
            <h3 className="font-headline text-lg lg:text-xl uppercase tracking-widest font-bold text-primary">Category</h3>
            <div className="flex flex-col gap-2">
              {[...new Set(dbCategories)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left px-6 py-4 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 ${selectedCategory === cat
                      ? "bg-[#1A1A1A] text-white shadow-lg translate-x-1"
                      : "text-on-surface-variant hover:bg-stone-50 hover:text-primary border border-transparent hover:border-stone-100"
                    }`}
                >
                  {cat}
                </button>
              ))}
              {dbCategories.length === 0 && (
                ["All Categories", "Combos", ...new Set(products.filter(p => p.type !== 'combo').map(p => p.category).filter(Boolean))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left px-6 py-4 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 ${selectedCategory === cat
                        ? "bg-[#1A1A1A] text-white shadow-lg translate-x-1"
                        : "text-on-surface-variant hover:bg-stone-50 hover:text-primary border border-transparent hover:border-stone-100"
                      }`}
                  >
                    {cat}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="font-label text-xs uppercase tracking-[0.15em] font-bold border-b border-outline-variant/20 pb-4 text-primary">Price Range</h3>
            <div className="space-y-8 px-2">
              <div className="relative h-2 bg-surface-container rounded-full mt-8">
                {/* Track */}
                <div
                  className="absolute h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    left: `${(priceRange[0] / 10000) * 100}%`,
                    right: `${100 - (priceRange[1] / 10000) * 100}%`
                  }}
                ></div>

                {/* Min Slider */}
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = Math.min(Number(e.target.value), priceRange[1] - 500);
                    setPriceRange([val, priceRange[1]]);
                  }}
                  className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none cursor-pointer z-20 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:rounded-full
                    [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
                    [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:rounded-full"
                />

                {/* Max Slider */}
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = Math.max(Number(e.target.value), priceRange[0] + 500);
                    setPriceRange([priceRange[0], val]);
                  }}
                  className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none cursor-pointer z-20 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:rounded-full
                    [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
                    [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:rounded-full"
                />
              </div>
              <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-outline font-bold">Min</span>
                  <span className="text-xs font-bold text-primary">{formatPrice(priceRange[0])}</span>
                </div>
                <div className="w-4 h-[1px] bg-outline-variant/30"></div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase tracking-widest text-outline font-bold">Max</span>
                  <span className="text-xs font-bold text-primary">{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-grow">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[4/5] bg-surface-container rounded-xl"></div>
                  <div className="h-4 bg-surface-container rounded w-3/4"></div>
                  <div className="h-3 bg-surface-container rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  reviewStats={reviewStats} 
                />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-20 bg-surface-container rounded-3xl">
                  <p className="text-on-surface-variant italic">No artifacts found in this collection. Please check back soon.</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-24 border-t border-outline-variant/20 pt-12 flex items-center justify-between">
            <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Showing {products.length} Items</span>
            <div className="flex items-center gap-6">
              <button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <button key={n} className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${n === 1 ? "bg-primary text-on-primary" : "text-outline hover:bg-surface-container"}`}>{n}</button>
                ))}
              </div>
              <button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <main className="pt-20 pb-24 max-w-[1440px] mx-auto px-8 font-label">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-surface-container rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="h-64 bg-surface-container rounded"></div>
            <div className="lg:col-span-3 grid grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-80 bg-surface-container rounded-xl"></div>)}
            </div>
          </div>
        </div>
      </main>
    }>
      <ShopContent />
    </Suspense>
  );
}
