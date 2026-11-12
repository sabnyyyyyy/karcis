import type { Pass } from "@/types/pass";

export type LevelKey = "tamu" | "pendatang" | "langganan" | "penjaga";

export interface PassportLevel {
  key: LevelKey;
  name: string;
  /** Stempel minimum untuk level ini */
  min: number;
  perks: string[];
}

// Urut naik. Sama dengan yang dijanjikan di landing page.
export const LEVELS: PassportLevel[] = [
  { key: "tamu", name: "Guest", min: 0, perks: ["Buy an event pass"] },
  {
    key: "pendatang",
    name: "Newcomer",
    min: 1,
    perks: ["Permanent keepsake badge", "Community general chat"],
  },
  {
    key: "langganan",
    name: "Regular",
    min: 3,
    perks: ["Private chat room for fellow attendees", "Voting rights for the next guest star"],
  },
  {
    key: "penjaga",
    name: "Base Keeper",
    min: 5,
    perks: ["Priority access to the creators' discussion room", "Automatic merchandise discount"],
  },
];

export type PerkKey = "chat-umum" | "chat-privat" | "voting" | "prioritas" | "diskon";

export interface Perk {
  key: PerkKey;
  title: string;
  desc: string;
  /** Stempel minimum untuk membuka perk ini */
  min: number;
}

/** Akses komunitas yang terbuka lewat stempel (fiturnya dibangun bertahap) */
export const PERKS: Perk[] = [
  { key: "chat-umum", title: "General chat", desc: "An open chat room for all badge holders.", min: 1 },
  { key: "chat-privat", title: "Private chat", desc: "A room just for regular attendees.", min: 3 },
  { key: "voting", title: "Guest star voting", desc: "Help decide who performs at the next event.", min: 3 },
  { key: "prioritas", title: "Creators' room", desc: "Priority access to the private discussion among makers.", min: 5 },
  { key: "diskon", title: "Merch discount", desc: "Automatic merch discount, no code needed.", min: 5 },
];

export const totalStamps = (passes: Pass[]) =>
  passes.filter((p) => p.status === "USED").reduce((sum, p) => sum + p.stamps, 0);

export const levelFor = (stamps: number): PassportLevel =>
  [...LEVELS].reverse().find((l) => stamps >= l.min) ?? LEVELS[0];

export const nextLevel = (stamps: number): PassportLevel | null =>
  LEVELS.find((l) => l.min > stamps) ?? null;

/** Perk yang sudah terbuka untuk jumlah stempel tertentu */
export const unlockedPerks = (stamps: number) => PERKS.filter((p) => stamps >= p.min);

/** Total stempel sampai (dan termasuk) pass ini, berdasarkan urutan check-in */
export const stampsThrough = (passes: Pass[], pass: Pass) => {
  if (!pass.checkedInAt) return totalStamps(passes);
  const at = +new Date(pass.checkedInAt);
  return passes
    .filter((p) => p.status === "USED" && p.checkedInAt && +new Date(p.checkedInAt) <= at)
    .reduce((sum, p) => sum + p.stamps, 0);
};

/** Level baru yang tercapai tepat saat pass ini discan, atau null jika level tidak berubah */
export const levelReachedBy = (passes: Pass[], pass: Pass): PassportLevel | null => {
  const after = stampsThrough(passes, pass);
  const before = after - pass.stamps;
  const lv = levelFor(after);
  return levelFor(before).key !== lv.key ? lv : null;
};
