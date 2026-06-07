"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, MapPin, Mail, Phone } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, send to an API
    console.log("Contact Form Submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <main className="pt-32">
      {/* Hero Section */}
      <section className="px-12 max-w-[1440px] mx-auto mb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-7">
            <span className="font-label text-[0.75rem] uppercase tracking-[0.1em] text-on-surface-variant block mb-4">Connect With Us</span>
            <h1 className="font-headline text-6xl md:text-8xl tracking-tight leading-[0.9] text-primary">
              Dialogue <br/> <span className="italic opacity-60">Enriches</span> the Craft.
            </h1>
          </div>
          <div className="md:col-span-5 pb-4">
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Whether you seek guidance on our toxin-free materials or wish to discuss a bespoke editorial partnership, our studio is at your service.
            </p>
          </div>
        </div>
      </section>

      {/* Contact & Imagery Grid */}
      <section className="px-12 max-w-[1440px] mx-auto mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Form Column */}
          <div className="space-y-16">
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="relative border-b border-primary/20 focus-within:border-primary transition-colors">
                  <label className="block font-label text-[0.65rem] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Full Name</label>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-transparent border-0 px-0 py-3 text-on-background placeholder:text-outline-variant/50 focus:ring-0 outline-none" 
                    placeholder="Elias Thorne" 
                    type="text"
                  />
                </div>
                <div className="relative border-b border-primary/20 focus-within:border-primary transition-colors">
                  <label className="block font-label text-[0.65rem] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Email Address</label>
                  <input 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-transparent border-0 px-0 py-3 text-on-background placeholder:text-outline-variant/50 focus:ring-0 outline-none" 
                    placeholder="elias@studio.com" 
                    type="email"
                  />
                </div>
              </div>
              <div className="relative border-b border-primary/20 focus-within:border-primary transition-colors">
                <label className="block font-label text-[0.65rem] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Subject</label>
                <input 
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-transparent border-0 px-0 py-3 text-on-background placeholder:text-outline-variant/50 focus:ring-0 outline-none" 
                    placeholder="Inquiry regarding The Heirloom Collection" 
                    type="text"
                />
              </div>
              <div className="relative border-b border-primary/20 focus-within:border-primary transition-colors">
                <label className="block font-label text-[0.65rem] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">Message</label>
                <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-transparent border-0 px-0 py-3 text-on-background placeholder:text-outline-variant/50 focus:ring-0 outline-none resize-none" 
                    placeholder="How can we assist your culinary journey?" 
                    rows="4"
                ></textarea>
              </div>
              
              <div className="flex items-center gap-6">
                <button 
                    disabled={submitted}
                    className="group flex items-center justify-between w-full md:w-auto md:min-w-[240px] px-8 py-5 bg-primary text-on-primary rounded-xl hover:bg-primary-container transition-all duration-300 disabled:bg-emerald-800" 
                    type="submit"
                >
                  <span className="font-label text-[0.75rem] uppercase tracking-widest font-bold">{submitted ? "Message Sent" : "Send Inquiry"}</span>
                  {submitted ? <Check strokeWidth={1.5} className="w-5 h-5" /> : <ArrowRight strokeWidth={1.5} className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
                {submitted && <p className="text-primary font-headline italic animate-fade-in">Thank you. Our curators will respond shortly.</p>}
              </div>
            </form>

              <div className="flex items-start gap-6">
                <div className="mt-1 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <MapPin strokeWidth={1.5} className="w-5 h-5 text-[#3A4A2F]" />
                </div>
                <div>
                  <h4 className="font-headline italic text-2xl mb-2">Visit Us</h4>
                  <p className="text-on-surface-variant leading-relaxed opacity-80 text-sm">
                    LIORA, 2-108/KSR/207/NP, 1ST FLOOR, SHOP NO:2,<br/>
                    KSR LAYOUT, CHANDA NAGAR, Hyderabad,<br/>
                    Telangana 500133, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                 <div className="mt-1 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <Mail strokeWidth={1.5} className="w-5 h-5 text-[#3A4A2F]" />
                </div>
                <div>
                  <h4 className="font-headline italic text-2xl mb-2">Email Us</h4>
                  <p className="text-on-surface-variant leading-relaxed opacity-80 text-sm">
                    For general inquiries and support.<br/>
                    <span className="font-bold">support@liorastore.in</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="mt-1 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <Phone strokeWidth={1.5} className="w-5 h-5 text-[#3A4A2F]" />
                </div>
                <div>
                  <h4 className="font-headline italic text-2xl mb-2">Call Us</h4>
                  <p className="text-on-surface-variant leading-relaxed opacity-80 text-sm">
                    Mon-Sat from 10am to 7pm IST.<br/>
                    <span className="font-bold">+91 99663 34330</span>
                  </p>
                </div>
              </div>
          </div>

          {/* Visual Column */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low shadow-2xl">
              <img 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRuWNbaxvCx3aHwKIxWDc1kx8fm3mgQun29wWrRKjELbE5t8GlnUl1kzcUbdwMqv4n-HTfTVvGD0n1MR3ymwUV9VZ7YrU4bYPhGvmGX1Km5XwSFkq6_fGyhEkFXt5-iL1JzjSJ1E5s4Bz7-Gvqas2w-J2CcRMqee0snk0HU8ClPruZGfqhKzpTJL5zUaYalBnaAlIsUEWlp3poKeLeUiJ-aZmJeQz6VcSY-HSRnZ8RKqMFdAn2ScFy5O7IKPWcuSQkYsNNE4vGzUDK" 
                alt="Kitchen Interior"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 hidden lg:block bg-secondary-container p-10 rounded-xl max-w-xs shadow-xl">
              <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-tighter mb-4 inline-block">Heirloom Standard</span>
              <p className="font-headline text-lg leading-snug text-on-secondary-container italic">"Our cookware is designed to be passed down, not replaced. Every detail serves longevity."</p>
            </div>
            <div className="mt-20 aspect-square rounded-xl overflow-hidden bg-surface-container-low w-2/3 ml-auto shadow-xl">
              <img 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVu8qlhL1nI4pB3T-8mtHCel6FQWnAv0l0f3aXNwTVK3vy9o7HK4Nky7ExBVhTLWqZ5_q4CvyAp-_YjP6nSBpAf-BWvofqUrT4n4PYCiaOM5CqKizbLA51XlXgaQl2sMqxIl5vHGZTUhltI5mA7E1bi0fOgPZzZU75YMj411EN-mYIUtILrLt_jzDIVVPRzjiVI9QYXdZJTCL0ljLXpqyJyJbVrYCa3i0Kzgp4Dloe3egyg6RrZsGEU1hyx_qAK9gOnHCpKZRuO1zo" 
                alt="Artisan Tools"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-surface-container py-32 px-12">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h2 className="font-headline text-5xl tracking-tight text-[#3A4A2F]">Flagship Studio</h2>
            <p className="text-on-surface-variant max-w-sm">Visit our studio in Hyderabad to experience the craftsmanship of Liora firsthand. We're open Mon-Sat, 10am to 7pm.</p>
          </div>
          <div className="relative w-full h-[500px] rounded-xl overflow-hidden grayscale contrast-125 opacity-80 hover:opacity-100 transition-opacity duration-700 bg-stone-200">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center p-12 bg-surface-container rounded-xl">
                <MapPin strokeWidth={1.5} className="w-12 h-12 text-[#3A4A2F]/40 mb-4" />
                <h4 className="font-headline text-2xl mb-2">The Studio</h4>
                <p className="text-on-surface-variant max-w-[200px]">Shop No:2, 1st Floor, Chanda Nagar, Hyderabad 500133</p>
              </div>
              <img 
                className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-30" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNCS4k4Azf4ypI_2EVgxhdik5ebXLYFnz--HISuMHlI-s_vbAQBJGersNbHxezs2GFrPjo3_wJjLI-RBnLFp0kzbTFTlJAClOUlsA71paIeSbM7Xsip3xrRkXWAdZh-oXAdZh-oXPhVEvKlRbn6oH-xgTlvKzcg-n5Lj87c6rfBQbH6mW8viJN7Id6uuwknAGwwZ_cr2WrfuNN2Xl0Sj9N4fTd8wHYujvMfkA9OT4H-qse9MoAKNmLYdkFQtn7nPgjVJQDK6UjGhK-AzioUR2" 
                alt="Map Background"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
