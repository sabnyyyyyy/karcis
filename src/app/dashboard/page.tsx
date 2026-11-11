"use client";

import React from "react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { Calendar, MapPin, Ticket, Stamp, Award, ChevronRight, ScanLine } from "lucide-react";
import Link from "next/link";
import { useProfile } from "@/store/useAuthStore";
import { useMyPassesQuery } from "@/lib/chain/hooks";
import { levelFor, nextLevel, totalStamps } from "@/lib/passport";
import { cn } from "@/lib/utils";

export default function OverviewPage() {
  const profile = useProfile();
  const { data: passes, isLoading } = useMyPassesQuery();

  if (isLoading) return <div className="min-h-[50vh] rounded-3xl bg-surface-low animate-pulse" />;

  const active = passes.filter((p) => p.status === "VALID");
  const badges = passes.filter((p) => p.status === "USED");
  const stamps = totalStamps(passes);
  const level = levelFor(stamps);
  const next = nextLevel(stamps);

  // Riwayat sederhana dari pass yang ada
  const activity = passes
    .flatMap((p) => [
      { at: p.mintedAt, label: "Pass diterbitkan", event: p.eventTitle },
      ...(p.checkedInAt ? [{ at: p.checkedInAt, label: `Stempel +${p.stamps}`, event: p.eventTitle }] : []),
    ])
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 5);

  return (
    <div className="space-y-12">
      <section className="space-y-2">
        <ScrollReveal>
          <p className="text-[11px] font-bold text-accent-ink uppercase tracking-widest leading-none">Paspor</p>
          <h1 className="font-bodoni text-3xl md:text-4xl font-black tracking-tight text-primary">
            Halo, <span className="text-accent-ink">{profile?.name || "Tamu"}</span>
          </h1>
        </ScrollReveal>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pass aktif", value: String(active.length), icon: Ticket },
          { label: "Lencana", value: String(badges.length), icon: Award },
          { label: "Stempel", value: String(stamps), icon: Stamp },
          { label: "Level", value: level.name, icon: Award },
        ].map((stat, i) => (
          <ScrollReveal key={stat.label} delay={i * 0.05}>
            <div className="space-y-4 bg-surface p-6 rounded-2xl border border-on-background/5 shadow-sm">
              <div className="flex justify-between items-center">
                <stat.icon className="w-5 h-5 text-accent-ink" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="font-bodoni text-2xl font-black tracking-tight text-primary">{stat.value}</p>
            </div>
          </ScrollReveal>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-end border-b border-on-background/5 pb-4">
            <h2 className="font-bodoni text-xl font-bold tracking-tight">Pass aktif</h2>
            <Link href="/dashboard/tickets" className="text-[11px] font-bold text-accent-ink hover:text-primary transition-all uppercase tracking-widest">
              Semua koleksi <ChevronRight className="inline w-3 h-3" />
            </Link>
          </div>

          {active.length === 0 ? (
            <div className="p-10 border border-dashed border-on-background/15 rounded-2xl text-center text-text-muted space-y-3">
              <p>Belum ada pass aktif.</p>
              <Link href="/events" className="text-accent-ink font-bold underline underline-offset-4">Cari event</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {active.map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 0.1}>
                  <Link href={`/dashboard/tickets/${p.id}`} className="group block">
                    <div className="flex gap-6 p-5 bg-surface border border-on-background/5 rounded-2xl hover:border-accent/40 transition-all shadow-sm">
                      <div className="w-28 aspect-[4/5] overflow-hidden rounded-xl shrink-0">
                        <img src={p.image} alt={p.eventTitle} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="space-y-3">
                          <h3 className="font-bodoni text-xl font-bold tracking-tight group-hover:text-accent-ink transition-colors leading-tight">{p.eventTitle}</h3>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">
                            <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {p.dateFull}</span>
                            <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {p.venue}, {p.city}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-accent-ink text-[11px] font-bold uppercase tracking-widest pt-4 border-t border-on-background/5 mt-4">
                          <ScanLine className="w-3.5 h-3.5" /> Buka QR pintu masuk <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="border-b border-on-background/5 pb-4">
            <h2 className="font-bodoni text-xl font-bold tracking-tight">Aktivitas</h2>
          </div>
          <div className="bg-surface border border-on-background/5 rounded-2xl overflow-hidden shadow-sm divide-y divide-on-background/5">
            {activity.length === 0 && <p className="p-5 text-sm text-text-muted">Belum ada aktivitas.</p>}
            {activity.map((a, i) => (
              <div key={i} className="p-5 space-y-1">
                <p className={cn("text-sm font-bold", a.label.startsWith("Stempel") ? "text-accent-coral" : "text-primary")}>{a.label}</p>
                <p className="text-[11px] text-text-muted uppercase tracking-widest font-bold">
                  {a.event} · {new Date(a.at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </p>
              </div>
            ))}
          </div>

          <div className="p-6 bg-accent/5 border border-accent/15 rounded-2xl space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent-ink">Menuju level berikutnya</p>
            <p className="text-sm text-text-muted">
              {next ? `${next.min - stamps} stempel lagi untuk jadi ${next.name}.` : "Kamu sudah di level tertinggi."}
            </p>
            <Link href="/dashboard/passport" className="inline-block text-sm text-accent-ink font-semibold underline underline-offset-4">
              Lihat paspor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
