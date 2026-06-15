"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, ChevronLeft, ShieldCheck, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore, UserRole, OrganizerStatus } from "@/store/useAuthStore";

const registerSchema = z.object({
  name: z.string().min(2, "Name identity required"),
  email: z.string().email("Valid email manifest required"),
  password: z.string().min(8, "Security hash min 8 characters"),
  confirmPassword: z.string(),
  organizationName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Security hashes must match",
  path: ["confirmPassword"],
});

const otpSchema = z.object({
  otp: z.string().length(6, "Verification hash must be 6 digits"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

interface RegisterFormProps {
  role: UserRole;
}

export const RegisterForm = ({ role }: RegisterFormProps) => {
  const [step, setStep] = useState<"register" | "otp">("register");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const {
    register: registerField,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegistering },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const {
    register: registerOtpField,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors, isSubmitting: isVerifying },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const onRegister = async (data: RegisterFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEmail(data.email);
    setStep("otp");
  };

  const onVerifyOtp = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mockStatus = role === "organizer" ? "ORGANIZER_DRAFT" : "BUYER";
    login({
      id: "new-user",
      name: "New Identity",
      email: email,
      role: role,
      status: mockStatus as OrganizerStatus,
      level: 1, xp: 0, voucherCount: 0
    });
    router.push(role === "buyer" ? "/dashboard" : "/organizer/onboarding");
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden font-inter">
      
      {/* LEFT: CINEMATIC PANEL */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1514525253361-bee8a18744ad?auto=format&fit=crop&q=80&w=1200" 
            className="w-full h-full object-cover grayscale opacity-60 contrast-125"
            alt="Culture"
          />
          <div className="absolute inset-0 bg-black/50 z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(214,180,255,0.15)_0%,transparent_70%)] z-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent opacity-80 z-30" />
        </div>

        <div className="relative z-40 w-full p-20 flex flex-col justify-between h-full">
          <Link href="/">
            <h1 className="font-bodoni text-5xl tracking-tighter uppercase italic text-primary font-black">
              SolTix.
            </h1>
          </Link>

          <div className="max-w-md space-y-6">
            <div className="w-12 h-[1px] bg-accent" />
            <p className="text-headline-md text-white/60 italic font-medium leading-relaxed tracking-tight">
              Initiate your presence in the global cultural exchange. Secure, verified, and architectural.
            </p>
          </div>

          <div>
             <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.6em]">© 2026 Archive Society</p>
          </div>
        </div>
      </div>

      {/* RIGHT: FORM PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-background relative overflow-y-auto">
        <div className="w-full max-w-md space-y-10 py-12">
          <AnimatePresence mode="wait">
            {step === "register" ? (
              <motion.div key="register" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-bodoni font-black uppercase italic tracking-tighter text-primary leading-tight">
                    Acquire <br /> Authentic Access.
                  </h2>
                  <p className="text-headline-md text-white/40 italic font-normal tracking-tight">
                    Initiate your verified architectural identity.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 italic ml-1">Full Identity Name</label>
                    <input className="w-full h-16 bg-surface-container-low border border-white/10 rounded-none px-6 text-[14px] font-bold tracking-[0.1em] text-primary placeholder:text-white/10 transition-all focus:border-accent focus:shadow-[0_0_20px_rgba(214,180,255,0.15)] outline-none" placeholder="FULL NAME" {...registerField("name")} />
                    {registerErrors.name && <p className="text-[10px] text-accent-vibrant font-black uppercase tracking-widest">{registerErrors.name.message}</p>}
                  </div>

                  {role === "organizer" && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 italic ml-1">Curator / Organization</label>
                      <input className="w-full h-16 bg-surface-container-low border border-white/10 rounded-none px-6 text-[14px] font-bold tracking-[0.1em] text-primary placeholder:text-white/10 transition-all focus:border-accent focus:shadow-[0_0_20px_rgba(214,180,255,0.15)] outline-none uppercase" placeholder="ORGANIZATION NAME" {...registerField("organizationName")} />
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 italic ml-1">Email Manifest</label>
                    <input type="email" className="w-full h-16 bg-surface-container-low border border-white/10 rounded-none px-6 text-[14px] font-bold tracking-[0.1em] text-primary placeholder:text-white/10 transition-all focus:border-accent focus:shadow-[0_0_20px_rgba(214,180,255,0.15)] outline-none uppercase" placeholder="IDENTITY@ARCHIVE.COM" {...registerField("email")} />
                    {registerErrors.email && <p className="text-[10px] text-accent-vibrant font-black uppercase tracking-widest">{registerErrors.email.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 italic ml-1">Security Hash</label>
                      <input type="password" className="w-full h-16 bg-surface-container-low border border-white/10 rounded-none px-6 text-[14px] font-bold tracking-[0.1em] text-primary placeholder:text-white/10 transition-all focus:border-accent focus:shadow-[0_0_20px_rgba(214,180,255,0.15)] outline-none" placeholder="••••••••" {...registerField("password")} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 italic ml-1">Confirm</label>
                      <input type="password" className="w-full h-16 bg-surface-container-low border border-white/10 rounded-none px-6 text-[14px] font-bold tracking-[0.1em] text-primary placeholder:text-white/10 transition-all focus:border-accent focus:shadow-[0_0_20px_rgba(214,180,255,0.15)] outline-none" placeholder="••••••••" {...registerField("confirmPassword")} />
                    </div>
                  </div>
                  {registerErrors.confirmPassword && <p className="text-[10px] text-accent-vibrant font-black uppercase tracking-widest">{registerErrors.confirmPassword.message}</p>}

                  <button type="submit" className="w-full h-20 bg-accent text-background text-[14px] font-black italic hover:bg-primary transition-all rounded-none uppercase shadow-2xl mt-4" disabled={isRegistering}>
                    {isRegistering ? "INITIATING..." : "INITIATE IDENTITY"}
                  </button>
                </form>

                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                    <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.4em]"><span className="bg-background px-6 text-white/20">External Protocol</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button className="h-14 border border-white/10 flex items-center justify-center space-x-3 text-[11px] font-black uppercase tracking-widest hover:border-accent transition-all">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        <span>Google</span>
                     </button>
                     <button className="h-14 border border-white/10 flex items-center justify-center space-x-3 text-[11px] font-black uppercase tracking-widest hover:border-accent transition-all">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.05 20.28c-.96.95-2.21 1.72-3.71 1.72-1.45 0-2.48-.74-3.54-.74-1.07 0-2.21.72-3.48.72-1.61 0-2.92-1-3.95-2.06-2.04-2.1-3.14-5.32-3.14-8.11 0-2.64.93-4.83 2.65-6.09 1.13-1.04 2.53-1.6 3.99-1.6 1.45 0 2.45.69 3.53.69 1.05 0 1.95-.69 3.54-.69 1.4 0 2.86.58 3.98 1.67-2.82 2.02-2.38 5.76.5 7.15-1.12 1.61-2.58 3.14-3.97 4.33zm-4.14-16.14c0-1.44 1.19-2.59 2.54-2.59.08 0 .16 0 .23.01.12 1.43-1.02 2.76-2.53 2.76-.08 0-.17-.01-.24-.01-.01-.06-.01-.12-.01-.17z"/></svg>
                        <span>Apple</span>
                     </button>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 text-center">
                  <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.6em] mb-4">Already authenticated?</p>
                  <Link href={role === "organizer" ? "/auth/login/organizer" : "/auth/login/buyer"} className="block group">
                    <span className="text-[14px] text-accent border-b-2 border-accent/20 pb-2 group-hover:border-accent group-hover:text-primary transition-all font-black uppercase tracking-widest italic">
                      Authenticate Access
                    </span>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 text-center">
                <button onClick={() => setStep("register")} className="mx-auto flex items-center space-x-4 text-[10px] text-white/40 hover:text-accent transition-colors font-black uppercase tracking-[0.4em] italic mb-12">
                  <ChevronLeft className="w-4 h-4" /> <span>Return to manifest</span>
                </button>

                <div className="space-y-6">
                  <h2 className="text-4xl md:text-6xl font-bodoni font-black uppercase italic tracking-tighter text-primary leading-tight">
                    Verify <br /> Identity.
                  </h2>
                  <p className="text-headline-md text-white/40 italic font-normal leading-relaxed tracking-tighter">
                    Identity hash sent to <br />
                    <span className="text-accent font-black underline underline-offset-[12px] decoration-accent/30">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-12 pt-12">
                  <input
                    placeholder="000000"
                    className="text-center text-5xl md:text-7xl h-24 bg-transparent border-b-4 border-accent/20 rounded-none font-bodoni italic focus:border-accent text-accent font-black tracking-widest shadow-2xl transition-all outline-none w-full"
                    maxLength={6}
                    {...registerOtpField("otp")}
                  />
                  <button type="submit" className="w-full h-20 bg-accent text-background text-[14px] font-black italic hover:bg-primary transition-all rounded-none uppercase shadow-2xl" disabled={isVerifying}>
                    {isVerifying ? "VERIFYING..." : "ENTER ARCHIVE"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
