"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Copy, Megaphone, Wallet } from "lucide-react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useCampaign, useChainEvent, useChainEvents, useJoinedCampaigns, useUnclaimed } from "@/lib/chain/hooks";
import { claimUnclaimedTx, submitClipTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { fmtIdr, fmtUsdc } from "@/lib/chain/format";
import { isEnded } from "@/data/events";

const PLATFORMS = ["tiktok", "instagram", "youtube", "x"];

export default function CampaignsPage() {
  const { accountId, sendTransactions } = useNearWallet();
  const joined = useJoinedCampaigns(accountId);
  const events = useChainEvents();
  const unclaimed = useUnclaimed(accountId);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinedIds = joined.data ?? [];
  const open = (events.data ?? []).filter(
    (e) => e.campaign?.funded && !e.campaign.settled && !isEnded(e) && !joinedIds.includes(e.id) && e.ownerAccount !== accountId
  );
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
    <div className="space-y-14">
      <section className="border-b border-on-background/10 pb-8">
        <ScrollReveal>
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-accent-ink uppercase tracking-[0.3em]">Campaigns</p>
            <h1 className="font-bodoni text-4xl md:text-5xl font-black tracking-tight">Promote events, earn rewards</h1>
            <p className="text-text-muted max-w-xl">
              Join an organizer&apos;s campaign, make promo videos, and share your referral link. You&apos;re paid per 1 million views and per ticket sold through your link. Funds are released after the event ends.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {claimable > 0 && (
        <div className="p-6 rounded-3xl border border-accent bg-accent/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-accent-ink" />
            <p className="text-sm">
              <b>{fmtUsdc(claimable)}</b> waiting to be claimed from the contract.
            </p>
          </div>
          <button
            onClick={claim}
            disabled={claiming}
            className="px-6 py-3 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-accent hover:text-[#141414] transition-colors disabled:opacity-50"
          >
            {claiming ? "Waiting for wallet…" : "Claim to wallet"}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-accent-coral">{error}</p>}

      <section className="space-y-6">
        <h2 className="font-bodoni text-2xl font-bold tracking-tight">Campaigns you&apos;ve joined</h2>
        {joined.isLoading ? (
          <div className="h-32 rounded-3xl bg-surface-low animate-pulse" />
        ) : joinedIds.length === 0 ? (
          <div className="p-10 border border-dashed border-on-background/15 rounded-3xl text-center text-text-muted">
            You haven&apos;t joined any campaign yet. Pick one below.
          </div>
        ) : (
          <div className="space-y-6">
            {joinedIds.map((id) => (
              <JoinedCard key={id} eventId={id} accountId={accountId!} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="font-bodoni text-2xl font-bold tracking-tight">Open campaigns</h2>
        {events.isLoading ? (
          <div className="h-24 rounded-3xl bg-surface-low animate-pulse" />
        ) : open.length === 0 ? (
          <p className="text-text-muted">There are no open campaigns right now.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {open.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="group p-6 rounded-3xl border border-on-background/10 bg-surface hover:border-accent transition-colors space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-accent-ink">
                  <Megaphone className="w-3.5 h-3.5" /> {e.organizer}
                </div>
                <h3 className="font-bodoni text-xl font-bold leading-tight group-hover:text-accent-ink transition-colors">{e.title}</h3>
                <p className="text-sm text-text-muted">
                  {fmtUsdc(e.campaign!.clipRatePerMillion)} per 1 million views · {fmtUsdc(e.campaign!.referralReward)} per sale
                </p>
                <p className="text-xs text-text-muted">≈ {fmtIdr(e.campaign!.clipRatePerMillion)} per 1 million views</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function JoinedCard({ eventId, accountId }: { eventId: string; accountId: string }) {
  const { sendTransactions } = useNearWallet();
  const { data: event } = useChainEvent(eventId);
  const campaign = useCampaign(eventId);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!event || !event.campaign || !campaign.data) return <div className="h-40 rounded-3xl bg-surface-low animate-pulse" />;

  const c = campaign.data;
  const terms = event.campaign;
  const ended = isEnded(event);
  const myClips = c.clips.filter((cl) => cl.clipper === accountId);
  const mySales = c.referrals.find((r) => r.account === accountId)?.sales ?? 0;
  const refLink = `${typeof window !== "undefined" ? window.location.origin : ""}/events/${event.id}?ref=${accountId}`;

  const reported = terms.viewsReported;
  const viewsOwed = myClips.reduce((sum, cl) => sum + (Number(cl.views ?? 0) / 1_000_000) * terms.clipRatePerMillion, 0);
  const salesOwed = mySales * terms.referralReward;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard tidak tersedia
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await sendTransactions([submitClipTx({ eventId, platform, url: url.trim() })], { callbackUrl: window.location.href });
      setUrl("");
      setMsg({ ok: true, text: "Clip submitted. Views are counted by the verifier after the event ends." });
      await campaign.refetch();
    } catch (err) {
      setMsg({ ok: false, text: explainChainError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl border border-on-background/10 bg-surface space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">{event.organizer}</p>
          <Link href={`/events/${event.id}`} className="font-bodoni text-2xl font-bold leading-tight hover:text-accent-ink transition-colors">
            {event.title}
          </Link>
          <p className="text-sm text-text-muted">
            {event.dateFull} · {terms.settled ? "campaign settled" : ended ? (reported ? "views counted" : "waiting for view report") : "in progress"}
          </p>
        </div>
        <div className="text-sm text-right space-y-0.5">
          <p>{fmtUsdc(terms.clipRatePerMillion)} / 1 million views</p>
          <p>{fmtUsdc(terms.referralReward)} / sale</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Tickets via your link" value={String(mySales)} />
        <Stat label="Clips submitted" value={`${myClips.length}/5`} />
        <Stat label={reported ? "Reward earned" : "Provisional reward"} value={fmtUsdc(Math.round(viewsOwed + salesOwed))} />
      </div>
      {!reported && <p className="text-xs text-text-muted">Rewards from new views are counted after the event ends and the verifier reports the view counts. The value above is only from referral sales so far.</p>}

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Your referral link</p>
        <div className="flex gap-2">
          <input readOnly value={refLink} className="flex-1 min-w-0 rounded-2xl border border-on-background/10 bg-background px-4 py-3 text-sm font-mono" />
          <button onClick={copy} className="px-5 rounded-2xl bg-primary text-on-primary text-sm font-semibold hover:bg-accent hover:text-[#141414] transition-colors flex items-center gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {myClips.length > 0 && (
        <ul className="space-y-2 text-sm">
          {myClips.map((cl) => (
            <li key={cl.id} className="flex justify-between gap-3">
              <a href={cl.url} target="_blank" rel="noreferrer" className="truncate underline underline-offset-4">
                {cl.platform} · {cl.url}
              </a>
              <span className="tabular-nums text-text-muted shrink-0">{cl.views === null ? "not counted yet" : `${Number(cl.views).toLocaleString("en-US")} views`}</span>
            </li>
          ))}
        </ul>
      )}

      {!ended && !terms.settled && myClips.length < 5 && (
        <form onSubmit={submit} className="grid sm:grid-cols-[140px_1fr_auto] gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-2xl border border-on-background/10 bg-background px-4 py-3 text-sm">
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@kamu/video/..."
            className="rounded-2xl border border-on-background/10 bg-background px-4 py-3 text-sm min-w-0"
          />
          <button type="submit" disabled={busy} className="px-6 py-3 rounded-2xl bg-accent text-[#141414] font-semibold text-sm disabled:opacity-50">
            {busy ? "Waiting for wallet…" : "Submit clip"}
          </button>
        </form>
      )}

      {msg && <p className={msg.ok ? "text-sm text-accent-ink" : "text-sm text-accent-coral"}>{msg.text}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-background border border-on-background/5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
      <p className="font-bodoni text-2xl font-black mt-1">{value}</p>
    </div>
  );
}
