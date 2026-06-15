"use client";

import React, { useState } from "react";
import { EditorialFooter } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  ShieldCheck, 
  ArrowLeft,
  Share2,
  Heart,
  ChevronRight,
  Music,
  Info,
  Ticket
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Mock Data
const eventData = {
  id: "1",
  title: "The Ritual: Jakarta Echoes",
  organizer: "Cultural Archive Society",
  category: "Experimental Music",
  date: "12 Aug 2026",
  time: "19:00 - 02:00",
  location: "SCBD District 8",
  city: "Jakarta",
  price: "850K",
  trust: 98.4,
  image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=2400",
  description: "An immersive multi-sensory journey through the subterranean soundscapes of the capital city. This one-night architectural music experience brings together the leading voices in experimental Indonesian sound for a curated ceremony of rhythm and light.",
  lineup: [
    { name: "Diskoria", time: "22:00", role: "Headliner" },
    { name: "Senyawa", time: "21:00", role: "Special Guest" },
    { name: "Batavia Madrigal", time: "20:00", role: "Opening" }
  ],
  venue: {
    name: "The Subterranean Hall",
    address: "District 8, SCBD, Lot 28",
    capacity: "1,200 Curators"
  }
};

export default function EventDetailPage() {
  const params = useParams();
  const [isLiked, setIsLiked] = useState(false);

  return (
    <main className="min-h-screen bg-background text-text-main font-inter transition-all duration-500">
      
      {/* 1. COMPACT HEADER */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img src={eventData.image} className="w-full h-full object-cover" alt={eventData.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        
        <div className="absolute top-24 left-6 md:left-12 z-10">
           <Link href="/events">
             <button className="flex items-center gap-2 px-5 py-2.5 bg-background/90 backdrop-blur-md border border-on-background/5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-accent-teal hover:text-white transition-all">
               <ArrowLeft className="w-3.5 h-3.5" /> Back to Archive
             </button>
           </Link>
        </div>

        <div className="absolute bottom-8 left-6 md:left-12 right-6 md:right-12 flex flex-col md:flex-row justify-between items-end gap-6">
           <ScrollReveal>
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="teal" className="text-[9px] px-2 py-0.5">{eventData.category}</Badge>
                  <div className="flex items-center gap-1.5 text-primary opacity-60">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent-mint" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Verified Society Access</span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tight lowercase leading-none">{eventData.title}</h1>
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted italic opacity-60">Organized by {eventData.organizer}</p>
             </div>
           </ScrollReveal>

           <ScrollReveal delay={0.2}>
             <div className="flex gap-3">
                <button 
                  onClick={() => setIsLiked(!isLiked)}
                  className={cn("p-3.5 rounded-full border transition-all shadow-sm", isLiked ? "bg-accent-coral border-accent-coral text-white" : "bg-background/80 border-on-background/10 hover:border-accent-coral")}
                >
                  <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                </button>
                <button className="p-3.5 rounded-full bg-background/80 border border-on-background/10 hover:border-accent-teal transition-all shadow-sm">
                  <Share2 className="w-5 h-5" />
                </button>
             </div>
           </ScrollReveal>
        </div>
      </section>

      {/* 2. DENSE CONTENT GRID */}
      <section className="container mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
          
          {/* LEFT: MAIN INFO */}
          <div className="lg:col-span-8 space-y-12">
             
             {/* QUICK SPECS */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-y border-on-background/5 py-8">
                <div className="space-y-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Date</span>
                   <p className="text-sm font-bold text-primary italic">{eventData.date}</p>
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Time</span>
                   <p className="text-sm font-bold text-primary italic">{eventData.time}</p>
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Location</span>
                   <p className="text-sm font-bold text-primary italic">{eventData.location}</p>
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Identity</span>
                   <p className="text-sm font-bold text-primary italic">{eventData.trust}% Trust</p>
                </div>
             </div>

             {/* ABOUT */}
             <div className="space-y-6">
                <h2 className="text-xl font-bold italic tracking-tight lowercase">About the Ritual.</h2>
                <p className="text-lg text-text-muted leading-relaxed font-medium italic opacity-80">
                  {eventData.description}
                </p>
             </div>

             {/* LINEUP */}
             <div className="space-y-8">
                <div className="flex items-center gap-3 text-accent-teal">
                   <Music className="w-5 h-5" />
                   <h2 className="text-xl font-bold italic tracking-tight lowercase">Sonic Curators.</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                   {eventData.lineup.map((act, i) => (
                     <div key={i} className="flex justify-between items-center p-6 bg-surface-low border border-on-background/5 rounded-xl group hover:border-accent-teal transition-all shadow-sm">
                        <div className="flex items-center gap-6">
                           <span className="text-lg font-bodoni italic opacity-20 group-hover:opacity-100 transition-opacity">0{i+1}</span>
                           <div>
                              <p className="text-xl font-bold italic tracking-tight">{act.name}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 italic">{act.role}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold italic">{act.time}</p>
                           <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Stage Entry</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* VENUE */}
             <div className="space-y-8">
                <div className="flex items-center gap-3 text-accent-peach">
                   <MapPin className="w-5 h-5" />
                   <h2 className="text-xl font-bold italic tracking-tight lowercase">Venue Archive.</h2>
                </div>
                <div className="relative h-[30vh] rounded-2xl overflow-hidden border border-on-background/10 shadow-md">
                   <img src="https://images.unsplash.com/photo-1540575861501-7ad0582371f3?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" alt="Venue" />
                   <div className="absolute bottom-6 left-6 p-6 bg-background/90 backdrop-blur-xl border border-on-background/10 rounded-xl max-w-sm shadow-xl">
                      <p className="text-lg font-bold italic leading-none mb-1">{eventData.venue.name}</p>
                      <p className="text-xs text-text-muted mb-3 italic">{eventData.venue.address}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-accent-teal italic">Capacity: {eventData.venue.capacity}</p>
                   </div>
                </div>
             </div>

          </div>

          {/* RIGHT: STICKY BOOKING (COMPACT) */}
          <div className="lg:col-span-4">
             <div className="sticky top-28 space-y-6">
                <div className="p-8 bg-surface border border-on-background/10 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Ticket className="w-24 h-24 rotate-12" />
                   </div>
                   
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-accent-teal italic leading-none">Archive Entry</p>
                      <p className="text-3xl font-black italic tracking-tight text-primary leading-none">Rp {eventData.price}</p>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-medium border-b border-on-background/5 pb-2">
                         <span className="opacity-40 italic">Service Charge</span>
                         <span>Rp 25.000</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-medium border-b border-on-background/5 pb-2">
                         <span className="opacity-40 italic">Society Fee</span>
                         <span>Rp 12.000</span>
                      </div>
                   </div>

                   <Link href={`/checkout/${eventData.id}`}>
                     <button className="w-full py-5 bg-primary text-on-primary font-bold uppercase tracking-[0.2em] rounded-full hover:bg-accent-teal transition-all shadow-lg italic flex items-center justify-center gap-2 text-xs">
                        Initiate Booking <ChevronRight className="w-4 h-4" />
                     </button>
                   </Link>

                   <div className="flex items-center gap-2.5 p-3.5 bg-accent-teal/5 rounded-xl border border-accent-teal/10">
                      <Info className="w-4 h-4 text-accent-teal shrink-0" />
                      <p className="text-[9px] font-bold uppercase tracking-wider leading-relaxed opacity-60">Verified identity required. All archives are non-transferable via external platforms.</p>
                   </div>
                </div>

                <div className="p-6 bg-accent-mint/5 border border-accent-mint/20 rounded-2xl space-y-3">
                   <div className="flex items-center gap-2 text-accent-mint">
                      <Users className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Society Presence</span>
                   </div>
                   <p className="text-xs text-text-muted italic leading-relaxed">
                      12 members of your collective have already archived their presence for this ritual.
                   </p>
                </div>
             </div>
          </div>

        </div>
      </section>

      <EditorialFooter />
    </main>
  );
}
