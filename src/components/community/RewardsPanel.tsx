"use client";

import React, { useState } from "react";
import { Gift, Lock, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { REWARD_MIN, voucherCode } from "@/lib/community";

export function RewardsPanel({ stamps, accountId }: { stamps: number; accountId: string }) {
  const unlocked = stamps >= REWARD_MIN;
  const code = voucherCode(accountId);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard tidak tersedia: kode tetap terlihat untuk disalin manual
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div
        className={cn(
          "relative rounded-[28px] p-8 overflow-hidden",
          unlocked ? "bg-[#0b0d0a] text-white" : "bg-[#F5F8EE] border border-on-background/10"
        )}
      >
        {unlocked && <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#9CFF1E]/25 blur-[70px]" />}
        <div className="relative flex items-start gap-5">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", unlocked ? "bg-[#9CFF1E] text-[#141414]" : "bg-black/5 text-text-muted")}>
            {unlocked ? <Gift className="w-7 h-7" /> : <Lock className="w-6 h-6" />}
          </div>
          <div className="space-y-2">
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.25em]", unlocked ? "text-[#9CFF1E]" : "text-text-muted")}>
              Reward Penjaga Markas
            </p>
            <h3 className="text-2xl font-bold tracking-[-0.02em]">Diskon merchandise</h3>
            <p className={cn("text-sm leading-relaxed", unlocked ? "text-white/65" : "text-text-muted")}>
              {unlocked
                ? "Tunjukkan kode ini di lapak merchandise komunitas. Berlaku otomatis selama kamu masih Penjaga Markas."
                : `Terbuka di ${REWARD_MIN} stempel. Kamu punya ${stamps}, jadi ${REWARD_MIN - stamps} stempel lagi.`}
            </p>
          </div>
        </div>

        {unlocked && (
          <div className="relative mt-6 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-[#9CFF1E]/60 px-5 py-4">
            <span className="font-mono text-lg tracking-widest text-[#9CFF1E]">{code}</span>
            <button
              onClick={copy}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#9CFF1E] text-[#141414] text-xs font-semibold uppercase tracking-widest"
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Tersalin</> : <><Copy className="w-3.5 h-3.5" /> Salin</>}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Kode voucher dibuat dari akunmu dan belum divalidasi on-chain oleh penyelenggara. Reward lain dari komunitas akan ditambahkan di sini.
      </p>
    </div>
  );
}
