"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { EditorialFooter } from "@/components/layout/Footer";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useProfile } from "@/store/useAuthStore";
import { useHydrated } from "@/lib/useHydrated";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { accountId, isReady, signIn } = useNearWallet();
  const profile = useProfile();

  // Akun tersambung tapi belum punya profil: arahkan ke pilih peran
  useEffect(() => {
    if (hydrated && isReady && accountId && !profile) router.replace("/onboarding");
  }, [hydrated, isReady, accountId, profile, router]);

  if (!hydrated || !isReady || (accountId && !profile)) return <div className="min-h-screen" />;

  if (!accountId) {
    return (
      <main data-nav-theme="light" className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center pt-16">
        <h1 className="text-[36px] md:text-[48px] font-extrabold tracking-[-0.04em] leading-none">Hubungkan wallet dulu.</h1>
        <p className="text-[#141414]/60 max-w-md">Paspor, pass, dan lencanamu tersimpan di akun wallet.</p>
        <button onClick={signIn} className="px-8 py-3.5 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold">
          Hubungkan Wallet
        </button>
      </main>
    );
  }

  return (
    <div data-nav-theme="light" className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-[240px] p-8 md:p-14 overflow-x-hidden border-l border-black/5 bg-[#FBFDF6]">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
      <div className="ml-[240px]">
        <EditorialFooter />
      </div>
    </div>
  );
}
