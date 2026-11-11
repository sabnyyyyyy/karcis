"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, MapPin, Repeat, ShieldCheck } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { Button } from "@/components/ui/button";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useChainEvents, useListings, useTokenBalance, useTokenRegistered } from "@/lib/chain/hooks";
import { buyResaleTx, cancelResaleTx, registerTokenTx, type PreparedTx } from "@/lib/chain/builders";
import { explainChainError, readSuccessValue } from "@/lib/chain/errors";
import { fmtIdr, fmtUsdc, shortAccount } from "@/lib/chain/format";
import { isEnded, type CommunityEvent } from "@/data/events";
import type { ChainListing } from "@/lib/chain/types";

export default function ResalePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <Market />
    </Suspense>
  );
}

function Market() {
  const search = useSearchParams();
  const eventFilter = search.get("event");
  const listings = useListings();
  const events = useChainEvents();

  const byId = useMemo(() => new Map((events.data ?? []).map((e) => [e.id, e])), [events.data]);
  const rows = (listings.data ?? [])
    .map((l) => ({ l, e: byId.get(l.event_id) }))
    .filter((r): r is { l: ChainListing; e: CommunityEvent } => !!r.e && !isEnded(r.e) && (!eventFilter || r.l.event_id === eventFilter));

  const loading = listings.isLoading || events.isLoading;

  return (
    <main className="min-h-screen bg-background text-text-main flex flex-col font-inter">
      <section className="pt-32 pb-12 px-6 md:px-12 border-b border-on-background/5 bg-surface-low">
        <div className="max-w-[1440px] mx-auto space-y-4">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-accent-ink">
            <Repeat className="w-4 h-4" /> Pasar tiket
          </p>
          <h1 className="font-bodoni text-4xl md:text-5xl font-black tracking-tight text-primary">Tiket dari yang tidak jadi hadir.</h1>
          {eventFilter && (
            <Link href="/resale" className="inline-block text-sm font-semibold text-accent-ink underline underline-offset-4">
              Tampilkan semua event
            </Link>
          )}
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 flex-1">
        <div className="max-w-[1440px] mx-auto">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-surface-low animate-pulse" />
              ))}
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="py-24 text-center space-y-4">
              <p className="text-xl text-text-muted">Belum ada tiket yang dijual ulang.</p>
              <p className="text-sm text-text-muted">Tidak jadi hadir? Buka pass-mu di koleksi, lalu pilih “Jual tiket”.</p>
              <Link href="/dashboard/tickets" className="inline-block text-accent-ink font-bold uppercase tracking-widest text-sm underline underline-offset-4">
                Pass saya
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map(({ l, e }) => (
              <ScrollReveal key={l.pass_id}>
                <ListingCard listing={l} event={e} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      <EditorialFooter />
    </main>
  );
}

function ListingCard({ listing, event }: { listing: ChainListing; event: CommunityEvent }) {
  const { accountId, signIn, sendTransactions } = useNearWallet();
  const balance = useTokenBalance(accountId);
  const registered = useTokenRegistered(accountId);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const price = Number(listing.price);
  const face = Number(listing.face_value);
  const off = face > 0 ? Math.round(((face - price) / face) * 100) : 0;
  const tier = event.tiers.find((t) => t.id === listing.tier_id);
  const mine = accountId === listing.seller;
  const enough = (balance.data ?? 0) >= price;

  const run = async (txs: PreparedTx[], ok: string, isBuy: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      const outcome = await sendTransactions(txs, { callbackUrl: `${window.location.origin}/dashboard/tickets` });
      if (isBuy) {
        const used = readSuccessValue(outcome);
        if (used === "0" || used === 0) {
          setMsg({ ok: false, text: "Kontrak menolak pembelian ini dan uangmu dikembalikan. Mungkin tiketnya baru saja terjual atau dibatalkan." });
          return;
        }
      }
      setMsg({ ok: true, text: ok });
    } catch (e) {
      setMsg({ ok: false, text: explainChainError(e) });
    } finally {
      setBusy(false);
    }
  };

  const buy = () => {
    if (!accountId) return signIn();
    const txs: PreparedTx[] = [];
    if (registered.data === false) txs.push(registerTokenTx(accountId));
    txs.push(buyResaleTx({ passId: listing.pass_id, amountUnits: price }));
    void run(txs, "Pembelian berhasil. Pass baru sudah ada di koleksimu.", true);
  };

  return (
    <div className="flex flex-col bg-surface-low border border-on-background/5 rounded-2xl overflow-hidden shadow-sm">
      <div className="relative h-44 bg-surface-lowest">
        {event.image && <img src={event.image} alt={event.title} className="w-full h-full object-cover" />}
        {off > 0 && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent text-[#141414] text-[11px] font-bold">Hemat {off}%</span>
        )}
      </div>

      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{event.organizer}</p>
          <Link href={`/events/${event.id}`} className="font-bodoni text-xl font-bold leading-tight hover:text-accent-ink transition-colors line-clamp-2">
            {event.title}
          </Link>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-text-muted pt-1">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.city}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {event.dateLabel}</span>
          </p>
          <p className="text-xs text-text-muted">
            {tier?.name ?? listing.tier_id} · dijual {mine ? "olehmu" : `oleh ${shortAccount(listing.seller)}`}
          </p>
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-on-background/5">
          <div>
            <p className="font-bodoni text-2xl font-black leading-none">{fmtUsdc(price)}</p>
            <p className="text-xs text-text-muted mt-1">≈ {fmtIdr(price)} · harga asli {fmtUsdc(face)}</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-accent-ink">
            <ShieldCheck className="w-3.5 h-3.5" /> Pass baru
          </span>
        </div>

        {mine ? (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => run([cancelResaleTx(listing.pass_id)], "Penjualan dibatalkan.", false)}
            className="w-full border border-on-background/20"
          >
            {busy ? "Menunggu wallet…" : "Batalkan penjualan"}
          </Button>
        ) : (
          <Button variant="lime" disabled={busy || (!!accountId && !enough)} onClick={buy} className="w-full">
            {!accountId ? "Hubungkan wallet" : busy ? "Menunggu wallet…" : enough ? `Beli ${fmtUsdc(price)}` : `Saldo ${fmtUsdc(balance.data ?? 0)} kurang`}
          </Button>
        )}

        {msg && <p className={msg.ok ? "text-sm text-accent-ink" : "text-sm text-accent-coral"}>{msg.text}</p>}
      </div>
    </div>
  );
}
