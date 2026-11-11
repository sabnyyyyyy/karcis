"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useProfile } from "@/store/useAuthStore";
import { useHydrated } from "@/lib/useHydrated";
import { useOrganizer } from "@/lib/chain/hooks";
import { registerOrganizerTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";

/** Hanya akun dengan peran penyelenggara yang boleh melihat isinya */
export const OrganizerGuard = ({ children }: { children: React.ReactNode }) => {
  const hydrated = useHydrated();
  const { accountId, isReady, signIn, sendTransactions } = useNearWallet();
  const profile = useProfile();
  const router = useRouter();
  const onchain = useOrganizer(accountId);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

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

  if (onchain.isLoading) return <div className="min-h-screen" />;

  // Peran penyelenggara ada di browser ini tapi belum tercatat di kontrak: daftarkan dulu
  if (!onchain.data) {
    const o = profile?.organizer;
    const register = async () => {
      if (!o) return;
      setRegistering(true);
      setRegError(null);
      try {
        await sendTransactions(
          [registerOrganizerTx({ name: o.orgName, orgType: o.orgType, city: o.city, contact: o.contact, description: o.description })],
          { callbackUrl: window.location.href }
        );
        await onchain.refetch();
      } catch (e) {
        setRegError(explainChainError(e));
      } finally {
        setRegistering(false);
      }
    };
    return (
      <Gate
        title="Daftarkan penyelenggara on-chain"
        text="Data penyelenggara dicatat permanen di kontrak NEAR atas nama akun walletmu, supaya pembeli bisa mengecek dan kasus bisa dilacak. Wajib sebelum membuat event."
      >
        {o ? (
          <button onClick={register} disabled={registering} className="px-8 py-3.5 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold disabled:opacity-60">
            {registering ? "Menunggu wallet…" : `Daftarkan "${o.orgName}"`}
          </button>
        ) : (
          <Link href="/onboarding?role=organizer" className="px-8 py-3.5 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold">
            Isi data penyelenggara
          </Link>
        )}
        {regError && <p className="text-[#E5484D] text-sm max-w-md">{regError}</p>}
      </Gate>
    );
  }

  if (onchain.data.status !== "ACTIVE") {
    const last = [...onchain.data.cases].reverse().find((c) => c.kind === "SUSPEND" || c.kind === "BAN");
    return (
      <Gate
        title={onchain.data.status === "BANNED" ? "Akun penyelenggara diblokir" : "Akun penyelenggara ditangguhkan"}
        text={`Kamu tidak bisa membuat event atau voting, dan penjualan tiket event-mu dihentikan.${last ? ` Alasan di catatan on-chain: ${last.reason}` : ""}`}
      >
        <Link href="/help" className="px-8 py-3.5 rounded-full border border-[#141414]/20 font-semibold hover:bg-[#141414] hover:text-white transition-colors">
          Hubungi tim Karcis
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
