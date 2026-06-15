"use client";

import React from "react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { 
  Calendar, 
  MapPin, 
  Ticket,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const myTickets = [
  {
    id: "STX-8829-JKT",
    title: "The Ritual: Jakarta Echoes",
    date: "12 Aug 2026",
    venue: "GBK Stadium",
    city: "Jakarta",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    status: "VERIFIED",
    category: "EXPERIMENTAL / MUSIC"
  },
  {
    id: "STX-9120-JKT",
    title: "Java Music Festival",
    date: "15 Jul 2026",
    venue: "JIExpo",
    city: "Jakarta",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800",
    status: "USED",
    category: "FESTIVAL / JAZZ"
  }
];

export default function MyTicketsPage() {
  return (
    <div className="space-y-20">
      <section className="border-b border-on-background/10 pb-8">
        <ScrollReveal>
          <div className="space-y-4">
            <p className="text-[12px] font-black text-accent uppercase tracking-[0.6em] italic">Ownership Hub</p>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-text-main">Archives</h1>
          </div>
        </ScrollReveal>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        {myTickets.map((ticket, i) => (
          <ScrollReveal key={ticket.id} delay={i * 0.1}>
            <div className="group bg-surface border border-on-background/5 hover:border-accent/40 transition-all duration-700 rounded-2xl overflow-hidden flex flex-col shadow-2xl hover:-translate-y-2">
              {/* Poster 4:5 */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={ticket.image} alt={ticket.title} className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
                <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
                  <span className="px-5 py-2 bg-background/90 backdrop-blur-xl rounded-xl text-[9px] font-black tracking-widest text-accent uppercase italic border border-white/10 shadow-2xl">{ticket.category}</span>
                  <div className={cn(
                    "px-5 py-2 backdrop-blur-xl rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-2xl border",
                    ticket.status === "VERIFIED" ? "bg-accent-olive/90 text-on-primary border-accent-olive/20" : "bg-surface-highest/90 text-text-muted border-white/10"
                  )}>
                    {ticket.status}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="p-10 space-y-8 flex-1 flex flex-col justify-between relative bg-surface">
                <div className="space-y-6">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter group-hover:text-accent transition-colors leading-[0.95] text-text-main">
                    {ticket.title}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-text-muted italic">
                      <Calendar className="w-5 h-5 text-accent-rose/60" />
                      <span className="text-[11px] font-black uppercase tracking-widest">{ticket.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-text-muted italic">
                      <MapPin className="w-5 h-5 text-accent-teal/60" />
                      <span className="text-[11px] font-black uppercase tracking-widest">{ticket.venue}, {ticket.city}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-on-background/5">
                  <Link href={`/dashboard/tickets/${ticket.id}`} className="block">
                    <button className="w-full py-6 bg-on-background/5 hover:bg-accent text-text-muted hover:text-on-primary border border-on-background/5 hover:border-accent transition-all duration-500 text-[11px] font-black uppercase tracking-[0.3em] italic flex items-center justify-center gap-3 group/btn rounded-xl">
                      Access Ledger <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
