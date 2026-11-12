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
      <Gate title="Connect your wallet first" text="The organizer dashboard opens only after your wallet is connected.">
        <button onClick={signIn} className="px-8 py-3.5 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold">
          Connect Wallet
        </button>
      </Gate>
    );
  }

  if (!profile) return <div className="min-h-screen" />;

  if (!isOrganizer) {
    return (
      <Gate title="You're not an organizer yet" text="Add the organizer role to your account. Just fill in your community details.">
        <Link href="/onboarding?role=organizer" className="px-8 py-3.5 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold">
          Become an organizer
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
        title="Register the organizer on-chain"
        text="Organizer details are recorded permanently on the NEAR contract under your wallet account, so buyers can check them and issues can be traced. Required before creating events."
      >
        {o ? (
          <button onClick={register} disabled={registering} className="px-8 py-3.5 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold disabled:opacity-60">
            {registering ? "Waiting for wallet…" : `Register "${o.orgName}"`}
          </button>
        ) : (
          <Link href="/onboarding?role=organizer" className="px-8 py-3.5 rounded-full bg-[#9CFF1E] text-[#141414] font-semibold">
            Fill in organizer details
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
        title={onchain.data.status === "BANNED" ? "Organizer account banned" : "Organizer account suspended"}
        text={`You can't create events or polls, and ticket sales for your events are stopped.${last ? ` Reason in the on-chain record: ${last.reason}` : ""}`}
      >
        <Link href="/help" className="px-8 py-3.5 rounded-full border border-[#141414]/20 font-semibold hover:bg-[#141414] hover:text-white transition-colors">
          Contact the Karcis team
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
