"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Repeat } from "lucide-react";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useChainEvent, useListing } from "@/lib/chain/hooks";
import { cancelResaleTx, listPassTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { fmtIdr, fmtUsdc } from "@/lib/chain/format";
import { isEnded } from "@/data/events";
import type { Pass } from "@/types/pass";

const FEE_BPS = 340;

/** Jual pass yang tidak jadi dipakai: harga maksimal harga asli, pembeli menerima pass baru, pass lama di-burn */
export function ResalePanel({ pass }: { pass: Pass }) {
  const { sendTransactions } = useNearWallet();
  const { data: event } = useChainEvent(pass.eventId);
  const { data: listing, refetch } = useListing(pass.id);
  const tier = event?.tiers.find((t) => t.id === pass.tierId);
  const face = tier?.price ?? 0;

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!event || !tier) return null;

  // Pass gratis dan event yang sudah selesai tidak bisa dijual ulang
  if (face === 0 || isEnded(event)) return null;

  const run = async (tx: ReturnType<typeof listPassTx>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await sendTransactions([tx], { callbackUrl: window.location.href });
      await refetch();
      setMsg({ ok: true, text: ok });
    } catch (e) {
      setMsg({ ok: false, text: explainChainError(e) });
    } finally {
      setBusy(false);
    }
  };

  const fee = Math.floor((face * FEE_BPS) / 10_000);

  return (
    <div className="p-6 md:p-8 rounded-3xl border border-on-background/10 bg-surface space-y-5">
      <div className="flex items-center gap-3 text-accent-ink">
        <Repeat className="w-5 h-5" />
        <h2 className="font-bodoni text-2xl font-bold tracking-tight">Tidak jadi hadir?</h2>
      </div>

      {listing ? (
        <div className="space-y-4">
          <p className="text-sm text-text-muted leading-relaxed">
            Pass ini sedang dijual di pasar tiket seharga <b className="text-primary">{fmtUsdc(listing.price)}</b> ({fmtIdr(listing.price)}). Kamu akan menerima{" "}
            <b className="text-primary">{fmtUsdc(listing.seller_receives)}</b> setelah biaya platform 3,4%. Kalau kamu datang dan discan, listing otomatis dibatalkan.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => run(cancelResaleTx(pass.id), "Penjualan dibatalkan.")}
              disabled={busy}
              className="px-6 py-3 rounded-full border border-on-background/20 text-sm font-semibold hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50"
            >
              {busy ? "Menunggu wallet…" : "Batalkan penjualan"}
            </button>
            <Link href={`/resale?event=${pass.eventId}`} className="text-sm font-semibold text-accent-ink underline underline-offset-4">
              Lihat di pasar tiket
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-muted leading-relaxed">
            Dijual dengan harga yang sama seperti saat kamu beli: <b className="text-primary">{fmtUsdc(face)}</b> ({fmtIdr(face)}). Kamu menerima{" "}
            <b className="text-primary">{fmtUsdc(face - fee)}</b> setelah biaya platform 3,4%.
          </p>
          <button
            onClick={() => run(listPassTx(pass.id, face), "Pass kamu sudah dipasang di pasar tiket.")}
            disabled={busy}
            className="px-7 py-3 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-accent hover:text-[#141414] transition-colors disabled:opacity-40"
          >
            {busy ? "Menunggu wallet…" : "Jual tiket"}
          </button>
          <p className="text-xs text-text-muted">Butuh sekitar 0,003 NEAR untuk menyimpan listing (kelebihan dikembalikan).</p>
        </div>
      )}

      {msg && <p className={msg.ok ? "text-sm text-accent-ink" : "text-sm text-accent-coral"}>{msg.text}</p>}
    </div>
  );
}
