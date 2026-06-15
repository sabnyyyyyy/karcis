"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export const OrganizerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== "organizer") {
      router.push("/dashboard");
      return;
    }

    const status = user.status;
    const isVerificationRoute = pathname.includes("/onboarding") || 
                                pathname.includes("/verification") || 
                                pathname.includes("/pending-review");

    if (status === "ORGANIZER_VERIFIED") {
      if (isVerificationRoute) {
        router.push("/organizer");
      }
      return;
    }

    // Redirect to appropriate onboarding step if not on a verification route
    if (!isVerificationRoute) {
      if (status === "ORGANIZER_DRAFT" || status === "ORGANIZER_KYC_LV1" || status === "ORGANIZER_REJECTED") {
        router.push("/organizer/onboarding");
      } else if (status === "ORGANIZER_PENDING_REVIEW") {
        router.push("/organizer/pending-review");
      }
    }

    // Redirect legacy verification route to onboarding
    if (pathname.includes("/organizer/verification")) {
      router.push("/organizer/onboarding");
    }
  }, [isAuthenticated, user, router, pathname]);

  if (!isAuthenticated || !user || (user.role === "organizer" && user.status !== "ORGANIZER_VERIFIED" && !pathname.includes("/organizer/"))) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
};
