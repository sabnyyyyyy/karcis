"use client";

import React from "react";
import { EditorialFooter } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { 
  ShieldCheck, 
  RefreshCcw, 
  Search, 
  UserCheck, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Lock,
  Verified,
  CreditCard,
  FileCheck,
  UserX,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const safetySections = [
  {
    title: "Buyer Protection",
    icon: ShieldCheck,
    description: "Every ritual access on SolTix is guaranteed. Our protection policy ensures you have a seamless experience from booking to entry.",
    details: [
      "100% refund for cancelled rituals",
      "Valid entry guarantee for every pass",
      "Secure digital archive delivery",
      "24/7 society support access"
    ]
  },
  {
    title: "Verified Resale",
    icon: RefreshCcw,
    description: "The only safe way to exchange society access. Our verified resale market eliminates fraud and predatory pricing.",
    details: [
      "Ethical price caps on all transfers",
      "Instant validity re-verification",
      "Automated ownership transfer",
      "Protection against double-listing"
    ]
  },
  {
    title: "Fraud Prevention",
    icon: Lock,
    description: "Keeping the society human. We use advanced systems to prevent automated booking bots and malicious activity.",
    details: [
      "Bot-free booking infrastructure",
      "Identity integrity checks",
      "Secure payment vaulting",
      "Real-time transaction monitoring"
    ]
  }
];

const authenticityPrinciples = [
  { title: "Dynamic QR Logic", icon: Zap, text: "Our entry archives use dynamic rotation to prevent screenshots and unauthorized duplication." },
  { title: "Member Sync", icon: UserCheck, text: "Access is tied to your society identity, ensuring only verified curators can enter." },
  { title: "Archival History", icon: FileCheck, text: "Every ticket has a complete, immutable chain of custody within the SolTix ledger." }
];

export default function ProtectionPage() {
  return (
    <main className="min-h-screen bg-background text-text-main font-inter transition-all duration-500 pt-16">
      
      {/* 1. SAFETY HERO */}
      <section className="py-24 px-6 md:px-12 bg-surface-low border-b border-on-background/5">
        <div className="max-w-4xl mx-auto text-center space-y-8">
           <ScrollReveal>
             <div className="space-y-4">
                <div className="flex justify-center">
                   <div className="p-4 bg-accent-teal/10 rounded-2xl text-accent-teal">
                      <ShieldCheck className="w-10 h-10" />
                   </div>
                </div>
                <h1 className="text-h1 lowercase italic">Safety Center.</h1>
                <p className="text-xl text-text-muted italic max-w-2xl mx-auto leading-relaxed">
                  The standard for trust, access, and authenticity in the creative collective. We protect the integrity of every cultural experience.
                </p>
             </div>
           </ScrollReveal>
        </div>
      </section>

      {/* 2. CORE PROTECTION LAYERS */}
      <section className="py-24 px-6 md:px-12 container mx-auto">
        <div className="space-y-12">
           <div className="border-b border-on-background/10 pb-6">
              <h2 className="text-2xl font-bold uppercase tracking-widest italic opacity-40">Protection Layers</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {safetySections.map((section, i) => (
                <ScrollReveal key={i} delay={i * 0.05}>
                  <div className="space-y-6 p-10 bg-surface border border-on-background/5 rounded-3xl hover:border-accent-teal transition-all h-full shadow-sm hover:shadow-xl group">
                     <div className="space-y-4">
                       <section.icon className="w-8 h-8 text-accent-teal transition-transform group-hover:scale-110" />
                       <h3 className="text-2xl font-bold italic tracking-tight">{section.title}</h3>
                       <p className="text-sm text-text-muted font-medium italic leading-relaxed">{section.description}</p>
                     </div>
                     <ul className="space-y-3 pt-6 border-t border-on-background/5">
                       {section.details.map((detail, j) => (
                         <li key={j} className="flex items-start gap-3 text-[11px] font-bold uppercase tracking-widest text-text-muted/60">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-teal mt-1.5 shrink-0" />
                            <span>{detail}</span>
                         </li>
                       ))}
                     </ul>
                  </div>
                </ScrollReveal>
              ))}
           </div>
        </div>
      </section>

      {/* 3. TICKET AUTHENTICITY */}
      <section className="py-24 px-6 md:px-12 bg-primary text-on-primary">
         <div className="max-w-[1440px] mx-auto space-y-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/10 pb-10">
               <div className="space-y-4">
                  <h2 className="text-[40px] font-black italic lowercase text-white leading-none">Archival Authenticity.</h2>
                  <p className="text-xl text-white/60 italic max-w-xl">How we ensure every ritual access remains secure and unique to its curator.</p>
               </div>
               <div className="flex items-center gap-2 text-accent-peach">
                  <Verified className="w-6 h-6" />
                  <span className="text-[12px] font-bold uppercase tracking-[0.2em] italic">Validated Ledger</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
               {authenticityPrinciples.map((p, i) => (
                 <div key={i} className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-xl w-fit">
                       <p.icon className="w-6 h-6 text-accent-peach" />
                    </div>
                    <h4 className="text-xl font-bold italic">{p.title}</h4>
                    <p className="text-sm text-white/50 leading-relaxed italic">{p.text}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* 4. REPORTING SECTION */}
      <section className="py-24 px-6 md:px-12 bg-surface-low border-b border-on-background/5">
         <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12 p-12 bg-background border border-on-background/10 rounded-[40px] shadow-sm">
            <div className="p-6 bg-accent-coral/10 rounded-full text-accent-coral">
               <UserX className="w-12 h-12" />
            </div>
            <div className="space-y-4 flex-1">
               <h2 className="text-2xl font-bold italic tracking-tight">Detect suspicious behavior?</h2>
               <p className="text-sm text-text-muted italic">Help us maintain the integrity of the society. Report scalping, bot activity, or fraudulent listings immediately.</p>
            </div>
            <button className="px-8 py-4 bg-primary text-on-primary font-bold uppercase tracking-widest rounded-full hover:bg-accent-coral transition-all italic text-xs whitespace-nowrap">Report Activity</button>
         </div>
      </section>

      {/* 5. FAQ */}
      <section className="py-32 px-6 md:px-12 container mx-auto max-w-3xl">
         <div className="space-y-12">
            <div className="text-center space-y-2">
               <h2 className="text-3xl font-black italic lowercase tracking-tight">Frequently Clarified.</h2>
            </div>
            <div className="space-y-3">
               {[
                 "How do I know my society archive is authentic?",
                 "What is the resale price cap policy?",
                 "How are refunds processed for cancelled events?",
                 "Is my society identity data private?",
                 "Can I transfer access to another member?"
               ].map((q, i) => (
                 <div key={i} className="group border border-on-background/10 rounded-2xl p-6 hover:border-accent-teal transition-all cursor-pointer bg-surface/20">
                    <div className="flex justify-between items-center">
                       <span className="text-base font-bold italic tracking-tight">{q}</span>
                       <ChevronDown className="w-4 h-4 text-text-muted transition-transform group-hover:rotate-180" />
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      <EditorialFooter />
    </main>
  );
}
