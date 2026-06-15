"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Users, 
  Globe, 
  ShieldCheck,
  CheckCircle2,
  Info
} from "lucide-react";
import Link from "next/link";
import { TrustScore } from "@/components/ui/trust-score";
import { useAuthStore } from "@/store/useAuthStore";

const organizerData = {
  name: "Java Festival Production",
  trustScore: 98,
  verified: true,
  joined: "January 2015",
  eventsHosted: 42,
  followers: "15.4k",
  bio: "Leading event organizer in Southeast Asia, specializing in world-class music festivals and cultural experiences since 2005.",
  socials: {
    website: "https://javafestivalproduction.com",
    twitter: "@javafest",
    instagram: "@javafest",
  },
  recentEvents: [
    {
      id: "1",
      title: "Java Music Festival 2026",
      date: "15-17 July 2026",
      location: "JIExpo Kemayoran, Jakarta",
      image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "2",
      title: "Startup SEA Summit",
      date: "22-24 August 2026",
      location: "Bali International Convention Center",
      image: "https://images.unsplash.com/photo-1540575861501-7ad05823c9f5?auto=format&fit=crop&q=80&w=400",
    }
  ]
};

export default function OrganizerProfilePage() {
  const { user } = useAuthStore();
  
  // TODO: Fetch real organizer data based on URL parameter or current user
  const displayData = user?.role === "organizer" ? {
    ...organizerData,
    name: user.name || organizerData.name,
    // Real score would come from backend scoring engine
  } : organizerData;

  return (
    <main className="min-h-screen bg-background flex flex-col pt-20 text-white">
      <div className="container-editorial py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-20">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-12">
            <div className="border border-border-main p-12 bg-white/5 space-y-10">
              <div className="w-32 h-32 border border-border-main flex items-center justify-center font-bodoni italic text-5xl mx-auto bg-primary text-black">
                {displayData.name.split(" ").map(n => n[0]).join("")}
              </div>
              
              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bodoni italic tracking-tight uppercase leading-none">{displayData.name}</h1>
                  {displayData.verified && (
                    <span className="text-label text-[8px] text-accent border border-accent/20 px-3 py-1 inline-block">Authenticated Partner</span>
                  )}
                </div>
                <div className="flex justify-center">
                  <TrustScore score={displayData.trustScore} size="sm" />
                </div>
              </div>

              <div className="flex items-center justify-center space-x-10 border-t border-b border-border-main py-8">
                <div className="text-center space-y-2">
                  <p className="text-2xl font-inter font-light tracking-tighter">{displayData.eventsHosted}</p>
                  <p className="text-label text-[8px] opacity-40">Archive Size</p>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-inter font-light tracking-tighter">{displayData.followers}</p>
                  <p className="text-label text-[8px] opacity-40">Followers</p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button className="w-full h-14 bg-primary text-black text-label text-xs hover:bg-accent transition-all duration-500 uppercase">Follow</button>
                <button className="w-full h-14 border border-border-main text-white text-label text-xs hover:bg-white/5 transition-all duration-500 uppercase">Message</button>
              </div>
            </div>

            <div className="border border-border-main p-10 bg-white/5 space-y-8">
              <h3 className="text-label text-[10px] opacity-40 border-b border-border-main pb-4 uppercase tracking-[0.4em]">Metadata</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4 text-[10px] font-inter tracking-widest uppercase text-text-muted">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span>Legal Entity: Verified</span>
                </div>
                <div className="flex items-center space-x-4 text-[10px] font-inter tracking-widest uppercase text-text-muted">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>KYC Tier 02 Active</span>
                </div>
                <div className="flex items-center space-x-4 text-[10px] font-inter tracking-widest uppercase text-text-muted">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {displayData.joined}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Events */}
          <div className="lg:col-span-3 space-y-20">
            
            {/* Bio section */}
            <div className="space-y-10">
              <div className="border-b border-border-main pb-8">
                <span className="text-label text-accent">Manifesto</span>
                <h2 className="text-5xl font-bodoni italic tracking-tighter uppercase mt-4 lowercase leading-none">The Curator&apos;s Profile</h2>
              </div>
              <div className="p-16 border border-border-main bg-white/5 space-y-12 relative overflow-hidden">
                <p className="text-3xl font-bodoni italic leading-relaxed text-primary/90 max-w-3xl lowercase">
                  &quot;{displayData.bio}&quot;
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-16 border-t border-border-main/20">
                  <div className="space-y-6">
                    <h4 className="text-label text-[10px] opacity-40 uppercase tracking-[0.4em]">Digital Presence</h4>
                    <div className="flex items-center space-x-8">
                      <a href={displayData.socials.website} className="text-label text-[10px] border-b border-accent pb-1 text-accent hover:opacity-60 transition-opacity">Website</a>
                      <a href="#" className="text-label text-[10px] border-b border-accent pb-1 text-accent hover:opacity-60 transition-opacity">Instagram</a>
                      <a href="#" className="text-label text-[10px] border-b border-accent pb-1 text-accent hover:opacity-60 transition-opacity">X (Twitter)</a>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-label text-[10px] opacity-40 uppercase tracking-[0.4em]">Integrity Metrics</h4>
                    <div className="flex flex-wrap gap-4">
                      <div className="px-4 py-2 border border-accent/20 bg-accent/5 text-[9px] text-accent text-label tracking-widest">
                        99.9% Fulfillment Rate
                      </div>
                      <div className="px-4 py-2 border border-primary/20 bg-primary/5 text-[9px] text-primary text-label tracking-widest">
                        Architectural Standard
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="space-y-12 pb-24">
              <div className="flex items-end justify-between border-b border-border-main pb-8">
                <div className="space-y-2">
                  <span className="text-label text-accent">Portfolio</span>
                  <h2 className="text-4xl font-bodoni italic tracking-tighter uppercase lowercase">Active Exhibitions</h2>
                </div>
                <div className="text-label text-[10px] opacity-40 tracking-[0.4em]">
                  {displayData.recentEvents.length} Assets Available
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l border-border-main bg-white/5">
                {displayData.recentEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="group p-12 border-r border-b border-border-main hover:bg-white/5 transition-all duration-700">
                    <div className="space-y-10">
                      <div className="relative aspect-[4/3] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute top-6 left-6">
                          <div className="bg-black border border-white/20 px-4 py-2 text-label text-[9px]">
                            Trust Score: 98
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-3xl font-bodoni italic lowercase tracking-tight text-white group-hover:text-accent transition-colors leading-none">{event.title}</h4>
                        <div className="space-y-3">
                          <div className="flex items-center text-[10px] text-text-muted font-inter tracking-[0.2em] uppercase">
                            <Calendar className="w-3 h-3 mr-3 text-accent" />
                            {event.date}
                          </div>
                          <div className="flex items-center text-[10px] text-text-muted font-inter tracking-[0.2em] uppercase">
                            <MapPin className="w-3 h-3 mr-3 text-accent" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
