"use client";

import React from "react";
import { 
  Search, 
  Ticket, 
  QrCode, 
  ShieldCheck, 
  Lock,
  Zap,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { EditorialFooter } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const protocolSteps = [
  {
    id: 1,
    title: "Discovery Phase",
    desc: "Browse curated authentic experiences through our verified architectural platform.",
    icon: Search
  },
  {
    id: 2,
    title: "Selection Protocol",
    desc: "Choose your level of access. Every object is uniquely derived and protected.",
    icon: Ticket
  },
  {
    id: 3,
    title: "Settlement",
    desc: "Instant digital transaction via secure infrastructure. All financial data is encrypted.",
    icon: Lock
  },
  {
    id: 4,
    title: "Validation",
    desc: "Real-time ownership verification derived through proprietary cryptographic layers.",
    icon: ShieldCheck
  },
  {
    id: 5,
    title: "Possession",
    desc: "Your digital object is stored in your vault, permanently linked to your identity.",
    icon: QrCode
  },
  {
    id: 6,
    title: "Presence",
    desc: "Validate your access at the event using real-time dynamic authentication.",
    icon: Zap
  }
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background text-primary flex flex-col pt-0 font-inter">
      {/* Hero Section */}
      <section className="py-64 bg-primary text-black relative overflow-hidden border-b border-border-main">
        <div className="container-editorial text-center space-y-12">
          <div className="space-y-8">
            <span className="text-label opacity-40 tracking-[0.6em]">Protocol Specification</span>
            <h1 className="text-6xl md:text-[10vw] font-bodoni italic tracking-tighter uppercase leading-[0.8]">
              Architectural <br /> <span className="not-italic">Trust.</span>
            </h1>
          </div>
          <p className="font-bodoni text-3xl text-black/60 max-w-2xl mx-auto italic leading-tight">
            A premium ecosystem built for the global creative community, ensuring absolute authenticity for the cultural archive.
          </p>
        </div>
      </section>

      {/* Step by Step Protocol */}
      <section className="py-40 container-editorial">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-border-main">
          {protocolSteps.map((step) => (
            <div key={step.id} className="p-16 border-r border-b border-border-main group hover:bg-surface transition-all duration-700 relative overflow-hidden">
              <div className="space-y-12 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 border border-border-main flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-700">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <span className="text-6xl font-bodoni italic text-white/5 group-hover:text-accent/10 transition-colors">0{step.id}</span>
                </div>
                <div className="space-y-6">
                  <h3 className="text-label text-primary group-hover:italic transition-all">{step.title}.</h3>
                  <p className="font-bodoni text-lg italic text-text-muted leading-tight">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="py-64 bg-surface border-y border-border-main overflow-hidden">
        <div className="container-editorial grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-16">
            <div className="space-y-8">
              <span className="text-label text-accent">Editorial Manifest</span>
              <h2 className="text-5xl md:text-7xl font-bodoni italic tracking-tighter leading-[0.9] uppercase">
                The Standard <br />for Cultural <br />Ownership.
              </h2>
            </div>
            <p className="font-bodoni text-2xl text-text-muted italic leading-relaxed max-w-lg">
              We eliminate the divide between digital possession and physical presence. Our infrastructure ensures every object in the archive is absolute.
            </p>
            <Link href="/events" className="inline-flex items-center text-label text-primary border-b border-accent pb-4 hover:text-accent transition-all group italic">
              View Archive <ArrowRight className="ml-6 w-5 h-5 group-hover:translate-x-4 transition-transform" />
            </Link>
          </div>
          
          <div className="relative aspect-square bg-background border border-border-main p-12 flex flex-col justify-between">
             <div className="flex justify-between items-start">
                <div className="w-1.5 h-1.5 bg-accent" />
                <span className="text-label text-text-muted">SYSTEM REF: STX-V01</span>
             </div>
             <div className="text-center space-y-4">
                <h3 className="text-[12vw] font-bodoni italic text-white/5 leading-none">ARCHIVE</h3>
                <p className="text-label text-accent">TRUST INFRASTRUCTURE ACTIVE</p>
             </div>
             <div className="flex justify-between items-end">
                <span className="text-label text-text-muted">© 2026</span>
                <div className="w-1.5 h-1.5 bg-accent" />
             </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-40 container-editorial text-center space-y-16">
        <h2 className="text-5xl md:text-6xl font-bodoni italic uppercase tracking-tighter">Beyond the Protocol.</h2>
        <p className="font-bodoni text-2xl text-text-muted italic max-w-xl mx-auto">Our curators are available to discuss the architectural nuances of the SolTix ecosystem.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-8">
           <Link href="/help">
             <Button variant="outline" className="h-16 px-12 border border-border-main text-primary text-label italic hover:border-accent transition-all rounded-none">
               Concierge Access
             </Button>
           </Link>
           <Button className="h-16 px-12 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none">
             Partner Portal
           </Button>
        </div>
      </section>

      <EditorialFooter />
    </main>
  );
}
