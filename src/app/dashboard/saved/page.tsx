"use client";

import React from "react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { 
  MapPin, 
  Calendar,
  Ticket
} from "lucide-react";
import Link from "next/link";

const savedEvents = [
  { id: "3", title: "Art Jakarta 2026", location: "JIExpo", city: "Jakarta", date: "28-30 Aug", price: "250K", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800", category: "Art", organizer: "Art Jakarta" },
  { id: "4", title: "Future of Web3", location: "The Sultan Hotel", city: "Jakarta", date: "12 Sep", price: "750K", image: "https://images.unsplash.com/photo-1540575861501-7ad0582371f3?auto=format&fit=crop&q=80&w=800", category: "Talks", organizer: "Level 7" },
];

export default function SavedEventsPage() {
  return (
    <div className="space-y-12">
      <section className="border-b border-on-background/5 pb-6">
        <ScrollReveal>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] italic">Archive</p>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-text-main">Saved Events</h1>
          </div>
        </ScrollReveal>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {savedEvents.map((event, i) => (
          <ScrollReveal key={event.id} delay={i * 0.1}>
            <Link href={`/events/${event.id}`} className="group block space-y-6">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] border border-on-background/5 bg-surface shadow-2xl transition-all duration-700 group-hover:border-accent/20">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
                <div className="absolute top-6 left-6">
                  <span className="px-3 py-1 bg-surface-low/80 backdrop-blur-md rounded-full text-[8px] font-black tracking-widest text-accent uppercase italic border border-on-background/5">{event.category}</span>
                </div>
              </div>
              <div className="space-y-4 px-2">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-text-muted/30 uppercase tracking-widest italic">{event.organizer}</p>
                  <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-accent transition-colors leading-tight italic text-text-main">{event.title}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-text-muted/40 italic">
                    <Calendar className="w-3.5 h-3.5 text-accent/60" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-muted/40 italic">
                    <MapPin className="w-3.5 h-3.5 text-accent/60" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{event.location}, {event.city}</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-main pt-2 border-t border-on-background/5 mt-2">
                    <Ticket className="w-3 h-3 text-accent/60" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Starting from Rp {event.price}</span>
                  </div>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
