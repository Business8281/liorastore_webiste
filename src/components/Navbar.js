"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag, User, LogOut, ChevronDown } from "lucide-react";
import { collection, query, where, getDocs, limit, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatPrice } from "@/lib/utils";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [categoryProducts, setCategoryProducts] = useState({});
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [expandedCats, setExpandedCats] = useState([]);

  const { cart, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();

  const toggleExpandedCat = (cat) => {
    setExpandedCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    const unsubscribeCategories = onSnapshot(query(collection(db, "categories"), orderBy("order", "asc")), (snapshot) => {
      const cats = snapshot.docs.map(doc => doc.data().name);
      const uniqueCats = [...new Set(cats)];
      if (uniqueCats.length > 0) {
        setCategories(uniqueCats);
        if (!activeCategory) setActiveCategory(uniqueCats[0]);
      }
    });

    const unsubscribeMegaMenu = onSnapshot(collection(db, "products"), (snapshot) => {
      try {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 1. Map products to categories
        const productsMap = {};
        docs.forEach(data => {
          if (data.category) {
            if (!productsMap[data.category]) productsMap[data.category] = [];
            if (productsMap[data.category].length < 3) {
              productsMap[data.category].push(data);
            }
          }
        });
        setCategoryProducts(productsMap);
      } catch (error) {
        console.error("Error updating mega menu live:", error);
      }
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubscribeCategories();
      unsubscribeMegaMenu();
    };
  }, []);

  return (
    <>
      <nav className={`w-full transition-all duration-500 ${isScrolled ? "bg-white/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-black/5" : "bg-[#FCFBFA] border-b border-black/5"}`}>
        <div className="max-w-[1440px] mx-auto flex justify-between items-center px-6 md:px-8 py-4">
          {/* Left: Mobile Menu Trigger & Logo */}
          <div className="flex-1 flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <Link href="/" className="flex items-center">
              <img src="/logo200BR.png" alt="Liora Logo" className="h-8 md:h-10 w-auto object-contain" />
            </Link>
          </div>

          {/* Center: Desktop Navigation Links (Hidden on Tablets/Mobile) */}
          <div className="hidden lg:flex flex-1 justify-center items-center gap-6 xl:gap-8 whitespace-nowrap">
            <div 
              className="relative py-2"
              onMouseEnter={() => setShowMegaMenu(true)}
              onMouseLeave={() => setShowMegaMenu(false)}
            >
              <button className="flex items-center gap-1 text-[#3A4A2F] font-semibold font-headline italic tracking-tight hover:opacity-70 transition-opacity">
                Categories
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showMegaMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showMegaMenu && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[calc(100vw-48px)] max-w-[750px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl border border-stone-200 overflow-hidden flex animate-in fade-in zoom-in-95 duration-300 z-[100]">
                  {/* Left: Category List (Sidebar) */}
                  <div className="w-[240px] bg-[#F9F8F6] p-6 border-r border-stone-100 flex flex-col">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 mb-6 font-label">Browse by Category</p>
                    <nav className="flex flex-col gap-2">
                      {[...new Set(categories)].map((cat) => (
                        <button
                          key={cat}
                          onMouseEnter={() => setActiveCategory(cat)}
                          className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold transition-all duration-300 transform ${
                            activeCategory === cat 
                            ? "bg-[#1A1A1A] text-white shadow-lg scale-[1.02]" 
                            : "text-stone-500 hover:text-stone-900 hover:bg-white/50"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  {/* Right: Featured Products Content */}
                  <div className="flex-grow p-8 flex flex-col bg-white">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex-grow text-center">
                        <h3 className="font-headline text-3xl italic text-primary leading-none capitalize mb-1">{activeCategory}</h3>
                        <div className="w-10 h-[1px] bg-secondary mx-auto mt-3 opacity-50"></div>
                      </div>
                      <Link 
                        href={`/shop?category=${activeCategory}`} 
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 border-b-2 border-primary pb-1 hover:text-secondary hover:border-secondary transition-all shrink-0 font-label"
                      >
                        View All
                      </Link>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                      {categoryProducts[activeCategory]?.length > 0 ? (
                        categoryProducts[activeCategory].slice(0, 3).map((item) => (
                          <Link key={item.id} href={`/product/${item.handle || item.id}`} className="group block">
                            <div className="aspect-square bg-stone-50 rounded-xl overflow-hidden border border-stone-100 mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                              <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </div>
                            <div>
                              <h4 className="text-[10px] font-bold text-stone-900 mb-0.5 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{item.title}</h4>
                              <p className="text-[9px] font-medium text-stone-400">{formatPrice(item.price)}</p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="col-span-3 flex flex-col items-center justify-center py-12 text-stone-300">
                          <div className="animate-pulse flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full border-2 border-stone-100 border-t-stone-300 animate-spin mb-3"></div>
                            <p className="italic text-xs text-primary/40">Loading...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/shop" className="text-stone-600 hover:text-stone-900 font-headline italic tracking-tight hover:opacity-80 transition-opacity duration-300">
              Shop All
            </Link>
            <Link href="/shop?sort=Newest First" className="text-stone-600 hover:text-stone-900 font-headline italic tracking-tight hover:opacity-80 transition-opacity duration-300">
              New Arrivals
            </Link>
            <Link href="/our-story" className="text-stone-600 hover:text-stone-900 font-headline italic tracking-tight hover:opacity-80 transition-opacity duration-300">
              Our Story
            </Link>
            <Link href="/contact" className="text-stone-600 hover:text-stone-900 font-headline italic tracking-tight hover:opacity-80 transition-opacity duration-300">
              Contact
            </Link>
          </div>

          {/* Right: Icons */}
          <div className="flex-1 flex justify-end items-center gap-5 md:gap-6">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative text-stone-900 transition-opacity duration-300 hover:opacity-80 p-1 focus:outline-none"
            >
              <ShoppingBag strokeWidth={1.5} className="w-5 h-5 md:w-[1.4rem] md:h-[1.4rem]" />
              {cart.totalQuantity > 0 && (
                <span className="absolute top-0 right-0 bg-[#3A4A2F] text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {cart.totalQuantity}
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2 md:gap-4">
                <Link href="/dashboard" className="text-stone-900 transition-opacity duration-300 hover:opacity-80 p-1">
                  <User strokeWidth={1.5} className="w-5 h-5 md:w-[1.4rem] md:h-[1.4rem]" />
                </Link>
                <button onClick={logout} className="text-stone-900 transition-opacity duration-300 hover:opacity-80 p-1">
                  <LogOut strokeWidth={1.5} className="w-5 h-5 md:w-[1.4rem] md:h-[1.4rem]" />
                </button>
              </div>
            ) : (
                <Link href="/login" className="text-stone-900 transition-opacity duration-300 hover:opacity-80 p-1">
                  <User strokeWidth={1.5} className="w-5 h-5 md:w-[1.4rem] md:h-[1.4rem]" />
                </Link>
            )}
          </div>
        </div>

        {/* Dynamic Offer Bar Integrated into Sticky Header */}
      </nav>

      {/* Mobile Menu Drawer */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 lg:hidden ${isMobileMenuOpen ? "visible" : "invisible"}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        
        {/* Drawer Content */}
        <div className={`absolute top-0 left-0 h-full w-4/5 max-w-[320px] bg-white shadow-2xl transition-transform duration-500 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <div className="flex items-center">
                <img src="/logo200BR.png" alt="Liora Logo" className="h-8 w-auto object-contain" />
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto py-8">
              <nav className="px-6 space-y-6">
                {/* Categories Dropdown */}
                <div className="space-y-3">
                  <button 
                    onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                    className="w-full flex items-center justify-between group py-2"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 group-hover:text-primary transition-colors">Categories</p>
                    <ChevronDown className={`w-4 h-4 text-stone-300 transition-transform duration-500 ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`grid transition-all duration-500 ease-in-out ${isMobileCategoriesOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
                    <div className="overflow-hidden flex flex-col gap-2">
                       {categories.map((cat) => (
                        <Link 
                          key={cat}
                          href={`/shop?category=${cat}`}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setIsMobileCategoriesOpen(false);
                          }}
                          className="flex items-center justify-between py-3.5 px-5 rounded-xl bg-stone-50 text-[13px] font-bold text-stone-900 border border-transparent hover:border-primary/10 hover:bg-white transition-all shadow-sm"
                        >
                          {cat}
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Primary Links */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <Link 
                    href="/shop" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-lg font-headline italic text-stone-600 hover:text-stone-900"
                  >
                    Shop All
                  </Link>
                  <Link 
                    href="/shop?sort=Newest First" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-lg font-headline italic text-stone-600 hover:text-stone-900"
                  >
                    New Arrivals
                  </Link>
                  <Link 
                    href="/our-story" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-lg font-headline italic text-stone-600 hover:text-stone-900"
                  >
                    Our Story
                  </Link>
                  <Link 
                    href="/contact" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-lg font-headline italic text-stone-600 hover:text-stone-900"
                  >
                    Contact
                  </Link>
                </div>
              </nav>
            </div>

            <div className="p-6 border-t border-stone-100 bg-stone-50/50">
              <p className="text-[10px] text-center text-stone-400 font-medium italic">Handcrafted culinary tools for the modern kitchen.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
