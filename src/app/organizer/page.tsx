"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ScanLine, Users, Ticket, ArrowUpRight, Calendar, MapPin, Vote, Wallet, Megaphone } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { useProfile } from "@/store/useAuthStore";
import { useHydrated } from "@/lib/useHydrated";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useChainEvents, useUnclaimed } from "@/lib/chain/hooks";
import { claimUnclaimedTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { fmtUsdc } from "@/lib/chain/format";
import { isEnded } from "@/data/events";

export default function OrganizerDashboardPage() {
  return (
    <OrganizerGuard>
      <Panel />
    </OrganizerGuard>
  );
}

function Panel() {
  const hydrated = useHydrated();
  const profile = useProfile();
  const { accountId, sendTransactions } = useNearWallet();
  const { data: all = [], isLoading } = useChainEvents();
  const unclaimed = useUnclaimed(accountId);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const events = useMemo(() => all.filter((e) => e.ownerAccount === accountId), [all, accountId]);

  if (!hydrated || !profile?.organizer) return <div className="min-h-screen" />;

  const orgName = profile.organizer.orgName;
  const sold = events.reduce((s, e) => s + e.sold, 0);
  const attended = events.reduce((s, e) => s + e.checkedIn, 0);
  const claimable = unclaimed.data ?? 0;

  const claim = async () => {
    setClaiming(true);
    setError(null);
    try {
      await sendTransactions([claimUnclaimedTx()], { callbackUrl: window.location.href });
    } catch (e) {
      setError(explainChainError(e));
    } finally {
      setClaiming(false);
    }
  };

  return (
    <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col">
      {/* Header gelap */}
      <section data-nav-theme="dark" className="relative bg-[#07090a] text-white pt-20 pb-16 px-6 md:px-12 overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#9CFF1E]/20 blur-[120px]" />
        <div className="relative max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between md:items-end gap-8">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9CFF1E]">Organizer dashboard</p>
            <h1 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-none">{orgName}</h1>
            <p className="text-white/60">{profile.organizer.city} · {profile.organizer.contact}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/organizer/create-event"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-[#141414] font-semibold shadow-[0_0_40px_rgba(156,255,30,0.45)]"
              style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
            >
              <Plus className="w-4 h-4" /> Create event
            </Link>
            <Link
              href="/organizer/scan"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full border border-[#9CFF1E] text-[#9CFF1E] font-semibold hover:bg-[#9CFF1E] hover:text-[#141414] transition-colors"
            >
              <ScanLine className="w-4 h-4" /> Door scan
            </Link>
            <Link
              href="/organizer/polls"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full border border-white/25 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              <Vote className="w-4 h-4" /> Polls
            </Link>
          </div>
        </div>
      </section>

      {/* Metrik */}
      <section className="px-6 md:px-12 py-12 border-b border-black/5">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Events", value: String(events.length), icon: Calendar },
            { label: "Passes sold", value: String(sold), icon: Ticket },
            { label: "Checked in", value: String(attended), icon: Users },
            { label: "Ready to claim", value: fmtUsdc(claimable), icon: Wallet },
          ].map((m) => (
            <div key={m.label} className="p-6 rounded-3xl bg-[#F5F8EE] border border-black/5 space-y-4">
              <div className="flex justify-between items-center text-[#5C6157]">
                <m.icon className="w-5 h-5 text-[#3F7D00]" />
                <span className="text-[11px] font-semibold uppercase tracking-widest">{m.label}</span>
              </div>
              <p className="text-3xl font-extrabold tracking-[-0.03em]">{m.value}</p>
            </div>
          ))}
        </div>
        {claimable > 0 && (
          <div className="max-w-[1280px] mx-auto mt-4 p-5 rounded-3xl border border-[#9CFF1E] bg-[#9CFF1E]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm">
              There is <b>{fmtUsdc(claimable)}</b> held in the contract (for example a payment that failed to send). Claim it to your wallet.
            </p>
            <button
              onClick={claim}
              disabled={claiming}
              className="px-6 py-3 rounded-full bg-[#141414] text-white text-sm font-semibold hover:bg-[#9CFF1E] hover:text-[#141414] transition-colors disabled:opacity-50"
            >
              {claiming ? "Waiting for wallet…" : "Claim funds"}
            </button>
          </div>
        )}
        {error && <p className="max-w-[1280px] mx-auto mt-3 text-sm text-[#E5484D]">{error}</p>}
      </section>

      {/* Daftar event */}
      <section className="px-6 md:px-12 py-14">
        <div className="max-w-[1280px] mx-auto space-y-8">
          <h2 className="text-3xl font-extrabold tracking-[-0.03em]">Your events</h2>

          {isLoading && <div className="h-32 rounded-3xl bg-[#F5F8EE] animate-pulse" />}

          {!isLoading && events.length === 0 && (
            <div className="p-12 rounded-3xl border border-dashed border-black/15 text-center space-y-4 text-[#5C6157]">
              <p>No events under this account yet.</p>
              <Link href="/organizer/create-event" className="inline-block text-[#3F7D00] font-semibold underline underline-offset-4">
                Create your first event
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl border border-black/10 hover:border-[#9CFF1E] transition-colors">
                <div className="flex items-center gap-5">
                  {e.image ? (
                    <img src={e.image} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#F5F8EE]" />
                  )}
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">{e.title}</h3>
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5C6157] font-medium">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {e.dateFull}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {e.city}</span>
                      <span className="font-mono">{e.code}</span>
                      {e.campaign && (
                        <span className="flex items-center gap-1.5 text-[#3F7D00]">
                          <Megaphone className="w-3.5 h-3.5" /> {e.campaign.funded ? "Active campaign" : "Campaign not funded"}
                        </span>
                      )}
                      {isEnded(e) && <span>Ended</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C6157]">Sold</p>
                    <p className="text-2xl font-bold">{e.sold}<span className="text-sm text-[#5C6157]">/{e.capacity}</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5C6157]">Attended</p>
                    <p className="text-2xl font-bold">{e.checkedIn}</p>
                  </div>
                  <Link
                    href={`/organizer/events/${e.id}`}
                    aria-label="Manage event"
                    className="w-12 h-12 rounded-full bg-[#9CFF1E] flex items-center justify-center hover:shadow-[0_0_30px_rgba(156,255,30,0.6)] transition-shadow"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EditorialFooter />
    </main>
  );
}
