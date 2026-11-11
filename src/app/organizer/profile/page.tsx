"use client";

import React from "react";
import Link from "next/link";
import { Building2, MapPin, AtSign, Calendar } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { useProfile } from "@/store/useAuthStore";
import { useHydrated } from "@/lib/useHydrated";

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
  if (!hydrated || !profile?.organizer) return <div className="min-h-screen" />;
  const o = profile.organizer;

  return (
    <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col">
      <section className="relative px-6 md:px-12 py-20 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_80%)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-[#9CFF1E] flex items-center justify-center text-4xl font-extrabold">
              {o.orgName[0]?.toUpperCase()}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3F7D00]">Profil penyelenggara</p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-none">{o.orgName}</h1>
            </div>
          </div>

          <p className="text-lg text-[#5C6157] leading-relaxed">{o.description}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Building2, label: "Jenis", value: o.orgType },
              { icon: MapPin, label: "Kota", value: o.city },
              { icon: AtSign, label: "Kontak", value: o.contact },
              { icon: Calendar, label: "Bergabung", value: new Date(profile.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) },
            ].map((f) => (
              <div key={f.label} className="p-5 rounded-2xl bg-[#F5F8EE] border border-black/5 space-y-1">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#5C6157]">
                  <f.icon className="w-3.5 h-3.5" /> {f.label}
                </p>
                <p className="font-semibold capitalize">{f.value}</p>
              </div>
            ))}
          </div>

          <Link href="/organizer" className="inline-block text-[#3F7D00] font-semibold underline underline-offset-4">
            Kembali ke panel
          </Link>
        </div>
      </section>
      <EditorialFooter />
    </main>
  );
}
