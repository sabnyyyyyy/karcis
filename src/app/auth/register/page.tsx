"use client";

import React from "react";
import { User, Building2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function RegisterChoicePage() {
  return (
    <main className="min-h-screen bg-background text-on-surface flex flex-col font-inter">
      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-32 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-7xl font-bodoni font-bold tracking-tight text-primary">
            Become part of the exchange.
          </h1>
          <p className="text-headline-md text-white/40 italic font-normal">
            Join the community of curators and collectors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Buyer Choice */}
          <Link href="/auth/register/buyer" className="group relative block overflow-hidden border border-white/10 bg-surface-container-low hover:border-accent transition-all duration-500">
            <div className="p-12 space-y-8">
              <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:border-accent group-hover:text-accent transition-colors">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bodoni font-bold text-primary group-hover:text-accent transition-colors uppercase italic">Become a Collector</h2>
                <p className="text-body-md text-white/40 leading-relaxed">
                  Secure access to exclusive events and verified secondary markets.
                </p>
              </div>
              <div className="flex items-center text-label-caps font-black text-accent tracking-widest pt-4">
                INITIATE IDENTITY <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Organizer Choice */}
          <Link href="/auth/register/organizer" className="group relative block overflow-hidden border border-white/10 bg-accent text-background hover:bg-white transition-all duration-500">
            <div className="p-12 space-y-8">
              <div className="w-12 h-12 bg-background/10 border border-background/20 flex items-center justify-center text-background">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bodoni font-bold text-background uppercase italic">Professional Curator</h2>
                <p className="text-background/60 leading-relaxed">
                  Empower your vision with architectural trust and on-chain transparency.
                </p>
              </div>
              <div className="flex items-center text-label-caps font-black text-background tracking-widest pt-4">
                JOIN AS PARTNER <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-label-caps text-white/20 font-bold tracking-[0.4em] uppercase">
            Experience Everything
          </p>
        </div>
      </div>
    </main>
  );
}
