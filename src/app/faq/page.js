"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const faqData = [
  {
    category: "ORDERS & SHIPPING",
    questions: [
      {
        q: "Do you ship across India?",
        a: "Yes, we currently ship to most locations across India."
      },
      {
        q: "How long does delivery take?",
        a: "Orders are usually delivered within 3–7 business days, depending on your location."
      },
      {
        q: "How can I track my order?",
        a: "Once your order is shipped, tracking details will be shared via email or SMS."
      },
      {
        q: "Can I cancel my order?",
        a: "Orders can be cancelled only before dispatch. Once shipped, cancellations are not possible."
      }
    ]
  },
  {
    category: "RETURNS & SUPPORT",
    questions: [
      {
        q: "What is your return policy?",
        a: "Returns are accepted only in case of manufacturing defects or transit damage, reported within 48 hours of delivery."
      },
      {
        q: "How do I request a replacement or refund?",
        a: "Please contact our customer support with order details and images/videos of the issue. Our team will guide you through the process."
      },
      {
        q: "What is not covered under returns?",
        a: "Normal wear and tear, misuse, and seasoning-related variations in cast iron cookware are not covered."
      }
    ]
  },
  {
    category: "WARRANTY & TRUST",
    questions: [
      {
        q: "Do Liora products come with a warranty?",
        a: "Warranty details, if applicable, are mentioned on individual product pages."
      },
      {
        q: "Are your products safe for health-conscious families?",
        a: "Yes. Our cookware is ideal for households looking to avoid toxic coatings and plastic contact during cooking."
      },
      {
        q: "How can I contact Liora?",
        a: "You can reach us via the Contact Us page or email mentioned on our website or text us in WhatsApp. Our team is happy to help."
      }
    ]
  },
  {
    category: "GENERAL",
    questions: [
      {
        q: "What is Liora?",
        a: "Liora is a home and kitchen brand focused on creating safe, durable, and toxin-free cookware and essentials designed for everyday Indian cooking."
      },
      {
        q: "What makes Liora cookware different?",
        a: "Our products are made using honest materials like stainless steel and cast iron—without harmful chemical coatings or unnecessary plastics—so you can cook with confidence."
      },
      {
        q: "Are Liora products toxin-free?",
        a: "Yes. Our cookware is designed to be free from harmful chemical coatings such as PTFE, PFOA, and other toxic non-stick substances."
      },
      {
        q: "Are your products safe for daily use?",
        a: "Absolutely. Liora products are crafted for regular, long-term use and are suitable for everyday Indian cooking styles."
      },
      {
        q: "Where are Liora products made?",
        a: "Our products are manufactured by trusted partners and suppliers, with a focus on quality, safety, and durability. Specific country of origin is mentioned on individual product pages."
      }
    ]
  },
  {
    category: "COOKWARE & USAGE",
    questions: [
      {
        q: "Do Liora products have non-stick coating?",
        a: "No. We do not use chemical non-stick coatings. Our cookware relies on material quality and proper usage for natural cooking performance."
      },
      {
        q: "Does food stick to stainless steel or cast iron cookware?",
        a: "When used correctly—proper preheating, oiling, and cooking technique—food does not stick significantly. Minor sticking is normal and part of natural cookware use."
      },
      {
        q: "Is Liora cookware suitable for Indian cooking?",
        a: "Yes. Our cookware is designed keeping Indian cooking methods in mind, including sautéing, frying, boiling, simmering, and tempering (tadka)."
      },
      {
        q: "Can Liora cookware be used on all cooktops?",
        a: "Most of our cookware is compatible with gas stoves and induction cooktops. Compatibility details are provided on individual product pages."
      },
      {
        q: "Is seasoning required for your cookware?",
        a: "Cast iron cookware requires seasoning before first use and regular maintenance. Stainless steel cookware does not require seasoning."
      }
    ]
  },
  {
    category: "CARE & MAINTENANCE",
    questions: [
      {
        q: "How do I clean Liora cookware?",
        a: "Wash with warm water and mild dish soap. Avoid harsh scrubbers or chemicals. Cleaning instructions are provided with every product."
      },
      {
        q: "Can I use a dishwasher?",
        a: "We recommend hand-washing for longer life and better performance, especially for cast iron products."
      },
      {
        q: "Will cast iron rust?",
        a: "Cast iron may rust if left wet or unseasoned. Proper drying and oiling after use will prevent rusting."
      },
      {
        q: "Is discoloration normal?",
        a: "Yes. Heat marks or color changes are natural with stainless steel and cast iron and do not affect performance or safety."
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="pt-32 pb-24 px-6 max-w-[1000px] mx-auto min-h-screen">
      <header className="text-center mb-20">
        <h1 className="font-headline text-5xl md:text-6xl text-primary mb-6 italic tracking-tight">Frequently Asked Questions</h1>
        <p className="text-stone-500 font-light text-lg max-w-2xl mx-auto leading-relaxed">
          Everything you need to know about our artifacts, craftsmanship, and your journey with Liora.
        </p>
      </header>

      <div className="space-y-16">
        {faqData.map((category, catIdx) => (
          <section key={catIdx}>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400 mb-8 border-b border-stone-100 pb-4">
              {category.category}
            </h2>
            <div className="space-y-4">
              {category.questions.map((faq, qIdx) => {
                const globalIdx = `${catIdx}-${qIdx}`;
                const isOpen = openIndex === globalIdx;

                return (
                  <div 
                    key={qIdx} 
                    className={`border border-stone-100 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "bg-stone-50/50 shadow-sm" : "hover:bg-stone-50/30"}`}
                  >
                    <button
                      onClick={() => toggleAccordion(globalIdx)}
                      className="w-full flex justify-between items-center p-6 text-left"
                    >
                      <span className="font-bold text-sm md:text-base text-primary tracking-tight pr-8">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUpIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-stone-600 leading-relaxed font-light text-lg md:text-xl italic serif-italic">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-32 p-12 bg-surface-container rounded-[2.5rem] text-center border border-stone-100">
        <h3 className="font-headline text-3xl mb-4 italic">Still Have Questions?</h3>
        <p className="text-stone-500 mb-10 font-light">
          Our team of curators is ready to assist you in selecting the perfect artifacts for your home.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a href="/contact" className="bg-primary text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all active:translate-y-0">
            Visit Help Center
          </a>
          <a href="https://wa.me/yourwhatsapplink" target="_blank" rel="noopener noreferrer" className="bg-white text-primary border border-stone-200 px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:translate-y-0">
            Text us on WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
