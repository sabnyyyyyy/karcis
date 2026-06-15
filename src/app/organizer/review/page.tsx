"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText,
  Zap,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";

import { EditorialFooter } from "@/components/layout/Footer";

export default function OrganizerReviewPage() {
  return (
    <OrganizerGuard>
      <main className="min-h-screen bg-background text-primary flex flex-col pt-0 font-inter">
        <div className="container-editorial py-32 max-w-[1440px] mx-auto text-center space-y-12">
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-24 h-24 bg-primary text-black flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>

          <div className="space-y-6">
            <div className="inline-flex items-center space-x-4 border border-border-main px-6 py-2 text-accent">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-label uppercase tracking-widest">Protocol Initiated</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bodoni italic tracking-tighter uppercase text-primary leading-tight">Verification / <br /><span className="not-italic">Submitted.</span></h1>
            <p className="font-bodoni text-2xl text-text-muted italic max-w-xl mx-auto leading-tight">
              Tim SolTix sedang meninjau dokumen dan data organisasi Anda untuk memastikan standar keamanan platform.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 text-left">
            <div className="lg:col-span-8 bg-surface border border-border-main p-12 space-y-12">
              <div className="space-y-4">
                <h3 className="text-3xl font-bodoni uppercase tracking-tight italic text-primary">System Response.</h3>
                <p className="font-bodoni text-xl text-text-muted italic">Monitoring status verifikasi infrastruktur Anda.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 p-8 bg-background border border-border-main group">
                  <div className="flex items-center space-x-4">
                    <Clock className="w-5 h-5 text-accent" />
                    <h4 className="text-label text-primary">Status Manifest</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bodoni italic text-primary uppercase leading-none">PENDING REVIEW</p>
                    <p className="text-label text-text-muted">ESTIMASI: 1–2 HARI KERJA</p>
                  </div>
                </div>
                <div className="space-y-6 p-8 bg-background border border-border-main group">
                  <div className="flex items-center space-x-4">
                    <ShieldCheck className="w-5 h-5 text-accent" />
                    <h4 className="text-label text-primary">Post-Approval</h4>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-center text-label text-text-muted">
                      <div className="w-1.5 h-1.5 bg-accent mr-4" />
                      Verified Badge
                    </li>
                    <li className="flex items-center text-label text-text-muted">
                      <div className="w-1.5 h-1.5 bg-accent mr-4" />
                      Trust Index Active
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-border-main flex items-center space-x-4 text-label text-text-muted italic">
                <FileText className="w-4 h-4" />
                <span>Kami akan mengirimkan notifikasi via email hash Anda.</span>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-12">
               <div className="bg-primary p-12 text-black border border-border-main space-y-10">
                  <div className="space-y-4">
                    <p className="text-label text-black/40">Next Actions</p>
                    <h3 className="text-4xl font-bodoni uppercase tracking-tight italic leading-tight">Prepare your <br /> collection.</h3>
                  </div>
                  <p className="font-bodoni text-lg text-black/60 italic leading-tight">
                    Sambil menunggu, Anda dapat menyiapkan aset visual untuk koleksi pertama Anda.
                  </p>
                  <Button className="w-full h-16 bg-black text-primary text-label italic hover:bg-accent hover:text-black transition-all rounded-none">
                     GUIDEBOOK
                  </Button>
               </div>

               <div className="p-8 border border-border-main space-y-6">
                 <div className="flex items-center space-x-4 text-accent">
                   <Zap className="w-5 h-5" />
                   <span className="text-label uppercase">Live Support</span>
                 </div>
                 <p className="font-bodoni text-lg text-text-muted italic leading-relaxed">
                   Butuh bantuan segera terkait proses verifikasi identitas?
                 </p>
                 <Link href="/help" className="block text-label text-primary border-b border-accent pb-2 hover:text-accent transition-all italic w-fit">
                    Concierge Access
                 </Link>
               </div>
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
                VIEW VAULT
              </Button>
            </Link>
          </div>
        </div>

        <EditorialFooter />
      </main>
    </OrganizerGuard>
  );
}
