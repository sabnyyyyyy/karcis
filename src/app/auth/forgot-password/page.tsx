"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Mail, Lock, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const emailSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP harus 6 digit"),
});

const resetSchema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email");
  const [email, setEmail] = useState("");

  const { register: regEmail, handleSubmit: subEmail, formState: { errors: errEmail, isSubmitting: loadingEmail } } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });
  const { register: regOtp, handleSubmit: subOtp, formState: { errors: errOtp, isSubmitting: loadingOtp } } = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });
  const { register: regReset, handleSubmit: subReset, formState: { errors: errReset, isSubmitting: loadingReset } } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) });

  const onSendEmail = async (data: EmailFormValues) => {
    await new Promise(r => setTimeout(r, 1500));
    setEmail(data.email);
    setStep("otp");
  };

  const onVerifyOtp = async () => {
    await new Promise(r => setTimeout(r, 1500));
    setStep("reset");
  };

  const onResetPassword = async () => {
    await new Promise(r => setTimeout(r, 1500));
    setStep("success");
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden font-inter">
      <div className="hidden lg:flex w-1/2 bg-primary p-24 flex-col justify-center items-center relative text-black text-center">
        <div className="relative z-10 space-y-12 max-w-sm">
          <div className="w-20 h-20 bg-black text-primary flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-5xl font-bodoni italic tracking-tighter leading-tight uppercase">Keamanan adalah prioritas.</h2>
          <p className="font-bodoni text-xl italic text-black/60">Pulihkan akses akun Anda melalui sistem verifikasi infrastruktur kami.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-24 bg-background">
        <div className="w-full max-w-md space-y-12">
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <Link href="/auth/login" className="text-label text-text-muted hover:text-primary transition-all italic">
                  <ChevronLeft className="w-4 h-4 inline mr-2" /> Back to Login
                </Link>
                <div className="space-y-4">
                  <h1 className="text-5xl font-bodoni italic tracking-tighter text-primary uppercase leading-none">Recover / <br /> <span className="not-italic">Access.</span></h1>
                  <p className="font-bodoni text-xl text-text-muted italic">Masukkan email Anda untuk menerima kode verifikasi.</p>
                </div>
                <form onSubmit={subEmail(onSendEmail)} className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-label text-text-muted">Email Hash</Label>
                    <Input placeholder="IDENTITY@ARCHIVE.COM" className="h-16 bg-surface border border-border-main rounded-none px-6 text-label focus:border-accent text-primary placeholder:text-text-muted" {...regEmail("email")} />
                    {errEmail.email && <p className="text-[10px] text-accent font-black uppercase tracking-widest">{errEmail.email.message}</p>}
                  </div>
                  <Button type="submit" className="w-full h-20 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none" disabled={loadingEmail}>
                    {loadingEmail ? "SENDING..." : "INITIATE RECOVERY"}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 text-center">
                <button onClick={() => setStep("email")} className="text-label text-text-muted hover:text-primary transition-all italic">
                  <ChevronLeft className="w-4 h-4 inline mr-2" /> Change Email
                </button>
                <div className="space-y-4">
                  <h1 className="text-5xl font-bodoni italic tracking-tighter text-primary uppercase leading-none">Verify / <br /> <span className="not-italic">Identity.</span></h1>
                  <p className="font-bodoni text-xl text-text-muted italic leading-relaxed">Kode telah dikirim ke <span className="text-primary">{email}</span></p>
                </div>
                <form onSubmit={subOtp(onVerifyOtp)} className="space-y-8 text-left">
                  <div className="space-y-4">
                    <Input placeholder="000000" className="text-center text-5xl h-24 bg-surface border border-border-main rounded-none font-bodoni italic focus:border-accent text-primary" maxLength={6} {...regOtp("otp")} />
                    {errOtp.otp && <p className="text-[10px] text-accent text-center font-black uppercase tracking-widest">{errOtp.otp.message}</p>}
                  </div>
                  <Button type="submit" className="w-full h-20 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none" disabled={loadingOtp}>
                    {loadingOtp ? "VERIFYING..." : "VALIDATE KEY"}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === "reset" && (
              <motion.div key="reset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="space-y-4">
                  <h1 className="text-5xl font-bodoni italic tracking-tighter text-primary uppercase leading-none">New / <br /> <span className="not-italic">Protocol.</span></h1>
                  <p className="font-bodoni text-xl text-text-muted italic">Gunakan password yang kuat untuk keamanan akun Anda.</p>
                </div>
                <form onSubmit={subReset(onResetPassword)} className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-label text-text-muted">New Key Hash</Label>
                    <Input type="password" placeholder="••••••••" className="h-16 bg-surface border border-border-main rounded-none px-6 text-label focus:border-accent text-primary" {...regReset("password")} />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-label text-text-muted">Confirm Protocol</Label>
                    <Input type="password" placeholder="••••••••" className="h-16 bg-surface border border-border-main rounded-none px-6 text-label focus:border-accent text-primary" {...regReset("confirmPassword")} />
                  </div>
                  {errReset.password && <p className="text-[10px] text-accent font-black uppercase tracking-widest">{errReset.password.message}</p>}
                  <Button type="submit" className="w-full h-20 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none" disabled={loadingReset}>
                    {loadingReset ? "PROCESSING..." : "UPDATE IDENTITY"}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-12">
                <div className="w-24 h-24 bg-primary text-black flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-5xl font-bodoni italic tracking-tighter text-primary uppercase leading-none">Success / <br /> <span className="not-italic">Recovered.</span></h1>
                  <p className="font-bodoni text-xl text-text-muted italic">Password berhasil diubah. Identitas Anda kini telah aman.</p>
                </div>
                <Link href="/auth/login" className="block">
                  <Button className="w-full h-20 bg-primary text-black text-label italic hover:bg-accent transition-all rounded-none">AUTHENTICATE NOW</Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
