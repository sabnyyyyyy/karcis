import React from "react";
import { Stamp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pass } from "@/types/pass";

// Kemiringan tetap per pass (dari ID) supaya cap terlihat dicap tangan tapi tidak berubah-ubah
const tilt = (id: string) => {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 13) - 6) * 1.2;
};

const shortDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "";

/** Cap bulat untuk satu lencana (pass yang sudah discan) */
export function StampSeal({ pass, className }: { pass: Pass; className?: string }) {
  return (
    <div
      className={cn(
        "aspect-square w-full overflow-hidden rounded-full bg-[#141414] border-[3px] border-[#9CFF1E] text-[#9CFF1E] flex flex-col items-center justify-center text-center p-2.5 gap-0.5 shadow-sm",
        className
      )}
      style={{ transform: `rotate(${tilt(pass.id)}deg)` }}
      title={pass.eventTitle}
    >
      <Stamp className="w-3.5 h-3.5 opacity-80 shrink-0" />
      <span className="text-[9px] sm:text-[10px] font-bold leading-[1.1] line-clamp-3 break-words">{pass.eventTitle}</span>
      <span className="text-[9px] font-mono opacity-70">{shortDate(pass.checkedInAt)}</span>
      {pass.stamps > 1 && <span className="text-[10px] font-extrabold text-[#141414] bg-[#9CFF1E] rounded-full px-1.5 leading-4">+{pass.stamps}</span>}
    </div>
  );
}

/** Slot kosong: tempat stempel berikutnya */
export function EmptyStampSlot({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "aspect-square w-full rounded-full border-2 border-dashed border-[#141414]/20 flex items-center justify-center text-[#141414]/25",
        className
      )}
    >
      <Stamp className="w-5 h-5" />
    </div>
  );
}
