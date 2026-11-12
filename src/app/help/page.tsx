"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Minus } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "How is a pass different from a regular ticket?", a: "A pass is a digital ticket in your NEAR wallet. Once scanned at the door, it becomes a permanent badge and adds a stamp to your passport, so it never ends up in the trash." },
  { q: "Do I need an ID card?", a: "No. Your identity is your wallet account. We only ask for a nickname." },
  { q: "How do I get into the event?", a: "Open your pass on your phone and show the QR. The organizer scans it at the door." },
  { q: "What are stamps and passport levels?", a: "Every event you attend gives you a stamp. 1 stamp makes you a Newcomer, 3 a Regular, 5 a Base Keeper. Higher levels unlock private chat, voting, and discounts." },
  { q: "I don't have a NEAR wallet yet.", a: "You can create a free testnet account through MyNearWallet when choosing a wallet. On testnet, test USDC can be minted for free from the checkout page." },
  { q: "What if I'm an organizer?", a: "Connect your wallet, choose Organizer, then fill in your community details. After that you can create events and scan passes at the door." },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-white text-[#141414] flex flex-col">
      <section data-nav-theme="light" className="relative pt-36 pb-24 px-6 md:px-12 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_80%)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-12">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3F7D00]">Help</p>
            <h1 className="text-[40px] md:text-[64px] font-extrabold tracking-[-0.045em] leading-none">Frequently asked questions.</h1>
          </div>

          <div className="divide-y divide-black/10 border-y border-black/10">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-6 py-6 text-left">
                  <span className="text-[19px] font-semibold tracking-[-0.01em]">{f.q}</span>
                  <span className={cn("shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors", open === i ? "bg-[#9CFF1E]" : "bg-black/5")}>
                    {open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                {open === i && <p className="pb-6 pr-14 text-[#5C6157] leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>

          <p className="text-[#5C6157]">
            Still unanswered? Write to us through the <Link href="/#contact" className="text-[#3F7D00] font-semibold underline underline-offset-4">contact form</Link>.
          </p>
        </div>
      </section>
      <EditorialFooter />
    </main>
  );
}
