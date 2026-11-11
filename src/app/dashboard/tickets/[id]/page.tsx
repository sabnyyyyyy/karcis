"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import {
  Calendar,
  MapPin,
  Ticket as TicketIcon,
  ChevronLeft,
  Clock,
  ScanLine,
  Stamp,
  History,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChainPass, useMyPasses } from "@/lib/chain/hooks";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { CHAIN, accountUrl } from "@/lib/chain/config";
import { shortAccount } from "@/lib/chain/format";
import { buildPassPayload } from "@/lib/passQr";
import { levelFor, levelReachedBy, nextLevel, totalStamps } from "@/lib/passport";
import { LevelLadder } from "@/components/passport/LevelLadder";
import type { Pass } from "@/types/pass";

const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "-";

export default function PassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accountId, isReady } = useNearWallet();
  const { data: pass, isLoading } = useChainPass(id);
  const myPasses = useMyPasses();

  if (!isReady || isLoading) return <div className="min-h-[50vh]" />;

  if (!pass) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 text-center">
        <div className="w-20 h-20 bg-surface flex items-center justify-center rounded-2xl border border-on-background/5">
          <TicketIcon className="w-8 h-8 text-text-muted/30" />
        </div>
        <div className="space-y-2">
          <h1 className="font-bodoni text-3xl font-black">Pass tidak ditemukan</h1>
          <p className="text-text-muted text-sm max-w-xs mx-auto">Tidak ada pass dengan ID ini di kontrak.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/tickets")}
          className="px-8 py-3 border border-on-background/15 text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-[#141414] hover:border-accent transition-all rounded-full"
        >
          Kembali ke koleksi
        </button>
      </div>
    );
  }

  const isOwner = !!accountId && pass.owner === accountId;
  const stamps = totalStamps(myPasses);

  if (!isOwner) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
        <h1 className="font-bodoni text-3xl font-black">Pass milik akun lain</h1>
        <p className="text-text-muted text-sm max-w-sm">
          {pass.id} dimiliki oleh <span className="font-mono">{shortAccount(pass.owner)}</span>.
          {accountId ? " Masuk dengan akun pemilik untuk melihat QR-nya." : " Hubungkan wallet pemiliknya untuk melihat QR."}
        </p>
        <button
          onClick={() => router.push("/dashboard/tickets")}
          className="px-8 py-3 border border-on-background/15 text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-[#141414] hover:border-accent transition-all rounded-full"
        >
          Kembali ke koleksi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1000px] mx-auto">
      <section className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/tickets")}
          className="flex items-center gap-2 text-text-muted hover:text-accent-ink transition-all text-[11px] font-bold uppercase tracking-[0.2em]"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Koleksi
        </button>
        <span
          className={cn(
            "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            pass.status === "USED" ? "text-accent-coral border-accent-coral/30 bg-accent-coral/5" : "text-accent-ink border-accent/30 bg-accent/5"
          )}
        >
          {pass.status === "USED" ? "Lencana permanen" : "Pass aktif"}
        </span>
      </section>

      <ScrollReveal>
        {pass.status === "VALID" ? (
          <TicketView pass={pass} />
        ) : (
          <BadgeView pass={pass} stamps={stamps} passes={myPasses} />
        )}
      </ScrollReveal>

      <Timeline pass={pass} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FASE 1: TIKET                                                       */
/* ------------------------------------------------------------------ */

function TicketView({ pass }: { pass: Pass }) {
  // Payload yang nanti dibaca scanner di pintu masuk
  const payload = buildPassPayload(pass);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row shadow-2xl rounded-[32px] overflow-hidden border border-on-background/5 bg-surface">
        <div className="lg:w-1/3 relative aspect-[3/4] lg:aspect-auto">
          <img src={pass.image} alt={pass.eventTitle} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">{pass.organizer}</p>
            <h1 className="font-bodoni text-2xl font-black leading-tight">{pass.eventTitle}</h1>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-10 flex flex-col gap-8 relative">
          <div className="flex flex-col sm:flex-row justify-between gap-8">
            <div className="space-y-5">
              <Field icon={Calendar} label="Tanggal" value={pass.dateFull} />
              <Field icon={Clock} label="Waktu" value={pass.time} />
              <Field icon={MapPin} label="Tempat" value={`${pass.venue}, ${pass.city}`} />
            </div>
            <div className="shrink-0 self-start p-4 bg-white rounded-2xl border border-on-background/10 shadow-lg">
              <QRCodeSVG value={payload} size={148} level="M" fgColor="#1A1830" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-on-background/10">
            <Field icon={TicketIcon} label="Jenis pass" value={pass.tierName} />
            <Field icon={ScanLine} label="ID pass" value={pass.id} mono />
          </div>

          <p className="text-sm text-text-muted leading-relaxed">
            Tunjukkan QR ini di pintu masuk. Setelah discan, pass otomatis berubah jadi lencana permanen dan menambah{" "}
            <b className="text-primary">{pass.stamps} stempel</b> di paspormu.
          </p>
        </div>
      </div>

      <p className="text-xs text-text-muted text-center">
        Petugas di pintu masuk memindai QR ini. Scan dicatat di kontrak, jadi satu pass hanya bisa dipakai sekali.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FASE 2: LENCANA                                                     */
/* ------------------------------------------------------------------ */

function BadgeView({ pass, stamps, passes }: { pass: Pass; stamps: number; passes: Pass[] }) {
  const level = levelFor(stamps);
  const next = nextLevel(stamps);
  // Level baru yang tercapai tepat saat pass ini discan (null jika tidak naik level)
  const reached = levelReachedBy(passes, pass);

  return (
    <div className="space-y-8">
      {reached && (
        <div className="rounded-3xl bg-[#9CFF1E] text-[#141414] p-6 flex items-center gap-5 shadow-[0_0_50px_rgba(156,255,30,0.45)]">
          <div className="w-14 h-14 rounded-full bg-[#141414] text-[#9CFF1E] flex items-center justify-center shrink-0">
            <Stamp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Naik level</p>
            <p className="text-2xl font-extrabold tracking-[-0.02em]">Sekarang kamu {reached.name}!</p>
            <p className="text-sm opacity-75">{reached.perks.join(" · ")}</p>
          </div>
        </div>
      )}

      <div className="rounded-[32px] overflow-hidden border border-on-background/10 bg-primary text-on-primary relative">
        <img src={pass.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent/60" />

        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          {/* Lencana bulat */}
          <div className="relative shrink-0">
            <div className="w-52 h-52 md:w-60 md:h-60 rounded-full border-[6px] border-accent-peach bg-primary flex items-center justify-center shadow-[0_0_60px_rgba(232,168,75,0.35)]">
              <div className="w-[88%] h-[88%] rounded-full border-2 border-dashed border-accent-peach/60 flex flex-col items-center justify-center text-center p-6 gap-1">
                <Stamp className="w-8 h-8 text-accent-peach" />
                <p className="font-bodoni text-xl font-black leading-tight text-accent-peach line-clamp-3">{pass.eventTitle}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-70">{pass.dateFull}</p>
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 rotate-[-8deg] rounded-full bg-accent-peach text-[#1A1830] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-lg">
              +{pass.stamps} stempel
            </span>
          </div>

          <div className="space-y-4 text-center md:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent-peach">Lencana permanen</p>
            <h1 className="font-bodoni text-3xl md:text-4xl font-black leading-tight">{pass.eventTitle}</h1>
            <p className="opacity-70">
              Kamu hadir di <b>{pass.venue}</b>, {pass.city}. Lencana ini milikmu selamanya dan tercatat di paspor.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2 text-[11px] font-bold uppercase tracking-widest">
              <span className="px-3 py-1.5 rounded-full bg-white/10">{pass.organizer}</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 font-mono">{pass.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Level & perk */}
      <div className="p-8 bg-surface border border-on-background/10 rounded-3xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Level paspor</p>
            <p className="font-bodoni text-3xl font-black">{level.name}</p>
          </div>
          <p className="text-sm text-text-muted">
            {stamps} stempel{next ? ` · ${next.min - stamps} lagi menuju ${next.name}` : " · level tertinggi"}
          </p>
        </div>

        <LevelLadder stamps={stamps} />
      </div>

      <div className="flex flex-wrap gap-6">
        <Link href="/dashboard/passport" className="inline-block text-accent-ink font-bold text-sm underline underline-offset-4">
          Lihat paspor lengkap
        </Link>
        <Link href="/events" className="inline-block text-accent-ink font-bold text-sm underline underline-offset-4">
          Cari event untuk stempel berikutnya
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="w-3.5 h-3.5" />
        <p className="text-[10px] font-bold uppercase tracking-widest leading-none">{label}</p>
      </div>
      <p className={cn("text-base font-bold text-primary leading-tight", mono && "font-mono text-sm")}>{value}</p>
    </div>
  );
}

function Timeline({ pass }: { pass: Pass }) {
  const items = [
    { label: "Pass diterbitkan", date: fmtDateTime(pass.mintedAt), done: true },
    {
      label: pass.status === "USED" ? "Discan di pintu masuk" : "Menunggu scan di pintu masuk",
      date: fmtDateTime(pass.checkedInAt),
      done: pass.status === "USED",
    },
    {
      label: pass.status === "USED" ? `Jadi lencana, +${pass.stamps} stempel` : "Jadi lencana permanen",
      date: pass.status === "USED" ? fmtDateTime(pass.checkedInAt) : "-",
      done: pass.status === "USED",
    },
  ];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-on-background/5 pb-4 text-text-muted">
          <History className="w-4 h-4" />
          <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Riwayat pass</h2>
        </div>
        <div className="space-y-5">
          {items.map((item, i) => (
            <div key={i} className="flex gap-5 items-start relative pl-1">
              {i !== items.length - 1 && <div className="absolute left-[7px] top-5 bottom-[-20px] w-px bg-on-background/10" />}
              <div className={cn("w-3.5 h-3.5 rounded-full mt-1 shrink-0 relative z-10 border-2", item.done ? "bg-accent border-accent" : "bg-background border-on-background/20")} />
              <div className="space-y-0.5">
                <p className={cn("text-sm font-bold", item.done ? "text-primary" : "text-text-muted")}>{item.label}</p>
                <p className="text-xs text-text-muted">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 border border-on-background/10 bg-surface rounded-3xl space-y-4">
        <div className="flex items-center gap-3 text-accent-ink">
          <ExternalLink className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Catatan on-chain</span>
        </div>
        <p className="text-sm text-text-muted leading-relaxed">
          Pass ini adalah NFT soulbound di kontrak <span className="font-mono">{CHAIN.contractId}</span>, tercatat atas nama{" "}
          <span className="font-mono">{pass.owner}</span> dan tidak bisa dipindahtangankan.
        </p>
        <p className="text-[11px] font-mono text-text-muted break-all">token_id: {pass.id}</p>
        <a href={accountUrl(CHAIN.contractId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-accent-ink underline underline-offset-4">
          Lihat kontrak di explorer <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
}
