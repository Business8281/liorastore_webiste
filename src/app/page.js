"use client";

import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProducts } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  SparklesIcon,
  TruckIcon
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState([]);
  const [mostSold, setMostSold] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({});

  useEffect(() => {
    // 1. Fetch New Arrivals
    const qNew = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(4));
    const unsubNew = onSnapshot(qNew, (querySnapshot) => {
      setNewArrivals(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Fetch Most Sold (Bestsellers)
    const qSold = query(collection(db, "products"), orderBy("price", "desc"), limit(4)); // Placeholder: using price/popularity
    const unsubSold = onSnapshot(qSold, (querySnapshot) => {
      setMostSold(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // 3. Fetch Reviews for stats
    const qReviews = query(collection(db, "reviews"));
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
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

    return () => {
      unsubNew();
      unsubSold();
      unsubReviews();
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] lg:min-h-[700px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            alt="Close-up of premium cast iron cookware on a minimalist kitchen counter"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeUJ1d9eHaOC9OcmTs7JTRRHpHICuWRno5buc7t0hgdLxL7ShJL3rYK14QlSwiBDZouLjWopsiX_c5yoNip0j6CyXPMDMgmLZaT_V18W-n7L_USYfeeiYgwx1_mA_Bowmezj431NWI11Bn2tA9yIuo-_5OMOUeUe5f1KzGT_sBY1RIQTXAkKwHE1DMehLk12SEltqpVsNJ93nALSfM5pA37IYiWvYOUXSbshXgF0uRajtN1gebd6m8MzsrODfIEwvN0XpUnwkGv6_i"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-8 w-full">
          <div className="max-w-2xl text-white">
            <span className="inline-block mb-6 px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label text-[0.7rem] uppercase tracking-[0.2em] font-bold">Home & Kitchen Essentials</span>
            <h1 className="font-headline text-5xl sm:text-6xl md:text-8xl italic tracking-tighter mb-8 leading-[1.1]">Cook Without <br />Chemicals.</h1>
            <p className="text-lg md:text-xl font-light mb-12 opacity-90 max-w-lg leading-relaxed">Upgrade your kitchen with culinary tools designed for health and built for generations.</p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link href="/shop" className="px-10 py-5 bg-primary text-on-primary rounded-xl font-medium text-sm tracking-widest uppercase hover:bg-primary-container transition-all editorial-shadow active:scale-95 duration-200 text-center">Shop Now</Link>
              <Link href="/our-story" className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-xl font-medium text-sm tracking-widest uppercase hover:bg-white/20 transition-all active:scale-95 duration-200 text-center">Explore</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Most Sold Products */}
      <section className="py-24 bg-surface">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="font-label text-secondary text-xs uppercase tracking-[0.2em] font-bold block mb-4">Customer Favorites</span>
              <h2 className="font-headline text-4xl md:text-5xl italic text-primary">Best Seller</h2>
            </div>
            <Link href="/shop" className="text-sm font-bold uppercase tracking-widest border-b-2 border-primary pb-1 hover:text-secondary transition-colors">View All</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="aspect-[4/5] bg-surface-container rounded-2xl"></div>
                  <div className="h-6 bg-surface-container rounded w-3/4"></div>
                </div>
              ))
            ) : (
              mostSold.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  reviewStats={reviewStats}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-24 bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="font-label text-secondary text-xs uppercase tracking-[0.2em] font-bold block mb-4">Fresh from the Archives</span>
              <h2 className="font-headline text-4xl md:text-5xl italic text-primary">New Arrivals</h2>
            </div>
            <Link href="/shop" className="text-sm font-bold uppercase tracking-widest border-b-2 border-primary pb-1 hover:text-secondary transition-colors">Explore Collection</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="aspect-[4/5] bg-surface-container rounded-2xl"></div>
                  <div className="h-6 bg-surface-container rounded w-3/4"></div>
                </div>
              ))
            ) : (
              newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  reviewStats={reviewStats}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="py-32 bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto">
            <div className="bg-surface-container-highest rounded-xl overflow-hidden flex flex-col">
              <div className="w-full">
                <Image src="/T.png" alt="Common Cookware" width={1000} height={600} className="w-full h-auto" />
              </div>
              <div className="p-10 sm:p-12 flex flex-col justify-center flex-grow">
                <span className="font-label text-error text-xs uppercase tracking-widest mb-4 font-bold">Health Hazards</span>
                <h2 className="font-headline text-3xl md:text-4xl mb-8 leading-tight text-on-surface">Common Cookware to Avoid</h2>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-error-container/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-error-container/30 transition-colors">
                      <XCircleIcon className="w-5 h-5 text-error" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide text-error">Coated NON-STICK Cookware</h4>
                      <p className="text-xs text-on-surface-variant font-light mt-1">PFAS from nonstick pans are harmful and release toxic fumes at high heat.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-error-container/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-error-container/30 transition-colors">
                      <XCircleIcon className="w-5 h-5 text-error" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide text-error">ALUMINUM Cookware</h4>
                      <p className="text-xs text-on-surface-variant font-light mt-1">Metal leaching from aluminum can potentially cause serious long-term health issues.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-error-container/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-error-container/30 transition-colors">
                      <XCircleIcon className="w-5 h-5 text-error" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide text-error">LOW GRADE CERAMIC Cookware</h4>
                      <p className="text-xs text-on-surface-variant font-light mt-1">High risk of lead and cadmium leaching from cheaper, low-grade ceramic finishes.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-primary text-on-primary rounded-xl overflow-hidden flex flex-col relative grid-rows-[auto_1fr]">
              <div className="w-full">
                <Image src="/H.png" alt="Why Liora Is Better" width={1000} height={600} className="w-full h-auto" />
              </div>
              <div className="p-10 sm:p-12 flex flex-col justify-center flex-grow relative z-10">
                <span className="font-label text-secondary-container text-xs uppercase tracking-widest mb-4 font-bold">Scientific Superiority</span>
                <h2 className="font-headline text-3xl md:text-4xl mb-8 leading-tight">Why Liora Is Better</h2>
                <ul className="space-y-6 mb-4">
                  <li className="flex items-start gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-secondary-container flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide">No coatings, chemicals, or toxins</h4>
                      <p className="text-xs opacity-70 font-light mt-1">100% pure cast-iron composition with absolutely zero artificial coatings.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-secondary-container flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide">Safe for children</h4>
                      <p className="text-xs opacity-70 font-light mt-1">Non-toxic surface ensures healthy meals for your family.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-secondary-container flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide">Naturally nonstick</h4>
                      <p className="text-xs opacity-70 font-light mt-1">Gets better with every use through natural seasoning.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-secondary-container flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide">High-heat safe</h4>
                      <p className="text-xs opacity-70 font-light mt-1">Withstands extreme temperatures without releasing fumes.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-secondary-container flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide">Lasts a lifetime</h4>
                      <p className="text-xs opacity-70 font-light mt-1">Durable heirloom quality that only improves over generations.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Icons */}
      <section className="py-24 border-y border-outline-variant/20">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          <div className="flex flex-col items-center">
            <GlobeAltIcon className="w-10 h-10 text-primary mb-6" />
            <h5 className="font-label text-xs font-bold tracking-[0.2em] uppercase mb-2">Toxin Free</h5>
            <p className="text-sm text-on-surface-variant">Safety in every simmer</p>
          </div>
          <div className="flex flex-col items-center">
            <AcademicCapIcon className="w-10 h-10 text-primary mb-6" />
            <h5 className="font-label text-xs font-bold tracking-[0.2em] uppercase mb-2">LIFETIME WARRANTY</h5>
            <p className="text-sm text-on-surface-variant">Built to be passed down</p>
          </div>
          <div className="flex flex-col items-center">
            <SparklesIcon className="w-10 h-10 text-primary mb-6" />
            <h5 className="font-label text-xs font-bold tracking-[0.2em] uppercase mb-2">Artisan Made</h5>
            <p className="text-sm text-on-surface-variant">Hand-crafted excellence</p>
          </div>
          <div className="flex flex-col items-center">
            <TruckIcon className="w-10 h-10 text-primary mb-6" />
            <h5 className="font-label text-xs font-bold tracking-[0.2em] uppercase mb-2">CARBON NEUTRAL</h5>
            <p className="text-sm text-on-surface-variant">Kind to the planet</p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-32 bg-primary text-on-primary">
        <div className="max-w-2xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-headline text-4xl md:text-5xl italic mb-6">The Culinary Letter</h2>
          <p className="text-on-primary-container font-light mb-12">Receive seasonal recipes, toxin-free living tips, and exclusive early access to our limited editions.</p>
          <form className="flex flex-col sm:flex-row gap-4">
            <input className="flex-grow bg-white/5 border-b border-white/30 text-white placeholder:text-white/40 focus:ring-0 focus:border-white transition-colors px-4 py-4 rounded-t-lg sm:rounded-none" placeholder="Email Address" type="email" />
            <button className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity">Subscribe</button>
          </form>
        </div>
      </section>
    </>
  );
}
