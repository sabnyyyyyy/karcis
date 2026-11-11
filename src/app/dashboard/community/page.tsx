"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessagesSquare, Vote, Gift, Info } from "lucide-react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { ChatPanel } from "@/components/community/ChatPanel";
import { PollsPanel } from "@/components/community/PollsPanel";
import { RewardsPanel } from "@/components/community/RewardsPanel";
import { useProfile } from "@/store/useAuthStore";
import { useMyPasses } from "@/lib/chain/hooks";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useHydrated } from "@/lib/useHydrated";
import { levelFor, totalStamps } from "@/lib/passport";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "obrolan", label: "Obrolan", icon: MessagesSquare },
  { key: "voting", label: "Voting", icon: Vote },
  { key: "reward", label: "Reward", icon: Gift },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function CommunityPage() {
  return (
    <Suspense fallback={null}>
      <Community />
    </Suspense>
  );
}

function Community() {
  const hydrated = useHydrated();
  const router = useRouter();
  const search = useSearchParams();
  const profile = useProfile();
  const { accountId } = useNearWallet();
  const passes = useMyPasses();

  if (!hydrated || !profile || !accountId) return <div className="min-h-[50vh]" />;

  const requested = search.get("tab");
  const tab: TabKey = tabs.some((t) => t.key === requested) ? (requested as TabKey) : "obrolan";
  const stamps = totalStamps(passes);
  const level = levelFor(stamps);

  return (
    <div className="space-y-10 pb-10">
      <section className="border-b border-on-background/10 pb-8">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-accent-ink uppercase tracking-[0.3em]">Komunitas</p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-none">Ruang untuk yang datang</h1>
            </div>
            <Link href="/dashboard/passport" className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#F5F8EE] border border-on-background/10 text-sm">
              <span className="font-semibold">{level.name}</span>
              <span className="text-text-muted">{stamps} stempel</span>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => router.replace(`/dashboard/community?tab=${t.key}`)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all",
              tab === t.key ? "bg-[#9CFF1E] border-[#9CFF1E]" : "border-on-background/15 hover:border-on-background/40"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "obrolan" && <ChatPanel stamps={stamps} accountId={accountId} name={profile.name} />}
      {tab === "voting" && <PollsPanel accountId={accountId} />}
      {tab === "reward" && <RewardsPanel stamps={stamps} accountId={accountId} />}

      <p className="flex items-start gap-2 text-xs text-text-muted max-w-2xl">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        Voting tercatat di kontrak NEAR. Obrolan masih tersimpan di browser ini saja; obrolan lintas perangkat butuh server pesan terpisah.
      </p>
    </div>
  );
}
