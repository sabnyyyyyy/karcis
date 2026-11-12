"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus, Trash2, ChevronLeft } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { useProfile } from "@/store/useAuthStore";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { CREATABLE_CATEGORIES } from "@/data/events";
import { useChainConfig } from "@/lib/chain/hooks";
import { chain } from "@/lib/chain/contract";
import { buildNewEvent, createEventTx, estimateCreateEventDeposit, isValidEventCode, type EventForm } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { fmtIdr, fmtNear, fmtUsdc, idrToUnits } from "@/lib/chain/format";
import { cn, plural } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";

const field =
  "w-full rounded-2xl border border-[#141414]/15 bg-white px-5 py-3.5 text-[15px] outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40 transition";

const defaultImages: Record<string, string> = {
  GIGS: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200",
  EXPO: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200",
  FESTIVAL: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200",
  COMMUNITY: "https://images.unsplash.com/photo-1514525253361-bee43833075d?auto=format&fit=crop&q=80&w=1200",
  WORKSHOP: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200",
};

interface TierDraft {
  key: string;
  name: string;
  /** Rupiah */
  price: string;
  perk: string;
}

const newTier = (name = ""): TierDraft => ({ key: Math.random().toString(36).slice(2), name, price: "", perk: "" });

export default function CreateEventPage() {
  return (
    <OrganizerGuard>
      <Form />
    </OrganizerGuard>
  );
}

function Form() {
  const router = useRouter();
  const profile = useProfile();
  const { accountId, sendTransactions } = useNearWallet();
  const config = useChainConfig();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("GIGS");
  const [city, setCity] = useState(profile?.organizer?.city ?? "");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("22:00");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [stamps, setStamps] = useState(1);
  const [capacity, setCapacity] = useState("100");
  const [tiers, setTiers] = useState<TierDraft[]>([{ ...newTier("Regular"), price: "50000", perk: "Entry + stamp" }]);

  const [code, setCode] = useState("");
  const [nftName, setNftName] = useState("");
  const [badgeImage, setBadgeImage] = useState("");
  const [codeTaken, setCodeTaken] = useState(false);

  const [feeBearer, setFeeBearer] = useState<"BUYER" | "SELLER">("BUYER");
  const [useCampaign, setUseCampaign] = useState(false);
  const [clipRate, setClipRate] = useState("5000");
  const [refReward, setRefReward] = useState("5000");

  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const updateTier = (key: string, patch: Partial<TierDraft>) =>
    setTiers((ts) => ts.map((t) => (t.key === key ? { ...t, ...patch } : t)));

  // Cek apakah kode sudah dipakai event lain
  useEffect(() => {
    setCodeTaken(false);
    if (!isValidEventCode(code)) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const e = await chain.eventByCode(code);
        if (!cancelled) setCodeTaken(!!e);
      } catch {
        // abaikan; kontrak tetap menolak kode ganda
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [code]);

  const minPaid = Number(config.data?.min_paid_price ?? 0);
  const tierUnits = tiers.map((t) => idrToUnits(Number(t.price) || 0));
  const paidUnits = tierUnits.filter((u) => u > 0);
  const lowestPaid = paidUnits.length ? Math.min(...paidUnits) : 0;
  const cap = Math.max(0, Math.floor(Number(capacity) || 0));
  const clipUnits = idrToUnits(Number(clipRate) || 0);
  const refUnits = idrToUnits(Number(refReward) || 0);

  // Deposit kampanye = kapasitas × harga termurah × 3% × 10% (sama dengan kontrak)
  const deposit = useMemo(() => Math.floor(((cap * lowestPaid * 300) / 10000) * 0.1), [cap, lowestPaid]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!profile?.organizer || !accountId) return;

    const cleanCode = code.trim().toUpperCase();
    if (!isValidEventCode(cleanCode)) return setError("The event code must be 3 to 8 uppercase letters or numbers.");
    if (codeTaken) return setError("This event code is already used by another event.");
    if (tiers.some((t) => !t.name.trim())) return setError("Every pass type needs a name.");
    if (!date) return setError("Pick the event date.");
    if (cap < 1) return setError("Capacity must be at least 1 ticket.");
    if (minPaid && paidUnits.some((u) => u < minPaid)) {
      return setError(`Paid passes must cost at least ${fmtUsdc(minPaid)} (about ${fmtIdr(minPaid)}).`);
    }
    if (useCampaign) {
      if (!lowestPaid) return setError("A campaign needs at least one paid pass.");
      if (clipUnits <= 0 || refUnits <= 0) return setError("The clip rate and referral reward must be greater than 0.");
      if (refUnits > lowestPaid) return setError("The referral reward can't exceed the cheapest pass price.");
    }

    const startAt = new Date(`${date}T${start}:00`);
    let endAt = new Date(`${date}T${end}:00`);
    if (endAt <= startAt) endAt = new Date(endAt.getTime() + 24 * 3600 * 1000); // lewat tengah malam
    if (endAt.getTime() <= Date.now()) return setError("The event end time must be in the future.");

    const d = new Date(`${date}T00:00:00`);
    const form: EventForm = {
      title,
      category,
      organizerName: profile.organizer.orgName,
      city,
      venue,
      address,
      dateLabel: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      dateFull: d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }),
      time: `${start} - ${end}`,
      image: image.trim() || defaultImages[category] || "",
      description,
      lineup: [],
      tiers: tiers.map((t, i) => ({
        id: `t${i + 1}`,
        name: t.name,
        priceUnits: tierUnits[i],
        perk: t.perk.trim() || `Entry + ${stamps} ${plural(stamps, "stamp")}`,
      })),
      stamps,
      capacity: cap,
      endsAtMs: endAt.getTime(),
      feeBearer,
      code: cleanCode,
      nftName,
      badgeImage,
      campaign: useCampaign ? { clipRatePerMillionUnits: clipUnits, referralRewardUnits: refUnits } : null,
    };

    setSending(true);
    try {
      const input = buildNewEvent(form);
      await sendTransactions([createEventTx(input)], { callbackUrl: `${window.location.origin}/organizer` });
      const created = await chain.eventByCode(cleanCode);
      router.push(created ? `/organizer/events/${created.id}` : "/organizer");
    } catch (err) {
      setError(explainChainError(err));
    } finally {
      setSending(false);
    }
  };

  const previewInput = useMemo(() => {
    try {
      return buildNewEvent({
        title: title || "x",
        category,
        organizerName: profile?.organizer?.orgName ?? "",
        city,
        venue,
        address,
        dateLabel: "",
        dateFull: "",
        time: `${start} - ${end}`,
        image: image || defaultImages[category] || "",
        description,
        lineup: [],
        tiers: tiers.map((t, i) => ({ id: `t${i + 1}`, name: t.name, priceUnits: tierUnits[i], perk: t.perk })),
        stamps,
        capacity: cap || 1,
        endsAtMs: Date.now() + 86400000,
        feeBearer,
        code: code || "ABC",
        nftName,
        badgeImage,
        campaign: useCampaign ? { clipRatePerMillionUnits: clipUnits || 1, referralRewardUnits: refUnits || 1 } : null,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, category, city, venue, address, start, end, image, description, tiers, stamps, cap, feeBearer, code, nftName, badgeImage, useCampaign, clipUnits, refUnits]);
  const nearDeposit = previewInput ? estimateCreateEventDeposit(previewInput) : "0";

  const previewCode = code.trim().toUpperCase() || "KODE";

  return (
    <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col">
      <section className="relative px-6 md:px-12 py-16 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_70%)] pointer-events-none" />
        <form onSubmit={submit} className="relative max-w-3xl mx-auto space-y-12">
          <div className="space-y-4">
            <Link href="/organizer" className="inline-flex items-center gap-1 text-sm text-[#5C6157] hover:text-[#141414]">
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </Link>
            <h1 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-none">Create event.</h1>
            <p className="text-[#5C6157] max-w-lg">
              This event is written to the NEAR contract. Prices are entered in Rupiah and converted to {config.data ? "USDC" : "stablecoin"} at the display rate.
            </p>
          </div>

          <Block title="About the event">
            <Label text="Event name">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gigs Basement Vol. 13" className={field} />
            </Label>
            <div className="space-y-2 text-[13px] font-semibold">
              Category
              <div className="flex flex-wrap gap-2">
                {CREATABLE_CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "px-4 py-2.5 rounded-full border text-[12px] font-semibold uppercase tracking-widest transition-all",
                      category === c ? "bg-[#9CFF1E] border-[#9CFF1E]" : "border-[#141414]/15 hover:border-[#141414]/40"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <Label text="Description">
              <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us about the event" className={cn(field, "resize-none")} />
            </Label>
            <Label text="Event image (optional)">
              <ImageUpload value={image} onChange={setImage} placeholder="or paste an image link: https://..." fieldClass={field} />
            </Label>
          </Block>

          <Block title="Time & place">
            <div className="grid sm:grid-cols-3 gap-5">
              <Label text="Date">
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
              </Label>
              <Label text="Start">
                <input required type="time" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
              </Label>
              <Label text="End">
                <input required type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={field} />
              </Label>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Label text="Venue name">
                <input required value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Basement Studio" className={field} />
              </Label>
              <Label text="City">
                <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bandung" className={field} />
              </Label>
            </div>
            <Label text="Address (optional)">
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Example St." className={field} />
            </Label>
          </Block>

          <Block title="Passes, capacity & stamps">
            <Label text="Capacity (number of tickets)">
              <input required type="number" min={1} max={100000} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={field} />
            </Label>

            <div className="space-y-4">
              {tiers.map((t, i) => (
                <div key={t.key} className="p-5 rounded-3xl border border-[#141414]/10 bg-[#F5F8EE] grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                  <Label text="Pass name">
                    <input required value={t.name} onChange={(e) => updateTier(t.key, { name: e.target.value })} placeholder="Regular" className={field} />
                  </Label>
                  <Label text="Price (Rp, 0 = free)">
                    <input required type="number" min={0} value={t.price} onChange={(e) => updateTier(t.key, { price: e.target.value })} placeholder="50000" className={field} />
                  </Label>
                  <button
                    type="button"
                    disabled={tiers.length === 1}
                    onClick={() => setTiers((ts) => ts.filter((x) => x.key !== t.key))}
                    aria-label="Remove pass"
                    className="h-[52px] w-[52px] rounded-2xl border border-[#141414]/15 flex items-center justify-center hover:bg-[#E5484D] hover:text-white hover:border-[#E5484D] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="sm:col-span-3 space-y-3">
                    <Label text="What's included (optional)">
                      <input value={t.perk} onChange={(e) => updateTier(t.key, { perk: e.target.value })} placeholder="Entry + limited edition sticker" className={field} />
                    </Label>
                    <p className="text-xs text-[#5C6157]">
                      Stored as {tierUnits[i] === 0 ? "free" : `${fmtUsdc(tierUnits[i])} (≈ ${fmtIdr(tierUnits[i])})`}
                    </p>
                  </div>
                </div>
              ))}
              {tiers.length < 6 && (
                <button
                  type="button"
                  onClick={() => setTiers((ts) => [...ts, newTier()])}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#3F7D00] hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add pass type
                </button>
              )}
              {minPaid > 0 && <p className="text-xs text-[#5C6157]">Paid passes cost at least {fmtUsdc(minPaid)} ({fmtIdr(minPaid)}).</p>}
            </div>

            <div className="space-y-2 text-[13px] font-semibold">
              Stamps for attendees
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setStamps(n)}
                    className={cn(
                      "w-14 h-14 rounded-full border-2 text-lg font-bold transition-all",
                      stamps === n ? "bg-[#9CFF1E] border-[#9CFF1E]" : "border-[#141414]/15 hover:border-[#141414]/40"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="font-normal text-[#5C6157]">Small events are usually 1 stamp. Large community events can give 2 or 3.</p>
            </div>
          </Block>

          <Block title="Pass NFT identity">
            <div className="grid sm:grid-cols-2 gap-5">
              <Label text="Event code (prefix of the pass ID)">
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                  placeholder="GIGS13"
                  className={cn(field, "font-mono uppercase", codeTaken && "border-[#E5484D]")}
                />
              </Label>
              <Label text="NFT name (optional)">
                <input value={nftName} onChange={(e) => setNftName(e.target.value)} placeholder={title || "Same as the event name"} className={field} />
              </Label>
            </div>
            <p className="text-xs text-[#5C6157]">
              {codeTaken ? <span className="text-[#E5484D]">This code is already taken.</span> : "3 to 8 uppercase letters or numbers, unique across the platform."} Example pass ID:{" "}
              <span className="font-mono">{previewCode}-0001</span>
            </p>
            <Label text="Badge image after check-in (optional)">
              <ImageUpload value={badgeImage} onChange={setBadgeImage} placeholder="or paste a link (empty = use the event image)" fieldClass={field} />
            </Label>
          </Block>

          <Block title="Fees & promo campaign">
            <div className="space-y-3 text-[13px] font-semibold">
              Who covers the 3.4% service fee?
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    { v: "BUYER", t: "Buyer", d: "The ticket price stays the same, and the fee is added on top at checkout." },
                    { v: "SELLER", t: "Organizer", d: "The buyer pays the ticket price, and the fee is deducted from your revenue." },
                  ] as const
                ).map((o) => (
                  <button
                    type="button"
                    key={o.v}
                    onClick={() => setFeeBearer(o.v)}
                    className={cn(
                      "text-left p-5 rounded-3xl border-2 transition-all space-y-1",
                      feeBearer === o.v ? "border-[#9CFF1E] bg-[#9CFF1E]/10" : "border-[#141414]/10 hover:border-[#141414]/30"
                    )}
                  >
                    <p className="text-base font-semibold">{o.t}</p>
                    <p className="font-normal text-[#5C6157] text-sm leading-snug">{o.d}</p>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-4 p-5 rounded-3xl border border-[#141414]/10 bg-[#F5F8EE] cursor-pointer">
              <input type="checkbox" checked={useCampaign} onChange={(e) => setUseCampaign(e.target.checked)} className="mt-1 w-5 h-5 accent-[#3F7D00]" />
              <span className="space-y-1">
                <span className="block font-semibold">Use a clipper campaign</span>
                <span className="block text-sm text-[#5C6157] leading-snug">
                  Clippers make promo videos and are paid per 1 million views, plus a reward for each sale through their referral link. Funds are released after the event ends. With no campaign, there is no promo fee.
                </span>
              </span>
            </label>

            {useCampaign && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Label text="Clip payout per 1 million views (Rp)">
                    <input type="number" min={1} value={clipRate} onChange={(e) => setClipRate(e.target.value)} className={field} />
                  </Label>
                  <Label text="Reward per referral sale (Rp)">
                    <input type="number" min={1} value={refReward} onChange={(e) => setRefReward(e.target.value)} className={field} />
                  </Label>
                </div>
                <div className="p-5 rounded-3xl border border-[#141414]/10 text-sm space-y-2">
                  <p>
                    The promo fee is 3% of the ticket price (2% for the clip pool, 1% for the referral pool), collected from each sale, on top of the 3.4% service fee.
                  </p>
                  <p>
                    Deposit you pay before sales open (10% of the promo budget for {cap || 0} tickets):{" "}
                    <b>{lowestPaid ? `${fmtUsdc(deposit)} (≈ ${fmtIdr(deposit)})` : "enter a paid pass price first"}</b>
                  </p>
                </div>
              </div>
            )}
          </Block>

          <div className="p-5 rounded-3xl border border-[#141414]/10 bg-[#F5F8EE] text-sm text-[#5C6157] space-y-1">
            <p>
              NEAR network storage cost: about <b className="text-[#141414]">{fmtNear(nearDeposit)}</b> paid from your wallet. Any excess is refunded automatically.
            </p>
            <p>Keep a slightly larger NEAR balance for gas.</p>
          </div>

          {error && <p className="text-[#E5484D] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-4 px-9 py-4 rounded-full text-[15px] font-semibold text-[#141414] hover:shadow-[0_0_40px_rgba(156,255,30,0.6)] transition-shadow disabled:opacity-60"
            style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
          >
            {sending ? "Waiting for wallet…" : "Publish event"} <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      </section>
      <EditorialFooter />
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-[-0.02em] border-b border-black/10 pb-3">{title}</h2>
      {children}
    </section>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-[13px] font-semibold">
      {text}
      {children}
    </label>
  );
}
