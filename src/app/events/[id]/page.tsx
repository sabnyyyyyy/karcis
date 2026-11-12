"use client";

import React, { Suspense, useEffect, useState } from "react";
import { EditorialFooter } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import {
  MapPin,
  ArrowLeft,
  Share2,
  Heart,
  ChevronRight,
  Music,
  Stamp,
  Ticket,
  ScanLine,
  MessagesSquare,
  Megaphone,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { cn, plural } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSavedStore } from "@/store/useSavedStore";
import { useHydrated } from "@/lib/useHydrated";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useCampaign, useChainEvent, useOrganizer, useQuote } from "@/lib/chain/hooks";
import { fmtIdr, fmtPrice, fmtUsdc } from "@/lib/chain/format";
import { explainChainError } from "@/lib/chain/errors";
import { joinCampaignTx } from "@/lib/chain/builders";
import { isEnded, isSoldOut } from "@/data/events";
import { OrganizerTrust } from "@/components/organizer/OrganizerTrust";

const refKey = (eventId: string) => `karcis-ref-${eventId}`;

export default function EventDetailPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <EventDetail />
    </Suspense>
  );
}

function EventDetail() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { data: event, isLoading, error } = useChainEvent(params.id);
  const campaign = useCampaign(event?.campaign ? params.id : undefined);
  const { accountId, signIn, sendTransactions } = useNearWallet();

  const hydrated = useHydrated();
  const savedIds = useSavedStore((s) => s.ids);
  const toggleSaved = useSavedStore((s) => s.toggle);
  const isLiked = hydrated && savedIds.includes(params.id);
  const [tierId, setTierId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Simpan kode referral dari ?ref= supaya terbawa ke checkout
  const refParam = search.get("ref");
  useEffect(() => {
    if (!refParam) return;
    try {
      localStorage.setItem(refKey(params.id), refParam);
    } catch {
      // localStorage tidak tersedia
    }
  }, [refParam, params.id]);

  const selectedTier = event?.tiers.find((t) => t.id === (tierId ?? event.tiers[0]?.id)) ?? event?.tiers[0];
  const quote = useQuote(event?.id, selectedTier?.id);
  const organizer = useOrganizer(event?.ownerAccount);

  if (isLoading) return <main className="min-h-screen bg-background" />;

  if (error || !event) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-bodoni text-4xl font-black">{error ? "The event can't be loaded." : "Event not found."}</h1>
        <p className="text-text-muted">{error ? explainChainError(error) : "This event may not exist on the contract."}</p>
        <Link href="/events" className="px-8 py-3 bg-primary text-on-primary rounded-full text-xs font-bold uppercase tracking-widest">
          Back to events
        </Link>
      </main>
    );
  }

  const ended = isEnded(event);
  const soldOut = isSoldOut(event);
  const needsFunding = !!event.campaign && !event.campaign.funded;
  const suspended = !!organizer.data && organizer.data.status !== "ACTIVE";
  const canBuy = !ended && !soldOut && !needsFunding && !suspended;
  const joined = !!accountId && !!campaign.data?.participants.includes(accountId);
  const isOwner = accountId === event.ownerAccount;
  const refLink = typeof window !== "undefined" && accountId ? `${window.location.origin}/events/${event.id}?ref=${accountId}` : "";
  const checkoutHref = `/checkout/${event.id}?tier=${selectedTier?.id ?? ""}`;

  const joinCampaign = async () => {
    if (!accountId) return signIn();
    setJoining(true);
    setJoinMsg(null);
    try {
      await sendTransactions([joinCampaignTx(event.id)], { callbackUrl: window.location.href });
      setJoinMsg("You've joined the campaign. Your referral link is ready.");
      await campaign.refetch();
    } catch (e) {
      setJoinMsg(explainChainError(e));
    } finally {
      setJoining(false);
    }
  };

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard tidak tersedia
    }
  };

  const q = quote.data;

  return (
    <main className="min-h-screen bg-background text-text-main font-inter transition-all duration-500">
      {/* HEADER */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden bg-surface-lowest">
        {event.image && <img src={event.image} className="w-full h-full object-cover" alt={event.title} />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

        <div className="absolute top-24 left-6 md:left-12 z-10">
          <Link href="/events">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-background/90 backdrop-blur-md border border-on-background/5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-[#141414] transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> All events
            </button>
          </Link>
        </div>

        <div className="absolute bottom-8 left-6 md:left-12 right-6 md:right-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <ScrollReveal>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="teal" className="text-[9px] px-2 py-0.5">{event.category}</Badge>
                <span className="stamp px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-background/70">
                  +{event.stamps} stamp
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-background/80 text-[10px] font-mono font-bold">{event.code}</span>
              </div>
              <h1 className="font-bodoni text-4xl md:text-6xl font-black tracking-tight leading-none">{event.title}</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Hosted by {event.organizer}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="flex gap-3">
              <button
                onClick={() => toggleSaved(params.id)}
                aria-label="Save event"
                className={cn("p-3.5 rounded-full border transition-all shadow-sm", isLiked ? "bg-accent-coral border-accent-coral text-white" : "bg-background/80 border-on-background/10 hover:border-accent-coral")}
              >
                <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
              </button>
              <button aria-label="Share" className="p-3.5 rounded-full bg-background/80 border border-on-background/10 hover:border-accent transition-all shadow-sm">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CONTENT */}
      <section className="container mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
          <div className="lg:col-span-8 space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-y border-on-background/5 py-8">
              {[
                { label: "Date", value: event.dateFull },
                { label: "Time", value: event.time },
                { label: "Venue", value: event.venue },
                { label: "Tickets", value: `${event.sold} / ${event.capacity} sold` },
              ].map((s) => (
                <div key={s.label} className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{s.label}</span>
                  <p className="text-sm font-bold text-primary">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="font-bodoni text-2xl font-bold tracking-tight">About this event</h2>
              <p className="text-lg text-text-muted leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {event.lineup.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-accent-ink">
                  <Music className="w-5 h-5" />
                  <h2 className="font-bodoni text-2xl font-bold tracking-tight">Lineup</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {event.lineup.map((act, i) => (
                    <div key={i} className="flex justify-between items-center p-6 bg-surface-low border border-on-background/5 rounded-xl hover:border-accent transition-all">
                      <div>
                        <p className="text-lg font-bold tracking-tight">{act.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{act.role}</p>
                      </div>
                      <p className="text-sm font-bold">{act.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-accent-coral">
                <MapPin className="w-5 h-5" />
                <h2 className="font-bodoni text-2xl font-bold tracking-tight">Location</h2>
              </div>
              <div className="p-6 bg-surface-low border border-on-background/5 rounded-xl">
                <p className="text-lg font-bold">{event.venue}</p>
                <p className="text-sm text-text-muted">{event.address}</p>
              </div>
            </div>

            <OrganizerTrust account={event.ownerAccount} name={event.organizer} />

            {/* Kampanye */}
            {event.campaign && (
              <div className="space-y-6 p-8 rounded-[28px] bg-[#0b0d0a] text-white relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#9CFF1E]/20 blur-[70px]" />
                <div className="relative space-y-6">
                  <div className="flex items-center gap-3 text-[#9CFF1E]">
                    <Megaphone className="w-5 h-5" />
                    <h2 className="text-xl font-bold tracking-tight">Promo campaign (become a clipper)</h2>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    Make promo content for this event and get paid. Rewards are released after the event ends.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[11px] uppercase tracking-widest text-white/50">Per 1 million views</p>
                      <p className="text-2xl font-bold text-[#9CFF1E]">{fmtUsdc(event.campaign.clipRatePerMillion)}</p>
                      <p className="text-xs text-white/50">≈ {fmtIdr(event.campaign.clipRatePerMillion)}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[11px] uppercase tracking-widest text-white/50">Per ticket via your link</p>
                      <p className="text-2xl font-bold text-[#9CFF1E]">{fmtUsdc(event.campaign.referralReward)}</p>
                      <p className="text-xs text-white/50">≈ {fmtIdr(event.campaign.referralReward)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/50">
                    {campaign.data?.participants.length ?? 0} {plural(campaign.data?.participants.length ?? 0, "clipper")} joined · {campaign.data?.clips.length ?? 0} {plural(campaign.data?.clips.length ?? 0, "clip")} submitted
                    {!event.campaign.funded && " · campaign funds not yet deposited by the organizer"}
                  </p>

                  {isOwner ? (
                    <Link href={`/organizer/events/${event.id}`} className="inline-block text-[#9CFF1E] font-semibold underline underline-offset-4">
                      Manage this campaign
                    </Link>
                  ) : joined ? (
                    <div className="space-y-3">
                      <p className="flex items-center gap-2 text-[#9CFF1E] font-semibold"><Check className="w-4 h-4" /> You&apos;re a clipper</p>
                      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#9CFF1E]/60 px-4 py-3">
                        <span className="flex-1 min-w-0 truncate font-mono text-xs text-[#9CFF1E]">{refLink}</span>
                        <button onClick={copyRef} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#9CFF1E] text-[#141414] text-xs font-semibold shrink-0">
                          {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy link</>}
                        </button>
                      </div>
                      <Link href="/dashboard/campaigns" className="inline-block text-sm text-[#9CFF1E] underline underline-offset-4">
                        Submit a clip and see your earnings
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={joinCampaign}
                      disabled={joining || ended || !event.campaign.funded}
                      className="px-7 py-3 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold disabled:opacity-40"
                    >
                      {!accountId ? "Connect wallet to join" : joining ? "Waiting for wallet…" : "Join campaign"}
                    </button>
                  )}
                  {joinMsg && <p className="text-sm text-white/70">{joinMsg}</p>}
                </div>
              </div>
            )}
          </div>

          {/* BOOKING */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="p-8 bg-surface border border-on-background/10 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Ticket className="w-24 h-24 rotate-12" />
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent-ink leading-none">Choose a pass</p>
                  {event.tiers.map((t) => {
                    const active = t.id === selectedTier?.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTierId(t.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all",
                          active ? "border-accent bg-accent/5" : "border-on-background/10 hover:border-on-background/30"
                        )}
                      >
                        <div className="flex justify-between items-baseline gap-4">
                          <span className="font-bold">{t.name}</span>
                          <span className="font-bold text-primary text-right text-sm">{fmtPrice(t.price)}</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{t.perk}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Rincian harga dari kontrak */}
                {selectedTier && selectedTier.price > 0 && q && (
                  <div className="space-y-2 pt-4 border-t border-on-background/10 text-sm">
                    <Row label="Ticket price" value={fmtUsdc(q.price)} />
                    {event.feeBearer === "BUYER" ? (
                      <>
                        <Row label="Service fee (3.4%)" value={fmtUsdc(q.platform_fee)} />
                        {Number(q.promo_fee) > 0 && <Row label="Promo fee" value={fmtUsdc(q.promo_fee)} />}
                      </>
                    ) : (
                      <p className="text-xs text-text-muted">The organizer covers the service fee.</p>
                    )}
                    <div className="flex justify-between items-baseline pt-2 border-t border-on-background/10">
                      <span className="font-bold">Total</span>
                      <span className="text-right">
                        <span className="font-bold text-lg">{fmtUsdc(q.total)}</span>
                        <span className="block text-xs text-text-muted">≈ {fmtIdr(q.total)}</span>
                      </span>
                    </div>
                  </div>
                )}

                {canBuy ? (
                  <Link href={checkoutHref} className="block">
                    <button className="w-full py-5 bg-primary text-on-primary font-bold uppercase tracking-[0.2em] rounded-full hover:bg-accent hover:text-[#141414] transition-all shadow-lg flex items-center justify-center gap-2 text-xs">
                      Buy pass <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <div className="w-full py-5 rounded-full bg-on-background/10 text-text-muted font-bold uppercase tracking-[0.15em] text-center text-xs">
                    {ended ? "Event ended" : soldOut ? "Sold out" : "Waiting for campaign funding"}
                  </div>
                )}
              </div>

              <div className="p-6 bg-accent/5 border border-accent/15 rounded-2xl space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent-ink">What you get</p>
                <ul className="space-y-3 text-sm text-text-muted">
                  <li className="flex gap-3"><ScanLine className="w-4 h-4 text-accent-ink shrink-0 mt-0.5" /> Pass NFT <span className="font-mono">{event.code}-0001</span> in your wallet, scanned at the door. No ID card.</li>
                  <li className="flex gap-3"><Stamp className="w-4 h-4 text-accent-ink shrink-0 mt-0.5" /> Once scanned, it becomes a permanent badge (+{event.stamps} {plural(event.stamps, "stamp")}).</li>
                  <li className="flex gap-3"><MessagesSquare className="w-4 h-4 text-accent-ink shrink-0 mt-0.5" /> The badge unlocks community chat, voting, and rewards.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EditorialFooter />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
