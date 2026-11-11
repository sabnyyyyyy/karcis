/** Bentuk JSON yang dikembalikan kontrak Karcis (U128/U64 berupa string) */

export interface ChainTier {
  id: string;
  name: string;
  price: string;
  perk: string;
}

export interface ChainLineupItem {
  name: string;
  role: string;
  time: string;
}

export interface ChainCampaignTerms {
  clip_rate_per_million: string;
  referral_reward: string;
  deposit_required: string;
  funded: boolean;
  views_reported: boolean;
  settled: boolean;
}

export interface ChainEvent {
  id: string;
  code: string;
  owner: string;
  title: string;
  category: string;
  organizer_name: string;
  city: string;
  venue: string;
  address: string;
  date_label: string;
  date_full: string;
  time: string;
  image: string;
  description: string;
  lineup: ChainLineupItem[];
  tiers: ChainTier[];
  stamps: number;
  capacity: number;
  ends_at: string;
  fee_bearer: "BUYER" | "SELLER";
  campaign: ChainCampaignTerms | null;
  scanners: string[];
  sold: number;
  checked_in: number;
  created_at: string;
  nft_name: string;
  badge_image: string;
}

export interface ChainPass {
  id: string;
  event_id: string;
  tier_id: string;
  serial: number;
  owner: string;
  status: "VALID" | "USED";
  stamps: number;
  minted_at: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
}

export interface ChainClip {
  id: number;
  clipper: string;
  platform: string;
  url: string;
  views: string | null;
}

export interface ChainCampaign {
  event_id: string;
  terms: ChainCampaignTerms;
  collected: string;
  deposit: string;
  participants: string[];
  clips: ChainClip[];
  referrals: { account: string; sales: number }[];
}

export interface ChainPoll {
  id: string;
  creator: string;
  organizer_name: string;
  question: string;
  options: string[];
  counts: number[];
  total: number;
  closed: boolean;
  created_at: string;
}

export interface ChainQuote {
  price: string;
  platform_fee: string;
  promo_fee: string;
  clip_pool: string;
  referral_pool: string;
  total: string;
  seller_receives: string;
}

export interface ChainConfig {
  stable_token: string;
  treasury: string;
  verifier: string;
  service_fee_bps: number;
  clip_pool_bps: number;
  referral_pool_bps: number;
  deposit_percent: number;
  min_paid_price: string;
  free_mint_storage_fee: string;
  token_registration_deposit: string;
}

export interface ChainNft {
  token_id: string;
  owner_id: string;
  metadata: {
    title: string | null;
    description: string | null;
    media: string | null;
    issued_at: string | null;
    extra: string | null;
  };
}
