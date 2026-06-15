"use client";

import React, { useState } from "react";
import { EditorialFooter } from "@/components/layout/Footer";
import { 
  Search as SearchIcon, 
  ShieldCheck as ShieldIcon, 
  TrendingUp as TrendingIcon,
  Clock as ClockIcon,
  Info as InfoIcon,
  ArrowRight as ArrowIcon,
  Shield as GuardIcon,
  Zap as ZapIcon,
  MapPin as MapIcon,
  Calendar as CalendarIcon
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TrustScore } from "@/components/ui/trust-score";
import { ScrollReveal } from "@/components/animations/SpatialSystem";

const resaleListings = [
  {
    id: "RS-101",
    name: "The Ritual: Jakarta Echoes",
    location: "GBK, Jakarta",
    date: "12 Aug 2026",
    originalPrice: "Rp 850.000",
    resalePrice: "Rp 935.000",
    sellerTrust: 99,
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    verified: true
  },
  {
    id: "RS-102",
    name: "Museum Macan: Midnight",
    location: "Museum Macan",
    date: "15 Aug 2026",
    originalPrice: "Rp 1.250.000",
    resalePrice: "Rp 1.300.000",
    sellerTrust: 95,
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
    verified: true
  },
  {
    id: "RS-103",
    name: "Wave of Tomorrow",
    location: "Sultan Hotel",
    date: "20 Aug 2026",
    originalPrice: "Rp 450.000",
    resalePrice: "Rp 495.000",
    sellerTrust: 92,
    image: "https://images.unsplash.com/photo-1514525253361-bee43833075d?auto=format&fit=crop&q=80&w=800",
    verified: true
  },
  {
    id: "RS-104",
    name: "LANY: a beautiful blur",
    location: "Beach City Stadium",
    date: "09 Oct 2026",
    originalPrice: "Rp 1.550.000",
    resalePrice: "Rp 1.705.000",
    sellerTrust: 97,
    image: "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=800",
    verified: true
  }
];

export default function ResalePage() {
  return (
    <main className="min-h-screen bg-background text-on-surface flex flex-col pt-0 font-inter">
      {/* 1. RESALE SEARCH */}
      <section className="pt-32 pb-12 px-8 md:px-20 border-b border-white/5 bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3 text-accent">
                  <ZapIcon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Verified P2P Exchange</span>
               </div>
               <h1 className="text-[48px] uppercase font-black tracking-tighter italic leading-none">Resale Market.</h1>
            </div>
            <div className="relative w-full md:w-96">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="text" 
                placeholder="SEARCH LISTINGS..." 
                className="w-full bg-white/5 border border-white/10 px-12 py-4 text-[10px] font-black uppercase tracking-widest focus:border-accent outline-none transition-all italic"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <div className="space-y-24 py-16 px-8 md:px-20">
        <ResaleSection title="Verified Listings" icon={<ShieldIcon className="w-5 h-5 text-accent" />} items={resaleListings} />
        <ResaleSection title="Trending Resale" icon={<TrendingIcon className="w-5 h-5 text-accent" />} items={resaleListings.slice(0, 2)} />
        <ResaleSection title="Recently Listed" icon={<ClockIcon className="w-5 h-5 text-accent" />} items={resaleListings.slice(2, 4)} />

        {/* SAFE TRADING INFORMATION */}
        <section className="max-w-[1440px] mx-auto py-16 border-t border-white/5">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-6 p-8 bg-surface-container-low border border-accent/10">
                 <GuardIcon className="w-10 h-10 text-accent stroke-[1px]" />
                 <h4 className="text-[24px] uppercase font-black tracking-tighter italic">Price Integrity.</h4>
                 <p className="text-sm text-white/40 leading-relaxed">All resales are capped at 110% of the original value to prevent scalping and ensure fair access.</p>
              </div>
              <div className="space-y-6 p-8 bg-surface-container-low border border-accent/10">
                 <ShieldIcon className="w-10 h-10 text-accent stroke-[1px]" />
                 <h4 className="text-[24px] uppercase font-black tracking-tighter italic">L3 Verification.</h4>
                 <p className="text-sm text-white/40 leading-relaxed">Every ticket is cryptographically verified before listing. Fraud is mathematically impossible.</p>
              </div>
              <div className="space-y-6 p-8 bg-surface-container-low border border-accent/10">
                 <InfoIcon className="w-10 h-10 text-accent stroke-[1px]" />
                 <h4 className="text-[24px] uppercase font-black tracking-tighter italic">Instant Sync.</h4>
                 <p className="text-sm text-white/40 leading-relaxed">Ownership transfer happens instantly on the ledger. Your new ticket is available immediately.</p>
              </div>
           </div>
        </section>
      </div>

      <EditorialFooter />
    </main>
  );
}

function ResaleSection({ title, items, icon }: { title: string, items: typeof resaleListings, icon?: React.ReactNode }) {
  return (
    <div className="max-w-[1440px] mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          {icon}
          <h2 className="text-[32px] uppercase font-black tracking-tighter italic leading-none">{title}</h2>
        </div>
        <Link href="#" className="text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group italic">
          Browse All <ArrowIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map((item) => (
          <ResaleCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ResaleCard({ item }: { item: typeof resaleListings[0] }) {
  return (
    <ScrollReveal>
      <div className="group cursor-pointer bg-surface-container-low border border-white/5 p-6 spatial-hover shadow-xl">
        <div className="relative aspect-[16/9] overflow-hidden mb-6 border border-white/5">
          <img 
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" 
            src={item.image} 
            alt={item.name}
          />
          {item.verified && (
            <div className="absolute top-3 left-3">
               <div className="bg-accent text-background px-3 py-1 flex items-center gap-2 shadow-xl">
                  <ShieldIcon className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest italic">L3 Verified</span>
               </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <h3 className="text-[22px] uppercase font-black tracking-tighter leading-tight italic truncate group-hover:text-accent transition-colors">
            {item.name}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
             <div className="space-y-1">
                <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">Original</span>
                <p className="text-sm text-white/60 font-black tracking-tight">{item.originalPrice}</p>
             </div>
             <div className="space-y-1 text-right">
                <span className="text-[9px] text-accent/40 font-black uppercase tracking-widest">Resale</span>
                <p className="text-xl text-accent font-black tracking-tighter italic">{item.resalePrice}</p>
             </div>
          </div>

          <div className="flex justify-between items-center pt-2">
             <div className="flex flex-col gap-1">
                <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">Seller Trust</span>
                <TrustScore score={item.sellerTrust} size="sm" showLevel={false} />
             </div>
             <button className="bg-white/5 hover:bg-accent hover:text-background border border-white/10 px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all italic">
                Acquire
             </button>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
