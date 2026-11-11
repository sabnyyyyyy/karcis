"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, ExternalLink, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useMyPasses, useOrganizer } from "@/lib/chain/hooks";
import { reportOrganizerTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { nsToMs, shortAccount } from "@/lib/chain/format";
import { accountUrl } from "@/lib/chain/config";

const statusLabel = { ACTIVE: "Aktif", SUSPENDED: "Ditangguhkan", BANNED: "Diblokir" } as const;

/** Kartu "siapa penyelenggaranya": data yang tercatat on-chain, status, dan tombol lapor untuk pemegang pass */
export function OrganizerTrust({ account, name }: { account: string; name: string }) {
  const { accountId, sendTransactions } = useNearWallet();
  const { data: org, isLoading, refetch } = useOrganizer(account);
  const passes = useMyPasses();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (isLoading) return <div className="h-32 rounded-xl bg-surface-low animate-pulse" />;

  if (!org) {
    return (
      <div className="space-y-3">
        <h2 className="font-bodoni text-2xl font-bold tracking-tight">Penyelenggara</h2>
        <div className="p-6 bg-surface-low border border-on-background/5 rounded-xl text-sm text-text-muted">
          {name} belum terdaftar di registri on-chain.
        </div>
      </div>
    );
  }

  const ok = org.status === "ACTIVE";
  const holdsPass = !!accountId && passes.some((p) => p.organizerAccount === account);
  const alreadyReported = !!accountId && org.cases.some((c) => c.kind === "REPORT" && c.by === accountId);
  const actions = org.cases.filter((c) => c.kind !== "REPORT");
  const lastAdmin = [...actions].reverse().find((c) => c.kind === "SUSPEND" || c.kind === "BAN");
  const since = new Date(nsToMs(org.registered_at)).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await sendTransactions([reportOrganizerTx(account, reason)], { callbackUrl: window.location.href });
      setMsg({ ok: true, text: "Laporanmu tercatat di kontrak. Terima kasih." });
      setOpen(false);
      setReason("");
      await refetch();
    } catch (err) {
      setMsg({ ok: false, text: explainChainError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-3", ok ? "text-accent-ink" : "text-accent-coral")}>
        {ok ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
        <h2 className="font-bodoni text-2xl font-bold tracking-tight">Penyelenggara</h2>
      </div>

      <div className="p-6 bg-surface-low border border-on-background/5 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold">{org.profile.name}</p>
            <p className="text-sm text-text-muted capitalize">
              {org.profile.org_type} · {org.profile.city}
            </p>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
              ok ? "text-accent-ink border-accent/40 bg-accent/10" : "text-accent-coral border-accent-coral/40 bg-accent-coral/10"
            )}
          >
            {statusLabel[org.status]}
          </span>
        </div>

        {!ok && (
          <p className="text-sm text-accent-coral">
            Penjualan tiket penyelenggara ini dihentikan oleh admin Karcis.
            {lastAdmin && ` Catatan: ${lastAdmin.reason}`}
          </p>
        )}

        {org.profile.description && <p className="text-sm text-text-muted leading-relaxed">{org.profile.description}</p>}

        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Terdaftar on-chain sejak</dt>
            <dd className="font-semibold">{since}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Kontak</dt>
            <dd className="font-semibold break-all">{org.profile.contact || "-"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Laporan dari pembeli</dt>
            <dd className="font-semibold">{org.reports}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Akun</dt>
            <dd>
              <a href={accountUrl(account)} target="_blank" rel="noreferrer" className="font-mono text-sm inline-flex items-center gap-1.5 underline underline-offset-4">
                {shortAccount(account)} <ExternalLink className="w-3 h-3" />
              </a>
            </dd>
          </div>
        </dl>

        {actions.length > 0 && (
          <ul className="space-y-1.5 pt-3 border-t border-on-background/10 text-sm">
            {actions.map((c, i) => (
              <li key={i} className="text-text-muted">
                <b className="text-primary">
                  {new Date(nsToMs(c.at)).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                  {c.kind === "SUSPEND" ? "Ditangguhkan" : c.kind === "BAN" ? "Diblokir" : c.kind === "PROFILEUPDATE" ? "Profil diubah" : "Dipulihkan"}
                </b>
                : {c.reason}
              </li>
            ))}
          </ul>
        )}

        {accountId !== account && (
          <div className="pt-3 border-t border-on-background/10 space-y-3">
            {holdsPass && !alreadyReported && !open && (
              <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-accent-coral underline underline-offset-4">
                <Flag className="w-4 h-4" /> Laporkan penyelenggara ini
              </button>
            )}
            {alreadyReported && <p className="text-sm text-text-muted">Kamu sudah melaporkan penyelenggara ini.</p>}
            {!holdsPass && !alreadyReported && (
              <p className="text-xs text-text-muted">Hanya pemegang pass dari event penyelenggara ini yang bisa melapor.</p>
            )}
            {open && (
              <form onSubmit={submit} className="space-y-3">
                <textarea
                  required
                  minLength={10}
                  maxLength={500}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ceritakan masalahnya (minimal 10 karakter). Laporan tercatat permanen di kontrak."
                  className="w-full rounded-2xl border border-on-background/15 bg-background px-4 py-3 text-sm outline-none focus:border-accent resize-none"
                />
                <div className="flex gap-3">
                  <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-accent hover:text-[#141414] transition-colors disabled:opacity-50">
                    {busy ? "Menunggu wallet…" : "Kirim laporan"}
                  </button>
                  <button type="button" onClick={() => setOpen(false)} className="text-sm text-text-muted">Batal</button>
                </div>
              </form>
            )}
            {msg && <p className={msg.ok ? "text-sm text-accent-ink" : "text-sm text-accent-coral"}>{msg.text}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
