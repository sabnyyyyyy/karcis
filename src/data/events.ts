// Tipe dan konstanta tampilan untuk event. Datanya sendiri dibaca dari kontrak (lihat src/lib/chain).

export type EventCategory = string;

export interface EventTier {
  id: string;
  name: string;
  /** Harga dasar dalam unit token stablecoin (6 desimal). 0 = gratis. */
  price: number;
  perk: string;
}

export interface EventCampaign {
  clipRatePerMillion: number;
  referralReward: number;
  depositRequired: number;
  funded: boolean;
  viewsReported: boolean;
  settled: boolean;
}

export interface CommunityEvent {
  /** ID di kontrak ("1", "2", ...) */
  id: string;
  /** Kode event, awalan ID pass (mis. "GIGS12") */
  code: string;
  title: string;
  organizer: string;
  category: EventCategory;
  city: string;
  venue: string;
  address: string;
  /** Label singkat untuk kartu, mis. "14 Des" */
  dateLabel: string;
  /** Label lengkap, mis. "14 Desember 2026" */
  dateFull: string;
  time: string;
  image: string;
  description: string;
  lineup: { name: string; role: string; time: string }[];
  tiers: EventTier[];
  /** Stempel yang didapat saat hadir */
  stamps: number;
  capacity: number;
  sold: number;
  checkedIn: number;
  /** Waktu event selesai (milidetik) */
  endsAt: number;
  feeBearer: "BUYER" | "SELLER";
  campaign: EventCampaign | null;
  nftName: string;
  badgeImage: string;
  scanners: string[];
  /** Akun NEAR pemilik event */
  ownerAccount: string;
}

export const EVENT_CATEGORIES: string[] = ["SEMUA", "GIGS", "PAMERAN", "FESTIVAL", "KOMUNITAS", "WORKSHOP"];

/** Kategori yang bisa dipilih di form buat event */
export const CREATABLE_CATEGORIES = EVENT_CATEGORIES.filter((c) => c !== "SEMUA");

/** Harga paling murah (unit token) untuk label "Mulai dari" */
export const lowestPrice = (e: CommunityEvent) => (e.tiers.length ? Math.min(...e.tiers.map((t) => t.price)) : 0);

export const isEnded = (e: CommunityEvent, now = Date.now()) => now >= e.endsAt;
export const isSoldOut = (e: CommunityEvent) => e.sold >= e.capacity;
