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
              Base Keeper rewards
            </p>
            <h3 className="text-2xl font-bold tracking-[-0.02em]">Merchandise discount</h3>
            <p className={cn("text-sm leading-relaxed", unlocked ? "text-white/65" : "text-text-muted")}>
              {unlocked
                ? "Show this code at the community merch stall. It applies automatically as long as you remain a Base Keeper."
                : `Unlocks at ${REWARD_MIN} stamps. You have ${stamps}, so ${REWARD_MIN - stamps} more to go.`}
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
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted">
        The voucher code is generated from your account and isn&apos;t validated on-chain by the organizer. Other community rewards will be added here.
      </p>
    </div>
  );
}
