"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Wallet, Building2, Unlink, Check } from "lucide-react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { useAuthStore, useProfile } from "@/store/useAuthStore";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-2xl border border-[#141414]/15 bg-white px-5 py-3.5 text-[15px] outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40 transition";

export default function SettingsPage() {
  const router = useRouter();
  const profile = useProfile();
  const { accountId, network, signOut } = useNearWallet();
  const updateName = useAuthStore((s) => s.updateName);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const [name, setName] = useState(profile?.name ?? "");
  const [saved, setSaved] = useState(false);

  if (!profile || !accountId) return null;

  const save = () => {
    if (name.trim().length < 2) return;
    updateName(accountId, name.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const disconnect = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="space-y-14 max-w-3xl pb-20">
      <section className="border-b border-on-background/10 pb-8">
        <ScrollReveal>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-accent-ink uppercase tracking-[0.3em]">Settings</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-none">Your account</h1>
          </div>
        </ScrollReveal>
      </section>

      {/* Profil */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-accent-ink" />
          <h2 className="text-xl font-semibold">Profile</h2>
        </div>
        <div className="space-y-3 max-w-md">
          <label className="text-[12px] font-semibold uppercase tracking-widest text-text-muted">Nickname</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          <div className="flex items-center gap-4">
            <button
              onClick={save}
              disabled={name.trim().length < 2 || name.trim() === profile.name}
              className="px-6 py-3 rounded-full bg-primary text-on-primary text-xs font-semibold uppercase tracking-widest hover:bg-accent hover:text-[#141414] transition-all disabled:opacity-40"
            >
              Save
            </button>
            {saved && <span className="text-sm text-accent-ink flex items-center gap-1"><Check className="w-4 h-4" /> Saved</span>}
          </div>
        </div>
      </section>

      {/* Wallet */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-accent-ink" />
          <h2 className="text-xl font-semibold">Wallet</h2>
        </div>
        <div className="p-8 rounded-3xl border border-on-background/10 bg-surface-low flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              NEAR {network}
            </p>
            <p className="font-mono text-lg break-all">{accountId}</p>
          </div>
          <button
            onClick={disconnect}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-accent-coral/40 text-accent-coral text-xs font-semibold uppercase tracking-widest hover:bg-accent-coral hover:text-white transition-all"
          >
            <Unlink className="w-4 h-4" /> Disconnect wallet
          </button>
        </div>
      </section>

      {/* Peran */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-accent-ink" />
          <h2 className="text-xl font-semibold">Roles</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["buyer", "organizer"] as const).map((r) => {
            const has = profile.roles.includes(r);
            const active = profile.activeRole === r;
            return (
              <div key={r} className={cn("p-6 rounded-2xl border space-y-4", has ? "border-on-background/15 bg-white" : "border-dashed border-on-background/20")}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r === "buyer" ? "Buyer" : "Organizer"}</span>
                  {active && <span className="px-3 py-1 rounded-full bg-accent text-[#141414] text-[10px] font-bold uppercase tracking-widest">Active</span>}
                </div>
                {has ? (
                  !active && (
                    <button
                      onClick={() => {
                        setActiveRole(accountId, r);
                        router.push(r === "organizer" ? "/organizer" : "/dashboard");
                      }}
                      className="text-sm text-accent-ink font-semibold underline underline-offset-4"
                    >
                      Use this role
                    </button>
                  )
                ) : (
                  <Link href="/onboarding?role=organizer" className="text-sm text-accent-ink font-semibold underline underline-offset-4">
                    Add role
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
