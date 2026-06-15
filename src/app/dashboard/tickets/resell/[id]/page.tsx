"use client";

import React, { useState } from "react";
import { 
  ChevronLeft, 
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Ticket, 
  TrendingUp,
  Info,
  ArrowRight,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TrustScore } from "@/components/ui/trust-score";

const steps = ["Ticket Details", "Resale Config", "Review & Publish"];

export default function ResellTicketPage({ params }: { params: { id: string } }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [resalePrice, setResalePrice] = useState<number>(0);
  
  // Mock Ticket Data
  const ticket = {
    id: params.id || "TK-99021",
    eventTitle: "Java Music Festival 2026",
    type: "Presale 1 - 3 Day Pass",
    originalPrice: 1850000,
    maxResalePrice: 2035000, // +10%
    ownershipStatus: "Verified",
    organizerTrust: 98,
  };

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const isPriceValid = resalePrice > 0 && resalePrice <= ticket.maxResalePrice;

  return (
    <main className="min-h-screen bg-background flex flex-col pt-20">
      <div className="container-editorial py-12 max-w-5xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-16 border-b border-border-main pb-12">
          <Link href="/dashboard/tickets" className="text-label text-accent mb-6 flex items-center hover:opacity-60 transition-opacity">
            <ChevronLeft className="w-3 h-3 mr-2" /> Back to Collection
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <span className="text-label opacity-40">Resale Entry</span>
              <h1 className="text-5xl md:text-6xl font-bodoni italic tracking-tighter uppercase leading-none">Resale Listing</h1>
            </div>
            <p className="text-text-muted font-inter text-sm max-w-xs tracking-wide">Initiating the architectural transfer of verified digital assets.</p>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-24 relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border-main -z-10" />
          {steps.map((label, i) => (
            <div key={i} className="flex flex-col items-center bg-background px-4 first:pl-0 last:pr-0">
              <div className={cn(
                "w-12 h-12 border flex items-center justify-center text-label transition-all duration-700",
                currentStep === i ? "border-accent bg-accent text-on-primary scale-110" : 
                currentStep > i ? "border-primary bg-primary text-on-primary" : "border-border-main text-text-muted"
              )}>
                {currentStep > i ? <CheckCircle2 className="w-5 h-5" /> : `0${i + 1}`}
              </div>
              <span className={cn(
                "text-label text-[9px] mt-4",
                currentStep === i ? "text-accent" : "text-text-muted opacity-40"
              )}>{label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Ticket Details */}
          {currentStep === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
              <div className="space-y-4">
                <span className="text-label text-accent">Phase 01</span>
                <h2 className="text-3xl font-bodoni italic uppercase tracking-tight">Asset Verification</h2>
              </div>

              <div className="border border-border-main p-12 bg-white/5 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <span className="text-label opacity-40">Event Title</span>
                      <p className="text-2xl font-bodoni text-primary italic lowercase tracking-tight">{ticket.eventTitle}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-label opacity-40">Ticket Classification</span>
                      <p className="text-xl font-inter tracking-wide">{ticket.type}</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <span className="text-label opacity-40">Acquisition Price</span>
                      <p className="text-2xl font-inter font-light tracking-tighter">IDR {ticket.originalPrice.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-label opacity-40">Authenticity Status</span>
                      <div className="flex items-center space-x-2 text-accent">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-label">{ticket.ownershipStatus} Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-12 border-t border-border-main flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center space-x-6">
                    <span className="text-label opacity-40">Organizer Integrity</span>
                    <TrustScore score={ticket.organizerTrust} size="sm" />
                  </div>
                  <div className="px-6 py-2 border border-accent text-accent text-label">
                    Architectural Standard Asset
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <button onClick={handleNext} className="h-16 px-16 bg-primary text-on-primary text-label hover:bg-accent transition-all duration-500 border-none outline-none cursor-pointer">
                  Proceed to Configuration
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Resale Configuration */}
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
              <div className="space-y-4">
                <span className="text-label text-accent">Phase 02</span>
                <h2 className="text-3xl font-bodoni italic uppercase tracking-tight">Economic Parameters</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="p-12 border border-border-main bg-white/5 space-y-10">
                  <div className="space-y-6">
                    <label className="text-label opacity-40 block">Proposed Market Price (IDR)</label>
                    <div className="relative border-b border-border-main pb-4">
                      <span className="absolute left-0 top-0 text-label opacity-30">IDR</span>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={resalePrice || ""}
                        onChange={(e) => setResalePrice(Number(e.target.value))}
                        className="w-full pl-12 bg-transparent border-none font-inter text-4xl tracking-tighter focus:ring-0 placeholder:opacity-10 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-label text-[9px] opacity-40">Anti-Scalping Boundary (+10%)</span>
                      <span className="text-inter text-sm">IDR {ticket.maxResalePrice.toLocaleString()}</span>
                    </div>
                    <div className="h-[2px] w-full bg-border-main overflow-hidden">
                      <motion.div 
                        className={cn("h-full transition-all duration-700", resalePrice > ticket.maxResalePrice ? "bg-red-500" : "bg-accent")}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((resalePrice / ticket.maxResalePrice) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {resalePrice > ticket.maxResalePrice && (
                    <div className="p-6 border border-red-500/20 bg-red-500/5 text-red-500 flex items-start space-x-4">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-label text-[10px] leading-relaxed">
                        Price exceeds structural limit. Listings are capped at +10% to maintain ecosystem health and archival value.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-12 bg-primary text-on-primary space-y-8 relative overflow-hidden">
                   <TrendingUp className="absolute -bottom-8 -right-8 w-48 h-48 opacity-5 grayscale" />
                   <div className="relative z-10 space-y-8">
                     <h3 className="text-label border-b border-on-primary/10 pb-4">Regulatory Standards</h3>
                    <ul className="space-y-6">
                      {[
                        "Mandatory ownership verification",
                        "Price ceiling protocol active",
                        "Single asset listing policy",
                        "Integrity score monitoring"
                      ].map((rule, i) => (
                        <li key={i} className="flex items-center space-x-4 text-label text-[10px]">
                          <div className="w-1.5 h-1.5 bg-on-primary" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button onClick={handleBack} className="h-16 px-12 border border-border-main text-label hover:bg-white/5 transition-all bg-transparent text-white cursor-pointer">
                  Back
                </button>
                <button 
                  disabled={!isPriceValid} 
                  onClick={handleNext} 
                  className={cn(
                    "h-16 px-16 text-label transition-all duration-500 border-none outline-none cursor-pointer",
                    isPriceValid ? "bg-primary text-on-primary hover:bg-accent" : "bg-border-main text-text-muted cursor-not-allowed"
                  )}
                >
                  Verify Configuration
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review & Publish */}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
              <div className="space-y-4">
                <span className="text-label text-accent">Phase 03</span>
                <h2 className="text-3xl font-bodoni italic uppercase tracking-tight">Final Curation</h2>
              </div>

              <div className="border border-border-main p-12 bg-white/5 space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-10">
                    <h3 className="text-label border-b border-border-main pb-4 flex items-center">
                      <Ticket className="w-3 h-3 mr-3 text-accent" /> Asset Summary
                    </h3>
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <span className="text-label text-[9px] opacity-40">Event Title</span>
                        <p className="font-bodoni text-2xl italic lowercase text-primary">{ticket.eventTitle}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-label text-[9px] opacity-40">Classification</span>
                        <p className="font-inter text-lg tracking-wide">{ticket.type}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <h3 className="text-label border-b border-border-main pb-4 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-3 text-accent" /> Economic Summary
                    </h3>
                    <div className="space-y-8">
                      <div className="flex justify-between items-center border-b border-border-main/50 pb-4">
                        <span className="text-label text-[9px] opacity-40">Initial Price</span>
                        <span className="font-inter opacity-60">IDR {ticket.originalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center bg-accent/5 p-6 border border-accent/20">
                        <span className="text-label text-accent">Market Price</span>
                        <span className="font-inter text-2xl tracking-tighter">IDR {resalePrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-12 border-t border-border-main grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="flex items-start space-x-6">
                    <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                    <div className="space-y-2">
                      <p className="text-label text-[10px] text-accent">Security Protocol</p>
                      <p className="text-sm font-inter text-text-muted leading-relaxed tracking-wide">On-chain ownership dervied and validated for architectural transfer.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-6">
                    <Zap className="w-5 h-5 text-primary shrink-0" />
                    <div className="space-y-2">
                      <p className="text-label text-[10px] text-primary">Ecosystem Compliance</p>
                      <p className="text-sm font-inter text-text-muted leading-relaxed tracking-wide">Listing adheres to the SolTix anti-scalping infrastructure standards.</p>
                    </div>
                  </div>
                </div>

                <button className="w-full h-24 bg-primary text-on-primary text-label text-lg hover:bg-accent transition-all duration-700 flex items-center justify-center group uppercase border-none outline-none cursor-pointer">
                  Publish to Archive <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-4 transition-transform duration-700" />
                </button>
              </div>

              <div className="flex justify-center">
                <button onClick={handleBack} className="text-label text-[9px] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-[0.6em] bg-transparent text-white border-none outline-none cursor-pointer">
                  Back to Parameters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Footer */}
        <div className="mt-24 py-12 border-t border-border-main flex flex-col items-center space-y-6">
          <Info className="w-5 h-5 text-accent" />
          <p className="text-label text-[10px] opacity-30 text-center tracking-[0.5em]">
            Verified Resale Infrastructure • Secured Asset Archive • SolTix Protocol 2026
          </p>
        </div>
      </div>
    </main>
  );
}
