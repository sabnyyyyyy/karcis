"use client";

import React from "react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { Calendar, MapPin, ChevronRight, ScanLine, Stamp } from "lucide-react";
import Link from "next/link";
import { cn, plural } from "@/lib/utils";
import { useListings, useMyPassesQuery } from "@/lib/chain/hooks";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { explainChainError } from "@/lib/chain/errors";
import type { Pass } from "@/types/pass";

export default function MyPassesPage() {
  const { accountId, isReady, signIn } = useNearWallet();
  const { data: passes, isLoading, error, refetch } = useMyPassesQuery();
  const listings = useListings();
  const listedIds = new Set((listings.data ?? []).map((l) => l.pass_id));

  if (!isReady) return <div className="min-h-[50vh]" />;

  if (!accountId) {
    return (
      <div className="py-24 text-center space-y-5">
        <p className="text-text-muted">Connect your wallet to see your passes and badges.</p>
        <button onClick={signIn} className="px-8 py-3 rounded-full bg-accent text-[#141414] font-bold text-sm">Connect wallet</button>
      </div>
    );
  }

  if (isLoading) return <div className="min-h-[50vh] rounded-3xl bg-surface-low animate-pulse" />;

  if (error) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-text-muted">{explainChainError(error)}</p>
        <button onClick={() => refetch()} className="text-accent-ink font-bold underline underline-offset-4">Try again</button>
      </div>
    );
  }

  const active = passes.filter((p) => p.status === "VALID");
  const badges = passes.filter((p) => p.status === "USED");

  return (
    <div className="space-y-16">
      <section className="border-b border-on-background/10 pb-8">
        <ScrollReveal>
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-accent-ink uppercase tracking-[0.3em]">Passes &amp; badges</p>
            <h1 className="font-bodoni text-5xl md:text-6xl font-black tracking-tight text-text-main">Your collection</h1>
          </div>
        </ScrollReveal>
      </section>

      <Group
        title="Active passes"
        hint="Show the QR at the door. Once scanned, the pass becomes a badge."
        icon={<ScanLine className="w-5 h-5 text-accent-ink" />}
        passes={active}
        listedIds={listedIds}
        empty="No active passes yet."
        emptyAction
      />
      <Group
        title="Badges"
        hint="Every badge is a stamp in your passport."
        icon={<Stamp className="w-5 h-5 text-accent-coral" />}
        passes={badges}
        listedIds={listedIds}
        empty="Your first badge appears after your pass is scanned at the door."
      />
    </div>
  );
}

function Group({
  title,
  hint,
  icon,
  passes,
  listedIds,
  empty,
  emptyAction,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
  passes: Pass[];
  listedIds: Set<string>;
  empty: string;
  emptyAction?: boolean;
}) {
  return (
    <section className="space-y-8">
      <div className="flex items-center gap-4 border-b border-on-background/5 pb-4">
        {icon}
        <div>
          <h2 className="font-bodoni text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-text-muted">{hint}</p>
        </div>
      </div>

      {passes.length === 0 ? (
        <div className="p-10 border border-dashed border-on-background/15 rounded-3xl text-center space-y-4 text-text-muted">
          <p>{empty}</p>
          {emptyAction && (
            <Link href="/events" className="inline-block text-accent-ink font-bold underline underline-offset-4">
              Find events
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {passes.map((p, i) => (
            <ScrollReveal key={p.id} delay={i * 0.05}>
              <PassCard pass={p} listed={listedIds.has(p.id)} />
            </ScrollReveal>
          ))}
        </div>
      )}
    </section>
  );
}

function PassCard({ pass, listed }: { pass: Pass; listed: boolean }) {
  const isBadge = pass.status === "USED";
  return (
    <Link
      href={`/dashboard/tickets/${pass.id}`}
      className="group bg-surface border border-on-background/5 hover:border-accent/40 transition-all duration-500 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={pass.image}
          alt={pass.eventTitle}
          className={cn("w-full h-full object-cover transition-all duration-700 group-hover:scale-105", isBadge && "grayscale")}
        />
        <span
          className={cn(
            "absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md",
            isBadge ? "bg-background/90 text-accent-coral" : "bg-accent text-[#141414]"
          )}
        >
          {isBadge ? "Badge" : "Active pass"}
        </span>
        {listed && (
          <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary text-on-primary">For sale</span>
        )}
        {isBadge && (
          <div className="absolute bottom-4 right-4 stamp w-16 h-16 flex items-center justify-center bg-background/80 text-[10px] font-black uppercase text-center leading-tight">
            +{pass.stamps}
            <br />
            {plural(pass.stamps, "stamp")}
          </div>
        )}
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="font-bodoni text-xl font-bold tracking-tight group-hover:text-accent-ink transition-colors leading-tight">{pass.eventTitle}</h3>
          <div className="space-y-2 text-text-muted text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {pass.dateFull}</div>
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {pass.venue}, {pass.city}</div>
          </div>
        </div>
        <div className="pt-4 border-t border-on-background/5 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-accent-ink">
          <span className="font-mono text-text-muted">{pass.id}</span>
          <span className="flex items-center gap-1">{isBadge ? "View badge" : "Open pass"} <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></span>
        </div>
      </div>
    </Link>
  );
}
