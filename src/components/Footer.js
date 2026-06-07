import Link from "next/link";
import { Mail, Phone } from "lucide-react";

const Facebook = ({ className, strokeWidth }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const Instagram = ({ className, strokeWidth }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-stone-100 dark:bg-stone-950 w-full pt-20 pb-10">
      <div className="max-w-[1440px] mx-auto px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <Link href="/" className="block mb-8">
            <img src="/logo200BR.png" alt="Liora Logo" className="h-10 w-auto object-contain" />
          </Link>
          <p className="text-xs uppercase tracking-[0.1em] text-stone-500 max-w-[200px] leading-loose">
            Home & Kitchen Essentials for the modern home.
          </p>
        </div>

        <div>
          <h6 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 font-label">Shop</h6>
          <ul className="space-y-4">
            <li><Link className="text-xs uppercase tracking-[0.1em] text-stone-500 hover:text-[#3A4A2F] transition-colors font-label font-bold" href="/shop">Shop All</Link></li>
            <li><Link className="text-xs uppercase tracking-[0.1em] text-stone-500 hover:text-[#3A4A2F] transition-colors font-label font-bold" href="/our-story">About Us</Link></li>
            <li><Link className="text-xs uppercase tracking-[0.1em] text-stone-500 hover:text-[#3A4A2F] transition-colors font-label font-bold" href="/faq">FAQ</Link></li>
            <li><Link className="text-xs uppercase tracking-[0.1em] text-stone-500 hover:text-[#3A4A2F] transition-colors font-label font-bold" href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h6 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 font-label">Legal & Policies</h6>
          <ul className="space-y-4">
            <li><Link className="text-xs uppercase tracking-[0.1em] text-stone-500 hover:text-[#3A4A2F] transition-colors font-label font-bold" href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link className="text-xs uppercase tracking-[0.1em] text-stone-500 hover:text-[#3A4A2F] transition-colors font-label font-bold" href="/shipping-policy">Shipping Policy</Link></li>
            <li><Link className="text-xs uppercase tracking-[0.1em] text-stone-500 hover:text-[#3A4A2F] transition-colors font-label font-bold" href="/terms-conditions">Terms of Service</Link></li>
            <li><Link className="text-xs uppercase tracking-[0.1em] text-stone-500 hover:text-[#3A4A2F] transition-colors font-label font-bold" href="/return-refund-policy">Returns & Refunds</Link></li>
          </ul>
        </div>
        <div>
          <h6 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 font-label">Get in Touch</h6>
          <ul className="space-y-4">
            <li>
              <a 
                href="https://wa.me/919966334330" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-stone-500 hover:text-[#25D366] transition-colors"
              >
                <img src="/walogo1.png" alt="WhatsApp" className="w-5 h-5 ml-0.5 object-contain" />
                <span className="text-xs uppercase tracking-[0.1em] font-bold font-label ml-0.5">+91 99663 34330</span>
              </a>
            </li>
            <li>
              <a 
                href="tel:+919966334330" 
                className="flex items-center gap-3 text-stone-500 hover:text-[#3A4A2F] transition-colors"
              >
                <Phone strokeWidth={1.5} className="w-5 h-5 ml-0.5" />
                <span className="text-xs uppercase tracking-[0.1em] font-bold font-label ml-0.5">+91 99663 34330</span>
              </a>
            </li>
            <li>
              <a 
                href="mailto:support@liorastore.in" 
                className="flex items-center gap-3 text-stone-500 hover:text-[#3A4A2F] transition-colors"
              >
                <Mail strokeWidth={1.5} className="w-5 h-5 ml-0.5" />
                <span className="text-xs uppercase tracking-[0.1em] font-bold font-label ml-0.5 lowercase">support@liorastore.in</span>
              </a>
            </li>
            <li>
              <a 
                href="https://www.instagram.com/lioraindiastore/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-stone-500 hover:text-[#E1306C] transition-colors"
              >
                <Instagram strokeWidth={1.5} className="w-5 h-5 ml-0.5" />
                <span className="text-xs uppercase tracking-[0.1em] font-bold font-label ml-0.5">Instagram</span>
              </a>
            </li>
            <li>
              <a 
                href="https://www.facebook.com/profile.php?id=61578169763009" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-stone-500 hover:text-[#1877F2] transition-colors"
              >
                <Facebook strokeWidth={1.5} className="w-5 h-5 ml-0.5" />
                <span className="text-xs uppercase tracking-[0.1em] font-bold font-label ml-0.5">Facebook</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-12 mt-20 pt-10 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs uppercase tracking-[0.1em] text-stone-400 font-label">© 2026 LIORA. Home & Kitchen Essentials.</p>
        <p className="text-xs uppercase tracking-[0.1em] text-stone-400 font-label">
          Developed by{' '}
          <a 
            href="https://xrmarketing.in" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-[#3A4A2F] transition-colors font-bold"
          >
            XRMarketing
          </a>
        </p>
      </div>

    </footer>
  );
}
