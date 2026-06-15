"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  CreditCard, 
  QrCode, 
  Building2, 
  ShieldCheck, 
  Lock,
  Ticket,
  Timer,
  AlertCircle,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TrustScore } from "@/components/ui/trust-score";

const steps = ["Attendee", "Payment", "Finalize"];

export default function CheckoutPage({ params: _params }: { params: Promise<{ id: string }> }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const searchParams = useSearchParams();
  
  const tierId = searchParams.get("tier");
  const qty = parseInt(searchParams.get("qty") || "1");

  const tierName = tierId === "vip" ? "VIP ACCESS" : "STANDARD ACCESS";
  const unitPrice = tierId === "vip" ? 3500000 : 1500000;
  const subtotal = unitPrice * qty;
  const fee = 5000;
  const total = subtotal + fee;

  useEffect(() => {
    if (timeLeft <= 0 || currentStep === 2) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, currentStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  return (
    <main className="min-h-screen bg-background text-primary flex flex-col pt-0 font-inter">
      <div className="container-editorial py-32 max-w-[1440px] mx-auto">
        
        {/* Reservation Ticker */}
        {currentStep < 2 && (
          <div className="bg-accent text-black p-8 mb-20 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-black text-accent flex items-center justify-center">
                <Timer className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-label uppercase tracking-widest font-black">Archive Reserved.</p>
                <p className="text-label uppercase opacity-60">Selesaikan pembayaran sebelum waktu habis</p>
              </div>
            </div>
            <div className="bg-black text-accent px-8 py-3 border border-black">
              <span className="text-3xl font-bodoni italic tracking-tighter">{formatTime(timeLeft)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
          
          {/* Main Checkout Area */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* Steps Visual */}
            <div className="flex items-center space-x-12 mb-12 border-b border-border-main pb-8">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className={cn(
                    "w-10 h-10 border flex items-center justify-center text-label transition-all",
                    currentStep === i ? "border-accent bg-accent text-black" : 
                    currentStep > i ? "border-primary bg-primary text-black" : "border-border-main text-text-muted"
                  )}>
                    0{i + 1}
                  </div>
                  <span className={cn("text-label uppercase", currentStep >= i ? "text-primary" : "text-text-muted")}>{step}</span>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              
              {/* Step 0: Attendee Details */}
              {currentStep === 0 && (
                <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bodoni uppercase tracking-tight italic text-primary">Attendee / <br /> <span className="not-italic">Manifest.</span></h2>
                    <p className="font-bodoni text-xl text-text-muted italic">E-ticket akan dikirimkan ke alamat email di bawah ini.</p>
                  </div>
                  
                  <div className="bg-surface border border-border-main p-12 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <Label className="text-label text-text-muted">Full Name (ID)</Label>
                        <Input placeholder="BUDI SANTOSO" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary placeholder:text-text-muted" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-label text-text-muted">Email Hash</Label>
                        <Input type="email" placeholder="IDENTITY@ARCHIVE.COM" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary placeholder:text-text-muted" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-label text-text-muted">Contact Protocol</Label>
                        <Input placeholder="0812XXXXXXXX" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-label text-text-muted">Identity Number (NIK)</Label>
                        <Input placeholder="320XXXXXXXXXXXXX" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary" />
                      </div>
                    </div>
                    
                    <div className="p-8 border border-accent/20 bg-accent/5 flex items-start space-x-4">
                      <AlertCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                      <p className="text-label text-accent leading-relaxed uppercase tracking-wide">
                        Pastikan data sesuai dengan kartu identitas. Kesalahan data dapat menghambat proses check-in.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Payment */}
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bodoni uppercase tracking-tight italic text-primary">Payment / <br /> <span className="not-italic">Settlement.</span></h2>
                    <p className="font-bodoni text-xl text-text-muted italic">Semua pembayaran diproses secara aman dan instan.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { id: "qris", name: "QRIS", icon: QrCode },
                      { id: "gopay", name: "GOPAY", icon: QrCode },
                      { id: "va", name: "BANK TRANSFER", icon: Building2 },
                      { id: "cc", name: "CREDIT CARD", icon: CreditCard },
                    ].map((method) => (
                      <div 
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          "p-8 border-2 transition-all cursor-pointer flex items-center space-x-6 relative group",
                          paymentMethod === method.id ? "border-accent bg-surface" : "border-border-main bg-background hover:border-text-muted"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 flex items-center justify-center transition-colors",
                          paymentMethod === method.id ? "bg-accent text-black" : "bg-surface text-text-muted"
                        )}>
                          <method.icon className="w-6 h-6" />
                        </div>
                        <span className="text-label font-black text-primary block">{method.name}</span>
                        {paymentMethod === method.id && (
                          <div className="absolute top-4 right-4 w-4 h-4 bg-accent" />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Success */}
              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-12">
                  <div className="w-32 h-32 bg-primary text-black flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-16 h-16" />
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-6xl font-bodoni italic tracking-tighter uppercase text-primary">Acquisition / <br /> <span className="not-italic">Success.</span></h2>
                    <p className="font-bodoni text-2xl text-text-muted italic max-w-md mx-auto">Tiket Anda telah dikirim ke email dan tersedia di Dashboard.</p>
                  </div>

                  <div className="max-w-md mx-auto bg-surface border border-border-main p-12 space-y-10">
                    <div className="space-y-1">
                      <p className="text-label text-text-muted">TRANSACTION HASH</p>
                      <p className="text-2xl font-bodoni italic text-accent tracking-widest">#STX-99021-JKT</p>
                    </div>
                    <div className="space-y-6 pt-10 border-t border-border-main text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-label text-text-muted">EVENT</span>
                        <span className="text-label text-primary">JAVA MUSIC FESTIVAL 2026</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-label text-text-muted">SETTLEMENT</span>
                        <span className="font-bodoni text-2xl italic text-primary">IDR 1.505.000</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-12 flex flex-col sm:flex-row gap-8 justify-center">
                    <Link href="/dashboard/tickets">
                      <Button className="h-20 px-12 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none">
                        View Vault
                      </Button>
                    </Link>
                    <Link href="/events">
                      <Button variant="outline" className="h-20 px-12 border border-border-main text-primary text-label italic hover:border-accent transition-all rounded-none">
                        Discovery
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStep < 2 && (
              <div className="flex items-center justify-between pt-12 border-t border-border-main">
                <button 
                  onClick={handleBack} 
                  disabled={currentStep === 0}
                  className="text-label text-text-muted hover:text-primary transition-all disabled:opacity-0"
                >
                  PREVIOUS
                </button>
                <Button 
                  onClick={handleNext} 
                  disabled={currentStep === 1 && !paymentMethod}
                  className="h-20 px-16 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none"
                >
                  {currentStep === 1 ? "FINALIZE ACQUISITION" : "NEXT PHASE"}
                </Button>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          {currentStep < 2 && (
            <div className="lg:col-span-4">
              <div className="sticky top-40 space-y-12">
                
                <div className="bg-surface border border-border-main p-12 space-y-10">
                  <h3 className="text-3xl font-bodoni italic tracking-tighter uppercase border-b border-border-main pb-6">Summary.</h3>
                  
                  <div className="space-y-6">
                    <div className="aspect-video bg-background border border-border-main overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=600" alt="Event" className="w-full h-full object-cover img-cinematic" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-bodoni text-2xl text-primary italic uppercase leading-none">Java Music Festival 2026</p>
                      <p className="text-label text-text-muted">15 JULY 2026 • JAKARTA, ID</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-10 border-t border-border-main">
                    <div className="flex justify-between items-center">
                      <span className="text-label text-text-muted">UNIT ({qty}X)</span>
                      <span className="text-label text-primary">{tierName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-label text-text-muted">UNIT PRICE</span>
                      <span className="text-label text-primary">IDR {unitPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-label text-text-muted">PROTOCOL FEE</span>
                      <span className="text-label text-primary">IDR {fee.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-border-main flex justify-between items-end">
                    <span className="text-label text-text-muted">TOTAL</span>
                    <span className="font-bodoni text-4xl italic text-primary leading-none">IDR {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-8 border border-border-main space-y-6">
                  <div className="flex items-center space-x-4 text-accent">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-label">SOLTIX GUARD ACTIVE</span>
                  </div>
                  <p className="font-bodoni text-lg text-text-muted italic leading-tight">
                    Encrypted digital issuance ensures your access is absolute and unique.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
