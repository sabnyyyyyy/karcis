"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Zap,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";

export default function OrganizerPendingReviewPage() {
  const submittedSteps = [
    { label: "Email Verifikasi", done: true },
    { label: "Identitas Pemilik (KTP)", done: true },
    { label: "Legalitas Bisnis (NIB)", done: true },
    { label: "Verifikasi Skor Kepercayaan", done: true },
  ];

  return (
    <OrganizerGuard>
      <main className="min-h-screen bg-background text-primary flex flex-col pt-0 font-inter">
        <div className="container-editorial py-32 max-w-[1440px] mx-auto text-center space-y-12">
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-24 h-24 bg-primary text-black flex items-center justify-center mx-auto relative"
          >
            <Clock className="w-12 h-12 animate-pulse" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-black flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </motion.div>

          <div className="space-y-6">
            <div className="inline-flex items-center space-x-4 border border-border-main px-6 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full bg-accent opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-label text-accent uppercase">Verification Flow Active</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bodoni italic tracking-tighter uppercase text-primary leading-tight">Data Under / <br /><span className="not-italic">Review.</span></h1>
            <p className="font-bodoni text-2xl text-text-muted italic max-w-xl mx-auto leading-tight">
              Tim Trust & Safety SolTix sedang memvalidasi dokumen Anda. Akses pembuatan event akan terbuka secara otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 text-left">
            <div className="lg:col-span-8 bg-surface border border-border-main p-12 space-y-12">
              <div className="space-y-4">
                <h3 className="text-3xl font-bodoni uppercase tracking-tight italic text-primary">Checklist Pengajuan.</h3>
                <p className="font-bodoni text-xl text-text-muted italic">Dokumen yang berhasil kami terima dalam sesi ini.</p>
              </div>

              <div className="space-y-4">
                {submittedSteps.map((step, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-background border border-border-main">
                    <div className="flex items-center space-x-6">
                      <div className={cn("w-6 h-6 border flex items-center justify-center", step.done ? "border-accent text-accent" : "border-border-main text-text-muted")}>
                        {step.done ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-1.5 h-1.5 bg-current" />}
                      </div>
                      <span className="text-label text-primary uppercase">{step.label}</span>
                    </div>
                    <span className="text-label text-accent uppercase italic">Submitted</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-12">
              <div className="bg-primary p-12 text-black border border-border-main space-y-10">
                <div className="space-y-1">
                  <p className="text-label text-black/40">STATUS PROTOCOL</p>
                  <p className="text-3xl font-bodoni italic leading-none">UNDER REVIEW</p>
                </div>
                <div className="space-y-1">
                  <p className="text-label text-black/40">ESTIMATED COMPLETION</p>
                  <p className="font-bodoni text-2xl italic flex items-center leading-none">
                    <Zap className="w-4 h-4 mr-2" /> 1–3 ARCHIVAL DAYS
                  </p>
                </div>
                <div className="pt-8 border-t border-black/10">
                  <p className="font-bodoni text-lg font-normal leading-tight text-black/60 italic">
                    Kami akan mengirimkan notifikasi ke email Anda segera setelah proses review selesai.
                  </p>
                </div>
              </div>

              <div className="p-8 border border-accent/20 bg-accent/5 flex items-start space-x-4">
                <AlertCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <p className="text-label text-accent leading-relaxed">
                  Fitur Create Event dinonaktifkan sementara selama masa review.
                </p>
              </div>

              <Link href="/help" className="flex items-center justify-center space-x-4 text-label text-text-muted hover:text-primary transition-colors italic">
                <HelpCircle className="w-4 h-4" />
                <span>Support Center</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-8 pt-12 border-t border-border-main">
            <Link href="/">
              <Button variant="outline" className="h-16 px-12 border border-border-main text-primary text-label italic hover:border-accent transition-all rounded-none">
                RETURN TO ARCHIVE
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="h-16 px-12 border border-border-main text-primary text-label italic hover:border-accent transition-all rounded-none">
                VIEW BUYER VAULT
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </OrganizerGuard>
  );
}
