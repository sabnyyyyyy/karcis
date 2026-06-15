"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LogIn, ShieldCheck, Mail, ChevronLeft, RefreshCw } from "lucide-react";
import { useAuthStore, UserRole, OrganizerStatus } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Email identity required"),
  password: z.string().min(8, "Security hash required"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Verification hash must be 6 digits"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

interface LoginFormProps {
  role: UserRole;
}

export const LoginForm = ({ role }: LoginFormProps) => {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [email, setEmail] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors, isSubmitting: isVerifying },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const onLogin = async (data: LoginFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEmail(data.email);
    setStep("otp");
    setTimer(60);
    setCanResend(false);
  };

  const onVerifyOtp = async (data: OtpFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Development Mode Mock OTP
    if (data.otp !== "123456") {
       alert("Invalid verification hash. Use 123456 for development.");
       return;
    }

    const mockStatus = role === "organizer" ? "ORGANIZER_DRAFT" : "BUYER";
    login({ 
      id: "1", 
      name: "Budi Santoso", 
      email: email,
      role: role,
      status: mockStatus as OrganizerStatus,
      level: 1, xp: 0, voucherCount: 0
    });
    router.push(role === "buyer" ? "/dashboard" : "/organizer/onboarding");
  };

  const handleResend = () => {
    if (canResend) {
      setTimer(60);
      setCanResend(false);
      // Future: Integrate Email/SMS/Authenticator resend logic here
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden font-inter">
      
      {/* LEFT: CINEMATIC PANEL */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200" 
            className="w-full h-full object-cover grayscale opacity-60 contrast-125"
            alt="Experience"
          />
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(214,180,255,0.15)_0%,transparent_70%)] z-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80 z-30" />
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
              Securing the future of cultural commerce through architectural trust and verified identity.
            </p>
          </div>

          <div>
             <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.6em]">© 2026 Archive Society</p>
          </div>
        </div>
      </div>

      {/* RIGHT: FORM PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-24 bg-background relative overflow-y-auto">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "login" ? (
              <motion.div 
                key="login-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-bodoni font-black uppercase italic tracking-tighter text-primary leading-tight">
                    Authenticate <br /> Your Access.
                  </h2>
                  <p className="text-headline-md text-white/40 italic font-normal tracking-tight">
                    Access your verified cultural archive.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onLogin)} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 italic ml-1">Identity / Email</label>
                    <input 
                       className="w-full h-16 bg-surface-container-low border border-white/10 rounded-none px-6 text-[14px] font-bold tracking-[0.1em] text-primary placeholder:text-white/10 transition-all focus:border-accent focus:shadow-[0_0_20px_rgba(214,180,255,0.15)] outline-none uppercase" 
                       placeholder="NAME@ARCHIVE.COM"
                       {...register("email")} 
                    />
                    {errors.email && <p className="text-[10px] text-accent-vibrant font-black uppercase tracking-widest">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 italic">Security Hash</label>
                      <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.4em] cursor-pointer hover:text-accent transition-colors">Recover?</span>
                    </div>
                    <input 
                       type="password" 
                       className="w-full h-16 bg-surface-container-low border border-white/10 rounded-none px-6 text-[14px] font-bold tracking-[0.1em] text-primary placeholder:text-white/10 transition-all focus:border-accent focus:shadow-[0_0_20px_rgba(214,180,255,0.15)] outline-none" 
                       placeholder="••••••••"
                       {...register("password")} 
                    />
                    {errors.password && <p className="text-[10px] text-accent-vibrant font-black uppercase tracking-widest">{errors.password.message}</p>}
                  </div>

                  <button type="submit" className="w-full h-20 bg-accent text-background text-[14px] font-black italic hover:bg-primary transition-all rounded-none uppercase shadow-2xl" disabled={isSubmitting}>
                    {isSubmitting ? "AUTHENTICATING..." : "ENTER ARCHIVE"}
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

                <div className="pt-10 border-t border-white/5 text-center">
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.6em] mb-4">No presence yet?</p>
                  <Link href={role === "organizer" ? "/auth/register/organizer" : "/auth/register/buyer"} className="block group">
                    <span className="text-[14px] text-accent border-b-2 border-accent/20 pb-2 group-hover:border-accent group-hover:text-primary transition-all font-black uppercase tracking-widest italic">
                      Initiate New Identity
                    </span>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <button 
                  onClick={() => setStep("login")}
                  className="flex items-center space-x-3 text-[10px] text-white/40 hover:text-accent transition-colors font-black uppercase tracking-[0.4em] italic"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Return to credentials</span>
                </button>

                <div className="space-y-4">
                  <h2 className="text-4xl md:text-6xl font-bodoni font-black uppercase italic tracking-tighter text-primary leading-tight">
                    Verification <br /> Code.
                  </h2>
                  <p className="text-headline-md text-white/40 italic font-normal tracking-tight">
                    We sent a 6-digit code to your email.
                  </p>
                  <p className="text-[12px] text-accent font-bold tracking-widest">
                    {email}
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 italic ml-1">Identity Hash / OTP</label>
                    <input 
                       className="w-full h-20 bg-surface-container-low border border-white/10 rounded-none px-6 text-3xl font-bold tracking-[0.5em] text-center text-primary placeholder:text-white/5 transition-all focus:border-accent focus:shadow-[0_0_20px_rgba(214,180,255,0.15)] outline-none" 
                       placeholder="000000"
                       maxLength={6}
                       {...registerOtp("otp")} 
                    />
                    {otpErrors.otp && <p className="text-[10px] text-accent-vibrant font-black uppercase tracking-widest text-center">{otpErrors.otp.message}</p>}
                  </div>

                  <div className="flex flex-col items-center space-y-6">
                    <button type="submit" className="w-full h-20 bg-accent text-background text-[14px] font-black italic hover:bg-primary transition-all rounded-none uppercase shadow-2xl" disabled={isVerifying}>
                      {isVerifying ? "VERIFYING..." : "VERIFY IDENTITY"}
                    </button>

                    <button 
                      type="button"
                      onClick={handleResend}
                      disabled={!canResend}
                      className={cn(
                        "flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all",
                        canResend ? "text-accent cursor-pointer hover:text-primary" : "text-white/20 cursor-not-allowed"
                      )}
                    >
                      <RefreshCw className={cn("w-3 h-3", !canResend && "animate-spin")} />
                      <span>{canResend ? "Resend Identity Hash" : `Resend available in ${timer}s`}</span>
                    </button>
                  </div>
                </form>

                <div className="pt-10 border-t border-white/5 text-center">
                   <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.6em]">
                      Archive Security Protocol v2.4
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
