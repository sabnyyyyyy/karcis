"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useProfile } from "@/store/useAuthStore";
import { useHydrated } from "@/lib/useHydrated";

/** Hanya akun dengan peran penyelenggara yang boleh melihat isinya */
export const OrganizerGuard = ({ children }: { children: React.ReactNode }) => {
  const hydrated = useHydrated();
  const { accountId, isReady, signIn } = useNearWallet();
  const profile = useProfile();
  const router = useRouter();

  const isOrganizer = !!profile?.roles.includes("organizer");

  useEffect(() => {
    if (!hydrated || !isReady || !accountId) return;
    if (!profile) router.replace("/onboarding");
  }, [hydrated, isReady, accountId, profile, router]);

  if (!hydrated || !isReady) return <div className="min-h-screen" />;

  if (!accountId) {
    return (
      <Gate title="Hubungkan wallet dulu" text="Panel penyelenggara hanya bisa dibuka setelah wallet tersambung.">
        <button onClick={signIn} className="px-8 py-3.5 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold">
          Hubungkan Wallet
        </button>
      </Gate>
    );
  }

  if (!profile) return <div className="min-h-screen" />;

  if (!isOrganizer) {
    return (
      <Gate title="Kamu belum jadi penyelenggara" text="Tambahkan peran penyelenggara ke akunmu. Cukup isi data komunitasmu.">
        <Link href="/onboarding?role=organizer" className="px-8 py-3.5 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold">
          Jadi penyelenggara
        </Link>
      </Gate>
    );
  }

  return <>{children}</>;
};

function Gate({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <main data-nav-theme="light" className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center pt-16">
      <h1 className="text-[36px] md:text-[48px] font-extrabold tracking-[-0.04em] leading-none">{title}</h1>
      <p className="text-[#141414]/60 max-w-md">{text}</p>
      {children}
    </main>
  );
}
