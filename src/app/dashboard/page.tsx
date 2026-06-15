"use client";

import React from "react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { 
  Calendar, 
  MapPin, 
  Ticket,
  Heart,
  ShieldCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  Zap,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const upcomingEvents = [
  {
    id: "STX-8829-JKT",
    title: "The Ritual: Jakarta Echoes",
    date: "12 Aug 2026",
    venue: "GBK Stadium",
    city: "Jakarta",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    status: "CONFIRMED",
  }
];

const recentActivity = [
  { type: "Experience Sync", event: "The Ritual", date: "2h ago", status: "Success" },
  { type: "Society Verified", event: "Identity", date: "1d ago", status: "Active" },
  { type: "Ticket Entry", event: "Museum Macan", date: "3d ago", status: "Archive" },
  { type: "Marketplace", event: "Listed Access", date: "5d ago", status: "Pending" }
];

export default function OverviewPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-12">
      {/* 1. COMPACT WELCOME SECTION */}
      <section className="space-y-4">
        <ScrollReveal>
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-accent-teal uppercase tracking-widest italic leading-none">Member Presence</p>
            <h1 className="text-3xl font-black italic tracking-tight lowercase text-primary">
              Welcome back, <span className="text-accent-peach font-normal">{user?.name || "Curator"}</span>
            </h1>
          </div>
        </ScrollReveal>
      </section>

      {/* 2. DENSE STATS GRID */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Passes", value: "01", icon: Ticket, color: "text-accent-teal" },
          { label: "Saved Rituals", value: "12", icon: Heart, color: "text-accent-coral" },
          { label: "Society Level", value: "Gold", icon: ShieldCheck, color: "text-accent-mint" },
          { label: "Society Points", value: "2.4K", icon: Zap, color: "text-accent-lavender" },
        ].map((stat, i) => (
          <ScrollReveal key={stat.label} delay={i * 0.05}>
            <div className="group space-y-4 bg-surface p-6 rounded-2xl border border-on-background/5 shadow-sm transition-all hover:border-accent-teal">
              <div className="flex justify-between items-center">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest italic opacity-40">{stat.label}</span>
              </div>
              <p className="text-2xl font-black italic tracking-tighter uppercase text-primary">{stat.value}</p>
            </div>
          </ScrollReveal>
        ))}
      </section>

      {/* 3. DENSE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* UPCOMING RITUALS (DENSE) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-end border-b border-on-background/5 pb-4">
            <h2 className="text-xl font-bold italic tracking-tight lowercase">Upcoming Rituals.</h2>
            <Link href="/dashboard/tickets" className="text-[10px] font-bold text-accent-teal hover:text-primary transition-all group italic uppercase tracking-widest">
              Full Collection <ChevronRight className="inline w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {upcomingEvents.map((event, i) => (
              <ScrollReveal key={event.id} delay={i * 0.1}>
                <Link href={`/dashboard/tickets/${event.id}`} className="group block">
                  <div className="flex gap-6 p-6 bg-surface border border-on-background/5 rounded-2xl hover:border-accent-teal/40 transition-all shadow-sm">
                    <div className="relative w-32 aspect-[4/5] overflow-hidden rounded-xl shrink-0">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-xl font-bold italic tracking-tight group-hover:text-accent-teal transition-colors leading-tight text-primary line-clamp-1">{event.title}</h3>
                          <Badge variant="teal" className="text-[9px] px-2 py-0.5">{event.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-text-muted italic opacity-60">
                          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {event.date}</div>
                          <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {event.venue}, {event.city}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-accent-teal text-[10px] font-bold uppercase tracking-widest italic group/btn pt-4 border-t border-on-background/5 mt-4 transition-colors">
                        Enter Experience Access <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* RECENT LEDGER (DENSE) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex justify-between items-end border-b border-on-background/5 pb-4">
            <h2 className="text-xl font-bold italic tracking-tight lowercase">Society Ledger.</h2>
          </div>

          <div className="bg-surface border border-on-background/5 rounded-2xl overflow-hidden shadow-sm divide-y divide-on-background/5">
            {recentActivity.map((activity, i) => (
              <div key={i} className="p-5 flex justify-between items-center group hover:bg-on-background/5 transition-colors cursor-default">
                <div className="space-y-1">
                  <p className="text-sm font-bold italic tracking-tight text-primary group-hover:text-accent-teal transition-colors leading-none">{activity.type}</p>
                  <p className="text-[9px] text-text-muted/60 uppercase tracking-widest font-bold italic">{activity.event} • {activity.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] text-accent-teal font-bold uppercase tracking-widest italic border border-accent-teal/10 px-2 py-0.5 rounded-full">{activity.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-accent-teal/5 border border-accent-teal/10 rounded-2xl space-y-4 shadow-sm relative overflow-hidden group">
             <div className="flex items-center gap-3 text-accent-teal">
               <TrendingUp className="w-4 h-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest italic">Member Sync</span>
             </div>
             <p className="text-xs text-text-muted leading-relaxed font-medium italic opacity-80">
                Creative presence fully archived. All rituals are verified and valid.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
