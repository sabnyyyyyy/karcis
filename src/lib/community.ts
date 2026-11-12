import { PERKS, type PerkKey } from "@/lib/passport";

export type RoomKey = "umum" | "privat" | "kreator";

export interface Room {
  key: RoomKey;
  title: string;
  desc: string;
  /** Perk yang membuka ruang ini (stempel minimum diambil dari PERKS) */
  perk: PerkKey;
}

export const ROOMS: Room[] = [
  { key: "umum", title: "General chat", desc: "Open to all badge holders.", perk: "chat-umum" },
  { key: "privat", title: "Regulars room", desc: "Only for attendees with 3 stamps.", perk: "chat-privat" },
  { key: "kreator", title: "Creators' room", desc: "Private discussion among makers.", perk: "prioritas" },
];

export const perkMin = (perk: PerkKey) => PERKS.find((p) => p.key === perk)?.min ?? 0;
export const roomMin = (room: Room) => perkMin(room.perk);

export const VOTE_MIN = perkMin("voting");
export const REWARD_MIN = perkMin("diskon");

/** Kode voucher tetap per akun (bukan acak) supaya tidak berubah tiap dibuka */
export const voucherCode = (accountId: string) => {
  let h = 5381;
  for (const c of accountId) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return `KRC-MERCH-${Math.abs(h).toString(36).toUpperCase().padStart(6, "0").slice(0, 6)}`;
};
