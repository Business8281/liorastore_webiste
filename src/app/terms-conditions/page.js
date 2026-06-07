"use client";

export default function TermsConditions() {
  return (
    <main className="pt-32 pb-24 px-12 max-w-4xl mx-auto">
      <header className="mb-16 text-center">
        <span className="font-label text-[0.75rem] uppercase tracking-widest text-stone-500 mb-4 block">Effective Date: 01/01/2026</span>
        <h1 className="font-headline text-5xl italic text-primary">Terms & Conditions</h1>
      </header>

      <div className="prose prose-stone max-w-none space-y-12">
        <section>
          <p className="text-stone-600 leading-relaxed text-lg italic serif-italic opacity-80">
            Welcome to Liora Store. By accessing or using our website liorastore.in, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website.
          </p>
        </section>

        <section className="space-y-12">
          <div>
            <h2 className="font-headline text-2xl mb-4 italic">1. Introduction</h2>
            <p className="text-stone-600 font-light leading-relaxed">
              Welcome to Liora Store. By accessing or using our website liorastore.in, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">2. Eligibility</h2>
            <p className="text-stone-600 font-light leading-relaxed">
              By using this website, you confirm that you are at least 18 years old or accessing the site under the supervision of a parent or legal guardian.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">3. Products and Services</h2>
            <p className="text-stone-600 font-light leading-relaxed">
              We offer cookware and related kitchen products. All product descriptions, images, and pricing are subject to change without notice. We strive for accuracy but do not guarantee that all information is error-free.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">4. Pricing and Payments</h2>
            <ul className="list-disc pl-5 space-y-2 text-stone-600 font-light">
              <li>All prices are listed in INR (₹) and include applicable taxes unless stated otherwise.</li>
              <li>We reserve the right to modify prices at any time.</li>
              <li>Payments must be made through approved payment gateways available on the website.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">5. Order Acceptance and Cancellation</h2>
            <ul className="list-disc pl-5 space-y-2 text-stone-600 font-light">
              <li>We reserve the right to accept or reject any order.</li>
              <li>Orders may be canceled due to stock unavailability, pricing errors, or suspected fraud.</li>
              <li>Customers may cancel orders before shipment by contacting support.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">6. Shipping and Delivery</h2>
            <p className="text-stone-600 font-light leading-relaxed">
              We aim to deliver products within the estimated timeframe, but delays may occur due to unforeseen circumstances. Risk of loss and ownership passes to the customer upon delivery.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">7. Returns and Refunds</h2>
            <p className="text-stone-600 font-light leading-relaxed">
              Returns are accepted within 3 days of delivery, subject to product condition. Items must be unused and in original packaging. Refunds will be processed to the original payment method within 7 business days after approval.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">8. User Responsibilities</h2>
            <p className="text-stone-600 font-light leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 text-stone-600 font-light">
              <li>Use the website for unlawful purposes</li>
              <li>Attempt to hack, disrupt, or misuse the website</li>
              <li>Provide false or misleading information</li>
            </ul>
          </div>

          <div className="bg-surface-container p-10 rounded-3xl border border-stone-100">
            <h2 className="font-headline text-2xl mb-4 italic">9. Intellectual Property</h2>
            <p className="text-stone-600 font-light leading-relaxed">
              All content on this website, including logos, images, text, and design, is the property of Liora Store and is protected by applicable intellectual property laws. Unauthorized use is prohibited.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">10. Limitation of Liability</h2>
            <p className="text-stone-600 font-light leading-relaxed">
              We are not liable for indirect or incidental damages, loss of data or profits, or delays caused by external factors.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">11. Warranty Disclaimer</h2>
            <p className="text-stone-600 font-light leading-relaxed">
              All products are provided "as is" unless otherwise specified. We do not guarantee uninterrupted or error-free website operation.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl mb-4 italic">12. Governing Law</h2>
            <p className="text-stone-600 font-light leading-relaxed">
              These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana.
            </p>
          </div>

          <div className="bg-primary/5 p-12 rounded-[2.5rem] border border-primary/10">
            <h2 className="font-headline text-3xl italic mb-6">Contact Information</h2>
            <div className="space-y-4 text-stone-600 font-light">
              <p>Email: <a href="mailto:support@liorastore.in" className="text-primary font-bold">support@liorastore.in</a></p>
              <p>Phone/WhatsApp: <a href="https://wa.me/919966334330" className="text-primary font-bold">+91 99663 34330</a></p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
