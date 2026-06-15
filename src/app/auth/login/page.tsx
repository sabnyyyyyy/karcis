"use client";

import React from "react";
import { User, Building2, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ScrollReveal, SpatialLayer } from "@/components/animations/SpatialSystem";

export default function AuthChoicePage() {
  return (
    <main className="min-h-screen bg-background text-on-surface flex flex-col font-inter spatial-root overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-32 max-w-[1440px] mx-auto w-full relative">
        <ScrollReveal>
           <div className="text-center mb-24 space-y-6 layer-mid">
             <h1 className="text-display-lg text-6xl font-black italic tracking-tighter text-primary leading-none uppercase">
               Enter The Archive.
             </h1>
             <p className="text-headline-lg text-2xl text-white/40 italic font-medium tracking-tight">
               Select your point of access to the cultural exchange society.
             </p>
           </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-12 w-full max-w-5xl relative z-10">
          {/* Buyer Choice */}
          <Link href="/auth/login/buyer" className="spatial-hover group">
             <div className="p-12 h-full bg-surface-container-low border border-white/5 hover:border-accent transition-all duration-700 shadow-xl relative overflow-hidden group card-premium">
                <div className="space-y-10 layer-mid relative z-10">
                   <div className="w-14 h-14 bg-accent text-background flex items-center justify-center group-hover:bg-primary transition-all duration-700 accent-glow shadow-lg layer-fg">
                      <User className="w-6 h-6" strokeWidth={2} />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl font-black italic uppercase tracking-tighter text-primary group-hover:text-accent transition-colors">Buyer.</h2>
                      <p className="text-xl text-white/40 italic font-medium leading-tight tracking-tight">
                         Access exclusive collections and secure your verified architectural presence.
                      </p>
                   </div>
                   <div className="flex items-center text-metadata font-black text-accent tracking-[0.4em] pt-6 layer-fg italic">
                      AUTHENTICATE IDENTITY <ChevronRight className="ml-4 w-4 h-4 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                   </div>
                </div>
                <div className="absolute -bottom-8 -right-8 text-8xl font-black text-white/5 italic select-none">01</div>
             </div>
          </Link>

          {/* Organizer Choice */}
          <Link href="/auth/login/organizer" className="spatial-hover group">
             <div className="p-12 h-full bg-surface-container-lowest border border-accent/10 hover:border-accent transition-all duration-700 shadow-xl relative overflow-hidden group card-premium">
                <div className="space-y-10 layer-mid relative z-10">
                   <div className="w-14 h-14 bg-accent text-background flex items-center justify-center group-hover:bg-primary transition-all duration-700 accent-glow shadow-lg layer-fg">
                      <Building2 className="w-6 h-6" strokeWidth={2} />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl font-black italic uppercase tracking-tighter text-primary group-hover:text-accent transition-colors">Curator.</h2>
                      <p className="text-xl text-white/40 italic font-medium leading-tight tracking-tight">
                         Empower your vision with architectural trust and on-chain transparency.
                      </p>
                   </div>
                   <div className="flex items-center text-metadata font-black text-accent tracking-[0.4em] pt-6 layer-fg italic">
                      ENTER CENTER <ChevronRight className="ml-4 w-4 h-4 group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                   </div>
                </div>
                <div className="absolute -bottom-8 -right-8 text-8xl font-black text-white/5 italic select-none">02</div>
             </div>
          </Link>
        </div>

        <ScrollReveal delay={0.2}>
           <div className="mt-20 text-center opacity-30 layer-base">
             <div className="flex items-center justify-center space-x-4">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <span className="text-metadata font-black tracking-[0.6em] uppercase">Verified Protocol Active</span>
             </div>
           </div>
        </ScrollReveal>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(214,180,255,0.02),transparent)] pointer-events-none" />
      </div>
    </main>
  );
}
