"use client";

import React from "react";
import { EditorialFooter } from "@/components/layout/Footer";
import { ScrollReveal, ParallaxWrapper } from "@/components/animations/SpatialSystem";
import { 
  ArrowRight,
  MapPin,
  Calendar,
  TrendingUp,
  Star,
  Trophy,
  Zap,
  Music,
  Tent,
  Palette,
  Mic2,
  Moon
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Mock Data
const allEvents = [
  { id: "1", title: "Java Music Festival", organizer: "Ismaya Live", location: "JIExpo", city: "Jakarta", date: "15-17 Jul", price: "1.5M", category: "MUSIC", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800" },
  { id: "2", title: "LANY: a beautiful blur", organizer: "TEM Presents", location: "Beach City Stadium", city: "Jakarta", date: "09 Oct", price: "1.2M", category: "MUSIC", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800" },
  { id: "3", title: "Art Jakarta 2026", organizer: "Art Jakarta", location: "JIExpo", city: "Jakarta", date: "28-30 Aug", price: "250K", category: "ART", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800" },
  { id: "4", title: "Future of Web3", organizer: "Level 7", location: "The Sultan Hotel", city: "Jakarta", date: "12 Sep", price: "750K", category: "CONFERENCE", image: "https://images.unsplash.com/photo-1540575861501-7ad0582371f3?auto=format&fit=crop&q=80&w=800" },
  { id: "5", title: "Soundrenaline 2026", organizer: "Ravel Ent", location: "GWK Bali", city: "Bali", date: "05 Dec", price: "1.8M", category: "MUSIC", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800" },
  { id: "6", title: "Jakarta Fashion Week", organizer: "GCM Group", location: "PIM 3", city: "Jakarta", date: "22-28 Oct", price: "100K", category: "ART", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800" },
  { id: "7", name: "Joyland Festival", location: "Senayan GBK", city: "Jakarta", date: "24-26 Nov", price: "1.1M", category: "FESTIVAL", organizer: "Plainsong Live", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800" },
  { id: "8", name: "DWP 2026", location: "GWK Bali", city: "Bali", date: "12-14 Dec", price: "2.1M", category: "NIGHTLIFE", organizer: "Ismaya Live", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800" },
];

export default function Home() {
  return (
    <main className="relative flex flex-col min-h-screen bg-background text-text-main overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[80vh] flex items-center pt-16 overflow-hidden border-b border-on-background/5">
        <ParallaxWrapper speed={0.9} className="absolute inset-0 z-0">
           <img 
             src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=2400" 
             alt="Hero Background" 
             className="w-full h-full object-cover brightness-[1.02] contrast-105"
           />
        </ParallaxWrapper>

        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent z-[1]" />

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-3xl space-y-10">
            <ScrollReveal>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold tracking-[0.15em] text-accent-teal uppercase italic">Curated No. 04</span>
                  <div className="h-[1px] w-8 bg-on-background/10" />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Archive Issue 88</span>
                </div>
                <h1 className="text-h1 leading-[1.0] text-primary lowercase">
                  The Ritual: <br /> <span className="text-accent-peach font-normal italic">Jakarta Echoes.</span>
                </h1>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="space-y-8">
                 <p className="text-lg font-medium text-text-muted italic max-w-lg leading-relaxed">An immersive journey through subterranean soundscapes. A curated architectural music experience.</p>
                 <div className="flex gap-3">
                   <Link href="/events/1">
                     <button className="px-8 py-4 bg-primary text-on-primary font-bold uppercase tracking-widest rounded-full hover:bg-accent-teal transition-all shadow-lg italic text-xs">Experience Now</button>
                   </Link>
                   <Link href="/events">
                    <button className="px-8 py-4 border border-on-background/20 font-bold uppercase tracking-widest rounded-full hover:bg-on-background/5 transition-all italic text-xs">View Archive</button>
                   </Link>
                 </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 2. TRENDING THIS WEEK (HORIZONTAL) */}
      <section className="py-20 px-6 md:px-12 bg-background relative z-10">
        <div className="max-w-[1440px] mx-auto space-y-10">
          <div className="flex justify-between items-end border-b border-on-background/5 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-accent-teal">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest italic">In Focus</span>
              </div>
              <h2 className="text-h2">Trending This Week.</h2>
            </div>
            <Link href="/events" className="text-label text-accent-teal hover:text-primary transition-colors flex items-center gap-2 group italic">
              See All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="horizontal-scroll no-scrollbar -mx-2 px-2">
            {allEvents.slice(0, 5).map((event, i) => (
              <div key={i} className="w-[280px] md:w-[340px]">
                <EventStandardCard event={event} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. POPULAR THIS WEEK (DENSE GRID) */}
      <section className="py-20 px-6 md:px-12 bg-surface-low border-y border-on-background/5">
        <div className="max-w-[1440px] mx-auto space-y-12">
          <div className="flex justify-between items-end border-b border-on-background/10 pb-6">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-accent-coral">
                  <Star className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest italic">Popular Right Now</span>
               </div>
               <h2 className="text-h2 italic lowercase">Community Favorites.</h2>
            </div>
            <Link href="/events" className="text-label text-accent-teal hover:text-primary transition-colors flex items-center gap-2 group italic">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allEvents.slice(0, 8).map((event, i) => (
              <EventStandardCard key={i} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. RECOMMENDED (GRID) */}
      <section className="py-24 px-6 md:px-12 bg-background relative z-10">
        <div className="max-w-[1440px] mx-auto space-y-12">
          <div className="text-center space-y-2 border-b border-on-background/5 pb-12">
             <h2 className="text-h2 italic lowercase">Curated Discovery.</h2>
             <p className="text-lg text-text-muted italic max-w-xl mx-auto opacity-60">Selected rituals based on your society sync and cultural preferences.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <EventLargeEditorialCard event={allEvents[0]} />
            <EventLargeEditorialCard event={allEvents[4]} />
          </div>
        </div>
      </section>

      {/* 5. UPCOMING HIGHLIGHTS */}
      <section className="py-24 px-6 md:px-12 bg-background border-t border-on-background/5">
        <div className="max-w-[1440px] mx-auto space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <h2 className="text-[40px] font-black italic lowercase leading-none tracking-tight">Upcoming Highlights.</h2>
            <p className="text-lg text-text-muted italic max-w-sm opacity-60">The most significant rituals being archived in the coming months.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
               <EventLargeEditorialCard event={allEvents[2]} />
            </div>
            <div className="md:col-span-4 flex flex-col gap-8">
               <EventStandardCard event={allEvents[1]} />
               <EventStandardCard event={allEvents[3]} />
            </div>
          </div>
        </div>
      </section>

      <EditorialFooter />
    </main>
  );
}

function EventStandardCard({ event }: { event: any }) {
  return (
    <Link href={`/events/${event.id}`} className="group flex flex-col bg-surface-low border border-on-background/5 rounded-2xl overflow-hidden h-[480px] transition-all duration-500 hover:-translate-y-1 hover:shadow-md">
      {/* Image Area - 70% height */}
      <div className="relative h-[70%] overflow-hidden bg-surface-lowest">
        <img 
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
          src={event.image} 
          alt={event.title || event.name}
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
            {event.title || event.name}
          </h3>
        </div>

        <div className="space-y-3 pt-3 border-t border-on-background/5">
           <div className="flex justify-between items-center text-text-muted">
              <div className="flex items-center gap-1.5 opacity-60">
                 <MapPin className="w-3.5 h-3.5" />
                 <span className="text-[11px] font-bold uppercase tracking-wider">{event.city || event.location}</span>
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

function EventLargeEditorialCard({ event }: { event: any }) {
  return (
    <Link href={`/events/${event.id}`} className="group relative flex flex-col h-full bg-surface-low border border-on-background/5 rounded-3xl overflow-hidden min-h-[480px]">
      <div className="absolute inset-0">
        <img 
          src={event.image} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          alt={event.title || event.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
      </div>
      <div className="relative mt-auto p-10 space-y-6">
        <div className="flex items-center gap-4">
           <Badge variant="teal" className="px-4 py-1.5">{event.category}</Badge>
           <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest">{event.organizer}</span>
        </div>
        <h3 className="font-bodoni text-4xl text-white italic tracking-tight leading-none group-hover:text-accent-peach transition-colors">{event.title || event.name}</h3>
        <div className="flex justify-between items-end pt-8 border-t border-white/10">
           <div className="flex gap-8 text-white/80">
              <div className="flex items-center gap-2">
                 <MapPin className="w-5 h-5 opacity-40" />
                 <span className="text-sm font-bold uppercase tracking-widest">{event.city || event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                 <Calendar className="w-5 h-5 opacity-40" />
                 <span className="text-sm font-bold uppercase tracking-widest">{event.date}</span>
              </div>
           </div>
           <div className="text-right">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1 italic">Archive Entry</p>
              <p className="text-3xl font-black text-white italic leading-none">Rp {event.price}</p>
           </div>
        </div>
      </div>
    </Link>
  );
}
