"use client";

export default function ReturnRefundPolicy() {
  return (
    <main className="pt-32 pb-24 px-12 max-w-4xl mx-auto">
      <header className="mb-16 text-center">
        <span className="font-label text-[0.75rem] uppercase tracking-widest text-stone-500 mb-4 block">Quality Assurance</span>
        <h1 className="font-headline text-5xl italic text-primary">Return & Refund Policy</h1>
      </header>

      <div className="prose prose-stone max-w-none space-y-16">
        <section>
          <p className="text-stone-600 leading-relaxed text-lg italic serif-italic opacity-80 mb-12">
            At Liora Store, we take pride in the quality of our toxin-free cookware. Because our products are used for food preparation, we maintain strict hygiene and quality standards.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-surface-container p-8 rounded-3xl border border-stone-100">
              <h4 className="font-headline text-xl mb-4 italic">Eligibility</h4>
              <p className="text-sm text-stone-500 leading-relaxed font-light">
                Returns or replacements are accepted within 2-3 days for manufacturing defects, transit damage, or incorrect items.
              </p>
            </div>
            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10">
              <h4 className="font-headline text-xl mb-4 italic text-primary">48-Hour Window</h4>
              <p className="text-sm text-stone-600 leading-relaxed font-light">
                Crucial: Any damage or defect must be reported within 48 hours of delivery.
              </p>
            </div>
            <div className="bg-surface-container p-8 rounded-3xl border border-stone-100">
              <h4 className="font-headline text-xl mb-4 italic">Unused Only</h4>
              <p className="text-sm text-stone-500 leading-relaxed font-light">
                Product must be unused and in original packaging with all tags and documentation.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="font-headline text-3xl italic border-b border-stone-100 pb-4">Detailed Terms</h2>

          <div className="space-y-12">
            <div>
              <h3 className="font-label text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-4">1. Eligibility for Returns</h3>
              <ul className="list-disc pl-5 space-y-2 text-stone-600 font-light">
                <li><strong>Manufacturing Defects:</strong> Structural issues that affect safety or functionality.</li>
                <li><strong>Transit Damage:</strong> If the product arrives broken, cracked, or severely dented.</li>
                <li><strong>Incorrect Item:</strong> If you received a product different from your order.</li>
              </ul>
            </div>

            <div className="bg-stone-50 p-8 rounded-2xl">
              <h3 className="font-label text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-4">2. Return Requirements</h3>
              <p className="text-stone-600 font-light mb-4">
                The product must be unused. Once a utensil has been seasoned, heated, or used for cooking, it cannot be returned for hygiene reasons.
              </p>
              <p className="text-stone-600 font-light">
                An unboxing video or clear photographs of the defect/damage are mandatory for processing your claim.
              </p>
            </div>

            <div>
              <h3 className="font-label text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-4">3. What is NOT Covered</h3>
              <ul className="list-disc pl-5 space-y-2 text-stone-600 font-light">
                <li>Natural variations in material (e.g., surface roughness in cast iron).</li>
                <li>Damage due to misuse, overheating, or dropping.</li>
                <li>Change of mind or preference.</li>
                <li>Normal wear and tear.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-surface-container p-12 rounded-[2.5rem] border border-stone-100">
          <h2 className="font-headline text-3xl italic mb-8">The Return Process</h2>
          <div className="space-y-6 text-stone-600 font-light">
            <p>1. Email us at <a href="mailto:support@liorastore.in" className="text-primary font-bold">support@liorastore.in</a> or WhatsApp <a href="https://wa.me/919966334330" className="text-primary font-bold">+91 99663 34330</a> with your Order ID and evidence.</p>
            <p>2. Our team will review your request within 24–48 hours.</p>
            <p>3. If approved, we will arrange a reverse pickup or instruct on next steps.</p>
            <p>4. Upon inspection, we will ship a replacement or process a refund.</p>
            <p>5. The refund amount will be credited within 5-7 Days after refund issued.</p>
            <p>6. The replacement item will be delivered within 6 working days thereafter.</p>
          </div>
        </section>

        <section className="border-t border-stone-100 pt-16">
          <h2 className="font-headline text-3xl italic mb-8">Cancellation Policy</h2>
          <p className="text-stone-600 font-light leading-relaxed">
            Orders can be cancelled only before dispatch. Once shipped, cancellation requests cannot be accepted. To cancel an order, please contact us immediately after placing it.
          </p>
        </section>

        <section className="bg-primary/5 p-10 rounded-xl text-center">
          <p className="text-xs font-label uppercase tracking-widest text-stone-400">
            Refunds are processed to the original payment method within 7 business days after approval.
          </p>
        </section>
      </div>
    </main>
  );
}
