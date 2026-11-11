import { CHAIN } from "./config";
import { viewCall } from "./rpc";
import type {
  ChainCampaign,
  ChainConfig,
  ChainEvent,
  ChainListing,
  ChainNft,
  ChainOrganizer,
  ChainPass,
  ChainPoll,
  ChainQuote,
} from "./types";

/** Pembacaan (view) kontrak Karcis dan token stablecoin */
export const chain = {
  config: () => viewCall<ChainConfig>("get_config"),

  events: async (): Promise<ChainEvent[]> => {
    const out: ChainEvent[] = [];
    // get_events dibatasi 100 per panggilan
    for (let from = 0; from < 1000; from += 100) {
      const page = await viewCall<ChainEvent[]>("get_events", { from_index: from, limit: 100 });
      out.push(...page);
      if (page.length < 100) break;
    }
    return out;
  },
  event: (id: string) => viewCall<ChainEvent | null>("get_event", { event_id: id }),
  eventByCode: (code: string) => viewCall<ChainEvent | null>("get_event_by_code", { code }),
  quote: (eventId: string, tierId: string) => viewCall<ChainQuote>("quote", { event_id: eventId, tier_id: tierId }),

  passesFor: (owner: string) => viewCall<ChainPass[]>("passes_for_owner", { owner }),
  pass: (id: string) => viewCall<ChainPass | null>("get_pass", { pass_id: id }),
  nft: (tokenId: string) => viewCall<ChainNft | null>("nft_token", { token_id: tokenId }),
  stampsOf: (account: string) => viewCall<number>("stamps_of", { account_id: account }),
  stampsWith: (account: string, organizer: string) =>
    viewCall<number>("stamps_with", { account_id: account, organizer }),
  isOrganizer: (account: string) => viewCall<boolean>("is_organizer", { account_id: account }),
  /** Catatan penyelenggara on-chain (profil, status, riwayat kasus); null jika belum terdaftar */
  organizer: (account: string) => viewCall<ChainOrganizer | null>("get_organizer", { account_id: account }),
  organizers: async (): Promise<ChainOrganizer[]> => {
    const out: ChainOrganizer[] = [];
    for (let from = 0; from < 1000; from += 100) {
      const page = await viewCall<ChainOrganizer[]>("get_organizers", { from_index: from, limit: 100 });
      out.push(...page);
      if (page.length < 100) break;
    }
    return out;
  },

  campaign: (eventId: string) => viewCall<ChainCampaign | null>("get_campaign", { event_id: eventId }),
  campaignsJoinedBy: (account: string) => viewCall<string[]>("campaigns_joined_by", { account_id: account }),
  unclaimed: async (account: string) => (await viewCall<string>("unclaimed_of", { account_id: account })) ?? "0",

  listings: async (): Promise<ChainListing[]> => {
    const out: ChainListing[] = [];
    for (let from = 0; from < 1000; from += 100) {
      const page = await viewCall<ChainListing[]>("get_listings", { from_index: from, limit: 100 });
      out.push(...page);
      if (page.length < 100) break;
    }
    return out;
  },
  listing: (passId: string) => viewCall<ChainListing | null>("get_listing", { pass_id: passId }),

  polls: () => viewCall<ChainPoll[]>("get_polls"),
  myVote: (pollId: string, account: string) => viewCall<number | null>("my_vote", { poll_id: pollId, account_id: account }),

  /** Saldo stablecoin (unit token) */
  tokenBalance: async (account: string) =>
    (await viewCall<string>("ft_balance_of", { account_id: account }, CHAIN.stableToken)) ?? "0",
  /** Apakah akun sudah terdaftar di kontrak token (NEP-145) */
  tokenRegistered: async (account: string) =>
    (await viewCall<{ total: string } | null>("storage_balance_of", { account_id: account }, CHAIN.stableToken)) !== null,
};
