"use client";

import React, { useState } from "react";
import { EditorialFooter } from "@/components/layout/Footer";
import { 
  Search, 
  MapPin, 
  Calendar,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Music,
  Tent,
  Mic2,
  Palette,
  Moon,
  Trophy,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { Badge } from "@/components/ui/badge";

const mockEvents = [
  { id: "1", name: "Java Music Festival 2026", location: "JIExpo, Jakarta", date: "15-17 Jul", price: "1.5M", category: "MUSIC", organizer: "Ismaya Live", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800" },
  { id: "2", name: "LANY: Jakarta Tour", location: "Beach City Stadium", date: "09 Oct", price: "1.2M", category: "MUSIC", organizer: "TEM Presents", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800" },
  { id: "3", name: "Art Jakarta 2026", location: "JIExpo, Jakarta", date: "28-30 Aug", price: "250K", category: "ART", organizer: "Art Jakarta", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800" },
  { id: "4", name: "Future of Web3", location: "The Sultan Hotel", date: "12 Sep", price: "750K", category: "CONFERENCE", organizer: "Level 7", image: "https://images.unsplash.com/photo-1540575861501-7ad0582371f3?auto=format&fit=crop&q=80&w=800" },
  { id: "5", name: "Pesta Pora", location: "Gambir Expo", date: "22 Sep", price: "350K", category: "MUSIC", organizer: "Boss Creator", image: "https://images.unsplash.com/photo-1514525253361-bee43833075d?auto=format&fit=crop&q=80&w=800" },
  { id: "6", name: "Soundrenaline 2026", location: "GWK Bali", date: "05 Dec", price: "1.8M", category: "FESTIVAL", organizer: "Ravel Ent", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800" },
  { id: "7", name: "Startup Summit", location: "Bali Convention Center", date: "14 Nov", price: "2.5M", category: "CONFERENCE", organizer: "SEA Startup", image: "https://images.unsplash.com/photo-1531050171669-0127e79201f0?auto=format&fit=crop&q=80&w=800" },
  { id: "8", name: "Jazz Goes To Campus", location: "UI Depok", date: "10 Nov", price: "150K", category: "MUSIC", organizer: "FEB UI", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800" },
  { id: "9", name: "DWP 2026", location: "GWK Bali", date: "12-14 Dec", price: "2.1M", category: "NIGHTLIFE", organizer: "Ismaya Live", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800" },
  { id: "10", name: "Jakarta Fashion Week", location: "PIM 3", date: "22-28 Oct", price: "100K", category: "ART", organizer: "GCM Group", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800" },
  { id: "11", name: "Joyland Festival", location: "Senayan GBK", date: "24-26 Nov", price: "1.1M", category: "FESTIVAL", organizer: "Plainsong Live", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800" },
  { id: "12", name: "Hammersonic", location: "Carnival Beach", date: "18-19 Mar", price: "2.5M", category: "MUSIC", organizer: "Ravel Ent", image: "https://images.unsplash.com/photo-1514525253361-bee43833075d?auto=format&fit=crop&q=80&w=800" },
];

const categories = [
  { name: "ALL", variant: "default" as const },
  { name: "MUSIC", variant: "teal" as const },
  { name: "ART", variant: "coral" as const },
  { name: "FESTIVAL", variant: "peach" as const },
  { name: "CONFERENCE", variant: "lavender" as const },
  { name: "NIGHTLIFE", variant: "mint" as const }
];

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filteredEvents = selectedCategory === "ALL" 
    ? mockEvents 
    : mockEvents.filter(event => event.category === selectedCategory);

  return (
    <main className="min-h-screen bg-background text-text-main flex flex-col pt-0 font-inter transition-all duration-500">
      
      {/* 1. DISCOVERY HEADER */}
      <section className="pt-32 pb-12 px-6 md:px-12 border-b border-on-background/5 bg-surface-low">
        <div className="max-w-[1440px] mx-auto space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
               <h1 className="text-4xl font-black lowercase italic tracking-tight text-primary">Discover Archive.</h1>
               <p className="text-base text-text-muted italic max-w-md">Search curated music, art, and cultural rituals.</p>
            </div>
            <div className="flex w-full md:w-auto gap-4">
              <div className="relative flex-1 md:w-[420px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-40" />
                <input 
                  type="text" 
                  placeholder="Find your next ritual..." 
                  className="w-full bg-background border border-on-background/10 px-12 py-4 text-sm font-medium focus:border-accent-teal outline-none transition-all rounded-full shadow-sm italic"
                />
              </div>
              <button className="px-6 py-4 border border-on-background/10 hover:border-accent-teal transition-all flex items-center gap-3 rounded-full bg-background shadow-sm group">
                <SlidersHorizontal className="w-4 h-4 text-accent-teal" />
                <span className="text-[11px] font-bold uppercase tracking-widest italic text-primary">Filter</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
             {categories.map((cat) => (
               <button 
                 key={cat.name}
                 onClick={() => setSelectedCategory(cat.name)}
                 className={cn(
                   "transition-all duration-300 transform active:scale-95",
                   selectedCategory === cat.name ? "opacity-100 scale-105" : "opacity-40 hover:opacity-70 scale-100"
                 )}
               >
                 <Badge variant={cat.variant} className="px-6 py-2.5 rounded-full shadow-sm text-[10px]">
                   {cat.name}
                 </Badge>
               </button>
             ))}
          </div>
        </div>
      </section>

      {/* 2. SYSTEMATIC GRID FEED */}
      <section className="py-16 px-6 md:px-12 bg-background relative z-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
              <ScrollReveal key={event.id}>
                <EventDiscoveryCard event={event} />
              </ScrollReveal>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="py-32 text-center space-y-4">
              <p className="text-xl italic text-text-muted">No rituals found in this archive segment.</p>
              <button 
                onClick={() => setSelectedCategory("ALL")}
                className="text-accent-teal font-bold uppercase tracking-widest text-sm underline underline-offset-4"
              >
                Reset Archive View
              </button>
            </div>
          )}

          {filteredEvents.length > 0 && (
            <div className="flex justify-center pt-20">
               <button className="px-16 py-6 border border-primary text-primary text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-primary hover:text-on-primary transition-all duration-500 italic rounded-full shadow-lg">
                 More Rituals
               </button>
            </div>
          )}
        </div>
      </section>

      <EditorialFooter />
    </main>
  );
}

function EventDiscoveryCard({ event }: { event: (typeof mockEvents)[0] }) {
  return (
    <Link href={`/events/${event.id}`} className="group flex flex-col bg-surface-low border border-on-background/5 rounded-2xl overflow-hidden h-[480px] shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1">
      {/* Image Area - 70% height */}
      <div className="relative h-[70%] overflow-hidden bg-surface-lowest">
        <img 
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
          src={event.image} 
          alt={event.name}
        />
        <div className="absolute top-4 left-4">
           <Badge variant="default" className="bg-background/90 backdrop-blur-md border border-on-background/5 text-[9px] px-2 py-0.5 font-black tracking-widest">
            {event.category}
           </Badge>
        </div>
      </div>

      {/* Content Area - 30% height */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-60 leading-none">
            {event.organizer}
          </p>
          <h3 className="font-bodoni text-xl italic tracking-tight text-primary leading-tight group-hover:text-accent-teal transition-colors line-clamp-2">
            {event.name}
          </h3>
        </div>

        <div className="space-y-3 pt-3 border-t border-on-background/5">
           <div className="flex justify-between items-center text-text-muted">
              <div className="flex items-center gap-1.5 opacity-60">
                 <MapPin className="w-3.5 h-3.5" />
                 <span className="text-[11px] font-bold uppercase tracking-wider">{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-60">
                 <Calendar className="w-3.5 h-3.5" />
                 <span className="text-[11px] font-bold uppercase tracking-wider">{event.date}</span>
              </div>
           </div>
           <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted italic opacity-40">Entry Archive</span>
              <span className="text-lg font-bold italic tracking-tighter leading-none">Rp {event.price}</span>
           </div>
        </div>
      </div>
    </Link>
  );
}
