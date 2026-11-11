"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Mengarahkan pengguna setelah wallet tersambung:
 * - akun sudah punya profil -> /dashboard
 * - akun baru -> /onboarding (pilih peran)
 * Sesi yang dipulihkan saat halaman dibuka ulang tidak dialihkan.
 */
export function AuthGate() {
  const { accountId, isReady } = useNearWallet();
  const profiles = useAuthStore((s) => s.profiles);
  const router = useRouter();
  const pathname = usePathname();

  // undefined = belum ada pengamatan pertama
  const previous = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isReady) return;

    // Pengamatan pertama: hanya catat, jangan redirect (sesi dipulihkan)
    if (previous.current === undefined) {
      previous.current = accountId;
      return;
    }

    const justConnected = !previous.current && !!accountId;
    previous.current = accountId;
    if (!justConnected || !accountId) return;

    if (profiles[accountId]) {
      if (pathname === "/" || pathname === "/onboarding") router.push("/dashboard");
    } else if (pathname !== "/onboarding") {
      router.push("/onboarding");
    }
  }, [accountId, isReady, profiles, pathname, router]);

  return null;
}
