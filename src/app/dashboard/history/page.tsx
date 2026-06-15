"use client";

import React from "react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { History as HistoryIcon, ExternalLink, Download } from "lucide-react";

const transactions = [
  { id: "TX-9921", event: "The Ritual: Jakarta Echoes", type: "Purchase", date: "12 Jun 2026", amount: "Rp 1.500.000", status: "SUCCESS" },
  { id: "TX-9812", event: "Java Music Festival", type: "Purchase", date: "05 Jun 2026", amount: "Rp 1.500.000", status: "SUCCESS" },
  { id: "TX-9755", event: "Museum Macan", type: "Transfer", date: "01 Jun 2026", amount: "-", status: "COMPLETE" },
  { id: "TX-9610", event: "Bali Art Week", type: "Resale", date: "28 May 2026", amount: "Rp 1.200.000", status: "SUCCESS" },
];

export default function HistoryPage() {
  return (
    <div className="space-y-12">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-on-background/5 pb-6">
        <ScrollReveal>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] italic leading-none">Archival Ledger</p>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-text-main">Transaction History</h1>
          </div>
        </ScrollReveal>
        <button className="flex items-center gap-2 text-text-muted/60 text-[9px] font-black uppercase tracking-widest italic border border-on-background/10 px-6 py-3 hover:bg-white/[0.03] transition-all rounded-full">
          <Download className="w-3.5 h-3.5" /> Export Manifest
        </button>
      </section>

      <div className="bg-surface border border-on-background/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-on-background/5 bg-white/[0.01]">
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/30 italic">Asset / Transmission</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/30 italic">Protocol Type</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/30 italic">Sync Date</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/30 italic">Value</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/30 italic">State</th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/30 italic">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-background/5">
              {transactions.map((tx, i) => (
                <tr key={tx.id} className="group hover:bg-white/[0.01] transition-colors cursor-default text-text-main">
                  <td className="px-8 py-8">
                    <span className="text-sm font-black italic uppercase tracking-tight group-hover:text-accent transition-colors leading-none">{tx.event}</span>
                    <p className="text-[8px] text-text-muted/30 uppercase tracking-widest mt-1 italic leading-none">ARCHIVE-ID: {tx.id}</p>
                  </td>
                  <td className="px-8 py-8 text-[10px] font-bold uppercase tracking-widest italic text-text-muted/50">{tx.type}</td>
                  <td className="px-8 py-8 text-[10px] font-bold uppercase tracking-widest italic text-text-muted/50">{tx.date}</td>
                  <td className="px-8 py-8 text-base font-black italic uppercase tracking-tight text-text-main/80">{tx.amount}</td>
                  <td className="px-8 py-8">
                    <span className="px-3 py-1 bg-white/[0.03] text-text-muted/40 text-[8px] font-black uppercase tracking-widest border border-on-background/10 italic rounded-full group-hover:border-accent/20 group-hover:text-accent transition-all">{tx.status}</span>
                  </td>
                  <td className="px-8 py-8 text-text-muted/20 group-hover:text-accent transition-colors">
                     <ExternalLink className="w-4 h-4 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center pt-8">
         <button className="px-8 py-4 bg-white/[0.01] border border-on-background/5 rounded-full text-[9px] font-black uppercase tracking-widest text-text-muted/30 italic hover:text-text-main transition-all">
            Archive Pagination / Next Transmission
         </button>
      </div>
    </div>
  );
}
