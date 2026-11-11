"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Wallet, AlertCircle, Stamp, Loader2, ExternalLink, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNearWallet } from "@/providers/NearWalletProvider";
import {
  useChainEvent,
  useMyPassesQuery,
  useQuote,
  useTokenBalance,
  useTokenRegistered,
} from "@/lib/chain/hooks";
import { fmtIdr, fmtUsdc, shortAccount, usdToUnits } from "@/lib/chain/format";
import { explainChainError, readSuccessValue } from "@/lib/chain/errors";
import {
  buyPassTx,
  canMintTestUsdc,
  mintFreePassTx,
  mintTestUsdcTx,
  registerTokenTx,
  type PreparedTx,
} from "@/lib/chain/builders";
import { CHAIN, txUrl } from "@/lib/chain/config";
import { isEnded, isSoldOut } from "@/data/events";

const refKey = (eventId: string) => `karcis-ref-${eventId}`;

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { data: event, isLoading } = useChainEvent(params.id);
  const { accountId, isReady, signIn, sendTransactions } = useNearWallet();

  const tier = event?.tiers.find((t) => t.id === search.get("tier")) ?? event?.tiers[0];
  const quote = useQuote(event?.id, tier?.id);
  const balance = useTokenBalance(accountId);
  const registered = useTokenRegistered(accountId);
  const myPasses = useMyPassesQuery();

  const [referrer, setReferrer] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);

  // Pass yang sudah ada sebelum pembelian, untuk mengenali pass baru
  const baseline = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!baseline.current && !myPasses.isLoading && accountId) {
      baseline.current = new Set(myPasses.data.filter((p) => p.eventId === params.id).map((p) => p.id));
    }
  }, [myPasses.isLoading, myPasses.data, accountId, params.id]);

  // Referral: dari ?ref= atau dari yang tersimpan saat membuka halaman event
  useEffect(() => {
    const fromUrl = search.get("ref");
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(refKey(params.id));
    } catch {
      // abaikan
    }
    setReferrer(fromUrl ?? stored);
  }, [search, params.id]);

  const returnedFromWallet = !!search.get("transactionHashes");
  const txHash = search.get("transactionHashes")?.split(",").pop() ?? null;

  const newPass = useMemo(() => {
    if (!baseline.current) return null;
    return myPasses.data.find((p) => p.eventId === params.id && !baseline.current!.has(p.id)) ?? null;
  }, [myPasses.data, params.id]);

  // Setelah kembali dari wallet (redirect), tunggu pass baru muncul
  useEffect(() => {
    if (!returnedFromWallet || newPass) return;
    const t = setInterval(() => void myPasses.refetch(), 3000);
    return () => clearInterval(t);
  }, [returnedFromWallet, newPass, myPasses]);

  if (isLoading || !isReady) return <main className="min-h-screen bg-background" />;

  if (!event || !tier) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-bodoni text-4xl font-black">Event tidak ditemukan.</h1>
        <Link href="/events" className="px-8 py-3 bg-primary text-on-primary rounded-full text-xs font-bold uppercase tracking-widest">
          Kembali ke daftar event
        </Link>
      </main>
    );
  }

  const isFree = tier.price === 0;
  const q = quote.data;
  const total = q ? Number(q.total) : 0;
  const have = balance.data ?? 0;
  const enough = isFree || have >= total;
  const ended = isEnded(event);
  const soldOut = isSoldOut(event);
  const needsFunding = !!event.campaign && !event.campaign.funded && !isFree;
  const blocked = ended || soldOut || needsFunding;
  const validRef = referrer && referrer !== accountId ? referrer : null;
  const success = phase === "done" || (returnedFromWallet && !!newPass);

  const pay = async () => {
    if (!accountId) return signIn();
    setPhase("sending");
    setMessage(null);
    try {
      let txs: PreparedTx[];
      if (isFree) {
        txs = [mintFreePassTx(event.id, tier.id)];
      } else {
        txs = [];
        if (registered.data === false) txs.push(registerTokenTx(accountId));
        txs.push(buyPassTx({ eventId: event.id, tierId: tier.id, amountUnits: total, referrer: validRef }));
      }
      const outcome = await sendTransactions(txs, {
        callbackUrl: `${window.location.origin}/checkout/${event.id}?tier=${tier.id}`,
      });
      // ft_transfer_call mengembalikan jumlah yang terpakai; "0" berarti kontrak menolak dan uang dikembalikan
      const used = readSuccessValue(outcome);
      if (!isFree && (used === "0" || used === 0)) {
        setPhase("idle");
        setMessage("Kontrak menolak pembelian ini dan pembayaranmu dikembalikan. Cek apakah tiket masih tersedia, lalu coba lagi.");
        return;
      }
      await myPasses.refetch();
      setPhase("done");
    } catch (e) {
      setPhase("idle");
      setMessage(explainChainError(e));
    }
  };

  const mintUsdc = async () => {
    if (!accountId) return;
    setMinting(true);
    setMessage(null);
    try {
      const txs: PreparedTx[] = [];
      if (registered.data === false) txs.push(registerTokenTx(accountId));
      txs.push(mintTestUsdcTx(accountId, usdToUnits(100)));
      await sendTransactions(txs, { callbackUrl: window.location.href });
      await balance.refetch();
    } catch (e) {
      setMessage(explainChainError(e));
    } finally {
      setMinting(false);
    }
  };

  return (
    <main data-nav-theme="light" className="min-h-screen bg-background text-primary flex flex-col pt-0 font-inter">
      <div className="px-6 md:px-12 py-32 max-w-[1100px] mx-auto w-full">
        {success ? (
          <div className="text-center py-10 space-y-10">
            <div className="w-24 h-24 bg-accent text-[#141414] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h1 className="font-bodoni text-5xl font-black tracking-tight">Pass-mu siap.</h1>
              <p className="text-lg text-text-muted max-w-md mx-auto">
                NFT pass sudah ada di walletmu. Tunjukkan QR-nya di pintu masuk, dan setelah discan ia jadi lencana permanen.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-surface-low border border-on-background/10 rounded-3xl p-8 space-y-5 text-left">
              <Line label="ID pass" value={newPass?.id ?? "Memproses…"} mono />
              <Line label="Event" value={event.title} />
              <Line label="Pemilik" value={accountId ? shortAccount(accountId) : "-"} mono />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Stempel</span>
                <span className="stamp px-3 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Stamp className="w-3 h-3" /> +{event.stamps} setelah discan
                </span>
              </div>
              {txHash && (
                <a href={txUrl(txHash)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-accent-ink underline underline-offset-4">
                  Lihat transaksi <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={newPass ? `/dashboard/tickets/${newPass.id}` : "/dashboard/tickets"}>
                <Button className="h-14 px-10 bg-primary text-on-primary font-bold hover:bg-accent transition-all rounded-full">Lihat pass</Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" className="h-14 px-10 border border-on-background/20 text-primary font-bold rounded-full">
                  Cari event lain
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-3">
                <h1 className="font-bodoni text-4xl md:text-5xl font-black tracking-tight">Bayar &amp; terima pass</h1>
                <p className="text-text-muted">
                  Pembayaran memakai {CHAIN.stableSymbol} di NEAR {CHAIN.network}. Pass langsung dikirim ke walletmu sebagai NFT.
                </p>
              </div>

              {/* Wallet */}
              <div className="p-6 rounded-3xl border border-on-background/10 bg-surface-low space-y-4">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-accent-ink" />
                  <p className="font-semibold">Wallet</p>
                </div>
                {accountId ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-mono break-all">{accountId}</p>
                    {!isFree && (
                      <p className="text-text-muted">
                        Saldo {CHAIN.stableSymbol}: <b className="text-primary">{fmtUsdc(have)}</b>
                        {!enough && <span className="text-accent-coral"> (kurang {fmtUsdc(total - have)})</span>}
                      </p>
                    )}
                    {!isFree && !enough && canMintTestUsdc() && (
                      <button
                        onClick={mintUsdc}
                        disabled={minting}
                        className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-full border border-on-background/20 text-sm font-semibold hover:bg-accent hover:border-accent hover:text-[#141414] transition-colors disabled:opacity-50"
                      >
                        <Coins className="w-4 h-4" /> {minting ? "Menunggu wallet…" : "Cetak 100 USDC uji (testnet)"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-text-muted">Hubungkan NEAR wallet untuk melanjutkan.</p>
                    <Button onClick={signIn} variant="lime" className="h-12 px-8">Hubungkan wallet</Button>
                  </div>
                )}
              </div>

              {validRef && !isFree && (
                <p className="text-sm text-text-muted">
                  Kamu membeli lewat link referral <span className="font-mono text-primary">{shortAccount(validRef)}</span>.
                  Biayanya tidak berubah; clipper itu dapat hadiah dari dana kampanye.
                </p>
              )}

              {message && (
                <div className="p-5 rounded-2xl border border-accent-coral/30 bg-accent-coral/5 flex gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 text-accent-coral shrink-0" />
                  <p>{message}</p>
                </div>
              )}

              {returnedFromWallet && !newPass && (
                <div className="p-5 rounded-2xl border border-accent/30 bg-accent/5 flex gap-3 text-sm items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-accent-ink" />
                  <p>Transaksi terkirim. Menunggu pass tercatat di jaringan…</p>
                </div>
              )}

              {blocked && (
                <p className="text-accent-coral font-semibold">
                  {ended ? "Event sudah selesai, penjualan ditutup." : soldOut ? "Tiket sudah habis." : "Penyelenggara belum menyetor dana kampanye."}
                </p>
              )}

              <Button
                onClick={pay}
                disabled={phase === "sending" || blocked || (!!accountId && !enough) || quote.isLoading}
                variant="lime"
                size="lg"
                className="w-full sm:w-auto"
              >
                {!accountId
                  ? "Hubungkan wallet"
                  : phase === "sending"
                    ? "Menunggu wallet…"
                    : isFree
                      ? "Ambil pass gratis"
                      : `Bayar ${q ? fmtUsdc(q.total) : ""}`}
              </Button>
              <p className="text-xs text-text-muted max-w-md">
                {isFree
                  ? "Pass gratis hanya butuh biaya penyimpanan sekitar 0,005 NEAR (kelebihan dikembalikan)."
                  : "Wallet akan meminta persetujuan. Kalau kontrak menolak pembelian, token dikembalikan otomatis."}
              </p>
            </div>

            {/* Ringkasan */}
            <div className="lg:col-span-5">
              <div className="sticky top-28 bg-surface-low border border-on-background/10 rounded-3xl p-8 space-y-7">
                <h2 className="font-bodoni text-2xl font-black tracking-tight border-b border-on-background/10 pb-5">Ringkasan</h2>
                <div className="space-y-4">
                  {event.image && (
                    <div className="aspect-video rounded-2xl overflow-hidden bg-background">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="font-bodoni text-xl font-bold leading-tight">{event.title}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted">{event.dateFull} · {event.city}</p>
                    <p className="text-xs text-text-muted">Pass: {tier.name} · kode {event.code}</p>
                  </div>
                </div>

                {isFree ? (
                  <p className="text-sm font-semibold">Gratis</p>
                ) : q ? (
                  <div className="space-y-3 pt-5 border-t border-on-background/10 text-sm">
                    <Line label="Harga tiket" value={fmtUsdc(q.price)} />
                    {event.feeBearer === "BUYER" ? (
                      <>
                        <Line label="Biaya layanan (3,4%)" value={fmtUsdc(q.platform_fee)} />
                        {Number(q.promo_fee) > 0 && <Line label="Biaya promosi" value={fmtUsdc(q.promo_fee)} />}
                      </>
                    ) : (
                      <p className="text-xs text-text-muted">Biaya layanan ditanggung penyelenggara.</p>
                    )}
                    <div className="pt-4 border-t border-on-background/10 flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Total</span>
                      <span className="text-right">
                        <span className="font-bodoni text-3xl font-black leading-none">{fmtUsdc(q.total)}</span>
                        <span className="block text-xs text-text-muted mt-1">≈ {fmtIdr(q.total)} (perkiraan kurs)</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">Memuat rincian harga dari kontrak…</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{label}</span>
      <span className={mono ? "font-mono text-sm break-all text-right" : "font-semibold text-right"}>{value}</span>
    </div>
  );
}
