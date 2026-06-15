"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Ticket, 
  CheckCircle2,
  AlertCircle,
  Plus,
  Shield,
  Trash2,
  Calendar,
  MapPin,
  Building,
  Info,
  Lock,
  Zap,
  ShieldCheck,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { VerificationLevel, TicketConfig, EventDetails } from "@/types/event";

const steps = ["Details", "Config", "Trust", "Publish"];

export default function CreateEventPage() {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form State
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    name: "",
    category: "Concert",
    description: "",
    venue: "",
    city: "",
    date: "",
  });

  const [tickets, setTickets] = useState<TicketConfig[]>([
    {
      id: "1",
      name: "General Admission",
      quantity: 100,
      price: 0,
      salesStart: "",
      salesEnd: "",
      verificationLevel: "Verified",
    }
  ]);

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const updateEventDetail = (field: keyof EventDetails, value: string) => {
    setEventDetails(prev => ({ ...prev, [field]: value }));
  };

  const addTicket = () => {
    setTickets(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        quantity: 0,
        price: 0,
        salesStart: "",
        salesEnd: "",
        verificationLevel: "Verified",
      }
    ]);
  };

  const removeTicket = (id: string) => {
    if (tickets.length > 1) {
      setTickets(prev => prev.filter(t => t.id !== id));
    }
  };

  const updateTicket = (id: string, field: keyof TicketConfig, value: string | number) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const trustImpact = useMemo(() => {
    const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);
    const avgPrice = tickets.length > 0 ? tickets.reduce((sum, t) => sum + t.price, 0) / tickets.length : 0;
    let estimatedScore = 65;
    if (eventDetails.description.length > 200) estimatedScore += 5;
    if (tickets.some(t => t.verificationLevel === "Ultimate")) estimatedScore += 15;
    const minPool = totalTickets * avgPrice * 0.1;
    const verificationSummary = tickets.every(t => t.verificationLevel === "Ultimate") ? "Ultimate" : "Standard";
    return { estimatedScore, minPool, verificationSummary };
  }, [tickets, eventDetails]);

  return (
    <OrganizerGuard>
      <main className="min-h-screen bg-background text-primary flex flex-col pt-0 font-inter">
        <div className="container-editorial py-32 max-w-[1440px] mx-auto">
          
          {/* Progress Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20 pb-8 border-b border-border-main">
            <div className="space-y-6">
              <Link href="/organizer" className="text-label text-text-muted hover:text-primary transition-all">
                <ChevronLeft className="w-4 h-4 inline mr-2" /> Back
              </Link>
              <h1 className="text-6xl font-bodoni italic tracking-tighter uppercase">Initiate <br /> <span className="not-italic">Experience.</span></h1>
            </div>
            <div className="flex items-center space-x-12">
              {steps.map((label, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className={cn(
                    "w-10 h-10 border flex items-center justify-center text-label transition-all",
                    currentStep === i ? "border-accent bg-accent text-black" : 
                    currentStep > i ? "border-primary bg-primary text-black" : "border-border-main text-text-muted"
                  )}>
                    0{i + 1}
                  </div>
                  {i === currentStep && (
                    <span className="text-label text-primary">{label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
            
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-12">
              <AnimatePresence mode="wait">
                
                {/* Step 1: Details */}
                {currentStep === 0 && (
                  <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                    <div className="space-y-4">
                      <h2 className="text-4xl font-bodoni uppercase tracking-tight italic text-primary">01 / Event Details.</h2>
                      <p className="font-bodoni text-xl text-text-muted italic">Lengkapi detail event untuk verifikasi infrastruktur.</p>
                    </div>
                    <div className="bg-surface border border-border-main p-12 space-y-10">
                      <div className="space-y-4">
                        <Label className="text-label text-text-muted">Event Name</Label>
                        <Input 
                          value={eventDetails.name}
                          onChange={(e) => updateEventDetail("name", e.target.value)}
                          placeholder="EX: SOLTIX ARCHIVE 2026" 
                          className="h-16 bg-background border-border-main rounded-none text-label focus:border-accent text-primary placeholder:text-text-muted" 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                          <Label className="text-label text-text-muted">Category</Label>
                          <select 
                            value={eventDetails.category}
                            onChange={(e) => updateEventDetail("category", e.target.value)}
                            className="w-full h-16 bg-background border border-border-main rounded-none px-4 text-label focus:outline-none focus:border-accent text-primary appearance-none cursor-pointer"
                          >
                            <option>Concert</option>
                            <option>Festival</option>
                            <option>Conference</option>
                          </select>
                        </div>
                        <div className="space-y-4">
                          <Label className="text-label text-text-muted">Event Date</Label>
                          <Input 
                            type="date"
                            value={eventDetails.date}
                            onChange={(e) => updateEventDetail("date", e.target.value)}
                            className="h-16 bg-background border-border-main rounded-none text-label focus:border-accent text-primary" 
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-label text-text-muted">Description</Label>
                        <textarea 
                          value={eventDetails.description}
                          onChange={(e) => updateEventDetail("description", e.target.value)}
                          className="w-full h-40 bg-background border border-border-main rounded-none p-4 text-label focus:outline-none focus:border-accent text-primary resize-none placeholder:text-text-muted" 
                          placeholder="BERIKAN DESKRIPSI LENGKAP..."
                        />
                      </div>

                      <div className="space-y-6">
                        <Label className="text-label text-text-muted">Banner Image</Label>
                        <div className="aspect-video bg-background border border-dashed border-border-main rounded-none flex flex-col items-center justify-center space-y-6 group hover:border-accent transition-all cursor-pointer">
                          <div className="w-16 h-16 bg-primary text-black flex items-center justify-center group-hover:bg-accent transition-all">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                          <p className="text-label text-text-muted">UPLOAD OBJECT IMAGE</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Config */}
                {currentStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                    <div className="flex justify-between items-end">
                      <div className="space-y-4">
                        <h2 className="text-4xl font-bodoni uppercase tracking-tight italic text-primary">02 / Ticket Configuration.</h2>
                        <p className="font-bodoni text-xl text-text-muted italic">Define your ticket types and verification levels.</p>
                      </div>
                      <Button onClick={addTicket} className="h-12 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none">
                        <Plus className="w-4 h-4 mr-2" /> Add
                      </Button>
                    </div>

                    <div className="space-y-8">
                      {tickets.map((ticket, index) => (
                        <div key={ticket.id} className="bg-surface border border-border-main p-12 space-y-10 relative">
                          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                          <div className="flex justify-between items-center">
                            <span className="text-label text-accent">OBJECT #{index + 1}</span>
                            {tickets.length > 1 && (
                              <button onClick={() => removeTicket(ticket.id)} className="text-label text-text-muted hover:text-accent transition-all">REMOVE</button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">Name</Label>
                              <Input 
                                value={ticket.name}
                                onChange={(e) => updateTicket(ticket.id, "name", e.target.value)}
                                placeholder="EX: EARLY BIRD" 
                                className="h-16 bg-background border-border-main rounded-none text-label focus:border-accent text-primary" 
                              />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">Quantity</Label>
                              <Input 
                                type="number"
                                value={ticket.quantity}
                                onChange={(e) => updateTicket(ticket.id, "quantity", parseInt(e.target.value))}
                                className="h-16 bg-background border-border-main rounded-none text-label focus:border-accent text-primary" 
                              />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">Price (IDR)</Label>
                              <Input 
                                type="number"
                                value={ticket.price}
                                onChange={(e) => updateTicket(ticket.id, "price", parseInt(e.target.value))}
                                className="h-16 bg-background border-border-main rounded-none text-label focus:border-accent text-primary" 
                              />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">Verification</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {(["Standard", "Verified", "Ultimate"] as VerificationLevel[]).map((level) => (
                                  <button
                                    key={level}
                                    onClick={() => updateTicket(ticket.id, "verificationLevel", level)}
                                    className={cn(
                                      "h-16 border text-label transition-all",
                                      ticket.verificationLevel === level 
                                        ? "border-accent bg-accent text-black" 
                                        : "border-border-main text-text-muted hover:border-accent"
                                    )}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Trust */}
                {currentStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                    <div className="space-y-4">
                      <h2 className="text-4xl font-bodoni uppercase tracking-tight italic text-primary">03 / Trust manifest.</h2>
                      <p className="font-bodoni text-xl text-text-muted italic">Review infrastruktur kepercayaan.</p>
                    </div>

                    <div className="bg-surface border border-border-main p-12 space-y-10">
                      {[
                        { title: "Trust Infrastructure", icon: ShieldCheck, desc: "Event di SolTix menggunakan infrastruktur Trust Pool." },
                        { title: "Commitment", icon: FileText, desc: "Anda berkomitmen pada transparansi penjualan." },
                        { title: "Ownership", icon: Shield, desc: "Verifikasi kepemilikan digital aktif." }
                      ].map((item, i) => (
                        <div key={i} className="flex items-start space-x-6">
                          <div className="w-12 h-12 bg-primary text-black flex items-center justify-center shrink-0">
                            <item.icon className="w-6 h-6" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-label text-primary">{item.title}</h3>
                            <p className="font-bodoni text-lg text-text-muted italic">{item.desc}</p>
                          </div>
                        </div>
                      ))}

                      <div className="pt-10 border-t border-border-main flex items-center space-x-4">
                        <input type="checkbox" id="agree" className="w-5 h-5 border-border-main bg-background rounded-none text-accent focus:ring-0" />
                        <label htmlFor="agree" className="text-label text-text-muted cursor-pointer">I agree to the Trust & Verification Agreement</label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Publish */}
                {currentStep === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                    <div className="space-y-4">
                      <h2 className="text-4xl font-bodoni uppercase tracking-tight italic text-primary">04 / Review & Publish.</h2>
                      <p className="font-bodoni text-xl text-text-muted italic">Tinjau detail event sebelum dikirim.</p>
                    </div>

                    <div className="bg-surface border border-border-main p-12 space-y-12">
                      <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-1">
                          <p className="text-label text-text-muted">Event Name</p>
                          <p className="font-bodoni text-2xl text-primary italic uppercase">{eventDetails.name || "UNTITLED OBJECT"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-label text-text-muted">Location</p>
                          <p className="font-bodoni text-2xl text-primary italic uppercase">{eventDetails.city || "ARCHIVE"}</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <p className="text-label text-text-muted">Ticket Hierarchy</p>
                        {tickets.map((t) => (
                          <div key={t.id} className="flex items-center justify-between py-4 border-b border-border-main">
                            <p className="font-bodoni text-xl text-primary italic uppercase">{t.name || "STANDARD"}</p>
                            <p className="text-label text-accent">{t.quantity} UNITS / IDR {t.price.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-10 flex flex-col sm:flex-row gap-8">
                        <Button className="h-16 flex-1 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none">
                          PUBLISH ARCHIVE
                        </Button>
                        <Button variant="outline" className="h-16 flex-1 border border-border-main text-primary text-label italic hover:border-accent transition-all rounded-none">
                          SAVE DRAFT
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Navigation */}
              {currentStep < 3 && (
                <div className="flex items-center justify-between pt-12 border-t border-border-main">
                  {currentStep > 0 ? (
                    <button onClick={handleBack} className="text-label text-text-muted hover:text-primary transition-all">PREVIOUS</button>
                  ) : (
                    <div />
                  )}
                  <Button onClick={handleNext} className="h-16 px-12 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none">
                    NEXT PHASE
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column: Side Panel */}
            <div className="lg:col-span-4">
              <div className="sticky top-40 space-y-12">
                <div className="bg-primary p-12 space-y-10 border border-border-main text-black">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bodoni uppercase tracking-tight italic">Trust Impact.</h3>
                    <p className="text-label text-black/40">Live live estimations.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-label text-black/60">EST. SCORE</span>
                        <span className="font-bodoni text-4xl italic leading-none">{trustImpact.estimatedScore}</span>
                      </div>
                      <div className="w-full h-[1px] bg-black/10">
                        <div className="h-full bg-black transition-all" style={{ width: `${trustImpact.estimatedScore}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-label text-black/60">MIN. TRUST POOL</p>
                      <p className="font-bodoni text-3xl italic">Rp {trustImpact.minPool.toLocaleString()}</p>
                    </div>

                    <div className="pt-8 border-t border-black/10">
                       <p className="font-bodoni text-lg text-black/60 italic leading-tight">
                         Higher verification levels optimize your trust pool requirement.
                       </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 border border-border-main space-y-6">
                  <div className="flex items-center space-x-4 text-accent">
                    <Lock className="w-5 h-5" />
                    <span className="text-label">SECURED ARCHITECTURE</span>
                  </div>
                  <p className="font-bodoni text-lg text-text-muted italic leading-relaxed">
                    All financial data is secured by the SolTix Trust Infrastructure.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </OrganizerGuard>
  );
}
