"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useCampaign, useChainConfig, useChainEvents } from "@/lib/chain/hooks";
import { reportViewsTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { shortAccount } from "@/lib/chain/format";
import { isEnded, type CommunityEvent } from "@/data/events";

/**
 * Halaman verifier: melaporkan jumlah view tiap clip setelah event selesai.
 * Hanya akun verifier yang ditetapkan di kontrak yang bisa mengirim laporan.
 */
export default function VerifierPage() {
  const { accountId, isReady, signIn } = useNearWallet();
  const config = useChainConfig();
  const events = useChainEvents();

  if (!isReady || config.isLoading || events.isLoading) return <div className="min-h-screen" />;

  const isVerifier = !!accountId && accountId === config.data?.verifier;
  const pending = (events.data ?? []).filter((e) => e.campaign?.funded && !e.campaign.settled && !e.campaign.viewsReported && isEnded(e));

  return (
    <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col">
      <section className="relative px-6 md:px-12 py-14 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-10">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#5C6157] hover:text-[#141414]">
              <ChevronLeft className="w-4 h-4" /> Home
            </Link>
            <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-[-0.04em] leading-none">View verification</h1>
            <p className="text-[#5C6157] max-w-lg">
              After an event ends, the verifier checks each clip&apos;s view count on its platform and reports it to the contract. This report determines clipper payouts.
            </p>
          </div>

          {!accountId ? (
            <button onClick={signIn} className="px-8 py-3.5 rounded-full bg-[#9CFF1E] font-semibold">Connect wallet</button>
          ) : !isVerifier ? (
            <p className="p-5 rounded-3xl bg-[#FFF4D6] text-[#6b4e00] text-sm">
              The account {shortAccount(accountId)} isn&apos;t the verifier. The verifier on this contract is: <span className="font-mono">{config.data?.verifier ?? "-"}</span>.
            </p>
          ) : pending.length === 0 ? (
            <p className="text-[#5C6157]">No campaigns are waiting for a view report.</p>
          ) : (
            <div className="space-y-6">
              {pending.map((e) => (
                <ReportCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>
      </section>
      <EditorialFooter />
    </main>
  );
}

function ReportCard({ event }: { event: CommunityEvent }) {
  const { sendTransactions } = useNearWallet();
  const campaign = useCampaign(event.id);
  const [views, setViews] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const clips = campaign.data?.clips ?? [];

  const submit = async () => {
    const reports = clips.map((c) => ({ clipId: c.id, views: Number(views[c.id] ?? 0) || 0 }));
    setBusy(true);
    setMsg(null);
    try {
      await sendTransactions([reportViewsTx(event.id, reports)], { callbackUrl: window.location.href });
      setMsg({ ok: true, text: "Report sent. The organizer can now settle the campaign." });
    } catch (e) {
      setMsg({ ok: false, text: explainChainError(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl border border-black/10 space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#5C6157]">{event.code} · {event.organizer}</p>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{event.title}</h2>
      </div>

      {clips.length === 0 ? (
        <p className="text-sm text-[#5C6157]">There are no clips. You can still send an empty report so the campaign can be settled.</p>
      ) : (
        <ul className="space-y-3">
          {clips.map((c) => (
            <li key={c.id} className="grid sm:grid-cols-[1fr_160px] gap-3 items-center">
              <a href={c.url} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4 truncate">
                #{c.id} · {c.platform} · {shortAccount(c.clipper)}
              </a>
              <input
                type="number"
                min={0}
                value={views[c.id] ?? ""}
                onChange={(e) => setViews((v) => ({ ...v, [c.id]: e.target.value }))}
                placeholder="View count"
                className="rounded-2xl border border-[#141414]/15 px-4 py-2.5 text-sm outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40"
              />
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="px-7 py-3 rounded-full bg-[#141414] text-white font-semibold hover:bg-[#9CFF1E] hover:text-[#141414] transition-colors disabled:opacity-50"
      >
        {busy ? "Waiting for wallet…" : "Submit view report"}
      </button>
      {msg && <p className={msg.ok ? "text-sm text-[#3F7D00]" : "text-sm text-[#E5484D]"}>{msg.text}</p>}
    </div>
  );
}
