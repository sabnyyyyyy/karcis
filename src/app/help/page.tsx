"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Minus } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "Apa bedanya pass dengan tiket biasa?", a: "Pass adalah tiket digital di wallet NEAR-mu. Setelah discan di pintu masuk, ia berubah jadi lencana permanen dan menambah stempel di paspormu, jadi tidak berakhir di tempat sampah." },
  { q: "Apakah saya perlu KTP?", a: "Tidak. Identitasmu adalah akun wallet. Kami hanya meminta nama panggilan." },
  { q: "Bagaimana cara masuk ke acara?", a: "Buka pass di ponsel dan tunjukkan QR-nya. Penyelenggara memindainya di pintu masuk." },
  { q: "Apa itu stempel dan level paspor?", a: "Setiap acara yang kamu hadiri memberi stempel. 1 stempel jadi Pendatang, 3 jadi Langganan, 5 jadi Penjaga Markas. Level yang lebih tinggi membuka obrolan privat, voting, dan diskon." },
  { q: "Saya belum punya wallet NEAR.", a: "Kamu bisa membuat akun testnet gratis lewat MyNearWallet saat memilih wallet. Di testnet, saldo USDC uji bisa dicetak gratis dari halaman pembayaran." },
  { q: "Bagaimana kalau saya penyelenggara?", a: "Hubungkan wallet, pilih Penyelenggara, lalu isi data komunitasmu. Setelah itu kamu bisa membuat event dan memindai pass di pintu masuk." },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-white text-[#141414] flex flex-col">
      <section data-nav-theme="light" className="relative pt-36 pb-24 px-6 md:px-12 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_80%)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-12">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3F7D00]">Bantuan</p>
            <h1 className="text-[40px] md:text-[64px] font-extrabold tracking-[-0.045em] leading-none">Pertanyaan umum.</h1>
          </div>

          <div className="divide-y divide-black/10 border-y border-black/10">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-6 py-6 text-left">
                  <span className="text-[19px] font-semibold tracking-[-0.01em]">{f.q}</span>
                  <span className={cn("shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors", open === i ? "bg-[#9CFF1E]" : "bg-black/5")}>
                    {open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                {open === i && <p className="pb-6 pr-14 text-[#5C6157] leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>

          <p className="text-[#5C6157]">
            Belum terjawab? Tulis ke kami lewat <Link href="/#contact" className="text-[#3F7D00] font-semibold underline underline-offset-4">formulir kontak</Link>.
          </p>
        </div>
      </section>
      <EditorialFooter />
    </main>
  );
}
