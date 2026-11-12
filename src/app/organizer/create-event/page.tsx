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
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";

const field =
  "w-full rounded-2xl border border-[#141414]/15 bg-white px-5 py-3.5 text-[15px] outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40 transition";

const defaultImages: Record<string, string> = {
  GIGS: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200",
  PAMERAN: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200",
  FESTIVAL: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200",
  KOMUNITAS: "https://images.unsplash.com/photo-1514525253361-bee43833075d?auto=format&fit=crop&q=80&w=1200",
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
  const [tiers, setTiers] = useState<TierDraft[]>([{ ...newTier("Reguler"), price: "50000", perk: "Masuk + stempel" }]);

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
    if (!isValidEventCode(cleanCode)) return setError("Kode event harus 3 sampai 8 huruf besar atau angka.");
    if (codeTaken) return setError("Kode event sudah dipakai event lain.");
    if (tiers.some((t) => !t.name.trim())) return setError("Setiap jenis pass perlu nama.");
    if (!date) return setError("Pilih tanggal event.");
    if (cap < 1) return setError("Kapasitas minimal 1 tiket.");
    if (minPaid && paidUnits.some((u) => u < minPaid)) {
      return setError(`Harga pass berbayar minimal ${fmtUsdc(minPaid)} (sekitar ${fmtIdr(minPaid)}).`);
    }
    if (useCampaign) {
      if (!lowestPaid) return setError("Kampanye butuh minimal satu pass berbayar.");
      if (clipUnits <= 0 || refUnits <= 0) return setError("Tarif clip dan hadiah referral harus lebih dari 0.");
      if (refUnits > lowestPaid) return setError("Hadiah referral tidak boleh melebihi harga pass termurah.");
    }

    const startAt = new Date(`${date}T${start}:00`);
    let endAt = new Date(`${date}T${end}:00`);
    if (endAt <= startAt) endAt = new Date(endAt.getTime() + 24 * 3600 * 1000); // lewat tengah malam
    if (endAt.getTime() <= Date.now()) return setError("Waktu selesai event harus di masa depan.");

    const d = new Date(`${date}T00:00:00`);
    const form: EventForm = {
      title,
      category,
      organizerName: profile.organizer.orgName,
      city,
      venue,
      address,
      dateLabel: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      dateFull: d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      time: `${start} - ${end}`,
      image: image.trim() || defaultImages[category] || "",
      description,
      lineup: [],
      tiers: tiers.map((t, i) => ({
        id: `t${i + 1}`,
        name: t.name,
        priceUnits: tierUnits[i],
        perk: t.perk.trim() || `Masuk + ${stamps} stempel`,
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
              <ChevronLeft className="w-4 h-4" /> Panel
            </Link>
            <h1 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-none">Buat event.</h1>
            <p className="text-[#5C6157] max-w-lg">
              Event ini ditulis ke kontrak NEAR. Harga diisi dalam Rupiah dan dikonversi ke {config.data ? "USDC" : "stablecoin"} sesuai kurs tampilan.
            </p>
          </div>

          <Block title="Tentang event">
            <Label text="Nama event">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gigs Basement Vol. 13" className={field} />
            </Label>
            <div className="space-y-2 text-[13px] font-semibold">
              Kategori
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
            <Label text="Deskripsi">
              <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ceritakan acaranya" className={cn(field, "resize-none")} />
            </Label>
            <Label text="Gambar event (opsional)">
              <ImageUpload value={image} onChange={setImage} placeholder="atau tempel link gambar: https://..." fieldClass={field} />
            </Label>
          </Block>

          <Block title="Waktu & tempat">
            <div className="grid sm:grid-cols-3 gap-5">
              <Label text="Tanggal">
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
              </Label>
              <Label text="Mulai">
                <input required type="time" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
              </Label>
              <Label text="Selesai">
                <input required type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={field} />
              </Label>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Label text="Nama tempat">
                <input required value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Basement Studio" className={field} />
              </Label>
              <Label text="Kota">
                <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bandung" className={field} />
              </Label>
            </div>
            <Label text="Alamat (opsional)">
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Contoh No. 1" className={field} />
            </Label>
          </Block>

          <Block title="Pass, kapasitas & stempel">
            <Label text="Kapasitas (jumlah tiket)">
              <input required type="number" min={1} max={100000} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={field} />
            </Label>

            <div className="space-y-4">
              {tiers.map((t, i) => (
                <div key={t.key} className="p-5 rounded-3xl border border-[#141414]/10 bg-[#F5F8EE] grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                  <Label text="Nama pass">
                    <input required value={t.name} onChange={(e) => updateTier(t.key, { name: e.target.value })} placeholder="Reguler" className={field} />
                  </Label>
                  <Label text="Harga (Rp, 0 = gratis)">
                    <input required type="number" min={0} value={t.price} onChange={(e) => updateTier(t.key, { price: e.target.value })} placeholder="50000" className={field} />
                  </Label>
                  <button
                    type="button"
                    disabled={tiers.length === 1}
                    onClick={() => setTiers((ts) => ts.filter((x) => x.key !== t.key))}
                    aria-label="Hapus pass"
                    className="h-[52px] w-[52px] rounded-2xl border border-[#141414]/15 flex items-center justify-center hover:bg-[#E5484D] hover:text-white hover:border-[#E5484D] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="sm:col-span-3 space-y-3">
                    <Label text="Yang didapat (opsional)">
                      <input value={t.perk} onChange={(e) => updateTier(t.key, { perk: e.target.value })} placeholder="Masuk + stiker edisi terbatas" className={field} />
                    </Label>
                    <p className="text-xs text-[#5C6157]">
                      Disimpan sebagai {tierUnits[i] === 0 ? "gratis" : `${fmtUsdc(tierUnits[i])} (≈ ${fmtIdr(tierUnits[i])})`}
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
                  <Plus className="w-4 h-4" /> Tambah jenis pass
                </button>
              )}
              {minPaid > 0 && <p className="text-xs text-[#5C6157]">Harga pass berbayar minimal {fmtUsdc(minPaid)} ({fmtIdr(minPaid)}).</p>}
            </div>

            <div className="space-y-2 text-[13px] font-semibold">
              Stempel untuk yang hadir
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
              <p className="font-normal text-[#5C6157]">Event kecil biasanya 1 stempel. Event besar komunitas bisa 2 atau 3.</p>
            </div>
          </Block>

          <Block title="Identitas NFT pass">
            <div className="grid sm:grid-cols-2 gap-5">
              <Label text="Kode event (awalan ID pass)">
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                  placeholder="GIGS13"
                  className={cn(field, "font-mono uppercase", codeTaken && "border-[#E5484D]")}
                />
              </Label>
              <Label text="Nama NFT (opsional)">
                <input value={nftName} onChange={(e) => setNftName(e.target.value)} placeholder={title || "Sama dengan nama event"} className={field} />
              </Label>
            </div>
            <p className="text-xs text-[#5C6157]">
              {codeTaken ? <span className="text-[#E5484D]">Kode ini sudah dipakai.</span> : "3 sampai 8 huruf besar atau angka, unik di seluruh platform."} Contoh ID pass:{" "}
              <span className="font-mono">{previewCode}-0001</span>
            </p>
            <Label text="Gambar lencana setelah check-in (opsional)">
              <ImageUpload value={badgeImage} onChange={setBadgeImage} placeholder="atau tempel link (kosong = pakai gambar event)" fieldClass={field} />
            </Label>
          </Block>

          <Block title="Biaya & kampanye promosi">
            <div className="space-y-3 text-[13px] font-semibold">
              Siapa yang menanggung biaya layanan 3,4%?
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    { v: "BUYER", t: "Pembeli", d: "Harga tiket tetap, biaya ditambahkan di atasnya saat bayar." },
                    { v: "SELLER", t: "Penyelenggara", d: "Pembeli bayar sesuai harga tiket, biaya dipotong dari pendapatanmu." },
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
                <span className="block font-semibold">Pakai kampanye clipper</span>
                <span className="block text-sm text-[#5C6157] leading-snug">
                  Clipper membuat video promosi dan dibayar per 1 juta view, ditambah hadiah per penjualan lewat link referral mereka. Dana cair setelah event selesai. Tanpa kampanye, tidak ada biaya promosi.
                </span>
              </span>
            </label>

            {useCampaign && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Label text="Bayaran clip per 1 juta view (Rp)">
                    <input type="number" min={1} value={clipRate} onChange={(e) => setClipRate(e.target.value)} className={field} />
                  </Label>
                  <Label text="Hadiah per penjualan referral (Rp)">
                    <input type="number" min={1} value={refReward} onChange={(e) => setRefReward(e.target.value)} className={field} />
                  </Label>
                </div>
                <div className="p-5 rounded-3xl border border-[#141414]/10 text-sm space-y-2">
                  <p>
                    Biaya promosi 3% dari harga tiket (2% untuk pool clip, 1% untuk pool referral) dikumpulkan dari tiap penjualan, di luar biaya layanan 3,4%.
                  </p>
                  <p>
                    Deposit yang kamu setor sebelum penjualan dibuka (10% dari anggaran promosi untuk {cap || 0} tiket):{" "}
                    <b>{lowestPaid ? `${fmtUsdc(deposit)} (≈ ${fmtIdr(deposit)})` : "isi dulu harga pass berbayar"}</b>
                  </p>
                </div>
              </div>
            )}
          </Block>

          <div className="p-5 rounded-3xl border border-[#141414]/10 bg-[#F5F8EE] text-sm text-[#5C6157] space-y-1">
            <p>
              Biaya penyimpanan di jaringan NEAR: sekitar <b className="text-[#141414]">{fmtNear(nearDeposit)}</b> dibayar dari walletmu. Kelebihannya dikembalikan otomatis.
            </p>
            <p>Siapkan saldo NEAR sedikit lebih besar untuk gas.</p>
          </div>

          {error && <p className="text-[#E5484D] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-4 px-9 py-4 rounded-full text-[15px] font-semibold text-[#141414] hover:shadow-[0_0_40px_rgba(156,255,30,0.6)] transition-shadow disabled:opacity-60"
            style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
          >
            {sending ? "Menunggu wallet…" : "Terbitkan event"} <ArrowUpRight className="w-4 h-4" />
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
