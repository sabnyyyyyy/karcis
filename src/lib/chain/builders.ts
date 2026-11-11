import { CHAIN, GAS } from "./config";
import { msToNs, nearToYocto } from "./format";

/** Satu panggilan fungsi yang siap ditandatangani wallet */
export interface PreparedTx {
  receiverId: string;
  methodName: string;
  args: object;
  gasTgas: number;
  /** yoctoNEAR (string) */
  depositYocto: string;
  /** Teks singkat untuk ditampilkan di UI */
  label: string;
}

const ONE_YOCTO = "1";
/** Deposit registrasi akun di kontrak token (NEP-145): 0,00125 NEAR */
export const TOKEN_REGISTRATION_YOCTO = "1250000000000000000000";

const contractTx = (
  methodName: string,
  args: object,
  label: string,
  opts: { gasTgas?: number; deposit?: string } = {}
): PreparedTx => ({
  receiverId: CHAIN.contractId,
  methodName,
  args,
  gasTgas: opts.gasTgas ?? GAS.default,
  depositYocto: opts.deposit ?? "0",
  label,
});

// ------------------------------------------------------------------ pembayaran stablecoin

/** Beli pass berbayar: ft_transfer_call dari akun pembeli ke kontrak Karcis */
export const buyPassTx = (p: { eventId: string; tierId: string; amountUnits: number | string; referrer?: string | null }): PreparedTx => ({
  receiverId: CHAIN.stableToken,
  methodName: "ft_transfer_call",
  args: {
    receiver_id: CHAIN.contractId,
    amount: String(p.amountUnits),
    msg: JSON.stringify({
      event_id: p.eventId,
      tier_id: p.tierId,
      ...(p.referrer ? { referrer: p.referrer } : {}),
    }),
  },
  gasTgas: GAS.payToken,
  depositYocto: ONE_YOCTO,
  label: "Bayar tiket",
});

/** Penyelenggara menyetor deposit kampanye */
export const fundCampaignTx = (p: { eventId: string; amountUnits: number | string }): PreparedTx => ({
  receiverId: CHAIN.stableToken,
  methodName: "ft_transfer_call",
  args: {
    receiver_id: CHAIN.contractId,
    amount: String(p.amountUnits),
    msg: JSON.stringify({ action: "fund_campaign", event_id: p.eventId }),
  },
  gasTgas: GAS.payToken,
  depositYocto: ONE_YOCTO,
  label: "Setor deposit kampanye",
});

/** Daftarkan akun di kontrak token supaya bisa menerima / memegang USDC */
export const registerTokenTx = (account: string): PreparedTx => ({
  receiverId: CHAIN.stableToken,
  methodName: "storage_deposit",
  args: { account_id: account, registration_only: true },
  gasTgas: GAS.default,
  depositYocto: TOKEN_REGISTRATION_YOCTO,
  label: "Daftarkan akun di token USDC",
});

// ------------------------------------------------------------------ pass

export const mintFreePassTx = (eventId: string, tierId: string): PreparedTx =>
  contractTx("mint_free_pass", { event_id: eventId, tier_id: tierId }, "Ambil pass gratis", {
    gasTgas: GAS.default,
    deposit: nearToYocto("0.01"), // butuh 0,005, kelebihan dikembalikan
  });

export const checkInTx = (passId: string): PreparedTx =>
  contractTx("check_in", { pass_id: passId }, "Check-in pass", { gasTgas: GAS.checkIn });

export const addScannerTx = (eventId: string, account: string): PreparedTx =>
  contractTx("add_scanner", { event_id: eventId, account_id: account }, "Tambah petugas scan");

// ------------------------------------------------------------------ event

export interface EventForm {
  title: string;
  category: string;
  organizerName: string;
  city: string;
  venue: string;
  address: string;
  dateLabel: string;
  dateFull: string;
  time: string;
  image: string;
  description: string;
  lineup: { name: string; role: string; time: string }[];
  tiers: { id: string; name: string; priceUnits: number; perk: string }[];
  stamps: number;
  capacity: number;
  endsAtMs: number;
  feeBearer: "BUYER" | "SELLER";
  code: string;
  nftName?: string;
  badgeImage?: string;
  campaign?: { clipRatePerMillionUnits: number; referralRewardUnits: number } | null;
}

/** Input `create_event` (snake_case, sesuai kontrak) */
export function buildNewEvent(f: EventForm) {
  return {
    title: f.title.trim(),
    category: f.category.trim().toUpperCase(),
    organizer_name: f.organizerName.trim(),
    city: f.city.trim(),
    venue: f.venue.trim(),
    address: f.address.trim() || `${f.venue.trim()}, ${f.city.trim()}`,
    date_label: f.dateLabel,
    date_full: f.dateFull,
    time: f.time,
    image: f.image.trim(),
    description: f.description.trim(),
    lineup: f.lineup.filter((l) => l.name.trim()).map((l) => ({ name: l.name.trim(), role: l.role.trim(), time: l.time.trim() })),
    tiers: f.tiers.map((t) => ({
      id: t.id,
      name: t.name.trim(),
      price: String(Math.max(0, Math.round(t.priceUnits))),
      perk: t.perk.trim(),
    })),
    stamps: f.stamps,
    capacity: f.capacity,
    ends_at: msToNs(f.endsAtMs),
    fee_bearer: f.feeBearer,
    campaign: f.campaign
      ? {
          clip_rate_per_million: String(Math.round(f.campaign.clipRatePerMillionUnits)),
          referral_reward: String(Math.round(f.campaign.referralRewardUnits)),
        }
      : null,
    code: f.code.trim().toUpperCase(),
    nft_name: f.nftName?.trim() ? f.nftName.trim() : null,
    badge_image: f.badgeImage?.trim() ? f.badgeImage.trim() : null,
  };
}

export type NewEventInput = ReturnType<typeof buildNewEvent>;

/**
 * Perkiraan deposit NEAR untuk `create_event`: 0,00001 NEAR per byte yang disimpan
 * (+ registrasi token jika ada pass berbayar) ditambah margin. Kelebihan dikembalikan kontrak.
 */
export function estimateCreateEventDeposit(input: NewEventInput): string {
  const hasPaid = input.tiers.some((t) => BigInt(t.price) > 0n);
  const bytes = JSON.stringify(input).length + 500;
  const storage = BigInt(bytes) * 10n ** 19n;
  const registration = hasPaid ? BigInt(TOKEN_REGISTRATION_YOCTO) : 0n;
  const margin = BigInt(nearToYocto("0.01"));
  return (storage + registration + margin).toString();
}

export const createEventTx = (input: NewEventInput): PreparedTx =>
  contractTx("create_event", { input }, "Buat event", {
    gasTgas: GAS.createEvent,
    deposit: estimateCreateEventDeposit(input),
  });

/** Kode event: 3 sampai 8 huruf besar atau angka (sama dengan aturan di kontrak) */
export const isValidEventCode = (code: string) => /^[A-Z0-9]{3,8}$/.test(code);

// ------------------------------------------------------------------ kampanye

export const joinCampaignTx = (eventId: string): PreparedTx =>
  contractTx("join_campaign", { event_id: eventId }, "Ikut kampanye", {
    gasTgas: GAS.join,
    deposit: nearToYocto("0.01"),
  });

export const submitClipTx = (p: { eventId: string; platform: string; url: string }): PreparedTx =>
  contractTx("submit_clip", { event_id: p.eventId, platform: p.platform, url: p.url }, "Kirim clip", {
    gasTgas: GAS.default,
    deposit: nearToYocto("0.01"),
  });

export const reportViewsTx = (eventId: string, reports: { clipId: number; views: number }[]): PreparedTx =>
  contractTx(
    "report_views",
    { event_id: eventId, reports: reports.map((r) => ({ clip_id: r.clipId, views: String(Math.max(0, Math.round(r.views))) })) },
    "Laporkan view clip"
  );

export const settleCampaignTx = (eventId: string): PreparedTx =>
  contractTx("settle_campaign", { event_id: eventId }, "Selesaikan kampanye", { gasTgas: 60 });

export const claimUnclaimedTx = (): PreparedTx =>
  contractTx("claim_unclaimed", {}, "Ambil hadiah", { gasTgas: GAS.claim });

// ------------------------------------------------------------------ pasar tiket (jual ulang)

/** Pasang pass di pasar tiket. Deposit 0,01 NEAR menutup penyimpanan listing; kelebihannya dikembalikan. */
export const listPassTx = (passId: string, priceUnits: number | string): PreparedTx =>
  contractTx("list_pass_for_resale", { pass_id: passId, price: String(priceUnits) }, "Jual pass", {
    deposit: nearToYocto("0.01"),
  });

export const cancelResaleTx = (passId: string): PreparedTx =>
  contractTx("cancel_resale", { pass_id: passId }, "Batalkan penjualan");

/** Beli pass dari pasar tiket: pass lama di-burn, pembeli menerima pass baru */
export const buyResaleTx = (p: { passId: string; amountUnits: number | string }): PreparedTx => ({
  receiverId: CHAIN.stableToken,
  methodName: "ft_transfer_call",
  args: {
    receiver_id: CHAIN.contractId,
    amount: String(p.amountUnits),
    msg: JSON.stringify({ action: "buy_resale", pass_id: p.passId }),
  },
  gasTgas: GAS.payToken,
  depositYocto: ONE_YOCTO,
  label: "Beli pass dari pasar tiket",
});

// ------------------------------------------------------------------ penyelenggara (registri on-chain)

export interface OrganizerProfileInput {
  name: string;
  orgType: string;
  city: string;
  contact: string;
  description: string;
}

/** Daftar sebagai penyelenggara. Deposit 0,02 NEAR menutup penyimpanan; kelebihannya dikembalikan. */
export const registerOrganizerTx = (p: OrganizerProfileInput): PreparedTx =>
  contractTx(
    "register_organizer",
    {
      profile: {
        name: p.name.trim(),
        org_type: p.orgType,
        city: p.city.trim(),
        contact: p.contact.trim(),
        description: p.description.trim(),
      },
    },
    "Daftar sebagai penyelenggara",
    { deposit: nearToYocto("0.02") }
  );

/** Ubah profil on-chain (mis. pindah kota); nilai lama tercatat di riwayat */
export const updateOrganizerProfileTx = (p: OrganizerProfileInput): PreparedTx =>
  contractTx(
    "update_organizer_profile",
    {
      profile: {
        name: p.name.trim(),
        org_type: p.orgType,
        city: p.city.trim(),
        contact: p.contact.trim(),
        description: p.description.trim(),
      },
    },
    "Ubah profil penyelenggara",
    { deposit: nearToYocto("0.01") }
  );

export const reportOrganizerTx = (organizer: string, reason: string): PreparedTx =>
  contractTx("report_organizer", { organizer, reason: reason.trim() }, "Laporkan penyelenggara", {
    deposit: nearToYocto("0.01"),
  });

/** Tindakan admin; masing-masing butuh deposit penyimpanan kecil untuk catatannya */
export const suspendOrganizerTx = (organizer: string, reason: string): PreparedTx =>
  contractTx("suspend_organizer", { organizer, reason: reason.trim() }, "Tangguhkan penyelenggara", { deposit: nearToYocto("0.01") });
export const banOrganizerTx = (organizer: string, reason: string): PreparedTx =>
  contractTx("ban_organizer", { organizer, reason: reason.trim() }, "Blokir penyelenggara", { deposit: nearToYocto("0.01") });
export const reinstateOrganizerTx = (organizer: string, reason: string): PreparedTx =>
  contractTx("reinstate_organizer", { organizer, reason: reason.trim() }, "Pulihkan penyelenggara", { deposit: nearToYocto("0.01") });

// ------------------------------------------------------------------ voting

export const createPollTx = (question: string, options: string[]): PreparedTx =>
  contractTx("create_poll", { question, options }, "Buat voting", { deposit: nearToYocto("0.02") });

export const voteTx = (pollId: string, optionIndex: number): PreparedTx =>
  contractTx("vote", { poll_id: pollId, option_index: optionIndex }, "Beri suara");

export const closePollTx = (pollId: string): PreparedTx => contractTx("close_poll", { poll_id: pollId }, "Tutup voting");

// ------------------------------------------------------------------ testnet

/** Hanya testnet: cetak USDC uji lewat fungsi `mint` publik di usdc.fakes.testnet */
export const canMintTestUsdc = () => CHAIN.network === "testnet" && CHAIN.stableToken === "usdc.fakes.testnet";

export const mintTestUsdcTx = (account: string, amountUnits: number): PreparedTx => ({
  receiverId: CHAIN.stableToken,
  methodName: "mint",
  args: { account_id: account, amount: String(amountUnits) },
  gasTgas: GAS.default,
  depositYocto: "0",
  label: "Cetak USDC uji",
});
