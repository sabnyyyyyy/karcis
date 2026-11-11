"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const LIME = "#9CFF1E";

const photos = [
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600",
];

/** Huruf K-A-R-C-I-S: goresan gelap yang "memotong" foto, seperti sayatan diagonal di referensi */
const LETTERS = [
  { char: "K", d: "M28 14V86 M76 14L30 52 M44 42L78 86" },
  { char: "A", d: "M18 90L50 12L82 90 M31 66H69" },
  { char: "R", d: "M28 88V14H56Q80 14 80 34Q80 54 56 54H28 M54 54L80 88" },
  { char: "C", d: "M80 30Q72 14 52 14Q22 14 22 50Q22 86 52 86Q72 86 80 70" },
  { char: "I", d: "M50 14V86 M30 14H70 M30 86H70" },
  { char: "S", d: "M78 28Q70 14 50 14Q26 14 26 32Q26 48 50 50Q76 52 76 68Q76 86 50 86Q28 86 20 70" },
];

/**
 * Huruf berisi api putih: dasar gelap, gradasi putih panas dari bawah,
 * dan lidah api yang naik berulang. Semua di-mask oleh bentuk huruf.
 * Posisi & tempo lidah api diturunkan dari index (tanpa Math.random) agar SSR = klien.
 */
const FLAMES = 13;
function FlameLetter({ d, index }: { d: string; index: number }) {
  const id = `fl${index}`;
  const tongues = Array.from({ length: FLAMES }, (_, k) => {
    const x = 6 + k * (88 / (FLAMES - 1)) + (((k * 37 + index * 11) % 7) - 3);
    const dur = 1.5 + ((k * 13 + index * 7) % 11) / 10; // 1.5 - 2.6 dtk
    const delay = -(((k * 17 + index * 5) % 25) / 10); // negatif: sudah berjalan sejak awal
    const w = 0.8 + (((k * 7 + index * 3) % 5) / 10); // lebar 0.8 - 1.2
    return { x, dur, delay, w };
  });
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full"
      style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.55))" }}
      aria-hidden
    >
      <defs>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <path d={d} fill="none" stroke="#fff" strokeWidth="15" strokeLinejoin="miter" strokeLinecap="butt" />
        </mask>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* dasar huruf */}
      <path d={d} fill="none" stroke="#07090a" strokeWidth="15" strokeLinejoin="miter" strokeLinecap="butt" />
      <g mask={`url(#${id}m)`}>
        <rect className="fire-base" width="100" height="100" fill={`url(#${id}g)`} />
        {tongues.map((t, k) => (
          <g key={k} transform={`translate(${t.x.toFixed(1)} 104) scale(${t.w})`}>
            <path
              className="flame"
              d="M-7 0 C-8 -12 -3 -22 0 -40 C3 -22 8 -12 7 0 Z"
              fill={`url(#${id}t)`}
              style={{ animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Satu huruf nama "Karcis" dalam kotak foto. Masuk bertahap, lalu mengambang terus. */
function Tile({ index }: { index: number }) {
  const l = LETTERS[index];
  const src = photos[index % photos.length];
  const reduce = useReducedMotion();
  // tiap huruf punya tempo & arah goyang sendiri supaya tidak terlihat kompak/kaku
  const bob = 10 + (index % 3) * 4;
  const tilt = (index % 2 === 0 ? 1 : -1) * (1.5 + (index % 3) * 0.5);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.1 * index, ease: [0.22, 1, 0.36, 1] }}
      className="relative aspect-square w-[min(27vw,130px)] md:w-[min(14vw,150px)]"
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -bob, 0], rotate: [0, tilt, 0] }}
        transition={{
          duration: 4.6 + index * 0.55,
          delay: 1.2 + index * 0.18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-full h-full rounded-[16px] overflow-hidden border border-white/10 bg-black shadow-[0_18px_40px_-12px_rgba(156,255,30,0.28)]"
        role="img"
        aria-label={l.char}
      >
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 brightness-125 scale-125"
          style={{ objectPosition: `${20 + index * 12}% ${30 + (index % 3) * 20}%` }}
        />
        <div className="absolute inset-0 bg-[#9CFF1E] mix-blend-multiply opacity-70" />
        <FlameLetter d={l.d} index={index} />
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section
      data-nav-theme="dark"
      className="relative min-h-[100svh] bg-[#07090a] text-[#F2F3F5] flex items-center justify-center overflow-hidden pt-24 pb-16 px-6"
    >
      {/* Galaksi lime + glow + vignette: SVG animasi (drift dari Figma "Karcis Hero Motion", plus putaran galaksi & kedip bintang) */}
      <img
        src="/hero-galaxy.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-[8%_center] md:object-center pointer-events-none select-none"
      />

      <div className="relative z-10 flex flex-col items-center text-center gap-8 w-full max-w-5xl">
        <div className="grid grid-cols-3 md:flex gap-3 md:gap-3 items-center justify-center" aria-label="Karcis">
          {LETTERS.map((l, i) => (
            <Tile key={l.char} index={i} />
          ))}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-[34px] sm:text-[48px] md:text-[60px] font-extrabold uppercase leading-[1.05] tracking-[-0.035em]"
        >
          <span style={{ color: LIME }}>Tiket</span> jadi stempel
          <span style={{ color: LIME }}>.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-[15px] md:text-[17px] leading-relaxed text-white/60"
        >
          Scan di pintu masuk, kumpulkan stempel di paspormu, lalu buka obrolan, voting, dan reward dari komunitas
          gigs, pameran, dan festival kreatormu.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/events"
            className="group inline-flex items-center gap-6 px-8 py-4 rounded-full text-[15px] font-semibold text-[#141414] shadow-[0_0_50px_rgba(156,255,30,0.45)] hover:shadow-[0_0_70px_rgba(156,255,30,0.65)] transition-shadow"
            style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
          >
            Cari event
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
