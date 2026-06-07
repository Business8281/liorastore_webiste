"use client";

export default function ShippingPolicy() {
  return (
    <main className="pt-32 pb-24 px-12 max-w-4xl mx-auto">
      <header className="mb-16 text-center">
        <span className="font-label text-[0.75rem] uppercase tracking-widest text-stone-500 mb-4 block">Delivery Information</span>
        <h1 className="font-headline text-5xl italic text-primary">Shipping Policy</h1>
      </header>

      <div className="prose prose-stone max-w-none space-y-12">
        <section className="bg-surface-container p-10 rounded-[2rem] border border-stone-100">
          <ul className="space-y-6 text-lg md:text-xl text-stone-600 font-light italic serif-italic leading-relaxed">
            <li className="flex items-start gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-3 flex-shrink-0" />
              <span>We currently ship across India.</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-3 flex-shrink-0" />
              <span>Orders are processed within 1–3 business days.</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-3 flex-shrink-0" />
              <span>Delivery typically takes 3–7 business days, depending on location.</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-3 flex-shrink-0" />
              <span>Shipping timelines may vary during sales, holidays, or unforeseen delays.</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-3 flex-shrink-0" />
              <span>Once your order is shipped, tracking details will be shared via email or SMS.</span>
            </li>
          </ul>
        </section>

        <section className="text-center">
          <p className="text-sm font-label uppercase tracking-widest text-stone-400">
            Note: Shipping charges (if applicable) will be clearly shown at checkout.
          </p>
        </section>
      </div>
    </main>
  );
}
