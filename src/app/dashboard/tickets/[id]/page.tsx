"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { 
  Calendar, 
  MapPin, 
  Ticket as TicketIcon, 
  ShieldCheck, 
  QrCode, 
  ArrowUpRight, 
  Download, 
  RefreshCcw, 
  History,
  ChevronLeft,
  ExternalLink,
  Clock,
  User,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const ticketsData = [
  {
    id: "STX-8829-JKT",
    title: "The Ritual: Jakarta Echoes",
    category: "EXPERIMENTAL / MUSIC",
    date: "12 Aug 2026",
    time: "21:00",
    venue: "GBK Stadium",
    city: "Jakarta",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    status: "VERIFIED",
    type: "VIP ACCESS",
    owner: "Curator",
    purchaseDate: "12 Jun 2026",
    wallet: "8Kf2...X9Pq",
    txHash: "0x4f...a9L2",
    mintDate: "12 Jun 2026",
    timeline: [
      { date: "12 Jun 2026", label: "Purchased", status: "COMPLETE" },
      { date: "12 Jun 2026", label: "Minted On-Chain", status: "COMPLETE" },
      { date: "13 Jun 2026", label: "Verified Protocol", status: "ACTIVE" },
    ]
  },
  {
    id: "STX-9120-JKT",
    title: "Java Music Festival",
    category: "FESTIVAL / JAZZ",
    date: "15 Jul 2026",
    time: "14:00",
    venue: "JIExpo",
    city: "Jakarta",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800",
    status: "USED",
    type: "GENERAL ADMISSION",
    owner: "Curator",
    purchaseDate: "05 Jun 2026",
    wallet: "8Kf2...X9Pq",
    txHash: "0x7d...c2m1",
    mintDate: "05 Jun 2026",
    timeline: [
      { date: "05 Jun 2026", label: "Purchased", status: "COMPLETE" },
      { date: "05 Jun 2026", label: "Minted On-Chain", status: "COMPLETE" },
      { date: "15 Jul 2026", label: "Ticket Used", status: "ARCHIVED" },
    ]
  }
];

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const ticket = ticketsData.find(t => t.id === id);

  if (!ticket) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8">
        <ScrollReveal>
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-surface flex items-center justify-center mx-auto mb-8 rounded-2xl border border-on-background/5 shadow-2xl">
              <TicketIcon className="w-8 h-8 text-text-muted/20" />
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-text-main">Archive Not Found</h1>
            <p className="text-text-muted/40 text-sm max-w-xs mx-auto italic font-medium">The requested digital asset could not be synchronized from the archival manifest.</p>
          </div>
        </ScrollReveal>
        <button 
          onClick={() => router.push("/dashboard/tickets")}
          className="px-8 py-3 bg-white/[0.03] border border-on-background/10 text-text-muted/60 text-[10px] font-black uppercase tracking-widest italic hover:bg-accent hover:text-background hover:border-accent transition-all rounded-full"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1000px] mx-auto">
      {/* HEADER */}
      <section className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted/30 hover:text-accent transition-all text-[9px] font-black uppercase tracking-[0.2em] italic"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Tickets
        </button>
        <div className="flex items-center gap-3 px-4 py-2 bg-accent-lime/5 border border-accent-lime/10 rounded-full shadow-lg shadow-accent-lime/5">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-lime" />
          <span className="text-[10px] font-black text-accent-lime uppercase tracking-widest italic">Authenticity Verified</span>
        </div>
      </section>

      {/* TICKET PASS CONTAINER */}
      <ScrollReveal>
        <div className="flex flex-col lg:flex-row shadow-2xl rounded-[40px] overflow-hidden border border-on-background/5 bg-surface shadow-accent/5">
           {/* LEFT: POSTER */}
           <div className="lg:w-1/3 relative aspect-[3/4] lg:aspect-auto">
             <img src={ticket.image} alt={ticket.title} className="w-full h-full object-cover grayscale-[0.2] brightness-90" />
             <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
             <div className="absolute bottom-8 left-8 right-8">
                <p className="text-[9px] font-black text-accent uppercase tracking-[0.4em] italic mb-2 leading-none">{ticket.category}</p>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-tight text-text-main drop-shadow-2xl">{ticket.title}</h1>
             </div>
           </div>

           {/* RIGHT: DETAILS (BOARDING PASS STYLE) */}
           <div className="flex-1 bg-surface-alt p-10 flex flex-col justify-between border-l border-on-background/5 relative">
              {/* Top Section */}
              <div className="flex justify-between items-start border-b border-on-background/5 pb-8 mb-8">
                 <div className="space-y-6 text-text-main">
                    <div className="flex gap-12">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest italic">Date</p>
                          <p className="text-lg font-black italic uppercase text-text-main tracking-tighter leading-none">{ticket.date}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest italic">Time</p>
                          <p className="text-lg font-black italic uppercase text-text-main tracking-tighter leading-none">{ticket.time}</p>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest italic">Venue</p>
                       <p className="text-base font-black italic uppercase text-text-main tracking-tighter leading-none">{ticket.venue}, {ticket.city}</p>
                    </div>
                 </div>
                 <div className="p-3 bg-white rounded-xl shadow-lg border border-white/10">
                    <QrCode className="w-24 h-24 text-background" strokeWidth={1.5} />
                 </div>
              </div>

              {/* Middle Section */}
              <div className="grid grid-cols-2 gap-y-8 gap-x-12 pb-8 border-b border-on-background/5 mb-8">
                 {[
                   { label: "Archival Owner", value: ticket.owner, icon: User },
                   { label: "Ticket Number", value: ticket.id.split('-')[1], icon: TicketIcon },
                   { label: "Access Tier", value: ticket.type, icon: Zap },
                   { label: "Sync ID", value: ticket.id, icon: Clock }
                 ].map((item) => (
                   <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center gap-2 text-text-muted/30">
                         <item.icon className="w-3 h-3" />
                         <p className="text-[8px] font-black uppercase tracking-widest italic leading-none">{item.label}</p>
                      </div>
                      <p className="text-sm font-black italic uppercase text-text-muted/60 tracking-tight leading-none">{item.value}</p>
                   </div>
                 ))}
              </div>

              {/* Bottom Section: Blockchain */}
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                 <div className="space-y-4 w-full md:w-auto">
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-text-muted/30 uppercase tracking-widest italic leading-none">Wallet Hash</p>
                       <p className="text-[10px] font-mono font-bold text-text-muted/40 truncate max-w-[120px]">{ticket.wallet}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-text-muted/30 uppercase tracking-widest italic leading-none">Protocol State</p>
                       <p className="text-[10px] font-black italic uppercase text-accent-lime tracking-widest">On-Chain • {ticket.mintDate}</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-accent text-background text-[9px] font-black uppercase tracking-widest hover:bg-accent-vibrant transition-all italic rounded-full shadow-lg">
                       <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] border border-on-background/10 text-text-muted/60 text-[9px] font-black uppercase tracking-widest hover:bg-white/[0.01] transition-all italic rounded-full">
                       <ArrowUpRight className="w-3.5 h-3.5" /> Transfer
                    </button>
                 </div>
              </div>

              {/* Jagged Edge Simulation */}
              <div className="absolute top-0 bottom-0 -left-2 w-4 flex flex-col justify-around py-4">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="w-4 h-4 bg-background rounded-full -ml-2" />
                ))}
              </div>
           </div>
        </div>
      </ScrollReveal>

      {/* TRANSACTIONAL LEDGER */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
         <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-on-background/5 pb-4 text-text-muted/20">
               <History className="w-4 h-4" />
               <h2 className="text-sm font-black italic uppercase tracking-[0.2em]">Archival Ledger</h2>
            </div>
            <div className="space-y-4">
               {ticket.timeline.map((item, i) => (
                 <div key={i} className="flex gap-6 items-start relative pl-2">
                    {i !== ticket.timeline.length - 1 && (
                      <div className="absolute left-3 top-5 bottom-0 w-[1px] bg-on-background/5" />
                    )}
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0 relative z-10",
                      item.status === "ACTIVE" ? "bg-accent shadow-[0_0_10px_#B79DFF]" : "bg-white/10"
                    )} />
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-black italic uppercase tracking-widest text-text-muted/60 leading-none">{item.label}</p>
                       <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/20 leading-none">{item.date}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="p-8 border border-on-background/5 bg-white/[0.01] rounded-3xl space-y-6 shadow-xl">
            <div className="flex items-center gap-3 text-accent/40">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest italic">Verification Protocol</span>
            </div>
            <p className="text-xs text-text-muted/40 leading-relaxed font-medium italic">This digital asset is cryptographically verified on the Solana architectural ledger. Any transfer of ownership will be automatically synchronized with the global manifest.</p>
            <div className="flex items-center gap-4 pt-2">
               <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/20">ID: {ticket.txHash}</span>
               <ExternalLink className="w-3 h-3 text-text-muted/10 hover:text-accent cursor-pointer transition-colors" />
            </div>
         </div>
      </section>
    </div>
  );
}
