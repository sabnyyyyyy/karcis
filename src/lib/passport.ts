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
  { key: "tamu", name: "Tamu", min: 0, perks: ["Beli pass event"] },
  {
    key: "pendatang",
    name: "Pendatang",
    min: 1,
    perks: ["Lencana kenang-kenangan permanen", "Obrolan umum komunitas"],
  },
  {
    key: "langganan",
    name: "Langganan",
    min: 3,
    perks: ["Ruang obrolan privat sesama pengunjung", "Hak suara bintang tamu berikutnya"],
  },
  {
    key: "penjaga",
    name: "Penjaga Markas",
    min: 5,
    perks: ["Akses prioritas ruang diskusi kreator", "Diskon merchandise otomatis"],
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
  { key: "chat-umum", title: "Obrolan umum", desc: "Ruang ngobrol terbuka untuk semua pemegang lencana.", min: 1 },
  { key: "chat-privat", title: "Obrolan privat", desc: "Ruang khusus sesama pengunjung yang sudah langganan.", min: 3 },
  { key: "voting", title: "Voting bintang tamu", desc: "Ikut menentukan siapa yang tampil di acara berikutnya.", min: 3 },
  { key: "prioritas", title: "Ruang kreator", desc: "Akses prioritas ke diskusi privat para pembuat karya.", min: 5 },
  { key: "diskon", title: "Diskon merchandise", desc: "Potongan harga merch otomatis tanpa kode.", min: 5 },
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
