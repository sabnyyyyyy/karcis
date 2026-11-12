"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Asterisk,
  Ticket,
  ScanLine,
  Stamp,
  Award,
  Repeat,
  Megaphone,
  ShieldCheck,
  MessagesSquare,
  Vote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlameScroll } from "./Hero";
import { NearLogo } from "@/components/ui/NearLogo";
import { useChainEvents } from "@/lib/chain/hooks";
import { fmtShort } from "@/lib/chain/format";
import { isEnded, lowestPrice } from "@/data/events";

const LIME = "#9CFF1E";
const INK = "#141414";

/* ------------------------------------------------------------------ */
/* ABOUT                                                               */
/* ------------------------------------------------------------------ */

const aboutText =
  "KARCIS turns community event tickets into a digital passport. Every visit is stamped, and every stamp unlocks new access: exclusive chat, voting rights, and rewards, no ID card needed.";

// kata yang diberi aksen serif italic lime
const EMPHASIS = new Set(["digital", "passport.", "stamp", "ID"]);

const pillars = [
  { no: "01", title: "Attendance stamps", desc: "Scanned at the door, every visit is stamped in your passport." },
  { no: "02", title: "Exclusive chat", desc: "A chat space open only to people who actually showed up." },
  { no: "03", title: "Voting rights", desc: "Vote on guest stars and the direction of the next event." },
  { no: "04", title: "Automatic rewards", desc: "Merch discounts and permanent badges, no ID card needed." },
];

const eventKinds = [
  "Local gigs",
  "Campus expos",
  "Creator festivals",
  "Zine fairs",
  "Open mic",
  "Workshops",
  "Screenings",
  "Creator markets",
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
          <textPath href="#stampCircle" textLength="486" lengthAdjust="spacing">Karcis · Attendance stamps · Community passport ·</textPath>
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
          <span className="text-[12px] tracking-[0.22em] uppercase text-white/55">(01) About us</span>
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
  {
    title: "Smart pass",
    who: "Attendees",
    desc: "A digital ticket in your NEAR wallet. No ID card, no paper.",
    icon: Ticket,
    href: "/how-it-works",
  },
  {
    title: "Door scan",
    who: "Organizers",
    desc: "Scan the pass QR from a phone. Attendance is recorded instantly and becomes a stamp.",
    icon: ScanLine,
    href: "/how-it-works",
  },
  {
    title: "Permanent badge",
    who: "Attendees",
    desc: "After the event, your ticket becomes a badge kept forever in your passport.",
    icon: Stamp,
    href: "/dashboard/tickets",
  },
  {
    title: "Passport & levels",
    who: "Attendees",
    desc: "Level up from Guest to Base Keeper, automatically from your stamp count.",
    icon: Award,
    href: "/dashboard/passport",
  },
  {
    title: "Community space",
    who: "Attendees",
    desc: "Exclusive chat with fellow attendees who actually showed up.",
    icon: MessagesSquare,
    href: "/dashboard/community",
  },
  {
    title: "Voting & rewards",
    who: "Attendees",
    desc: "Pick the next guest star and get merch discounts.",
    icon: Vote,
    href: "/dashboard/community?tab=voting",
  },
  {
    title: "Ticket market",
    who: "Attendees",
    desc: "Can't make it? Sell your pass to someone else, all recorded on the contract.",
    icon: Repeat,
    href: "/resale",
  },
  {
    title: "Promo campaign",
    who: "Creators",
    desc: "Make promo videos and share a referral link. Paid per view and per ticket sold.",
    icon: Megaphone,
    href: "/dashboard/campaigns",
  },
  {
    title: "Registered organizers",
    who: "Everyone",
    desc: "Registered on NEAR. Problem organizers can be reported and have their sales stopped.",
    icon: ShieldCheck,
    href: "/events",
  },
];

export function Services() {
  return (
    <section
      id="services"
      data-nav-theme="light"
      className="relative bg-[#FBFCF7] text-[#141414] py-28 md:py-40 overflow-hidden"
    >
      {/* cahaya lime sangat tipis */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-[#9CFF1E]/[0.14] blur-[140px]"
      />

      <div className="relative px-6 md:px-12 max-w-[1280px] mx-auto">
        {/* label + garis tipis */}
        <div className="flex items-center gap-5 mb-14 md:mb-20">
          <span className="text-[12px] tracking-[0.22em] uppercase text-[#141414]/55">(02) Features</span>
          <span className="h-px flex-1 bg-[#141414]/12" />
        </div>

        {/* judul + pengantar */}
        <div className="grid md:grid-cols-12 gap-8 md:gap-10 items-end mb-16 md:mb-24">
          <h2 className="md:col-span-8 text-[38px] sm:text-[48px] md:text-[68px] font-light leading-[1.06] tracking-[-0.035em]">
            Everything your community{" "}
            <span className="font-[family-name:var(--font-logo)] italic font-normal text-[#3F7D00] tracking-[-0.01em]">
              needs
            </span>
            .
          </h2>
          <p className="md:col-span-4 text-[15.5px] leading-relaxed text-[#141414]/55 max-w-[38ch]">
            From the door to after the event wraps, for attendees, creators, and organizers.
          </p>
        </div>

        {/* daftar fitur */}
        <div className="border-b border-[#141414]/12">
          {services.map((sv, i) => {
            const Icon = sv.icon;
            return (
              <motion.div
                key={sv.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={sv.href}
                  className="group grid md:grid-cols-12 items-center gap-y-4 gap-x-6 py-7 md:py-9 -mx-4 px-4 md:-mx-8 md:px-8 border-t border-[#141414]/12 transition-colors duration-500 hover:bg-[#9CFF1E]/[0.16]"
                >
                  <span className="md:col-span-1 text-[12px] tracking-[0.2em] text-[#3F7D00]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="md:col-span-5 font-[family-name:var(--font-logo)] italic text-[38px] md:text-[52px] leading-[1.02] tracking-[-0.015em] transition-transform duration-500 group-hover:translate-x-2">
                    {sv.title}
                  </h3>
                  <div className="md:col-span-4 max-w-[36ch] space-y-2">
                    <span className="block text-[10.5px] tracking-[0.22em] uppercase text-[#3F7D00]">{sv.who}</span>
                    <p className="text-[15px] leading-relaxed text-[#141414]/55">{sv.desc}</p>
                  </div>
                  <div className="md:col-span-2 flex md:justify-end">
                    <span className="relative inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#141414]/18 transition-all duration-500 group-hover:bg-[#141414] group-hover:border-[#141414] group-hover:text-[#9CFF1E] group-hover:rotate-[-8deg]">
                      <Icon className="w-6 h-6" strokeWidth={1.25} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-14 md:mt-16">
          <Link
            href="#contact"
            className="group inline-flex items-center gap-4 pl-7 pr-5 py-3.5 rounded-full border border-[#141414]/20 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-[#141414] hover:text-white hover:border-[#141414]"
          >
            Let&apos;s talk
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#9CFF1E] text-[#141414]">
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
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
  const arrowBtn =
    "w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white transition-colors duration-300 hover:bg-[#9CFF1E] hover:border-[#9CFF1E] hover:text-[#141414]";

  return (
    <section
      id="events"
      data-nav-theme="dark"
      className="relative bg-[#050606] text-white py-28 md:py-40 overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/3 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-[#9CFF1E]/[0.06] blur-[140px]"
      />

      <div className="relative px-6 md:px-12 max-w-[1280px] mx-auto">
        {/* label + garis tipis */}
        <div className="flex items-center gap-5 mb-14 md:mb-20">
          <span className="text-[12px] tracking-[0.22em] uppercase text-white/55">(03) Events</span>
          <span className="h-px flex-1 bg-white/12" />
        </div>

        {/* judul + pengantar + panah */}
        <div className="grid md:grid-cols-12 gap-8 md:gap-10 items-end mb-14 md:mb-20">
          <h2 className="md:col-span-8 text-[38px] sm:text-[48px] md:text-[68px] font-light leading-[1.06] tracking-[-0.035em]">
            Latest{" "}
            <span className="font-[family-name:var(--font-logo)] italic font-normal text-[#9CFF1E] tracking-[-0.01em]">
              events
            </span>
            .
          </h2>
          <div className="md:col-span-4 space-y-6">
            <p className="text-[15.5px] leading-relaxed text-white/55 max-w-[38ch]">
              Grassroots gigs, expos, and festivals. Every event adds a stamp to your passport.
            </p>
            <div className="flex gap-3">
              <button onClick={() => scrollBy(-1)} aria-label="Previous" className={arrowBtn}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollBy(1)} aria-label="Next" className={arrowBtn}>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scroller}
          className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0 pb-2"
        >
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[260px] md:w-[300px] space-y-5">
                <div className="aspect-[4/5] rounded-[14px] bg-white/[0.06] animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-white/[0.06] animate-pulse" />
                <div className="h-7 w-full rounded bg-white/[0.06] animate-pulse" />
              </div>
            ))}

          {!isLoading && events.length === 0 && (
            <div className="w-full py-16 text-center text-white/60 space-y-3">
              <p>{error ? "Events can't be loaded from the NEAR network." : "There are no events on the contract yet."}</p>
              {!error && (
                <Link href="/organizer/create-event" className="inline-block font-semibold text-[#9CFF1E] underline underline-offset-4">
                  Be the first to create one
                </Link>
              )}
            </div>
          )}

          {events.map((e, i) => {
            const ended = isEnded(e);
            return (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group snap-start shrink-0 w-[260px] md:w-[300px]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-white/[0.06]">
                  {e.image && (
                    <img
                      src={e.image}
                      alt={e.title}
                      className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0",
                        ended ? "grayscale opacity-60" : "grayscale-[35%]"
                      )}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
                  <span className="absolute top-4 left-4 text-[11px] tracking-[0.22em] text-white/85">
                    NO. {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute top-3.5 right-4 px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm text-[10px] uppercase tracking-[0.16em] text-white/90">
                    {e.category.charAt(0) + e.category.slice(1).toLowerCase()}
                  </span>
                </div>

                <div className="pt-5 space-y-3">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-white/45 truncate">
                    {e.organizer} · {e.city}
                  </p>
                  <h3 className="font-[family-name:var(--font-logo)] italic text-[26px] md:text-[29px] leading-[1.08] tracking-[-0.01em] line-clamp-2 transition-colors duration-300 group-hover:text-[#9CFF1E]">
                    {e.title}
                  </h3>
                  <div className="flex items-center justify-between pt-3 border-t border-white/12 text-[13px]">
                    <span className="text-white/55">{e.dateLabel}</span>
                    {ended ? (
                      <span className="text-white/40">Ended</span>
                    ) : (
                      <span className="text-white/55">
                        From <span className="text-[#9CFF1E] font-medium">{fmtShort(lowestPrice(e))}</span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 md:mt-16">
          <Link
            href="/events"
            className="group inline-flex items-center gap-4 pl-7 pr-5 py-3.5 rounded-full border border-white/20 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 hover:bg-white hover:text-[#141414] hover:border-white"
          >
            View all events
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#9CFF1E] text-[#141414]">
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* PASSPORT                                                            */
/* ------------------------------------------------------------------ */

const passportPoints = [
  "One pass to get in, then it becomes a permanent badge",
  "Levels go up automatically from your stamp count",
  "Perks unlock without showing an ID card",
];

const passportStamps = [
  { label: "Gigs Basement", date: "12.10", rot: -8 },
  { label: "Zine Fair", date: "03.11", rot: 5 },
  { label: "Open Mic", date: "21.11", rot: -3 },
];

/** Satu cap: masuk dengan efek "ditekan", lalu ditekan ulang berkala dengan riak tinta */
function StampMark({
  label,
  date,
  rot,
  i,
  reduce,
}: {
  label: string;
  date: string;
  rot: number;
  i: number;
  reduce: boolean | null;
}) {
  const loopDelay = 3.2 + i * 0.55;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.5, rotate: rot + 14 }}
      whileInView={{ opacity: 1, scale: 1, rotate: rot }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: 0.5 + i * 0.22, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative aspect-square"
    >
      <motion.div
        animate={reduce ? undefined : { scale: [1, 1.12, 0.96, 1], rotate: [0, -3, 1.5, 0] }}
        transition={{ duration: 0.75, delay: loopDelay, repeat: Infinity, repeatDelay: 5.5, ease: "easeOut" }}
        className="absolute inset-0 rounded-full border border-[#9CFF1E] text-[#9CFF1E] flex flex-col items-center justify-center text-center px-3"
      >
        <span className="absolute inset-[5px] rounded-full border border-dashed border-[#9CFF1E]/45" />
        <span className="relative text-[9px] font-semibold uppercase leading-tight tracking-[0.14em]">{label}</span>
        <span className="relative mt-1.5 text-[10px] font-mono tracking-wider text-[#9CFF1E]/80">{date}</span>
      </motion.div>
      {!reduce && (
        <motion.span
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ scale: [1, 1.5], opacity: [0.75, 0] }}
          transition={{ duration: 1.1, delay: loopDelay, repeat: Infinity, repeatDelay: 5.15, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-full border border-[#9CFF1E]"
        />
      )}
    </motion.div>
  );
}

function PassportCard() {
  const reduce = useReducedMotion();
  // kemiringan 3D mengikuti kursor (per sumbu dihaluskan dengan spring)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 14, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 120, damping: 14, mass: 0.6 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [10, -10]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-8, 8]);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      className="relative w-full max-w-[420px] mx-auto lg:ml-auto"
      style={{ perspective: 1100 }}
      onPointerMove={reduce ? undefined : onMove}
      onPointerLeave={onLeave}
    >
      {/* pendar lime di belakang kartu, bernapas pelan */}
      <motion.div
        aria-hidden
        className="absolute -inset-10 rounded-full bg-[#9CFF1E]/25 blur-[70px]"
        animate={reduce ? undefined : { opacity: [0.65, 1, 0.65], scale: [1, 1.07, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* melayang pelan */}
      <motion.div
        className="relative"
        animate={reduce ? undefined : { y: [0, -14, 0], rotate: [-1.5, 0.6, -1.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* api di BELAKANG kartu: helai api lime naik dan menjilat keluar dari tepi atas & samping */}
        <div
          aria-hidden
          className="pointer-events-none absolute overflow-hidden"
          style={{
            left: "-13%",
            right: "-13%",
            top: "-38%",
            bottom: "-2%",
            maskImage:
              "linear-gradient(to top, #000 45%, transparent 100%), linear-gradient(to right, transparent, #000 20%, #000 80%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to top, #000 45%, transparent 100%), linear-gradient(to right, transparent, #000 20%, #000 80%, transparent)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        >
          <FlameScroll src="/flame-lime.png" tileW={83.33} tileH={60.61} dur={5.2} offX={20} opacity={0.95} />
          <FlameScroll src="/flame-lime.png" tileW={58.33} tileH={42.42} dur={3.3} delay={1.4} offX={45} opacity={0.8} />
        </div>

        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative z-10 overflow-hidden rounded-[26px] bg-[#0a0c09] text-white p-2 shadow-[0_40px_80px_-30px_rgba(20,20,20,0.55)]"
        >
          {/* bingkai tipis di dalam kartu */}
          <div className="rounded-[20px] border border-white/10 p-7 md:p-8 space-y-8">
            <div className="flex items-start justify-between">
              <span className="font-[family-name:var(--font-logo)] italic text-[30px] leading-none text-[#9CFF1E]">Karcis</span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/45 pt-1.5">Community passport</span>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Holder</p>
              <p className="font-[family-name:var(--font-logo)] italic text-[34px] leading-[1.15] tracking-[-0.01em]">budi.testnet</p>
            </div>

            <div className="grid grid-cols-3 gap-3.5">
              {passportStamps.map((st, i) => (
                <StampMark key={st.label} {...st} i={i} reduce={reduce} />
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/55">
                <span>Level · Regular</span>
                <span>3 / 5 stamps</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((n) => (
                  <motion.span
                    key={n}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + n * 0.12, ease: "easeOut" }}
                    style={{ originX: 0 }}
                    className={cn("relative h-[3px] rounded-full", n < 3 ? "bg-[#9CFF1E]" : "bg-white/15")}
                  >
                    {/* segmen berikutnya berkedip: "tinggal selangkah lagi" */}
                    {n === 3 && !reduce && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-[#9CFF1E]"
                        animate={{ opacity: [0, 0.9, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </motion.span>
                ))}
              </div>
              <p className="text-[12.5px] leading-relaxed text-white/50">2 more stamps to unlock the creators&apos; discussion room.</p>
            </div>

            {/* baris ala paspor: hiasan */}
            <p aria-hidden className="font-mono text-[10px] leading-[1.5] tracking-[0.18em] text-white/20 break-all select-none">
              {"P<KRC<<BUDI<TESTNET<<<<<<<<<<<"}
              <br />
              {"0003<<STAMPS<<REGULAR<<<<<<<<<"}
            </p>
          </div>

          {!reduce && (
            <>
              {/* kilau yang menyapu kartu */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.13] to-transparent"
                initial={{ x: "-160%" }}
                animate={{ x: ["-160%", "420%"] }}
                transition={{ duration: 1.9, delay: 2, repeat: Infinity, repeatDelay: 5.5, ease: "easeInOut" }}
              />
              {/* garis scan lime, seperti dipindai di pintu masuk */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-x-5 h-px bg-[#9CFF1E] shadow-[0_0_14px_3px_rgba(156,255,30,0.5)]"
                initial={{ top: "3%", opacity: 0 }}
                animate={{ top: ["3%", "97%"], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.6, delay: 4.5, repeat: Infinity, repeatDelay: 5.5, ease: "linear" }}
              />
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export function Passport() {
  return (
    <section
      data-nav-theme="light"
      className="relative bg-[#F5F9EA] text-[#141414] py-28 md:py-40 overflow-hidden"
    >
      <div className="relative px-6 md:px-12 max-w-[1280px] mx-auto">
        {/* label + garis tipis */}
        <div className="flex items-center gap-5 mb-14 md:mb-20">
          <span className="text-[12px] tracking-[0.22em] uppercase text-[#141414]/55">(04) Passport</span>
          <span className="h-px flex-1 bg-[#141414]/12" />
        </div>

        <div className="grid lg:grid-cols-12 gap-16 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-10">
            <h2 className="text-[38px] sm:text-[48px] md:text-[68px] font-light leading-[1.06] tracking-[-0.035em]">
              A stamp passport{" "}
              <span className="font-[family-name:var(--font-logo)] italic font-normal text-[#3F7D00] tracking-[-0.01em]">
                in your wallet
              </span>
              .
            </h2>
            <p className="text-[16px] text-[#141414]/55 leading-relaxed max-w-[44ch]">
              Every event you attend is recorded as a stamp. The more you collect, the closer you get to the community.
            </p>
            <ol className="max-w-lg border-b border-[#141414]/12">
              {passportPoints.map((pt, i) => (
                <li key={pt} className="flex items-baseline gap-6 py-5 border-t border-[#141414]/12">
                  <span className="w-6 shrink-0 text-[12px] tracking-[0.2em] text-[#3F7D00]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[16px] leading-snug">{pt}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-5">
            <PassportCard />
          </div>
        </div>
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
    "w-full bg-transparent border-0 border-b border-white/25 px-0 py-3 text-[17px] normal-case tracking-normal text-white placeholder:text-white/30 outline-none focus:border-[#9CFF1E] transition-colors";
  const labelCls = "block space-y-1 text-[11px] uppercase tracking-[0.22em] text-white/50";

  return (
    <section
      id="contact"
      data-nav-theme="dark"
      className="relative bg-[#050606] text-white py-28 md:py-40 overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/2 left-1/4 w-[60vw] h-[60vw] rounded-full bg-[#9CFF1E]/[0.06] blur-[140px]"
      />
      <div className="relative px-6 md:px-12 max-w-[1280px] mx-auto">
        {/* label + garis tipis */}
        <div className="flex items-center gap-5 mb-14 md:mb-20">
          <span className="text-[12px] tracking-[0.22em] uppercase text-white/55">(05) Contact</span>
          <span className="h-px flex-1 bg-white/12" />
        </div>

        <div className="grid lg:grid-cols-12 gap-14 lg:gap-10">
          <div className="lg:col-span-5 space-y-8">
            <h2 className="text-[38px] sm:text-[48px] md:text-[68px] font-light leading-[1.06] tracking-[-0.035em]">
              Let&apos;s{" "}
              <span className="font-[family-name:var(--font-logo)] italic font-normal text-[#9CFF1E] tracking-[-0.01em]">
                talk
              </span>
              .
            </h2>
            <p className="text-[15.5px] leading-relaxed text-white/55 max-w-[38ch]">
              Running gigs, expos, or festivals? Tell us about your community and we&apos;ll help set up your pass.
            </p>
          </div>

          <form
            className="lg:col-span-7 lg:pl-10 grid gap-9"
            onSubmit={(e) => {
              e.preventDefault();
              // Demo: belum ada backend, jadi form hanya menampilkan konfirmasi
              setSent(true);
            }}
          >
            <div className="grid sm:grid-cols-2 gap-9">
              <label className={labelCls}>
                Name
                <input required name="name" placeholder="Your name" className={field} />
              </label>
              <label className={labelCls}>
                Email
                <input required type="email" name="email" placeholder="you@community.com" className={field} />
              </label>
            </div>
            <label className={labelCls}>
              Message
              <textarea required name="message" rows={3} placeholder="Tell us about your event or community" className={cn(field, "resize-none")} />
            </label>
            <div className="flex flex-wrap items-center gap-5">
              <button
                type="submit"
                className="group inline-flex items-center gap-4 pl-8 pr-3 py-3 rounded-full bg-[#9CFF1E] text-[#141414] text-[13px] font-semibold uppercase tracking-[0.14em] transition-shadow hover:shadow-[0_0_40px_rgba(156,255,30,0.45)]"
              >
                Send
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#141414] text-[#9CFF1E]">
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </button>
              {sent && <span className="text-[14px] text-white/55">Thank you! (demo: the message isn&apos;t sent anywhere)</span>}
            </div>
          </form>
        </div>
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
            Community event tickets that don&apos;t end up in the trash. Every visit becomes a stamp in your passport.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12 text-[14px]">
          <nav className="flex flex-col gap-3 text-white/70">
            <Link href="/events" className="hover:text-white">All events</Link>
            <Link href="/resale" className="hover:text-white">Ticket market</Link>
            <Link href="/how-it-works" className="hover:text-white">How it works</Link>
            <Link href="/help" className="hover:text-white">Help</Link>
          </nav>
          <nav className="flex flex-col gap-3 text-white/70">
            <Link href="/dashboard" className="hover:text-white">My passport</Link>
            <Link href="/organizer" className="hover:text-white">For organizers</Link>
            <Link href="/onboarding" className="hover:text-white">Get started</Link>
          </nav>
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-[12px] text-white/40">
        <span>© 2026 Karcis. Made for communities.</span>
        <span className="inline-flex items-center gap-2">
          <NearLogo className="h-4 w-4 text-white/70" />
          Built on NEAR Protocol (testnet)
        </span>
      </div>
    </footer>
  );
}
