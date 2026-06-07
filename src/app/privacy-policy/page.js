"use client";

export default function PrivacyPolicy() {
  return (
    <main className="pt-32 pb-24 px-12 max-w-4xl mx-auto">
      <header className="mb-16 text-center">
        <span className="font-label text-[0.75rem] uppercase tracking-widest text-stone-500 mb-4 block">Last Updated: Jan 2026</span>
        <h1 className="font-headline text-5xl italic text-primary">Privacy Policy</h1>
      </header>

      <div className="prose prose-stone max-w-none space-y-12">
        <section className="bg-surface-container p-12 rounded-[2.5rem] border border-stone-100 text-center">
          <p className="text-stone-600 leading-relaxed text-2xl italic serif-italic mb-12">
            Your privacy matters to us.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-50">
              <h3 className="font-label text-xs uppercase tracking-widest text-[#3A4A2F] mb-4">Data Collection</h3>
              <p className="text-stone-500 font-light leading-relaxed">
                We collect only essential information required to process your orders and ensure a seamless acquisition experience.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-50">
              <h3 className="font-label text-xs uppercase tracking-widest text-[#3A4A2F] mb-4">Data Safety</h3>
              <p className="text-stone-500 font-light leading-relaxed">
                Personal data is never sold or shared with third parties, except for essential logistics and fulfillment partners.
              </p>
            </div>
            <div className="md:col-span-2 p-6 bg-white rounded-2xl shadow-sm border border-stone-50">
              <h3 className="font-label text-xs uppercase tracking-widest text-[#3A4A2F] mb-4">Secure Processing</h3>
              <p className="text-stone-500 font-light leading-relaxed">
                Payment information is processed through secure, trusted gateways to maintain the highest level of financial integrity.
              </p>
            </div>
          </div>
        </section>

        <section className="text-center pt-12">
          <p className="text-[#3A4A2F] font-headline text-xl italic opacity-60">
            By using our website, you consent to our privacy practices.
          </p>
        </section>
      </div>
    </main>
  );
}
