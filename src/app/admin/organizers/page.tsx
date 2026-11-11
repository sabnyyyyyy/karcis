"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useChainConfig, useOrganizers } from "@/lib/chain/hooks";
import { banOrganizerTx, reinstateOrganizerTx, suspendOrganizerTx, type PreparedTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { nsToMs, shortAccount } from "@/lib/chain/format";
import type { ChainOrganizer } from "@/lib/chain/types";
import { cn } from "@/lib/utils";

const statusStyle = {
  ACTIVE: "bg-[#9CFF1E]/30 text-[#2d5c00]",
  SUSPENDED: "bg-[#FFF4D6] text-[#6b4e00]",
  BANNED: "bg-[#FFE5E6] text-[#9b1c22]",
} as const;
const statusLabel = { ACTIVE: "Aktif", SUSPENDED: "Ditangguhkan", BANNED: "Diblokir" } as const;
const kindLabel = { REPORT: "Laporan", SUSPEND: "Ditangguhkan", BAN: "Diblokir", REINSTATE: "Dipulihkan", PROFILEUPDATE: "Profil diubah" } as const;

const fmtDate = (ns: string) =>
  new Date(nsToMs(ns)).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Pelacakan penyelenggara: semua pendaftar, laporan pembeli, dan tindakan admin. Hanya admin yang bisa bertindak. */
export default function AdminOrganizersPage() {
  const { accountId, isReady, signIn } = useNearWallet();
  const config = useChainConfig();
  const list = useOrganizers();

  if (!isReady || config.isLoading) return <div className="min-h-screen" />;

  const isAdmin = !!accountId && accountId === config.data?.admin;
  // Yang paling banyak dilaporkan / bermasalah di atas
  const sorted = [...(list.data ?? [])].sort(
    (a, b) => Number(b.status !== "ACTIVE") - Number(a.status !== "ACTIVE") || b.reports - a.reports
  );

  return (
    <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col">
      <section className="relative px-6 md:px-12 py-14 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto space-y-10">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#5C6157] hover:text-[#141414]">
              <ChevronLeft className="w-4 h-4" /> Beranda
            </Link>
            <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-[-0.04em] leading-none">Registri penyelenggara</h1>
            <p className="text-[#5C6157] max-w-xl">
              Semua penyelenggara dan riwayat kasusnya tercatat di kontrak NEAR. Siapa pun bisa membaca; hanya admin ({config.data?.admin ?? "-"}) yang bisa menangguhkan, memblokir, atau memulihkan.
            </p>
          </div>

          {!accountId && (
            <button onClick={signIn} className="px-8 py-3.5 rounded-full bg-[#9CFF1E] font-semibold">Hubungkan wallet admin</button>
          )}
          {accountId && !isAdmin && (
            <p className="p-4 rounded-2xl bg-[#FFF4D6] text-[#6b4e00] text-sm">
              Mode baca saja. Akun {shortAccount(accountId)} bukan admin, jadi tombol tindakan tidak tersedia.
            </p>
          )}

          {list.isLoading ? (
            <div className="h-40 rounded-3xl bg-[#F5F8EE] animate-pulse" />
          ) : sorted.length === 0 ? (
            <p className="text-[#5C6157]">Belum ada penyelenggara terdaftar.</p>
          ) : (
            <div className="space-y-4">
              {sorted.map((o) => (
                <OrganizerRow key={o.account_id} org={o} canAct={isAdmin} />
              ))}
            </div>
          )}
        </div>
      </section>
      <EditorialFooter />
    </main>
  );
}

function OrganizerRow({ org, canAct }: { org: ChainOrganizer; canAct: boolean }) {
  const { sendTransactions } = useNearWallet();
  const [open, setOpen] = useState(org.status !== "ACTIVE" || org.reports > 0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const act = async (key: string, tx: PreparedTx) => {
    if (reason.trim().length < 5) return setMsg({ ok: false, text: "Isi alasan dulu (minimal 5 karakter)." });
    setBusy(key);
    setMsg(null);
    try {
      await sendTransactions([tx], { callbackUrl: window.location.href });
      setMsg({ ok: true, text: "Tindakan tercatat di kontrak." });
      setReason("");
    } catch (e) {
      setMsg({ ok: false, text: explainChainError(e) });
    } finally {
      setBusy(null);
    }
  };

  const btn = "px-5 py-2.5 rounded-full text-sm font-semibold border transition-colors disabled:opacity-40";

  return (
    <div className="p-6 rounded-3xl border border-black/10 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-lg font-semibold">{org.profile.name}</p>
          <p className="text-xs font-mono text-[#5C6157] break-all">{org.account_id}</p>
          <p className="text-sm text-[#5C6157]">
            {org.profile.org_type} · {org.profile.city} · {org.profile.contact || "tanpa kontak"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#5C6157]">{org.reports} laporan</span>
          <span className={cn("px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest", statusStyle[org.status])}>
            {statusLabel[org.status]}
          </span>
        </div>
      </div>

      <button onClick={() => setOpen((v) => !v)} className="text-sm font-semibold text-[#3F7D00] underline underline-offset-4">
        {open ? "Sembunyikan riwayat" : `Lihat riwayat (${org.cases.length})`}
      </button>

      {open && (
        <div className="space-y-4">
          {org.cases.length === 0 ? (
            <p className="text-sm text-[#5C6157]">Belum ada catatan kasus.</p>
          ) : (
            <ul className="space-y-3">
              {org.cases.map((c, i) => (
                <li key={i} className="p-4 rounded-2xl bg-[#F5F8EE] text-sm space-y-1">
                  <p className="flex flex-wrap gap-x-3 text-[#5C6157]">
                    <b className="text-[#141414]">{kindLabel[c.kind]}</b>
                    <span>{fmtDate(c.at)}</span>
                    <span className="font-mono">{shortAccount(c.by)}</span>
                  </p>
                  <p>{c.reason}</p>
                </li>
              ))}
            </ul>
          )}

          {canAct && (
            <div className="space-y-3 pt-2">
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Alasan tindakan (tercatat permanen)"
                className="w-full rounded-2xl border border-[#141414]/15 px-4 py-3 text-sm outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40 resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {org.status === "ACTIVE" && (
                  <button disabled={busy !== null} onClick={() => act("suspend", suspendOrganizerTx(org.account_id, reason))} className={cn(btn, "border-[#F5D37A] bg-[#FFF4D6] text-[#6b4e00] hover:bg-[#F5D37A]")}>
                    {busy === "suspend" ? "Menunggu wallet…" : "Tangguhkan"}
                  </button>
                )}
                {org.status !== "BANNED" && (
                  <button disabled={busy !== null} onClick={() => act("ban", banOrganizerTx(org.account_id, reason))} className={cn(btn, "border-[#F5A3A7] bg-[#FFE5E6] text-[#9b1c22] hover:bg-[#F5A3A7]")}>
                    {busy === "ban" ? "Menunggu wallet…" : "Blokir"}
                  </button>
                )}
                {org.status !== "ACTIVE" && (
                  <button disabled={busy !== null} onClick={() => act("reinstate", reinstateOrganizerTx(org.account_id, reason))} className={cn(btn, "border-[#9CFF1E] bg-[#9CFF1E]/30 hover:bg-[#9CFF1E]")}>
                    {busy === "reinstate" ? "Menunggu wallet…" : "Pulihkan"}
                  </button>
                )}
              </div>
            </div>
          )}
          {msg && <p className={msg.ok ? "text-sm text-[#3F7D00]" : "text-sm text-[#E5484D]"}>{msg.text}</p>}
        </div>
      )}
    </div>
  );
}
