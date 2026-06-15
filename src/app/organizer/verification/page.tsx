"use client";

import React, { useState } from "react";
import { EditorialFooter } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Upload, 
  User, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { ScrollReveal, SpatialLayer } from "@/components/animations/SpatialSystem";

export default function OrganizerVerificationPage() {
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else {
      updateUser({ status: "ORGANIZER_PENDING_REVIEW" });
      router.push("/organizer/pending-review");
    }
  };

  return (
    <OrganizerGuard>
      <main className="min-h-screen bg-background text-on-surface flex flex-col pt-0 font-inter spatial-root overflow-hidden">
        <div className="container-editorial py-32 max-w-[1440px] mx-auto">
          <ScrollReveal>
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20 pb-8 border-b border-accent/20 spatial-hover">
               <div className="space-y-6 layer-mid">
                 <button onClick={() => router.back()} className="text-label-caps text-accent/60 hover:text-accent transition-all font-black tracking-widest italic">
                   <ChevronLeft className="w-4 h-4 inline mr-2" /> Back to Center
                 </button>
                 <h1 className="text-display-lg italic uppercase leading-none font-black tracking-tighter">Verification / <br /> <span className="not-italic text-accent">Protocol.</span></h1>
               </div>
               
               <div className="flex items-center space-x-12 layer-fg">
                  <div className={cn("flex items-center space-x-4 transition-all", step >= 1 ? "text-accent" : "text-white/20")}>
                    <div className={cn("w-12 h-12 border-2 flex items-center justify-center text-[12px] font-black transition-all accent-glow", step >= 1 ? "border-accent bg-accent text-background shadow-3xl" : "border-white/10")}>01</div>
                    <span className="text-label-caps font-black tracking-widest uppercase">Identity Hash</span>
                  </div>
                  <div className={cn("flex items-center space-x-4 transition-all", step >= 2 ? "text-accent" : "text-white/20")}>
                    <div className={cn("w-12 h-12 border-2 flex items-center justify-center text-[12px] font-black transition-all accent-glow", step >= 2 ? "border-accent bg-accent text-background shadow-3xl" : "border-white/10")}>02</div>
                    <span className="text-label-caps font-black tracking-widest uppercase">Business Sync</span>
                  </div>
               </div>
             </div>
          </ScrollReveal>

          <div className="grid grid-cols-12 gap-24">
            <div className="col-span-8 space-y-12">
              {step === 1 && (
                <ScrollReveal>
                   <div className="bg-surface-container-low border-2 border-accent/10 p-16 space-y-16 spatial-hover shadow-2xl">
                     <div className="space-y-6 layer-mid">
                       <h2 className="text-display-lg uppercase italic text-accent font-black tracking-tighter">01 / Personal Archive.</h2>
                       <p className="text-headline-lg text-white/40 italic font-normal tracking-tight">Initiate architectural identity verification to sync event publishing rights.</p>
                     </div>

                     <div className="grid grid-cols-2 gap-12 layer-base">
                       <div className="col-span-2 space-y-6">
                         <label className="text-label-caps text-accent/40 font-black tracking-widest uppercase italic">KTP / NIK Manifest</label>
                         <input placeholder="16 DIGIT NIK" className="input-premium w-full h-20 text-xl" required />
                       </div>
                       
                       <div className="space-y-6">
                         <label className="text-label-caps text-accent/40 font-black tracking-widest uppercase italic">Identity Document</label>
                         <div className="aspect-[3/2] border-2 border-dashed border-accent/20 bg-background flex flex-col items-center justify-center space-y-8 group hover:border-accent transition-all cursor-pointer spatial-hover">
                           <div className="w-16 h-16 bg-accent text-background flex items-center justify-center group-hover:bg-primary transition-all accent-glow shadow-xl layer-fg">
                             <Upload className="w-8 h-8" />
                           </div>
                           <p className="text-label-caps text-accent/40 font-black tracking-widest layer-mid">UPLOAD KTP</p>
                         </div>
                       </div>

                       <div className="space-y-6">
                         <label className="text-label-caps text-accent/40 font-black tracking-widest uppercase italic">Biometric Validation</label>
                         <div className="aspect-[3/2] border-2 border-dashed border-accent/20 bg-background flex flex-col items-center justify-center space-y-8 group hover:border-accent transition-all cursor-pointer spatial-hover">
                           <div className="w-16 h-16 bg-accent text-background flex items-center justify-center group-hover:bg-primary transition-all accent-glow shadow-xl layer-fg">
                             <User className="w-8 h-8" />
                           </div>
                           <p className="text-label-caps text-accent/40 font-black tracking-widest layer-mid">UPLOAD SELFIE</p>
                         </div>
                       </div>
                     </div>
                   </div>
                </ScrollReveal>
              )}

              {step === 2 && (
                <ScrollReveal>
                   <div className="bg-surface-container-low border-2 border-accent/10 p-16 space-y-16 spatial-hover shadow-2xl">
                     <div className="space-y-6 layer-mid">
                       <h2 className="text-display-lg uppercase italic text-accent font-black tracking-tighter">02 / Business Hash.</h2>
                       <p className="text-headline-lg text-white/40 italic font-normal tracking-tight">Verified financial settlement information for revenue distribution.</p>
                     </div>

                     <div className="space-y-12 layer-base">
                       <div className="grid grid-cols-2 gap-12">
                         <div className="col-span-2 space-y-6">
                           <label className="text-label-caps text-accent/40 font-black tracking-widest uppercase italic">Bank Institution</label>
                           <input placeholder="BANK NAME" className="input-premium w-full h-20 text-xl" required />
                         </div>
                         <div className="space-y-6">
                           <label className="text-label-caps text-accent/40 font-black tracking-widest uppercase italic">Account Number</label>
                           <input placeholder="0000000000" className="input-premium w-full h-20 text-xl" required />
                         </div>
                         <div className="space-y-6">
                           <label className="text-label-caps text-accent/40 font-black tracking-widest uppercase italic">Account Holder</label>
                           <input placeholder="LEGAL NAME" className="input-premium w-full h-20 text-xl" required />
                         </div>
                       </div>

                       <div className="p-10 border-2 border-accent/20 bg-accent-soft flex items-start space-x-6 spatial-hover">
                         <AlertCircle className="w-6 h-6 text-accent mt-0.5 shrink-0" />
                         <p className="text-headline-md text-accent font-bold tracking-tight italic leading-tight">
                           Pastikan nama pemilik rekening sesuai dengan identitas architectural yang didaftarkan.
                         </p>
                       </div>
                     </div>
                   </div>
                </ScrollReveal>
              )}

              <ScrollReveal>
                 <div className="flex justify-between items-center pt-16 border-t-2 border-accent/10">
                   {step > 1 ? (
                     <button onClick={() => setStep(step - 1)} className="text-label-caps text-accent/40 hover:text-accent transition-all font-black tracking-widest uppercase italic underline underline-offset-8">Previous Phase</button>
                   ) : (
                     <div />
                   )}
                   <button onClick={handleNext} className="button-premium px-16 py-6 text-xl shadow-2xl accent-glow">
                     {step === 2 ? "SUBMIT FOR REVIEW" : "NEXT PHASE"} 
                   </button>
                 </div>
              </ScrollReveal>
            </div>

            <div className="col-span-4">
              <div className="sticky top-[120px] space-y-16">
                <ScrollReveal delay={0.1}>
                   <div className="bg-accent p-12 space-y-12 border-2 border-accent/20 text-background spatial-hover shadow-3xl accent-glow">
                     <div className="space-y-4 layer-mid">
                       <h3 className="text-4xl uppercase italic font-black leading-none tracking-tighter">Trust Flow.</h3>
                       <p className="text-label-caps text-background/60 font-black tracking-widest uppercase">Identity Verification Status.</p>
                     </div>
                     
                     <div className="space-y-8 layer-base">
                       {[
                         { label: "Email Identity Manifest", done: true },
                         { label: "Biometric Validation", done: true },
                         { label: "Business Hash Sync", done: step === 2 },
                       ].map((item, i) => (
                         <div key={i} className="flex items-center justify-between border-b-2 border-background/10 pb-6">
                           <span className="text-lg font-black italic tracking-tight">{item.label}</span>
                           {item.done ? <CheckCircle2 className="w-6 h-6 text-background" strokeWidth={3} /> : <div className="w-3 h-3 bg-background/20 rounded-full" />}
                         </div>
                       ))}
                     </div>
                   </div>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                   <div className="p-10 border-2 border-accent/10 space-y-8 bg-accent-soft spatial-hover shadow-xl">
                     <div className="flex items-center space-x-6 text-accent layer-fg">
                       <ShieldCheck className="w-8 h-8" />
                       <span className="text-label-caps font-black tracking-widest uppercase">Secured Infrastructure Active</span>
                     </div>
                     <p className="text-headline-lg text-white/40 italic font-medium leading-tight layer-base tracking-tight">
                       Setiap data identity hash dienkripsi secara end-to-end melalui protocol L3 SolTix infrastructure.
                     </p>
                   </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>

        <EditorialFooter />
      </main>
    </OrganizerGuard>
  );
}
