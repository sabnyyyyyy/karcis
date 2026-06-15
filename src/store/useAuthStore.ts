import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "buyer" | "organizer";

export type OrganizerStatus = 
  | "ORGANIZER_DRAFT" 
  | "ORGANIZER_KYC_LV1" 
  | "ORGANIZER_PENDING_REVIEW" 
  | "ORGANIZER_VERIFIED" 
  | "ORGANIZER_REJECTED";

export type UserStatus = "BUYER" | OrganizerStatus;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletAddress?: string;
  avatar?: string;
  level: number;
  xp: number;
  voucherCount: number;
  status: UserStatus;
  organizationType?: "individual" | "company" | "community" | "agency";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
    }),
    {
      name: "soltix-auth-storage",
    }
  )
);
