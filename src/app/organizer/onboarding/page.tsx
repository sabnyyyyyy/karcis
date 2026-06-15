"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  User, 
  Phone, 
  Globe, 
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Lock,
  Zap,
  ChevronLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { motion, AnimatePresence } from "framer-motion";

type Step = 1 | 2 | 3 | 4;

export default function OrganizerOnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  
  // Form State
  const [formData, setFormData] = useState({
    orgName: "",
    orgType: "individual" as "individual" | "company" | "community" | "agency",
    picName: "",
    phone: "",
    website: "",
    social: "",
    ktpNumber: "",
    businessRegNumber: "",
    businessAddress: "",
    npwp: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const setOrgType = (type: typeof formData.orgType) => {
    setFormData(prev => ({ ...prev, orgType: type }));
  };

  const nextStep = () => {
    if (step < 4) {
      setStep((step + 1) as Step);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      nextStep();
    } else {
      updateUser({ 
        status: "ORGANIZER_PENDING_REVIEW",
        organizationType: formData.orgType,
        name: formData.picName,
      });
      router.push("/organizer/pending-review");
    }
  };

  const steps = [
    { id: 1, label: "Profile" },
    { id: 2, label: "Identity" },
    { id: 3, label: "Business" },
    { id: 4, label: "Review" },
  ];

  return (
    <OrganizerGuard>
      <main className="min-h-screen bg-background text-primary flex flex-col pt-0 font-inter">
        <div className="container-editorial py-32 max-w-[1440px] mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20 pb-8 border-b border-border-main">
            <div className="space-y-6">
              <button onClick={() => router.back()} className="text-label text-text-muted hover:text-primary transition-all">
                <ChevronLeft className="w-4 h-4 inline mr-2" /> Back
              </button>
              <h1 className="text-6xl font-bodoni italic tracking-tighter uppercase">
                Onboarding / <br /> <span className="not-italic">Identity.</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-12">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center space-x-4">
                  <div className={cn(
                    "w-10 h-10 border flex items-center justify-center text-label transition-all",
                    step >= s.id ? "border-primary bg-primary text-black" : "border-border-main text-text-muted"
                  )}>
                    {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : `0${s.id}`}
                  </div>
                  {step === s.id && (
                    <span className="text-label uppercase">{s.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
            
            <div className="lg:col-span-8">
              {user?.status === "ORGANIZER_REJECTED" && step === 1 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-accent/10 p-8 border border-accent/20 flex items-start space-x-4 text-left mb-12"
                >
                  <AlertCircle className="w-6 h-6 text-accent shrink-0 mt-1" />
                  <div className="space-y-2">
                    <p className="text-label text-accent">Pendaftaran Ditolak</p>
                    <p className="font-bodoni text-lg italic text-text-muted">Mohon maaf, dokumen atau informasi yang Anda berikan sebelumnya belum memenuhi standar verifikasi kami.</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {step === 1 && (
                      <div className="bg-surface border border-border-main p-12 space-y-12">
                        <div className="space-y-4">
                          <h2 className="text-3xl font-bodoni uppercase tracking-tight italic text-primary">01 / Profile Manifest.</h2>
                          <p className="font-bodoni text-xl text-text-muted italic">Beritahu kami lebih lanjut tentang organisasi Anda.</p>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-4">
                            <Label className="text-label text-text-muted">Organization Type</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {(["individual", "company", "community", "agency"] as const).map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setOrgType(type)}
                                  className={cn(
                                    "h-16 border text-label transition-all",
                                    formData.orgType === type 
                                      ? "border-accent bg-accent text-black" 
                                      : "border-border-main text-text-muted hover:border-accent"
                                  )}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">Organization Name</Label>
                              <Input id="orgName" value={formData.orgName} onChange={handleInputChange} placeholder="SOLTIX EVENTS" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary placeholder:text-text-muted" required />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">PIC Identity</Label>
                              <Input id="picName" value={formData.picName} onChange={handleInputChange} placeholder="LEGAL NAME" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary placeholder:text-text-muted" required />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">Contact Protocol</Label>
                              <Input id="phone" value={formData.phone} onChange={handleInputChange} placeholder="0812..." className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary" required />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">Digital Hub (Website)</Label>
                              <Input id="website" value={formData.website} onChange={handleInputChange} placeholder="HTTPS://..." className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="bg-surface border border-border-main p-12 space-y-12">
                        <div className="space-y-4">
                          <h2 className="text-3xl font-bodoni uppercase tracking-tight italic text-primary">02 / Identity Hash.</h2>
                          <p className="font-bodoni text-xl text-text-muted italic">Unggah identitas resmi untuk memastikan keamanan transaksi.</p>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-4">
                            <Label className="text-label text-text-muted">NIK Manifest</Label>
                            <Input id="ktpNumber" value={formData.ktpNumber} onChange={handleInputChange} placeholder="16 DIGIT NIK" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary placeholder:text-text-muted" required />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">Identity Document</Label>
                              <div className="aspect-[3/2] border border-dashed border-border-main bg-background flex flex-col items-center justify-center space-y-6 group hover:border-accent transition-all cursor-pointer">
                                <div className="w-12 h-12 bg-primary text-black flex items-center justify-center group-hover:bg-accent transition-all">
                                  <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-label text-text-muted">UPLOAD KTP</p>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <Label className="text-label text-text-muted">Biometric Validation</Label>
                              <div className="aspect-[3/2] border border-dashed border-border-main bg-background flex flex-col items-center justify-center space-y-6 group hover:border-accent transition-all cursor-pointer">
                                <div className="w-12 h-12 bg-primary text-black flex items-center justify-center group-hover:bg-accent transition-all">
                                  <User className="w-6 h-6" />
                                </div>
                                <p className="text-label text-text-muted">UPLOAD SELFIE</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="bg-surface border border-border-main p-12 space-y-12">
                        <div className="space-y-4">
                          <h2 className="text-3xl font-bodoni uppercase tracking-tight italic text-primary">03 / Business Protocol.</h2>
                          <p className="font-bodoni text-xl text-text-muted italic">Lengkapi data legalitas untuk meningkatkan batas likuiditas.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="md:col-span-2 space-y-4">
                            <Label className="text-label text-text-muted">NIB / SIUP Manifest</Label>
                            <Input id="businessRegNumber" value={formData.businessRegNumber} onChange={handleInputChange} placeholder="BUSINESS REGISTRATION NUMBER" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary placeholder:text-text-muted" required />
                          </div>
                          <div className="space-y-4">
                            <Label className="text-label text-text-muted">NPWP Hash</Label>
                            <Input id="npwp" value={formData.npwp} onChange={handleInputChange} placeholder="00.000.000.0-000.000" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary" />
                          </div>
                          <div className="space-y-4">
                            <Label className="text-label text-text-muted">Legal Address</Label>
                            <Input id="businessAddress" value={formData.businessAddress} onChange={handleInputChange} placeholder="OFFICE ADDRESS" className="h-16 bg-background border border-border-main rounded-none px-6 text-label focus:border-accent text-primary" required />
                          </div>
                          <div className="md:col-span-2 space-y-4 pt-4">
                            <Label className="text-label text-text-muted">Legalization Documents</Label>
                            <div className="h-32 border border-dashed border-border-main bg-background flex flex-col items-center justify-center space-y-4 group hover:border-accent transition-all cursor-pointer">
                              <Upload className="w-6 h-6 text-primary group-hover:bg-accent transition-all" />
                              <p className="text-label text-text-muted uppercase">UPLOAD PDF/JPG</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-12">
                        <div className="bg-surface border border-border-main p-12 space-y-12">
                          <div className="space-y-4">
                            <h2 className="text-3xl font-bodoni uppercase tracking-tight italic text-primary">04 / Verification Preview.</h2>
                            <p className="font-bodoni text-xl text-text-muted italic">Ringkasan status identitas digital Anda.</p>
                          </div>

                          <div className="space-y-4">
                            {[
                              { label: "Organization Profile", status: "Complete" },
                              { label: "Identity Hash", status: "Complete" },
                              { label: "Business Protocol", status: "Complete" },
                              { label: "Account Security", status: "Verified" },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-6 bg-background border border-border-main">
                                <div className="flex items-center space-x-6">
                                  <CheckCircle2 className="w-5 h-5 text-accent" />
                                  <span className="text-label text-primary">{item.label}</span>
                                </div>
                                <span className="text-label text-accent uppercase">{item.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between items-center mt-12 border-t border-border-main pt-12">
                  {step > 1 ? (
                    <button type="button" onClick={prevStep} className="text-label text-text-muted hover:text-primary transition-all italic">
                      <ArrowLeft className="mr-2 w-4 h-4 inline" /> Previous
                    </button>
                  ) : (
                    <div />
                  )}
                  
                  <Button type="submit" className="h-20 px-12 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none">
                    {step === 4 ? "SUBMIT FOR REVIEW" : "NEXT PHASE"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-4">
               <div className="sticky top-40 space-y-12">
                  <div className="bg-primary p-12 space-y-10 text-black border border-border-main">
                     <div className="space-y-2">
                        <h3 className="text-3xl font-bodoni uppercase tracking-tight italic">Trust Preview.</h3>
                        <p className="text-label text-black/40">Expected visibility level.</p>
                     </div>
                     <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <span className="text-label text-black/60">EST. SCORE</span>
                            <span className="font-bodoni text-4xl italic">85</span>
                          </div>
                          <div className="w-full h-[1px] bg-black/10">
                            <div className="w-[85%] h-full bg-black" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-label text-black/60">REVIEW CYCLE</p>
                          <p className="font-bodoni text-2xl italic flex items-center">
                            <Zap className="w-4 h-4 mr-2" /> 1–3 ARCHIVAL DAYS
                          </p>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 border border-border-main space-y-6">
                    <div className="flex items-center space-x-4 text-accent">
                      <Lock className="w-5 h-5" />
                      <span className="text-label">IDENTITY ENCRYPTION</span>
                    </div>
                    <p className="font-bodoni text-lg text-text-muted italic leading-relaxed">
                      Data identitas Anda akan dienkripsi secara end-to-end melalui infrastruktur SolTix Trust.
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
