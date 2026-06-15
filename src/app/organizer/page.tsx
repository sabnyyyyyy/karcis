"use client";

import React from "react";
import { EditorialFooter } from "@/components/layout/Footer";
import { ScrollReveal, SpatialLayer } from "@/components/animations/SpatialSystem";
import { 
  Plus, 
  ArrowUpRight, 
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";

const myEvents = [
  {
    id: "1",
    title: "Java Music Festival 2026",
    date: "15 Jul 2026",
    sold: 8420,
    total: 10000,
    revenue: "12.6M",
    status: "ACTIVE"
  },
  {
    id: "2",
    title: "Startup SEA Summit",
    date: "22 Aug 2026",
    sold: 1240,
    total: 2000,
    revenue: "2.7M",
    status: "ACTIVE"
  }
];

export default function OrganizerDashboardPage() {
  return (
    <OrganizerGuard>
      <main className="min-h-screen bg-background text-on-surface spatial-root overflow-hidden">
        {/* PERFORMANCE HEADER SPATIAL */}
        <section className="bg-accent pt-64 pb-32 border-b border-accent/20 relative overflow-hidden spatial-hover">
          <div className="container-editorial relative z-10">
            <div className="max-w-[1440px] mx-auto grid grid-cols-12 w-full items-end gap-12 layer-mid">
              <div className="col-span-8 space-y-8">
                <ScrollReveal>
                  <div className="flex items-center space-x-6 layer-fg">
                    <div className="border border-background/20 px-4 py-1.5 flex items-center space-x-3 bg-background/5 shadow-xl accent-glow">
                      <ShieldCheck className="w-4 h-4 text-background" />
                      <span className="text-label-caps text-background/60 font-black tracking-widest uppercase">Official Partner</span>
                    </div>
                  </div>
                  <h1 className="text-display-lg text-background uppercase font-black tracking-tighter layer-base">
                    Performance <br /> <span className="italic font-normal">Manifest.</span>
                  </h1>
                </ScrollReveal>
              </div>
              
              <div className="col-span-4 flex flex-col items-end space-y-12 pb-4 layer-fg">
                <div className="text-right">
                  <p className="text-label-caps text-background/40 mb-3 font-bold tracking-widest uppercase">Gross Revenue</p>
                  <p className="text-display-lg text-background leading-none italic font-black">IDR 15.3M</p>
                </div>
                <Link href="/organizer/create-event">
                  <Button className="bg-background text-accent hover:bg-primary hover:text-background h-20 px-16 rounded-none text-label-caps italic font-black accent-glow shadow-2xl">
                    INITIATE ACCESS
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-background/5 -skew-y-3 translate-y-1/2 pointer-events-none" />
        </section>

        {/* METRICS STRIP SPATIAL */}
        <section className="bg-background border-b border-accent/10 py-16">
          <div className="container-editorial grid grid-cols-4 gap-12">
            {[
              { label: "Tickets Verified", value: "9,660" },
              { label: "Reputation Index", value: "98.2" },
              { label: "Community Reach", value: "124K" },
              { label: "Growth Velocity", value: "+12.5%" }
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="space-y-4 border-l border-accent/10 pl-12 first:border-none first:pl-0 spatial-hover">
                  <p className="text-display-lg italic leading-none text-accent font-black layer-mid">{stat.value}</p>
                  <p className="text-label-caps text-accent/40 font-bold tracking-widest layer-base">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* MANAGED EXPERIENCES SPATIAL */}
        <section className="container-editorial py-40">
          <div className="space-y-16">
            <div className="flex items-center justify-between border-b-2 border-accent/10 pb-8 layer-mid">
              <h2 className="text-display-lg uppercase italic text-accent font-black tracking-tighter leading-none">Portfolios.</h2>
              <div className="flex items-center space-x-12 text-label-caps text-accent/40 font-black tracking-widest uppercase">
                <button className="text-accent hover:text-primary transition-all underline underline-offset-8">Active</button>
                <button className="hover:text-accent transition-all">Historical</button>
              </div>
            </div>

            <div className="space-y-0 border-t border-white/5">
              {myEvents.map((event, i) => (
                <ScrollReveal key={event.id} delay={i * 0.1}>
                  <div className="group flex flex-col md:flex-row items-center justify-between py-16 border-b border-white/5 hover:bg-accent-soft transition-all px-10 spatial-hover">
                    <div className="flex items-center space-x-16 layer-mid">
                      <div className="w-24 h-24 bg-accent text-background flex items-center justify-center text-display-lg italic font-black accent-glow shadow-2xl group-hover:bg-primary transition-colors">
                        {event.title[0]}
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-display-lg uppercase italic leading-none group-hover:translate-x-6 group-hover:text-accent transition-all duration-1000 font-black tracking-tighter">{event.title}</h3>
                        <p className="text-label-caps text-accent/40 font-black tracking-widest uppercase">{event.date} • {event.status}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-20 text-right layer-fg">
                      <div>
                        <p className="text-label-caps text-accent/20 mb-2 font-bold uppercase tracking-widest">Acquired</p>
                        <p className="text-3xl italic leading-none font-bold text-accent">{event.sold.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-label-caps text-accent/20 mb-2 font-bold uppercase tracking-widest">Valuation</p>
                        <p className="text-3xl italic leading-none text-accent font-black">IDR {event.revenue}</p>
                      </div>
                      <div className="flex items-center justify-end">
                        <Link href={`/organizer/events/${event.id}`}>
                          <Button className="w-16 h-16 bg-accent text-background flex items-center justify-center rounded-none hover:bg-primary transition-all shadow-xl accent-glow">
                            <ArrowUpRight className="w-6 h-6" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <EditorialFooter />
      </main>
    </OrganizerGuard>
  );
}

function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn("button-premium", className)} {...props}>
      {children}
    </button>
  );
}
