import type { CommunityEvent } from "@/data/events";
import type { Pass } from "@/types/pass";
import { nsToIso, nsToMs } from "./format";
import type { ChainEvent, ChainPass } from "./types";

/** Event dari kontrak -> bentuk yang dipakai UI */
export function toUiEvent(e: ChainEvent): CommunityEvent {
  return {
    id: e.id,
    code: e.code,
    title: e.title,
    organizer: e.organizer_name,
    category: (e.category || "KOMUNITAS").toUpperCase(),
    city: e.city,
    venue: e.venue,
    address: e.address,
    dateLabel: e.date_label,
    dateFull: e.date_full,
    time: e.time,
    image: e.image,
    description: e.description,
    lineup: e.lineup,
    tiers: e.tiers.map((t) => ({ id: t.id, name: t.name, price: Number(t.price), perk: t.perk })),
    stamps: e.stamps,
    capacity: e.capacity,
    sold: e.sold,
    checkedIn: e.checked_in,
    endsAt: nsToMs(e.ends_at),
    feeBearer: e.fee_bearer,
    campaign: e.campaign
      ? {
          clipRatePerMillion: Number(e.campaign.clip_rate_per_million),
          referralReward: Number(e.campaign.referral_reward),
          depositRequired: Number(e.campaign.deposit_required),
          funded: e.campaign.funded,
          viewsReported: e.campaign.views_reported,
          settled: e.campaign.settled,
        }
      : null,
    nftName: e.nft_name,
    badgeImage: e.badge_image,
    scanners: e.scanners,
    ownerAccount: e.owner,
  };
}

/** Pass dari kontrak + data event -> bentuk yang dipakai UI */
export function toUiPass(p: ChainPass, event?: CommunityEvent): Pass {
  const used = p.status === "USED";
  return {
    id: p.id,
    serial: p.serial,
    eventId: p.event_id,
    eventCode: event?.code ?? p.id.split("-")[0],
    eventTitle: event?.title ?? `Event #${p.event_id}`,
    nftName: event?.nftName ?? event?.title ?? "",
    organizer: event?.organizer ?? "",
    organizerAccount: event?.ownerAccount ?? "",
    city: event?.city ?? "",
    venue: event?.venue ?? "",
    dateFull: event?.dateFull ?? "",
    time: event?.time ?? "",
    image: used && event?.badgeImage ? event.badgeImage : (event?.image ?? ""),
    tierId: p.tier_id,
    tierName: event?.tiers.find((t) => t.id === p.tier_id)?.name ?? p.tier_id,
    owner: p.owner,
    status: p.status,
    stamps: p.stamps,
    mintedAt: nsToIso(p.minted_at),
    checkedInAt: p.checked_in_at ? nsToIso(p.checked_in_at) : undefined,
    checkedInBy: p.checked_in_by ?? undefined,
  };
}
