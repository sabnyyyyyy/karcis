"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ExternalLink, Megaphone, Coins, UserPlus, ScanLine } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useCampaign, useChainEvent, useTokenBalance, useTokenRegistered } from "@/lib/chain/hooks";
import {
  addScannerTx,
  canMintTestUsdc,
  fundCampaignTx,
  mintTestUsdcTx,
  registerTokenTx,
  settleCampaignTx,
  type PreparedTx,
} from "@/lib/chain/builders";
import { explainChainError, readSuccessValue } from "@/lib/chain/errors";
import { fmtIdr, fmtUsdc, shortAccount, usdToUnits } from "@/lib/chain/format";
import { CHAIN, accountUrl } from "@/lib/chain/config";
import { isEnded } from "@/data/events";

export default function ManageEventPage() {
  return (
    <OrganizerGuard>
      <Manage />
    </OrganizerGuard>
  );
}

function Manage() {
  const { id } = useParams<{ id: string }>();
  const { accountId, sendTransactions } = useNearWallet();
  const { data: event, isLoading } = useChainEvent(id);
  const campaign = useCampaign(event?.campaign ? id : undefined);
  const balance = useTokenBalance(accountId);
  const registered = useTokenRegistered(accountId);

  const [scanner, setScanner] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (isLoading) return <div className="min-h-screen" />;

  if (!event || event.ownerAccount !== accountId) {
    return (
      <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col items-center justify-center gap-5 text-center px-6">
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">{event ? "Ini bukan event milikmu." : "Event tidak ditemukan."}</h1>
        <Link href="/organizer" className="px-8 py-3.5 rounded-full bg-[#9CFF1E] font-semibold">Kembali ke panel</Link>
      </main>
    );
  }

  const ended = isEnded(event);
  const terms = event.campaign;
  const have = balance.data ?? 0;
  const c = campaign.data;

  const run = async (key: string, txs: PreparedTx[], okText: string) => {
    setBusy(key);
    setMessage(null);
    try {
      const outcome = await sendTransactions(txs, { callbackUrl: window.location.href });
      // Setoran kampanye yang ditolak kontrak dikembalikan; ft_transfer_call memberi jumlah terpakai "0"
      if (key === "fund") {
        const used = readSuccessValue(outcome);
        if (used === "0" || used === 0) {
          setMessage({ ok: false, text: "Kontrak menolak setoran dan dana dikembalikan. Pastikan jumlahnya sesuai deposit yang dibutuhkan." });
          return;
        }
      }
      setMessage({ ok: true, text: okText });
    } catch (e) {
      setMessage({ ok: false, text: explainChainError(e) });
    } finally {
      setBusy(null);
    }
  };

  const fund = () => {
    if (!terms) return;
    const txs: PreparedTx[] = [];
    if (registered.data === false && accountId) txs.push(registerTokenTx(accountId));
    txs.push(fundCampaignTx({ eventId: event.id, amountUnits: terms.depositRequired }));
    void run("fund", txs, "Deposit kampanye tersetor. Penjualan pass berbayar sekarang dibuka.");
  };

  const mint = () => {
    if (!accountId) return;
    const txs: PreparedTx[] = [];
    if (registered.data === false) txs.push(registerTokenTx(accountId));
    txs.push(mintTestUsdcTx(accountId, usdToUnits(1000)));
    void run("mint", txs, "USDC uji masuk ke walletmu.");
  };

  const addScanner = (e: React.FormEvent) => {
    e.preventDefault();
    const who = scanner.trim();
    if (!who) return;
    void run("scanner", [addScannerTx(event.id, who)], `${who} sekarang bisa scan pass event ini.`).then(() => setScanner(""));
  };

  return (
    <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col">
      <section className="relative px-6 md:px-12 py-14 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto space-y-12">
          <div className="space-y-4">
            <Link href="/organizer" className="inline-flex items-center gap-1 text-sm text-[#5C6157] hover:text-[#141414]">
              <ChevronLeft className="w-4 h-4" /> Panel
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3F7D00]">Kelola event · {event.code}</p>
                <h1 className="text-[34px] md:text-[48px] font-extrabold tracking-[-0.04em] leading-none">{event.title}</h1>
                <p className="text-[#5C6157]">{event.dateFull} · {event.venue}, {event.city}{ended ? " · selesai" : ""}</p>
              </div>
              <Link href={`/events/${event.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#3F7D00] underline underline-offset-4">
                Lihat halaman publik <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: "Terjual", v: `${event.sold}/${event.capacity}` },
              { l: "Sudah hadir", v: String(event.checkedIn) },
              { l: "Stempel", v: `+${event.stamps}` },
              { l: "Biaya layanan", v: event.feeBearer === "BUYER" ? "Pembeli" : "Penyelenggara" },
            ].map((m) => (
              <div key={m.l} className="p-5 rounded-3xl bg-[#F5F8EE] border border-black/5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#5C6157]">{m.l}</p>
                <p className="text-2xl font-extrabold tracking-[-0.03em] mt-1">{m.v}</p>
              </div>
            ))}
          </div>

          {message && (
            <p className={message.ok ? "p-4 rounded-2xl bg-[#9CFF1E]/20 text-sm" : "p-4 rounded-2xl bg-[#FFE5E6] text-[#9b1c22] text-sm"}>{message.text}</p>
          )}

          {/* Identitas NFT */}
          <Block title="Identitas NFT pass">
            <dl className="grid sm:grid-cols-3 gap-4 text-sm">
              <Info label="Contoh ID" value={`${event.code}-0001`} mono />
              <Info label="Nama NFT" value={event.nftName || event.title} />
              <Info label="Kontrak" value={CHAIN.contractId} mono />
            </dl>
          </Block>

          {/* Kampanye */}
          {terms ? (
            <Block title="Kampanye clipper">
              <div className="flex items-start gap-3 text-sm text-[#5C6157]">
                <Megaphone className="w-5 h-5 mt-0.5 text-[#3F7D00] shrink-0" />
                <p>
                  Clip dibayar {fmtUsdc(terms.clipRatePerMillion)} ({fmtIdr(terms.clipRatePerMillion)}) per 1 juta view dan {fmtUsdc(terms.referralReward)} ({fmtIdr(terms.referralReward)}) per penjualan referral. Dana cair setelah event selesai.
                </p>
              </div>

              {!terms.funded ? (
                <div className="p-6 rounded-3xl border-2 border-[#9CFF1E] bg-[#9CFF1E]/10 space-y-4">
                  <p className="font-semibold">Setor deposit untuk membuka penjualan</p>
                  <p className="text-sm text-[#5C6157]">
                    Deposit {fmtUsdc(terms.depositRequired)} (≈ {fmtIdr(terms.depositRequired)}), 10% dari anggaran promosi. Sisanya tidak terpakai dikembalikan setelah kampanye selesai. Saldo {CHAIN.stableSymbol} kamu: <b>{fmtUsdc(have)}</b>.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={fund}
                      disabled={busy !== null || have < terms.depositRequired}
                      className="px-7 py-3 rounded-full bg-[#141414] text-white font-semibold hover:bg-[#9CFF1E] hover:text-[#141414] transition-colors disabled:opacity-40"
                    >
                      {busy === "fund" ? "Menunggu wallet…" : `Setor ${fmtUsdc(terms.depositRequired)}`}
                    </button>
                    {canMintTestUsdc() && have < terms.depositRequired && (
                      <button
                        onClick={mint}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#141414]/20 font-semibold hover:bg-[#9CFF1E] hover:border-[#9CFF1E] transition-colors disabled:opacity-40"
                      >
                        <Coins className="w-4 h-4" /> {busy === "mint" ? "Menunggu wallet…" : "Cetak 1.000 USDC uji"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <Info label="Deposit tersetor" value={c ? fmtUsdc(c.deposit) : "…"} />
                  <Info label="Biaya promosi terkumpul" value={c ? fmtUsdc(c.collected) : "…"} />
                  <Info label="Status" value={terms.settled ? "Sudah diselesaikan" : terms.viewsReported ? "View sudah dilaporkan" : ended ? "Menunggu laporan view" : "Berjalan"} />
                </div>
              )}

              {c && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="p-5 rounded-3xl border border-black/10 space-y-3">
                    <p className="font-semibold">Clip ({c.clips.length})</p>
                    {c.clips.length === 0 && <p className="text-sm text-[#5C6157]">Belum ada clip dikirim.</p>}
                    <ul className="space-y-2 text-sm">
                      {c.clips.map((cl) => (
                        <li key={cl.id} className="flex justify-between gap-3">
                          <a href={cl.url} target="_blank" rel="noreferrer" className="truncate underline underline-offset-4">
                            {cl.platform} · {shortAccount(cl.clipper)}
                          </a>
                          <span className="tabular-nums text-[#5C6157] shrink-0">{cl.views === null ? "belum dihitung" : `${Number(cl.views).toLocaleString("id-ID")} view`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5 rounded-3xl border border-black/10 space-y-3">
                    <p className="font-semibold">Penjualan referral</p>
                    {c.referrals.length === 0 && <p className="text-sm text-[#5C6157]">Belum ada penjualan lewat referral.</p>}
                    <ul className="space-y-2 text-sm">
                      {c.referrals.map((r) => (
                        <li key={r.account} className="flex justify-between gap-3">
                          <span className="truncate font-mono">{shortAccount(r.account)}</span>
                          <span className="tabular-nums text-[#5C6157]">{r.sales} tiket</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {terms.funded && ended && !terms.settled && (
                <div className="p-5 rounded-3xl border border-black/10 space-y-3">
                  <p className="text-sm text-[#5C6157]">
                    Event sudah selesai. Setelah verifier melaporkan jumlah view (atau 14 hari berlalu tanpa laporan), kampanye bisa diselesaikan: clipper dibayar, sisa deposit kembali ke walletmu.
                  </p>
                  <button
                    onClick={() => run("settle", [settleCampaignTx(event.id)], "Kampanye diselesaikan. Hadiah dikirim ke para clipper.")}
                    disabled={busy !== null}
                    className="px-7 py-3 rounded-full bg-[#141414] text-white font-semibold hover:bg-[#9CFF1E] hover:text-[#141414] transition-colors disabled:opacity-40"
                  >
                    {busy === "settle" ? "Menunggu wallet…" : "Selesaikan kampanye"}
                  </button>
                </div>
              )}
            </Block>
          ) : (
            <Block title="Kampanye clipper">
              <p className="text-sm text-[#5C6157]">Event ini tidak memakai kampanye, jadi pembeli hanya membayar harga tiket (plus biaya layanan jika ditanggung pembeli).</p>
            </Block>
          )}

          {/* Petugas scan */}
          <Block title="Petugas scan">
            <p className="text-sm text-[#5C6157]">Kamu sendiri selalu bisa scan. Tambahkan akun NEAR lain untuk membantu di pintu masuk.</p>
            <ul className="flex flex-wrap gap-2">
              {event.scanners.length === 0 && <li className="text-sm text-[#5C6157]">Belum ada petugas tambahan.</li>}
              {event.scanners.map((s) => (
                <li key={s}>
                  <a href={accountUrl(s)} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full bg-[#F5F8EE] border border-black/5 text-sm font-mono">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
            <form onSubmit={addScanner} className="flex gap-2 max-w-lg">
              <input
                value={scanner}
                onChange={(e) => setScanner(e.target.value)}
                placeholder="akun-petugas.testnet"
                className="flex-1 min-w-0 rounded-2xl border border-[#141414]/15 px-4 py-3 text-[15px] font-mono outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40"
              />
              <button
                type="submit"
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-5 rounded-2xl bg-[#141414] text-white text-sm font-semibold hover:bg-[#9CFF1E] hover:text-[#141414] transition-colors disabled:opacity-40"
              >
                <UserPlus className="w-4 h-4" /> Tambah
              </button>
            </form>
            <Link href="/organizer/scan" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3F7D00] underline underline-offset-4">
              <ScanLine className="w-4 h-4" /> Buka pemindai
            </Link>
          </Block>
        </div>
      </section>
      <EditorialFooter />
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-semibold tracking-[-0.02em] border-b border-black/10 pb-3">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-4 rounded-2xl bg-[#F5F8EE] border border-black/5 min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-[#5C6157]">{label}</dt>
      <dd className={mono ? "font-mono text-sm break-all mt-1" : "font-semibold mt-1"}>{value}</dd>
    </div>
  );
}
