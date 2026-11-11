"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, AtSign, Calendar, Pencil } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { useAuthStore, useProfile, type OrganizerType } from "@/store/useAuthStore";
import { useHydrated } from "@/lib/useHydrated";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useOrganizer } from "@/lib/chain/hooks";
import { updateOrganizerProfileTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { nsToMs } from "@/lib/chain/format";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-2xl border border-[#141414]/15 bg-white px-5 py-3.5 text-[15px] outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40 transition";

const orgTypes: OrganizerType[] = ["komunitas", "kampus", "individu", "agensi"];
const asOrgType = (v: string): OrganizerType => orgTypes.find((t) => t === v) ?? "komunitas";

const kindLabel = {
  REPORT: "Laporan",
  SUSPEND: "Ditangguhkan",
  BAN: "Diblokir",
  REINSTATE: "Dipulihkan",
  PROFILEUPDATE: "Profil diubah",
} as const;

export default function OrganizerProfilePage() {
  return (
    <OrganizerGuard>
      <ProfileView />
    </OrganizerGuard>
  );
}

function ProfileView() {
  const hydrated = useHydrated();
  const profile = useProfile();
  const { accountId, sendTransactions } = useNearWallet();
  const { data: chainOrg, refetch } = useOrganizer(accountId);
  const addOrganizerRole = useAuthStore((s) => s.addOrganizerRole);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", orgType: "komunitas" as OrganizerType, city: "", contact: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Sumber kebenaran adalah catatan on-chain
  const o = chainOrg?.profile;
  useEffect(() => {
    if (o && !editing) setForm({ name: o.name, orgType: asOrgType(o.org_type), city: o.city, contact: o.contact, description: o.description });
  }, [o, editing]);

  if (!hydrated || !profile?.organizer || !chainOrg || !o) return <div className="min-h-screen" />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setBusy(true);
    setMsg(null);
    try {
      await sendTransactions([updateOrganizerProfileTx({ name: form.name, orgType: form.orgType, city: form.city, contact: form.contact, description: form.description })], {
        callbackUrl: window.location.href,
      });
      addOrganizerRole(accountId, { orgName: form.name.trim(), orgType: form.orgType, city: form.city.trim(), contact: form.contact.trim(), description: form.description.trim() });
      await refetch();
      setEditing(false);
      setMsg({ ok: true, text: "Profil diperbarui di kontrak. Nilai lamanya tetap tercatat di riwayat." });
    } catch (err) {
      setMsg({ ok: false, text: explainChainError(err) });
    } finally {
      setBusy(false);
    }
  };

  const history = chainOrg.cases.filter((c) => c.kind === "PROFILEUPDATE");

  return (
    <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col">
      <section className="relative px-6 md:px-12 py-20 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_80%)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-[#9CFF1E] flex items-center justify-center text-4xl font-extrabold">
              {o.name[0]?.toUpperCase()}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3F7D00]">Profil penyelenggara</p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-none">{o.name}</h1>
            </div>
          </div>

          {!editing ? (
            <>
              <p className="text-lg text-[#5C6157] leading-relaxed">{o.description}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Building2, label: "Jenis", value: o.org_type },
                  { icon: MapPin, label: "Kota", value: o.city },
                  { icon: AtSign, label: "Kontak", value: o.contact || "-" },
                  { icon: Calendar, label: "Terdaftar on-chain", value: new Date(nsToMs(chainOrg.registered_at)).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) },
                ].map((f) => (
                  <div key={f.label} className="p-5 rounded-2xl bg-[#F5F8EE] border border-black/5 space-y-1">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#5C6157]">
                      <f.icon className="w-3.5 h-3.5" /> {f.label}
                    </p>
                    <p className="font-semibold capitalize">{f.value}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-[#5C6157]">
                Event besar sering pindah kota? Perbarui profil kapan saja. Event yang sudah dibuat tidak berubah, dan perubahan profil tercatat di riwayat supaya tetap transparan.
              </p>

              <div className="flex flex-wrap items-center gap-6">
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#141414] text-white font-semibold hover:bg-[#9CFF1E] hover:text-[#141414] transition-colors">
                  <Pencil className="w-4 h-4" /> Ubah profil
                </button>
                <Link href="/organizer" className="text-[#3F7D00] font-semibold underline underline-offset-4">
                  Kembali ke panel
                </Link>
              </div>
            </>
          ) : (
            <form onSubmit={save} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <label className="space-y-2 text-[13px] font-semibold sm:col-span-2">
                  Nama kolektif / penyelenggara
                  <input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={cn(field, "font-normal")} />
                </label>
                <div className="space-y-2 text-[13px] font-semibold sm:col-span-2">
                  Jenis
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {orgTypes.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setForm({ ...form, orgType: t })}
                        className={cn(
                          "px-3 py-3 rounded-2xl border text-[13px] font-medium capitalize transition-all",
                          form.orgType === t ? "bg-[#9CFF1E] border-[#9CFF1E]" : "border-[#141414]/15 hover:border-[#141414]/40"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="space-y-2 text-[13px] font-semibold">
                  Kota
                  <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={cn(field, "font-normal")} />
                </label>
                <label className="space-y-2 text-[13px] font-semibold">
                  Kontak
                  <input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={cn(field, "font-normal")} />
                </label>
                <label className="space-y-2 text-[13px] font-semibold sm:col-span-2">
                  Tentang komunitasmu
                  <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={cn(field, "font-normal resize-none")} />
                </label>
              </div>
              <div className="flex items-center gap-4">
                <button type="submit" disabled={busy} className="px-8 py-3.5 rounded-full bg-[#9CFF1E] font-semibold disabled:opacity-60">
                  {busy ? "Menunggu wallet…" : "Simpan di kontrak"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="text-sm text-[#141414]/50 hover:text-[#141414]">Batal</button>
              </div>
            </form>
          )}

          {msg && <p className={msg.ok ? "text-sm text-[#3F7D00]" : "text-sm text-[#E5484D]"}>{msg.text}</p>}

          {history.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Riwayat perubahan profil</h2>
              <ul className="space-y-2 text-sm">
                {history.map((c, i) => (
                  <li key={i} className="p-4 rounded-2xl bg-[#F5F8EE]">
                    <b>{kindLabel[c.kind]}</b> · {new Date(nsToMs(c.at)).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    <p className="text-[#5C6157]">{c.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
      <EditorialFooter />
    </main>
  );
}
