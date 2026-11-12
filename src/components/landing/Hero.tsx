"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { NearLogo } from "@/components/ui/NearLogo";

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
 * Huruf berisi api putih berasap.
 * - Tekstur helai api (public/flame-noise.png, prosedural & bisa di-tile) digeser naik di dua lapisan
 *   dengan kecepatan beda. Hanya `transform`, jadi jalan di GPU dan ringan.
 * - Bentuk huruf dipakai sebagai CSS mask. Tepi yang bergelombang (turbulence) di-"bake" sekali
 *   ke dalam gambar mask, tidak dihitung ulang tiap frame.
 * - Mask kedua yang lebih lebar + blur membuat kabut api menjilat keluar dari kotak foto.
 * Semua parameter diturunkan dari index (tanpa Math.random) agar SSR = klien.
 */
function maskUri(d: string, opts: { sw: number; disp: number; blur: number; seed: number; join: "miter" | "round" }) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -30 120 130" width="360" height="390">` +
    `<filter id="f" x="-20%" y="-20%" width="140%" height="140%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.03 0.07" numOctaves="2" seed="${opts.seed}" result="t"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="t" scale="${opts.disp}" xChannelSelector="R" yChannelSelector="G"/>` +
    (opts.blur ? `<feGaussianBlur stdDeviation="${opts.blur}"/>` : "") +
    `</filter><g filter="url(#f)"><path d="${d}" fill="none" stroke="#fff" stroke-width="${opts.sw}" stroke-linejoin="${opts.join}"/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function maskStyle(uri: string): React.CSSProperties {
  return {
    maskImage: uri,
    WebkitMaskImage: uri,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  };
}

/** Lapisan tekstur api yang meluncur naik; tinggi lapisan 253.8% dari wadah (330 dari 130 unit). */
export function FlameScroll({
  src = "/flame-noise.png",
  tileW,
  tileH,
  dur,
  delay = 0,
  offX = 0,
  opacity = 1,
}: {
  src?: string;
  tileW: number; // lebar 1 tile, % dari lebar lapisan
  tileH: number; // tinggi 1 tile, % dari tinggi lapisan
  dur: number;
  delay?: number;
  offX?: number;
  opacity?: number;
}) {
  return (
    <div
      className="flame-scroll absolute left-0 right-0 top-0"
      style={{
        height: "253.85%",
        opacity,
        backgroundImage: `url(${src})`,
        backgroundSize: `${tileW}% ${tileH}%`,
        backgroundPosition: `${offX}% 0`,
        backgroundRepeat: "repeat",
        willChange: "transform",
        animationDuration: `${dur}s`,
        animationDelay: `${-delay}s`,
        ["--flame-dist" as string]: `-${tileH}%`,
      }}
    />
  );
}

function FlameLetter({ d, index }: { d: string; index: number }) {
  const inner = useMemo(() => maskUri(d, { sw: 15, disp: 8, blur: 0, seed: index + 3, join: "miter" }), [d, index]);
  const halo = useMemo(() => maskUri(d, { sw: 27, disp: 18, blur: 1.6, seed: index + 11, join: "round" }), [d, index]);
  const durA = 3.4 + (index % 3) * 0.45;
  const durB = 2.2 + (index % 2) * 0.35;
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{ left: "-10%", top: "-30%", width: "120%", height: "130%" }}
    >
      {/* dasar huruf gelap + pendar putih (statis) */}
      <svg viewBox="-10 -30 120 130" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <filter id={`fl${index}glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <path d={d} fill="none" stroke="#fff" strokeWidth="17" opacity="0.5" filter={`url(#fl${index}glow)`} />
        <path d={d} fill="none" stroke="#07090a" strokeWidth="15" strokeLinejoin="miter" opacity="0.8" />
      </svg>

      {/* kabut api yang menjilat keluar */}
      <div className="absolute inset-0 overflow-hidden" style={{ ...maskStyle(halo), opacity: 0.75 }}>
        <FlameScroll tileW={58.33} tileH={42.42} dur={durB * 1.5} delay={index * 0.6} offX={index * 13} />
      </div>

      {/* isi huruf */}
      <div className="absolute inset-0 overflow-hidden" style={maskStyle(inner)}>
        <div
          className="fire-base absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.14) 23%, rgba(255,255,255,0.5) 62%, rgba(255,255,255,1) 100%)",
          }}
        />
        <FlameScroll tileW={83.33} tileH={60.61} dur={durA} offX={(index * 31) % 100} />
        <FlameScroll tileW={58.33} tileH={42.42} dur={durB} delay={index * 0.37} offX={(index * 17 + 40) % 70} opacity={0.9} />
        <FlameScroll tileW={83.33} tileH={60.61} dur={durA * 0.78} delay={index * 0.9} offX={(index * 47 + 55) % 100} opacity={0.75} />
      </div>
    </div>
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
        className="relative w-full h-full"
        role="img"
        aria-label={l.char}
      >
        {/* foto (dipotong rounded) */}
        <div className="absolute inset-0 rounded-[16px] overflow-hidden border border-white/10 bg-black shadow-[0_18px_40px_-12px_rgba(156,255,30,0.28)]">
          <img
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 brightness-125 scale-125"
            style={{ objectPosition: `${20 + index * 12}% ${30 + (index % 3) * 20}%` }}
          />
          <div className="absolute inset-0 bg-[#9CFF1E] mix-blend-multiply opacity-70" />
        </div>
        {/* api: di luar kotak foto supaya kabutnya bisa menjilat keluar */}
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
          <span style={{ color: LIME }}>Tickets</span> become stamps
          <span style={{ color: LIME }}>.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-[15px] md:text-[17px] leading-relaxed text-white/60"
        >
          Scan at the door, collect stamps in your passport, then unlock chat, voting, and rewards from the community
          of your gigs, expos, and creator festivals.
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
            Find events
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* keterangan: dibangun di atas NEAR */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 md:bottom-8 z-10 flex justify-center">
        <motion.a
          href="https://near.org"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Built on NEAR"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto group inline-flex items-center gap-3 rounded-full border border-white/12 bg-black/35 backdrop-blur-md pl-5 pr-5 py-2.5 text-[11px] uppercase tracking-[0.22em] text-white/55 transition-colors duration-300 hover:border-white/30 hover:text-white"
        >
          <span>Built on</span>
          <NearLogo className="h-[18px] w-[18px] text-white" />
          <span className="font-semibold tracking-[0.24em] text-white">NEAR</span>
        </motion.a>
      </div>
    </section>
  );
}
