"use client";

import React from "react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { 
  Bell,
  ShieldCheck, 
  Zap, 
  Calendar,
  Ticket,
  Clock,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  { 
    id: 1, 
    title: "Ticket Verified Successfully", 
    desc: "Your Java Music Festival 2026 pass has been verified via Smart Verification protocol.", 
    time: "5m ago", 
    type: "success", 
    icon: ShieldCheck 
  },
  { 
    id: 2, 
    title: "Security Infrastructure Update", 
    desc: "SolTix Guard has activated Dynamic QR protocols for your upcoming event.", 
    time: "2h ago", 
    type: "info", 
    icon: Zap 
  },
  { 
    id: 3, 
    title: "Event Synchronization Reminder", 
    desc: "Java Music Festival commences in 12 days. Synchronize your digital presence.", 
    time: "1d ago", 
    type: "warning", 
    icon: Calendar 
  },
  { 
    id: 4, 
    title: "Resale Activity Alert", 
    desc: "A buy offer has been registered for your Art Jakarta 2026 listing.", 
    time: "2d ago", 
    type: "info", 
    icon: Ticket 
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-12">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-on-background/5 pb-6">
        <ScrollReveal>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] italic leading-none">Alert Center</p>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-text-main">Notifications</h1>
          </div>
        </ScrollReveal>
        <button className="text-accent text-[9px] font-black uppercase tracking-widest italic border border-accent/20 px-6 py-3 hover:bg-accent/5 transition-all rounded-full">
          Mark All As Read
        </button>
      </section>

      <div className="bg-surface border border-on-background/5 rounded-[32px] overflow-hidden shadow-2xl divide-y divide-on-background/5">
        {notifications.map((notif, i) => (
          <ScrollReveal key={notif.id} delay={i * 0.1}>
            <div className="p-8 flex items-start space-x-8 hover:bg-white/[0.01] transition-colors group cursor-pointer relative overflow-hidden">
              <div className={cn(
                "w-12 h-12 rounded-2xl border border-on-background/10 flex items-center justify-center shrink-0 transition-all duration-500 group-hover:bg-accent group-hover:text-background shadow-lg",
                notif.type === "success" ? "text-accent-lime" :
                notif.type === "info" ? "text-accent-blue" : "text-accent-orange"
              )}>
                <notif.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black italic uppercase tracking-tighter group-hover:text-accent transition-colors leading-tight text-text-main">{notif.title}</h4>
                  <div className="flex items-center gap-2 text-text-muted/30">
                     <Clock className="w-3 h-3" />
                     <span className="text-[9px] font-black uppercase tracking-widest">{notif.time}</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted/50 font-medium leading-relaxed max-w-2xl tracking-tight italic">{notif.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted/10 group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
          </ScrollReveal>
        ))}
      </div>

      <div className="p-10 bg-surface-low border border-on-background/10 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="space-y-3 text-center md:text-left">
          <div className="flex items-center gap-3 text-accent">
            <Bell className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest italic text-text-muted/40">Notification Preferences</span>
          </div>
          <p className="text-xs font-medium tracking-tight text-text-muted/40 max-w-md italic">Tailor your architectural experience and security protocol alerts. Managed on the Solana synchronization layer.</p>
        </div>
        <button className="h-14 px-10 bg-white/[0.03] border border-on-background/10 text-text-muted/60 text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-background hover:border-accent transition-all italic rounded-full shadow-lg">
          Configure Alert Protocols
        </button>
      </div>
    </div>
  );
}
