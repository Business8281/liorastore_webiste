"use client";

import Link from "next/link";

export default function OurStory() {
  return (
    <main className="pt-32 pb-24 px-6 md:px-12 max-w-5xl mx-auto">
      <header className="mb-20 text-center">
        <span className="font-label text-[0.75rem] uppercase tracking-[0.3em] text-stone-400 mb-6 block">Our Journey</span>
        <h1 className="font-headline text-5xl md:text-7xl italic text-[#3A4A2F] leading-tight">The Liora Story</h1>
      </header>

      <div className="space-y-24">
        {/* Intro Section */}
        <section className="max-w-3xl mx-auto text-center">
          <h2 className="font-headline text-3xl md:text-4xl text-stone-800 mb-8 leading-snug">
            Liora was born from a simple but powerful question: <span className="italic serif-italic text-stone-500 block mt-2">Why should healthy cooking come with uncertainty?</span>
          </h2>
          <p className="text-stone-600 text-lg leading-relaxed font-light">
            In today’s kitchens, non-stick coatings, plastic handles, and chemical finishes have become the norm—often without clear information on long-term safety. We felt Indian households deserved better.
          </p>
        </section>

        {/* Mission Section */}
        <section className="bg-stone-50 px-8 py-20 md:p-24 rounded-[3rem] border border-stone-100 text-center relative overflow-hidden">
          <div className="relative z-10">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-[#3A4A2F] mb-6 block">Our Mission</span>
            <h3 className="font-headline text-4xl md:text-5xl italic text-[#3A4A2F] mb-10 leading-tight">
              Remove toxins from cookware and <br className="hidden md:block" /> bring purity back to everyday cooking.
            </h3>
            <div className="w-20 h-[1px] bg-[#3A4A2F]/20 mx-auto mb-10"></div>
            <p className="text-stone-500 max-w-2xl mx-auto leading-relaxed italic opacity-70">
              Honesty in materials, precision in design.
            </p>
          </div>
        </section>

        {/* Curation & Quality */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h3 className="font-headline text-3xl text-stone-800">Honest Materials, Reimagined.</h3>
            <p className="text-stone-600 text-lg leading-relaxed font-light">
              We design and curate cookware using honest materials like cast iron and stainless steel—materials trusted for generations, reimagined for modern kitchens. Every product is created with durability, safety, and Indian cooking habits in mind.
            </p>
            <p className="text-stone-600 text-lg leading-relaxed font-light">
              We handle the research, material selection, and quality checks—so you can cook with confidence.
            </p>
          </div>
          <div className="bg-stone-50 aspect-[4/5] rounded-[2.5rem] flex items-center justify-center p-12 overflow-hidden border border-stone-100 shadow-inner">
             <div className="text-center">
                <span className="font-headline text-8xl italic text-[#3A4A2F] opacity-10">L</span>
                <p className="text-[0.6rem] uppercase tracking-[0.5em] text-stone-300 mt-4">Purity in Craft</p>
             </div>
          </div>
        </section>

        {/* Closing Thought */}
        <section className="text-center py-20 border-t border-stone-100">
          <p className="font-headline text-2xl md:text-4xl italic text-[#3A4A2F] opacity-80 mb-6 max-w-2xl mx-auto leading-relaxed">
            Pure living begins in the kitchen. And the kitchen begins with Liora.
          </p>
          <div className="flex justify-center gap-6 pt-8">
             <Link href="/shop" className="bg-[#3A4A2F] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-colors">
               Explore Collection
             </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
