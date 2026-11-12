"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Building2, User, Wallet, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useAuthStore, type OrganizerType } from "@/store/useAuthStore";
import { useHydrated } from "@/lib/useHydrated";
import { useOrganizer } from "@/lib/chain/hooks";
import { registerOrganizerTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";

const DRAFT_KEY = "karcis-org-draft";

const asOrgType = (v: string): OrganizerType =>
  (["komunitas", "kampus", "individu", "agensi"] as const).find((t) => t === v) ?? "komunitas";

const orgTypes: { id: OrganizerType; label: string }[] = [
  { id: "komunitas", label: "Community / collective" },
  { id: "kampus", label: "Campus / student org" },
  { id: "individu", label: "Individual" },
  { id: "agensi", label: "Agency / event organizer" },
];

const field =
  "w-full rounded-2xl border border-[#141414]/15 bg-white px-5 py-3.5 text-[15px] outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40 transition";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <Onboarding />
    </Suspense>
  );
}

function Onboarding() {
  const router = useRouter();
  const search = useSearchParams();
  const hydrated = useHydrated();
  const { accountId, isReady, signIn, sendTransactions } = useNearWallet();
  const onchain = useOrganizer(accountId);
  const profiles = useAuthStore((s) => s.profiles);
  const saveProfile = useAuthStore((s) => s.saveProfile);
  const addOrganizerRole = useAuthStore((s) => s.addOrganizerRole);

  const existing = accountId ? profiles[accountId] : undefined;
  const wantsOrganizer = search.get("role") === "organizer";

  const [role, setRole] = useState<"buyer" | "organizer" | null>(wantsOrganizer ? "organizer" : null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [org, setOrg] = useState({ orgName: "", orgType: "komunitas" as OrganizerType, city: "", contact: "", description: "" });

  // Akun sudah terdaftar sebagai penyelenggara di kontrak (mis. kembali dari wallet berbasis redirect,
  // atau membuka dari browser baru): pulihkan profil lokalnya dari catatan on-chain
  useEffect(() => {
    if (!hydrated || !isReady || !accountId || !onchain.data) return;
    if (existing?.roles.includes("organizer")) return;
    let draftName = "";
    try {
      draftName = (JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") as { name?: string }).name ?? "";
    } catch {
      // abaikan draft rusak
    }
    const o = onchain.data.profile;
    const organizer = { orgName: o.name, orgType: asOrgType(o.org_type), city: o.city, contact: o.contact, description: o.description };
    if (existing) {
      addOrganizerRole(accountId, organizer);
    } else {
      saveProfile({
        accountId,
        name: draftName.trim() || o.name,
        roles: ["buyer", "organizer"],
        activeRole: "organizer",
        organizer,
        createdAt: new Date().toISOString(),
      });
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // abaikan
    }
  }, [hydrated, isReady, accountId, onchain.data, existing, addOrganizerRole, saveProfile]);

  // Profil sudah ada & tidak sedang menambah peran: langsung ke dashboard
  useEffect(() => {
    if (!hydrated || !isReady) return;
    if (existing && !(wantsOrganizer && !existing.roles.includes("organizer"))) {
      router.replace(existing.activeRole === "organizer" ? "/organizer" : "/dashboard");
    }
  }, [hydrated, isReady, existing, wantsOrganizer, router]);

  if (!hydrated || !isReady) return <div className="min-h-screen" />;

  const finishBuyer = () => {
    if (!accountId || name.trim().length < 2) return;
    saveProfile({
      accountId,
      name: name.trim(),
      roles: ["buyer"],
      activeRole: "buyer",
      createdAt: new Date().toISOString(),
    });
    router.push("/dashboard");
  };

  const finishOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setError(null);
    const organizer = { ...org, orgName: org.orgName.trim() };

    setBusy(true);
    try {
      // Pendaftaran dicatat permanen di kontrak supaya penyelenggara bisa dilacak jika ada kasus
      const registered = await onchain.refetch();
      if (!registered.data) {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: name.trim() }));
        } catch {
          // abaikan
        }
        await sendTransactions(
          [registerOrganizerTx({ name: organizer.orgName, orgType: organizer.orgType, city: organizer.city, contact: organizer.contact, description: organizer.description })],
          { callbackUrl: `${window.location.origin}/onboarding?role=organizer` }
        );
      }
      // Profil lokal diisi oleh efek di atas begitu catatan on-chain terbaca
      await onchain.refetch();
      if (existing) {
        addOrganizerRole(accountId, organizer);
      } else {
        saveProfile({
          accountId,
          name: name.trim() || organizer.orgName,
          roles: ["buyer", "organizer"],
          activeRole: "organizer",
          organizer,
          createdAt: new Date().toISOString(),
        });
      }
      router.push("/organizer");
    } catch (err) {
      setError(explainChainError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main data-nav-theme="light" className="relative min-h-screen bg-white text-[#141414] pt-32 pb-24 px-6 overflow-hidden">
      <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_75%)] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto space-y-12">
        {/* 1. Belum ada wallet */}
        {!accountId && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-none">Connect your wallet first.</h1>
              <p className="text-[17px] text-[#141414]/60 leading-relaxed max-w-xl">
                Your NEAR account is your identity on Karcis. No email, password, or ID card needed. Your passes and badges are stored on that account.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={signIn}
                className="inline-flex items-center gap-4 px-8 py-4 rounded-full text-[15px] font-semibold text-[#141414] hover:shadow-[0_0_40px_rgba(156,255,30,0.6)] transition-shadow"
                style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
              >
                <Wallet className="w-4 h-4" /> Connect NEAR wallet
              </button>
            </div>
          </div>
        )}

        {/* 2. Wallet tersambung, pilih peran */}
        {accountId && role === null && (
          <div className="space-y-10">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9CFF1E]/30 text-[12px] font-semibold">
                <Check className="w-3.5 h-3.5" /> Connected:<span className="font-mono">{accountId}</span>
              </p>
              <h1 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-none">What do you want to be?</h1>
              <p className="text-[17px] text-[#141414]/60">You can switch or add roles anytime from the account menu.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <button
                onClick={() => setRole("buyer")}
                className="group text-left rounded-[28px] p-8 min-h-[240px] flex flex-col justify-between bg-white border-2 border-[#141414]/10 hover:border-[#9CFF1E] hover:-translate-y-1 transition-all"
              >
                <User className="w-10 h-10" strokeWidth={1.5} />
                <div className="space-y-2">
                  <h2 className="text-[28px] font-semibold tracking-[-0.02em]">Buyer</h2>
                  <p className="text-[#141414]/60 leading-snug">Find events, buy passes, collect stamps, and unlock community access.</p>
                </div>
              </button>
              <button
                onClick={() => setRole("organizer")}
                className="group text-left rounded-[28px] p-8 min-h-[240px] flex flex-col justify-between hover:-translate-y-1 transition-all"
                style={{ background: "#9CFF1E" }}
              >
                <Building2 className="w-10 h-10" strokeWidth={1.5} />
                <div className="space-y-2">
                  <h2 className="text-[28px] font-semibold tracking-[-0.02em]">Organizer</h2>
                  <p className="text-[#141414]/70 leading-snug">Create events, scan passes at the door, and stay close to your attendees.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 3a. Pembeli */}
        {accountId && role === "buyer" && (
          <div className="space-y-8 max-w-lg">
            <div className="space-y-3">
              <h1 className="text-[40px] md:text-[48px] font-extrabold tracking-[-0.04em] leading-none">What should we call you?</h1>
              <p className="text-[#141414]/60">That&apos;s all. This name appears on your passport and in community chat.</p>
            </div>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" className={field} />
            <div className="flex items-center gap-4">
              <button
                onClick={finishBuyer}
                disabled={name.trim().length < 2}
                className="inline-flex items-center gap-4 px-8 py-3.5 rounded-full text-[15px] font-semibold text-[#141414] disabled:opacity-40 transition-shadow hover:shadow-[0_0_40px_rgba(156,255,30,0.6)]"
                style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
              >
                Go to my passport <ArrowUpRight className="w-4 h-4" />
              </button>
              <button onClick={() => setRole(null)} className="text-sm text-[#141414]/50 hover:text-[#141414]">Back</button>
            </div>
          </div>
        )}

        {/* 3b. Penyelenggara */}
        {accountId && role === "organizer" && (
          <form onSubmit={finishOrganizer} className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-[40px] md:text-[48px] font-extrabold tracking-[-0.04em] leading-none">Tell us about your community.</h1>
              <p className="text-[#141414]/60 max-w-xl">
                This info appears on your event pages and is recorded permanently on NEAR under your wallet account, so buyers can check who the organizer is and issues can be traced. No documents or KYC are required.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {!existing && (
                <label className="space-y-2 text-[13px] font-semibold sm:col-span-2">
                  Your nickname
                  <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" className={cn(field, "font-normal")} />
                </label>
              )}
              <label className="space-y-2 text-[13px] font-semibold sm:col-span-2">
                Collective / organizer name
                <input required minLength={2} value={org.orgName} onChange={(e) => setOrg({ ...org, orgName: e.target.value })} placeholder="Shortwave Collective" className={cn(field, "font-normal")} />
              </label>

              <div className="space-y-2 text-[13px] font-semibold sm:col-span-2">
                Type
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {orgTypes.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setOrg({ ...org, orgType: t.id })}
                      className={cn(
                        "px-3 py-3 rounded-2xl border text-[13px] font-medium transition-all",
                        org.orgType === t.id ? "bg-[#9CFF1E] border-[#9CFF1E]" : "border-[#141414]/15 hover:border-[#141414]/40"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="space-y-2 text-[13px] font-semibold">
                City
                <input required value={org.city} onChange={(e) => setOrg({ ...org, city: e.target.value })} placeholder="Bandung" className={cn(field, "font-normal")} />
              </label>
              <label className="space-y-2 text-[13px] font-semibold">
                Contact (email or Instagram)
                <input required value={org.contact} onChange={(e) => setOrg({ ...org, contact: e.target.value })} placeholder="@gelombangpendek" className={cn(field, "font-normal")} />
              </label>
              <label className="space-y-2 text-[13px] font-semibold sm:col-span-2">
                About your community
                <textarea required rows={4} value={org.description} onChange={(e) => setOrg({ ...org, description: e.target.value })} placeholder="What kind of events do you run, and for whom?" className={cn(field, "font-normal resize-none")} />
              </label>
            </div>

            {error && <p className="text-[#E5484D] font-medium">{error}</p>}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-4 px-8 py-3.5 rounded-full text-[15px] font-semibold text-[#141414] transition-shadow hover:shadow-[0_0_40px_rgba(156,255,30,0.6)] disabled:opacity-60"
                style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
              >
                {busy ? "Waiting for wallet…" : onchain.data ? "Open organizer dashboard" : "Register on-chain & open dashboard"} <ArrowUpRight className="w-4 h-4" />
              </button>
              {!existing && <button type="button" onClick={() => setRole(null)} className="text-sm text-[#141414]/50 hover:text-[#141414]">Back</button>}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
