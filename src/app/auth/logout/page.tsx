"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Ticket, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function LogoutPage() {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [stage, setStage] = useState<"logging_out" | "success">("logging_out");

  useEffect(() => {
    const performLogout = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        logout();
        setStage("success");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        router.push("/");
      } catch (error) {
        console.error("Error during logout:", error);
        router.push("/");
      }
    };

    performLogout();
  }, [logout, router]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-inter">
      <div className="absolute top-12 left-12">
        <Link href="/">
          <span className="font-bodoni text-3xl tracking-tighter uppercase italic text-primary">
            SolTix.
          </span>
        </Link>
      </div>

      <div className="max-w-md w-full bg-surface border border-border-main p-12 md:p-20 text-center space-y-12 relative overflow-hidden">
        <div className="relative flex justify-center h-24">
          <AnimatePresence mode="wait">
            {stage === "logging_out" ? (
              <motion.div
                key="logging_out"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute flex items-center justify-center"
              >
                <div className="w-24 h-24 bg-primary text-black flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin" strokeWidth={1} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute w-24 h-24 bg-accent text-black flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-bodoni italic tracking-tighter uppercase text-primary">
            {stage === "logging_out" ? "Exiting / <br /> Vault." : "Session / <br /> Terminated."}
          </h2>
          <p className="font-bodoni text-xl text-text-muted italic">
            {stage === "logging_out"
              ? "Menghapus sesi login Anda dengan aman. Mohon tunggu..."
              : "Sesi login Anda telah berakhir. Mengalihkan ke Beranda..."}
          </p>
        </div>
      </div>
    </main>
  );
}
