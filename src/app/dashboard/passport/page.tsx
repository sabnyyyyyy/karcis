"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Check, Lock, MessagesSquare, Vote, Gift, Users, Star, ScanLine } from "lucide-react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { StampSeal, EmptyStampSlot } from "@/components/passport/StampSeal";
import { LevelLadder } from "@/components/passport/LevelLadder";
import { useProfile } from "@/store/useAuthStore";
import { useMyPassesQuery } from "@/lib/chain/hooks";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useHydrated } from "@/lib/useHydrated";
import { PERKS, levelFor, nextLevel, totalStamps, type PerkKey } from "@/lib/passport";
import { cn } from "@/lib/utils";

const perkIcon: Record<PerkKey, React.ElementType> = {
  "chat-umum": MessagesSquare,
  "chat-privat": Users,
  voting: Vote,
  prioritas: Star,
  diskon: Gift,
};

// Perk -> tab di halaman Komunitas
const perkTab: Record<PerkKey, string> = {
  "chat-umum": "obrolan",
  "chat-privat": "obrolan",
  prioritas: "obrolan",
  voting: "voting",
  diskon: "reward",
};

export default function PassportPage() {
  const hydrated = useHydrated();
  const profile = useProfile();
  const { accountId } = useNearWallet();
  const { data: passes, isLoading } = useMyPassesQuery();

  if (!hydrated || !profile || isLoading) return <div className="min-h-[50vh]" />;

  const badges = passes
    .filter((p) => p.status === "USED")
    .sort((a, b) => +new Date(b.checkedInAt ?? 0) - +new Date(a.checkedInAt ?? 0));
  const waiting = passes.filter((p) => p.status === "VALID");

  const stamps = totalStamps(passes);
  const level = levelFor(stamps);
  const next = nextLevel(stamps);
  const pct = next ? Math.round(((stamps - level.min) / (next.min - level.min)) * 100) : 100;

  // Slot cap: lencana yang ada + beberapa slot kosong, minimal 8
  const slots = Math.max(8, Math.ceil((badges.length + 2) / 4) * 4);
  const empty = slots - badges.length;

  return (
    <div className="space-y-14 pb-10">
      <section className="border-b border-on-background/10 pb-8">
        <ScrollReveal>
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-accent-ink uppercase tracking-[0.3em]">Paspor</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-none">Stempel yang kamu kumpulkan</h1>
          </div>
        </ScrollReveal>
      </section>

      {/* Kartu paspor + cap */}
      <section className="grid lg:grid-cols-[360px_1fr] gap-6">
        <ScrollReveal>
          <div className="relative rounded-[32px] bg-[#0b0d0a] text-white p-8 space-y-8 overflow-hidden h-full">
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#9CFF1E]/20 blur-[80px]" />
            <div className="relative flex items-center justify-between">
              <span className="font-[family-name:var(--font-logo)] text-xl font-black italic uppercase tracking-tighter text-[#9CFF1E]">Karcis</span>
              <span className="text-[11px] uppercase tracking-[0.3em] text-white/50">Paspor</span>
            </div>

            <div className="relative space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-white/40">Pemegang</p>
              <p className="text-3xl font-bold tracking-[-0.03em]">{profile.name}</p>
              <p className="text-xs font-mono text-white/50 break-all">{accountId}</p>
            </div>

            <div className="relative space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/40">Level</p>
                  <p className="text-2xl font-bold text-[#9CFF1E]">{level.name}</p>
                </div>
                <p className="text-sm text-white/60">{stamps} stempel</p>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-[#9CFF1E] transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-white/50">
                {next ? `${next.min - stamps} stempel lagi menuju ${next.name}.` : "Kamu sudah di level tertinggi."}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="rounded-[32px] border border-on-background/10 bg-white p-6 md:p-8 h-full space-y-5">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-semibold">Lencana ({badges.length})</h2>
              {waiting.length > 0 && (
                <Link href="/dashboard/tickets" className="text-sm text-accent-ink font-semibold underline underline-offset-4">
                  {waiting.length} pass menunggu scan
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {badges.map((p) => (
                <Link key={p.id} href={`/dashboard/tickets/${p.id}`} className="block hover:scale-105 transition-transform">
                  <StampSeal pass={p} />
                </Link>
              ))}
              {Array.from({ length: empty }).map((_, i) => (
                <EmptyStampSlot key={i} />
              ))}
            </div>
            {badges.length === 0 && (
              <p className="text-sm text-text-muted">
                Belum ada stempel. Datangi acara dan tunjukkan QR pass-mu di pintu masuk. <Link href="/events" className="text-accent-ink font-semibold underline underline-offset-4">Cari event</Link>
              </p>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* Level */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-[-0.02em]">Tangga level</h2>
        <LevelLadder stamps={stamps} />
      </section>

      {/* Akses komunitas */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Akses komunitas</h2>
          <p className="text-sm text-text-muted">Terbuka otomatis sesuai stempelmu. Klik perk yang terbuka untuk memakainya.</p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {PERKS.map((perk) => {
            const open = stamps >= perk.min;
            const Icon = perkIcon[perk.key];
            return (
              <div
                key={perk.key}
                className={cn("p-6 rounded-3xl border flex gap-4", open ? "border-[#9CFF1E] bg-[#9CFF1E]/10" : "border-on-background/10 bg-white")}
              >
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", open ? "bg-[#9CFF1E] text-[#141414]" : "bg-on-background/5 text-text-muted")}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold">{perk.title}</p>
                  <p className="text-sm text-text-muted leading-snug">{perk.desc}</p>
                  <p className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest", open ? "text-accent-ink" : "text-text-muted")}>
                    {open ? <><Check className="w-3.5 h-3.5" /> Terbuka</> : <><Lock className="w-3.5 h-3.5" /> Butuh {perk.min} stempel</>}
                  </p>
                  {open && (
                    <Link href={`/dashboard/community?tab=${perkTab[perk.key]}`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent-ink underline underline-offset-4">
                      Buka <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Riwayat kehadiran */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-[-0.02em]">Riwayat kehadiran</h2>
        {badges.length === 0 && waiting.length === 0 ? (
          <p className="text-text-muted">Belum ada riwayat.</p>
        ) : (
          <div className="rounded-3xl border border-on-background/10 bg-white divide-y divide-on-background/10 overflow-hidden">
            {[...waiting, ...badges].map((p) => (
              <Link key={p.id} href={`/dashboard/tickets/${p.id}`} className="group flex items-center justify-between gap-4 p-5 hover:bg-[#9CFF1E]/10 transition-colors">
                <div className="space-y-1 min-w-0">
                  <p className="font-semibold truncate">{p.eventTitle}</p>
                  <p className="text-xs text-text-muted">
                    {p.city} · {p.dateFull}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {p.status === "USED" ? (
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-accent-ink">+{p.stamps} stempel</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                      <ScanLine className="w-3.5 h-3.5" /> Menunggu scan
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
