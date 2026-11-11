import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useNearWallet } from "@/providers/NearWalletProvider";

/**
 * Auth berbasis wallet: identitas = akun NEAR.
 * Profil disimpan per akun di browser (belum ada backend).
 */
export type UserRole = "buyer" | "organizer";

export type OrganizerType = "komunitas" | "kampus" | "individu" | "agensi";

export interface OrganizerProfile {
  orgName: string;
  orgType: OrganizerType;
  city: string;
  contact: string;
  description: string;
}

export interface Profile {
  accountId: string;
  name: string;
  roles: UserRole[];
  activeRole: UserRole;
  organizer?: OrganizerProfile;
  createdAt: string;
}

interface AuthState {
  profiles: Record<string, Profile>;
  saveProfile: (profile: Profile) => void;
  setActiveRole: (accountId: string, role: UserRole) => void;
  /** Tambah peran penyelenggara ke profil yang sudah ada */
  addOrganizerRole: (accountId: string, organizer: OrganizerProfile) => void;
  updateName: (accountId: string, name: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profiles: {},
      saveProfile: (profile) =>
        set((s) => ({ profiles: { ...s.profiles, [profile.accountId]: profile } })),
      setActiveRole: (accountId, role) =>
        set((s) => {
          const p = s.profiles[accountId];
          if (!p || !p.roles.includes(role)) return s;
          return { profiles: { ...s.profiles, [accountId]: { ...p, activeRole: role } } };
        }),
      addOrganizerRole: (accountId, organizer) =>
        set((s) => {
          const p = s.profiles[accountId];
          if (!p) return s;
          const roles = p.roles.includes("organizer") ? p.roles : [...p.roles, "organizer" as const];
          return {
            profiles: { ...s.profiles, [accountId]: { ...p, roles, organizer, activeRole: "organizer" } },
          };
        }),
      updateName: (accountId, name) =>
        set((s) => {
          const p = s.profiles[accountId];
          if (!p) return s;
          return { profiles: { ...s.profiles, [accountId]: { ...p, name } } };
        }),
    }),
    { name: "karcis-auth-storage" }
  )
);

/** Profil milik akun yang sedang tersambung (atau undefined jika belum ada) */
export const useProfile = () => {
  const { accountId } = useNearWallet();
  const profiles = useAuthStore((s) => s.profiles);
  return accountId ? profiles[accountId] : undefined;
};
