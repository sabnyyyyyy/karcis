"use client";

import React from "react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { 
  ArrowRight,
  RefreshCcw,
  TrendingUp,
  History,
  Tag,
  Clock,
  ExternalLink
} from "lucide-react";

const activeListings = [
  { id: "L-102", event: "Art Jakarta 2026", category: "Art", originalPrice: "Rp 250.000", listingPrice: "Rp 350.000", status: "ACTIVE" }
];

const soldListings = [
  { id: "L-088", event: "Java Music Festival", category: "Music", originalPrice: "Rp 1.500.000", listingPrice: "Rp 1.800.000", status: "SOLD" }
];

export default function ResaleCenterPage() {
  return (
    <div className="space-y-16">
      <section className="border-b border-on-background/5 pb-6">
        <ScrollReveal>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] italic leading-none">Secondary Market</p>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-text-main">Resale Center</h1>
          </div>
        </ScrollReveal>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* ACTIVE LISTINGS */}
        <div className="space-y-8">
          <ScrollReveal>
            <div className="flex items-center gap-4 border-b border-on-background/5 pb-4">
              <RefreshCcw className="w-4 h-4 text-accent" />
              <h2 className="text-xl font-black italic tracking-tighter uppercase text-text-main">Active Transmissions</h2>
            </div>
          </ScrollReveal>

          <div className="space-y-6">
            {activeListings.length > 0 ? activeListings.map((listing) => (
              <div key={listing.id} className="p-8 bg-surface border border-on-background/5 rounded-[32px] group hover:border-accent/30 transition-all shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                   <div className="space-y-2">
                      <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[8px] font-black tracking-widest text-accent uppercase italic">{listing.category}</span>
                      <p className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-accent transition-colors leading-none text-text-main">{listing.event}</p>
                      <p className="text-[9px] text-text-muted/30 uppercase tracking-widest italic leading-none">Transmission ID: {listing.id}</p>
                   </div>
                   <span className="px-3 py-1 bg-accent-blue/10 text-accent-blue text-[8px] font-black uppercase tracking-widest border border-accent-blue/20 italic rounded-full shadow-lg">{listing.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-on-background/5">
                   <div>
                      <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest mb-2 italic leading-none">Archival Price</p>
                      <p className="text-base font-black text-text-muted/50 italic">{listing.originalPrice}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-accent/40 uppercase tracking-widest mb-2 italic leading-none">Market Value</p>
                      <p className="text-2xl font-black text-accent italic tracking-tighter">{listing.listingPrice}</p>
                   </div>
                </div>
                <div className="mt-8 flex gap-3">
                   <button className="flex-1 py-4 bg-accent text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent-vibrant transition-all italic shadow-xl">Update Listing</button>
                   <button className="px-6 py-4 bg-white/[0.03] border border-on-background/10 rounded-2xl text-text-muted/40 text-[10px] font-black uppercase tracking-widest hover:bg-accent-pink/10 hover:text-accent-pink transition-all italic">Remove</button>
                </div>
              </div>
            )) : (
              <div className="p-12 bg-white/[0.01] border border-on-background/5 rounded-[32px] text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/10 italic">No active transmissions detected</p>
              </div>
            )}
          </div>
        </div>

        {/* SOLD / OFFERS */}
        <div className="space-y-8">
          <ScrollReveal>
            <div className="flex items-center gap-4 border-b border-on-background/5 pb-4">
              <History className="w-4 h-4 text-text-muted/30" />
              <h2 className="text-xl font-black italic tracking-tighter uppercase text-text-muted/40">Historical Ledger</h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {soldListings.map((listing) => (
              <div key={listing.id} className="p-6 bg-surface-low border border-on-background/5 rounded-[32px] opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all shadow-xl">
                <div className="flex justify-between items-start mb-6">
                   <div className="space-y-1">
                      <p className="text-lg font-black italic uppercase tracking-tighter leading-none text-text-main">{listing.event}</p>
                      <p className="text-[8px] text-text-muted/20 uppercase tracking-widest italic leading-none">Sync ID: {listing.id}</p>
                   </div>
                   <span className="px-2 py-0.5 bg-white/[0.03] text-text-muted/30 text-[8px] font-black uppercase tracking-widest border border-on-background/10 italic rounded-full">{listing.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-on-background/5">
                   <div>
                      <p className="text-[8px] font-black text-text-muted/20 uppercase tracking-widest mb-1 italic">Acquired For</p>
                      <p className="text-sm font-black text-text-muted/30 italic">{listing.originalPrice}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-text-muted/20 uppercase tracking-widest mb-1 italic">Finalized At</p>
                      <p className="text-base font-black text-text-muted/40 italic">{listing.listingPrice}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-surface border border-on-background/5 rounded-[32px] space-y-6 shadow-2xl">
             <div className="flex items-center gap-4 text-accent">
               <TrendingUp className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest italic">Valuation Insight</span>
             </div>
             <p className="text-xs text-text-muted/40 leading-relaxed font-medium italic">
                Market activity for curated cultural assets is currently synchronized at peak efficiency. Real-time liquidity verified.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
