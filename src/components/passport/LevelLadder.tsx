import React from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVELS } from "@/lib/passport";

/** Tiga level paspor beserta perk-nya; yang sudah tercapai ditandai */
export function LevelLadder({ stamps }: { stamps: number }) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {LEVELS.filter((l) => l.key !== "tamu").map((l) => {
        const unlocked = stamps >= l.min;
        return (
          <div
            key={l.key}
            className={cn(
              "p-5 rounded-2xl border space-y-3 transition-colors",
              unlocked ? "border-[#9CFF1E] bg-[#9CFF1E]/10" : "border-on-background/10 bg-white opacity-70"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{l.name}</span>
              {unlocked ? (
                <span className="w-6 h-6 rounded-full bg-[#9CFF1E] flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-[#141414]" strokeWidth={3} />
                </span>
              ) : (
                <Lock className="w-4 h-4 text-text-muted" />
              )}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{l.min} stamps</p>
            <ul className="space-y-1.5 text-xs text-text-muted leading-snug">
              {l.perks.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
