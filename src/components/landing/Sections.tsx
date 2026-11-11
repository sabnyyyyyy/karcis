"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Asterisk,
  Ticket,
  ScanLine,
  Stamp,
  MessagesSquare,
  Vote,
  Gift,
  Sparkles,
  MapPin,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChainEvents } from "@/lib/chain/hooks";
import { fmtShort } from "@/lib/chain/format";
import { isEnded, lowestPrice } from "@/data/events";

const LIME = "#9CFF1E";
const INK = "#141414";

/* ------------------------------------------------------------------ */
/* ABOUT                                                               */
/* ------------------------------------------------------------------ */

const aboutText =
  "KARCIS mengubah tiket event komunitas jadi paspor digital. Setiap kedatangan dicap, setiap stempel membuka akses baru: obrolan eksklusif, hak suara, dan reward, tanpa perlu menunjukkan KTP.";

// kata yang diberi aksen serif italic lime
const EMPHASIS = new Set(["paspor", "digital.", "stempel", "KTP."]);

const pillars = [
  { no: "01", title: "Stempel kehadiran", desc: "Scan di pintu masuk, setiap kedatangan tercap di paspormu." },
  { no: "02", title: "Obrolan eksklusif", desc: "Ruang ngobrol yang hanya terbuka untuk mereka yang benar-benar hadir." },
  { no: "03", title: "Hak suara", desc: "Pilih bintang tamu dan arah acara berikutnya lewat voting." },
  { no: "04", title: "Reward otomatis", desc: "Diskon merchandise dan lencana permanen, tanpa perlu menunjukkan KTP." },
];

const eventKinds = [
  "Gigs lokal",
  "Pameran kampus",
  "Festival kreator",
  "Zine fair",
  "Open mic",
  "Workshop",
  "Screening",
  "Pasar kreator",
];

function Word({
  word,
  range,
  progress,
}: {
  word: string;
  range: [number, number];
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  const em = EMPHASIS.has(word);
  return (
    <motion.span
      style={{ opacity }}
      className={cn(
        "inline-block mr-[0.26em]",
        em && "font-[family-name:var(--font-logo)] italic font-normal text-[#9CFF1E] tracking-[-0.01em]"
      )}
    >
      {word}
    </motion.span>
  );
}

/** Cap stempel melingkar yang berputar pelan */
function StampBadge() {
  return (
    <div className="relative w-[132px] h-[132px] md:w-[168px] md:h-[168px] text-[#9CFF1E]" aria-hidden>
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full animate-spin-slow">
        <defs>
          <path id="stampCircle" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
        </defs>
        <text fill="currentColor" fontSize="11.5" fontWeight="500" className="uppercase">
          <textPath href="#stampCircle" textLength="486" lengthAdjust="spacing">Karcis · Stempel kehadiran · Paspor komunitas ·</textPath>
        </text>
      </svg>
      <div className="absolute inset-[26%] rounded-full border border-[#9CFF1E]/40 flex items-center justify-center">
        <span className="font-[family-name:var(--font-logo)] italic text-[40px] md:text-[52px] leading-none">K</span>
      </div>
    </div>
  );
}

function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <div className="flex items-center gap-10 md:gap-14 w-max animate-marquee">
        {doubled.map((label, i) => (
          <React.Fragment key={i}>
            <span
              className="font-[family-name:var(--font-logo)] italic text-[44px] md:text-[84px] leading-none whitespace-nowrap text-transparent"
              style={{ WebkitTextStroke: "1px rgba(255,255,255,0.5)" }}
            >
              {label}
            </span>
            <Asterisk className="w-6 h-6 md:w-9 md:h-9 shrink-0 text-[#9CFF1E]" strokeWidth={1.5} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = aboutText.split(" ");

  return (
    <section
      id="about"
      data-nav-theme="dark"
      className="relative bg-[#050606] text-white py-28 md:py-40 overflow-hidden"
    >
      {/* cahaya lime yang sangat tipis */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full bg-[#9CFF1E]/[0.06] blur-[140px]"
      />

      <div className="relative px-6 md:px-12 max-w-[1280px] mx-auto">
        {/* label + garis tipis */}
        <div className="flex items-center gap-5 mb-14 md:mb-20">
          <span className="text-[12px] tracking-[0.22em] uppercase text-white/55">(01) Tentang kami</span>
          <span className="h-px flex-1 bg-white/12" />
        </div>

        {/* pernyataan utama + cap stempel */}
        <div className="grid md:grid-cols-12 gap-12 md:gap-8 items-start">
          <div ref={ref} className="md:col-span-9">
            <p className="text-[30px] sm:text-[40px] md:text-[56px] font-light leading-[1.14] tracking-[-0.03em]">
              {words.map((w, i) => {
                const start = i / words.length;
                const end = Math.min(1, start + 1.5 / words.length);
                return <Word key={i} word={w} range={[start, end]} progress={scrollYProgress} />;
              })}
            </p>
          </div>
          <div className="md:col-span-3 flex md:justify-end md:pt-3">
            <StampBadge />
          </div>
        </div>

        {/* empat hal yang kamu dapat */}
        <div className="mt-20 md:mt-28 grid sm:grid-cols-2 lg:grid-cols-4 border-t border-white/12">
          {pillars.map((it, i) => (
            <motion.div
              key={it.no}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
              className="group relative py-8 md:py-10 pr-6 lg:pr-10 lg:pl-8 first:lg:pl-0 border-b border-white/12 lg:border-b-0 lg:border-l first:lg:border-l-0 border-white/12"
            >
              <span className="text-[12px] tracking-[0.2em] text-[#9CFF1E]">{it.no}</span>
              <h3 className="mt-5 font-[family-name:var(--font-logo)] italic text-[28px] md:text-[32px] leading-[1.05] tracking-[-0.01em] transition-colors group-hover:text-[#9CFF1E]">
                {it.title}
              </h3>
              <p className="mt-4 text-[14.5px] leading-relaxed text-white/50 max-w-[26ch]">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* jenis acara */}
      <div className="relative mt-20 md:mt-28 border-y border-white/10 py-8 md:py-10">
        <Marquee items={eventKinds} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SERVICES                                                            */
/* ------------------------------------------------------------------ */

const services = [
  { title: "Smart pass", desc: "Tiket digital di ponsel", icon: Ticket, accent: ScanLine, href: "/how-it-works" },
  { title: "Lencana permanen", desc: "Tiket jadi lencana setelah acara", icon: Stamp, accent: Sparkles, href: "/how-it-works" },
  { title: "Ruang komunitas", desc: "Obrolan eksklusif sesama pengunjung", icon: MessagesSquare, accent: Sparkles, href: "/how-it-works" },
  { title: "Voting & reward", desc: "Pilih bintang tamu, dapat diskon merch", icon: Vote, accent: Gift, href: "/how-it-works" },
];

function Illustration({ Main, Accent }: { Main: React.ElementType; Accent: React.ElementType }) {
  return (
    <div className="relative w-[120px] h-[110px] md:w-[170px] md:h-[130px] shrink-0">
      <div className="absolute inset-x-3 inset-y-2 rounded-[28px] bg-white border-[3px] border-[#141414] rotate-[-4deg]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Main className="w-14 h-14 md:w-20 md:h-20 text-[#141414]" strokeWidth={1.6} />
      </div>
      <Accent className="absolute -top-1 -right-1 w-7 h-7 text-[#141414]" strokeWidth={1.8} />
      <Sparkles className="absolute bottom-0 -left-2 w-5 h-5 text-[#141414]" strokeWidth={1.8} />
    </div>
  );
}

export function Services() {
  return (
    <section id="services" data-nav-theme="light" className="relative bg-white text-[#141414] py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_85%)] pointer-events-none" />
      <div className="relative px-6 md:px-12 max-w-[1280px] mx-auto space-y-12">
        <div className="space-y-4 max-w-xl">
          <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-none">Fitur</h2>
          <p className="text-[17px] text-[#141414]/60 leading-relaxed">
            Semua yang komunitasmu butuhkan supaya pengunjung tetap dekat, dari pintu masuk sampai setelah acara bubar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {services.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group relative rounded-[28px] p-7 md:p-9 flex items-center justify-between gap-6 min-h-[170px] md:min-h-[190px] transition-transform duration-500 hover:-translate-y-1"
              style={{ background: LIME }}
            >
              <div className="space-y-2 max-w-[11rem]">
                <h3 className="text-[22px] md:text-[26px] font-semibold leading-tight tracking-[-0.02em]">{s.title}</h3>
                <p className="text-[14px] text-[#141414]/70 leading-snug">{s.desc}</p>
              </div>
              <Illustration Main={s.icon} Accent={s.accent} />
              <ArrowUpRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>

        <div>
          <Link
            href="#contact"
            className="inline-flex items-center gap-4 px-7 py-3.5 rounded-full border text-[14px] font-medium uppercase tracking-wide hover:bg-[#9CFF1E] transition-colors"
            style={{ borderColor: LIME }}
          >
            Ayo ngobrol <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* EVENTS CAROUSEL                                                     */
/* ------------------------------------------------------------------ */

export function Events() {
  const scroller = useRef<HTMLDivElement>(null);
  const { data = [], isLoading, error } = useChainEvents();
  // Event yang masih berjalan lebih dulu, lalu yang sudah selesai
  const events = [...data].sort((a, b) => Number(isEnded(a)) - Number(isEnded(b))).slice(0, 8);
  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  return (
    <section id="events" data-nav-theme="light" className="relative bg-white text-[#141414] py-24 md:py-32 overflow-hidden">
      <div className="px-6 md:px-12 max-w-[1280px] mx-auto space-y-12">
        <div className="space-y-4 max-w-xl">
          <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-none">Event terbaru</h2>
          <p className="text-[17px] text-[#141414]/60 leading-relaxed">
            Gigs, pameran, dan festival dari akar rumput. Setiap event menambah stempel di paspormu.
          </p>
        </div>

        <div
          ref={scroller}
          className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0 pb-2"
        >
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[260px] md:w-[300px] h-[400px] md:h-[440px] rounded-[24px] bg-[#F5F8EE] animate-pulse" />
            ))}

          {!isLoading && events.length === 0 && (
            <div className="w-full py-16 text-center text-[#141414]/60 space-y-3">
              <p>{error ? "Event belum bisa dimuat dari jaringan NEAR." : "Belum ada event di kontrak."}</p>
              {!error && (
                <Link href="/organizer/create-event" className="inline-block font-semibold text-[#3F7D00] underline underline-offset-4">
                  Jadi yang pertama membuat event
                </Link>
              )}
            </div>
          )}

          {events.map((e) => (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              className="group relative snap-start shrink-0 w-[260px] md:w-[300px] h-[400px] md:h-[440px] rounded-[24px] overflow-hidden bg-[#141414]"
            >
              {e.image && <img src={e.image} alt={e.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <span
                className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide text-[#141414]"
                style={{ background: LIME }}
              >
                {e.category.charAt(0) + e.category.slice(1).toLowerCase()}
              </span>
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-3 text-white">
                <p className="text-[12px] uppercase tracking-wide text-white/60">{e.organizer}</p>
                <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.02em]">{e.title}</h3>
                <div className="flex items-center justify-between text-[12px] text-white/70">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {e.city}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {e.dateLabel}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/15">
                  <span className="text-[12px] text-white/60">{isEnded(e) ? "Event selesai" : "Mulai dari"}</span>
                  <span className="text-[17px] font-semibold" style={{ color: LIME }}>{fmtShort(lowestPrice(e))}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Sebelumnya"
            className="w-11 h-11 rounded-full border border-[#141414]/15 flex items-center justify-center hover:bg-[#9CFF1E] hover:border-[#9CFF1E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Berikutnya"
            className="w-11 h-11 rounded-full border border-[#141414]/15 flex items-center justify-center hover:bg-[#9CFF1E] hover:border-[#9CFF1E] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* PASSPORT                                                            */
/* ------------------------------------------------------------------ */

const passportPoints = [
  "Satu pass untuk masuk, lalu jadi lencana permanen",
  "Level naik otomatis dari jumlah stempel",
  "Perk terbuka tanpa perlu menunjukkan KTP",
];

function PassportCard() {
  const stamps = [
    { label: "Gigs Basement", date: "12.10", rot: "-8deg" },
    { label: "Zine Fair", date: "03.11", rot: "6deg" },
    { label: "Open Mic", date: "21.11", rot: "-3deg" },
  ];
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[32px]" style={{ background: LIME }} />
      <div className="relative rounded-[32px] bg-[#0b0d0a] text-white p-7 md:p-8 space-y-7 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-logo)] text-xl font-black italic uppercase tracking-tighter" style={{ color: LIME }}>Karcis</span>
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/50">Paspor</span>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-white/40">Pemegang</p>
          <p className="text-2xl font-semibold tracking-tight">budi.testnet</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stamps.map((s) => (
            <div
              key={s.label}
              className="aspect-square rounded-full border-2 text-center p-2 flex flex-col items-center justify-center bg-white/5"
              style={{ transform: `rotate(${s.rot})`, borderColor: LIME, color: LIME }}
            >
              <span className="text-[9px] font-bold uppercase leading-tight">{s.label}</span>
              <span className="text-[10px] font-mono mt-1">{s.date}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] uppercase tracking-widest text-white/60">
            <span>Level: Langganan</span>
            <span>3 / 5 stempel</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-3/5 rounded-full" style={{ background: LIME }} />
          </div>
          <p className="text-[12px] text-white/50">2 stempel lagi untuk akses ruang diskusi kreator.</p>
        </div>
      </div>
    </div>
  );
}

export function Passport() {
  return (
    <section data-nav-theme="light" className="relative bg-[#F7FFE9] text-[#141414] py-24 md:py-32 border-y border-[#141414]/5 overflow-hidden">
      <div className="absolute inset-0 lime-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_75%)] pointer-events-none" />
      <div className="relative px-6 md:px-12 max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-[1.02]">
            Paspor stempel<br />di dompetmu.
          </h2>
          <p className="text-[17px] text-[#141414]/60 leading-relaxed max-w-md">
            Setiap acara yang kamu datangi tercatat sebagai stempel. Semakin banyak, semakin dekat kamu dengan komunitas.
          </p>
          <ul className="space-y-4">
            {passportPoints.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[16px]">
                <Check className="w-5 h-5" style={{ color: "#5fb800" }} strokeWidth={2.5} />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <PassportCard />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CONTACT                                                             */
/* ------------------------------------------------------------------ */

export function Contact() {
  const [sent, setSent] = useState(false);

  const field =
    "w-full rounded-2xl border border-[#141414]/15 bg-white px-5 py-3.5 text-[15px] outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40 transition";

  return (
    <section id="contact" data-nav-theme="light" className="relative bg-white text-[#141414] py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(0deg,#000,transparent_80%)] pointer-events-none" />
      <div className="relative px-6 md:px-12 max-w-[1280px] mx-auto grid lg:grid-cols-[.85fr_1.15fr] gap-12">
        <div className="space-y-4">
          <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.04em] leading-none">Ayo ngobrol.</h2>
          <p className="text-[17px] text-[#141414]/60 leading-relaxed max-w-sm">
            Penyelenggara gigs, pameran, atau festival? Ceritakan komunitasmu dan kami bantu pasang pass-nya.
          </p>
        </div>

        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            // Demo: belum ada backend, jadi form hanya menampilkan konfirmasi
            setSent(true);
          }}
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <label className="space-y-2 text-[13px] font-semibold">
              Nama
              <input required name="name" placeholder="Nama kamu" className={cn(field, "font-normal")} />
            </label>
            <label className="space-y-2 text-[13px] font-semibold">
              Email
              <input required type="email" name="email" placeholder="kamu@komunitas.com" className={cn(field, "font-normal")} />
            </label>
          </div>
          <label className="space-y-2 text-[13px] font-semibold">
            Pesan
            <textarea required name="message" rows={4} placeholder="Ceritakan event atau komunitasmu" className={cn(field, "font-normal resize-none")} />
          </label>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="inline-flex items-center gap-4 px-8 py-3.5 rounded-full text-[15px] font-semibold text-[#141414] hover:shadow-[0_0_40px_rgba(156,255,30,0.6)] transition-shadow"
              style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
            >
              Kirim <ArrowUpRight className="w-4 h-4" />
            </button>
            {sent && <span className="text-[14px] text-[#141414]/60">Terima kasih! (demo: pesan belum dikirim ke mana pun)</span>}
          </div>
        </form>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FOOTER                                                              */
/* ------------------------------------------------------------------ */

export function LandingFooter() {
  return (
    <footer data-nav-theme="dark" className="bg-[#07090a] text-white px-6 md:px-12 py-14">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between gap-10">
        <div className="space-y-4 max-w-xs">
          <span className="font-[family-name:var(--font-logo)] text-3xl font-black italic uppercase tracking-tighter" style={{ color: LIME }}>Karcis</span>
          <p className="text-[14px] text-white/50 leading-relaxed">
            Tiket event komunitas yang tidak berakhir di tempat sampah. Setiap kedatangan jadi stempel di paspormu.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12 text-[14px]">
          <nav className="flex flex-col gap-3 text-white/70">
            <Link href="/events" className="hover:text-white">Semua event</Link>
            <Link href="/how-it-works" className="hover:text-white">Cara kerja</Link>
            <Link href="/help" className="hover:text-white">Bantuan</Link>
          </nav>
          <nav className="flex flex-col gap-3 text-white/70">
            <Link href="/dashboard" className="hover:text-white">Paspor saya</Link>
            <Link href="/organizer" className="hover:text-white">Untuk penyelenggara</Link>
            <Link href="/onboarding" className="hover:text-white">Mulai</Link>
          </nav>
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-[12px] text-white/40">
        <span>© 2026 Karcis. Dibuat untuk komunitas.</span>
        <span>Dibangun di NEAR Protocol (testnet)</span>
      </div>
    </footer>
  );
}
