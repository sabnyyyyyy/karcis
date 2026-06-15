"use client";

import React from "react";
import { 
  Search, 
  ShoppingBag, 
  Undo2, 
  ArrowLeftRight, 
  CreditCard, 
  User,
  MessageCircle,
  Mail,
  Phone,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorialFooter } from "@/components/layout/Footer";

const helpCategories = [
  { icon: ShoppingBag, title: "Membeli Tiket", count: 12 },
  { icon: Undo2, title: "Keamanan & Status", count: 8 },
  { icon: ArrowLeftRight, title: "Transfer Tiket", count: 5 },
  { icon: CreditCard, title: "Pembayaran & QRIS", count: 10 },
  { icon: User, title: "Akun & Keamanan", count: 15 },
];

const popularArticles = [
  "Bagaimana cara verifikasi identitas saya?",
  "Berapa lama proses verifikasi otomatis?",
  "Cara menjual kembali tiket (Official Resale)",
  "Mengapa status tiket saya 'Validation'?",
  "Cara transfer kepemilikan tiket digital",
];

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col pt-0 font-inter">
      {/* Hero Search */}
      <section className="py-64 bg-primary text-black relative overflow-hidden border-b border-border-main">
        <div className="container-editorial max-w-5xl mx-auto relative z-10 text-center">
          <div className="space-y-8 mb-16">
            <span className="text-label opacity-60">Archive & Support</span>
            <h1 className="text-6xl md:text-8xl font-bodoni italic tracking-tighter uppercase leading-none">
              How can we<br />Assist you?
            </h1>
          </div>
          <div className="relative max-w-3xl mx-auto group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 opacity-30 group-focus-within:opacity-100 transition-opacity" />
            <input 
              placeholder="SEARCH THE ARCHIVE..." 
              className="w-full h-24 pl-20 pr-12 text-2xl bg-white/40 border border-black/10 font-bodoni italic tracking-tight focus:ring-0 focus:bg-white transition-all outline-none placeholder:text-black/20"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 container-editorial">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-0 border-t border-l border-border-main">
          {helpCategories.map((cat, i) => (
            <button key={i} className="p-12 border-r border-b border-border-main hover:bg-surface transition-all text-center group">
              <div className="w-20 h-20 border border-border-main flex items-center justify-center mx-auto mb-8 group-hover:bg-accent group-hover:text-black transition-all duration-700">
                <cat.icon className="w-8 h-8 transition-colors" />
              </div>
              <h3 className="text-label text-xs mb-4">{cat.title}</h3>
              <p className="text-[10px] text-text-muted font-inter tracking-[0.2em] uppercase">{cat.count} Manuscripts</p>
            </button>
          ))}
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-40 container-editorial">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
          {/* Popular Articles */}
          <div className="lg:col-span-8 space-y-16">
            <div className="space-y-4 border-b border-border-main pb-8">
              <span className="text-label text-accent">Knowledge Base</span>
              <h2 className="text-4xl font-bodoni italic tracking-tight uppercase">Popular Enquiries.</h2>
            </div>
            <div className="divide-y divide-border-main border-b border-border-main">
              {popularArticles.map((article, i) => (
                <button key={i} className="w-full flex items-center justify-between py-12 hover:translate-x-4 transition-all duration-700 text-left group">
                  <span className="text-2xl font-bodoni italic tracking-tight text-primary group-hover:text-accent transition-colors">{article}</span>
                  <div className="w-12 h-12 border border-border-main flex items-center justify-center group-hover:border-accent">
                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent" />
                  </div>
                </button>
              ))}
            </div>
            <button className="text-label text-accent border-b border-accent pb-2 hover:opacity-60 transition-opacity italic">
              Explore All Manuscripts
            </button>
          </div>

          {/* Contact Support */}
          <div className="lg:col-span-4">
            <div className="border border-border-main p-12 bg-surface space-y-12">
              <div className="space-y-4">
                <span className="text-label opacity-40">Direct Lines</span>
                <h3 className="text-3xl font-bodoni italic tracking-tight uppercase">Concierge.</h3>
              </div>
              <div className="space-y-10">
                {[
                  { icon: MessageCircle, label: "Live Protocol", meta: "2m Response", color: "text-accent" },
                  { icon: Mail, label: "Digital Mail", meta: "24h Response", color: "text-primary" },
                  { icon: Phone, label: "Neural Line", meta: "24/7 Access", color: "text-accent" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-6 group cursor-pointer">
                    <div className={cn("w-12 h-12 border border-border-main flex items-center justify-center transition-all duration-700 group-hover:bg-primary group-hover:text-black", item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-label text-xs tracking-widest">{item.label}</p>
                      <p className="text-[10px] text-text-muted font-inter uppercase tracking-[0.2em]">{item.meta}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
              <div className="pt-12 border-t border-border-main">
                <p className="text-label text-[10px] opacity-20 mb-8 uppercase tracking-[0.5em]">Digital Presence</p>
                <div className="flex flex-wrap gap-8">
                  {["X", "Instagram", "LinkedIn"].map((s) => (
                    <span key={s} className="text-label text-[10px] hover:text-accent cursor-pointer transition-colors">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EditorialFooter />
    </main>
  );
}
