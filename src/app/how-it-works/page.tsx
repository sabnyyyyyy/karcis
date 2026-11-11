import Link from "next/link";
import { ArrowUpRight, Ticket, ScanLine, Stamp, KeyRound, MessagesSquare, Vote, Gift } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";

const steps = [
  { icon: Ticket, title: "Beli pass", text: "Pilih event, bayar, dan pass langsung masuk ke wallet NEAR-mu. Tanpa KTP, tanpa kertas." },
  { icon: ScanLine, title: "Scan di pintu masuk", text: "Tunjukkan QR dari ponsel. Penyelenggara memindainya dan kamu masuk dalam hitungan detik." },
  { icon: Stamp, title: "Jadi lencana", text: "Setelah discan, pass berubah jadi lencana permanen dan paspormu dapat stempel baru." },
  { icon: KeyRound, title: "Buka akses", text: "Makin banyak stempel, makin banyak pintu terbuka di komunitas yang kamu datangi." },
];

const perks = [
  { icon: MessagesSquare, title: "Obrolan eksklusif", text: "Ruang ngobrol hanya untuk orang yang benar-benar datang." },
  { icon: Vote, title: "Voting bintang tamu", text: "Pemegang lencana ikut menentukan siapa yang tampil di acara berikutnya." },
  { icon: Gift, title: "Reward otomatis", text: "Diskon merchandise dan perk lain terbuka sesuai level paspormu." },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white text-[#141414] flex flex-col">
      <section data-nav-theme="light" className="relative pt-36 pb-20 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_85%)] pointer-events-none" />
        <div className="relative max-w-[1280px] mx-auto space-y-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3F7D00]">Cara kerja</p>
          <h1 className="text-[44px] md:text-[72px] font-extrabold tracking-[-0.045em] leading-[0.98] max-w-3xl">
            Dari tiket jadi paspor komunitas.
          </h1>
          <p className="text-[18px] text-[#5C6157] max-w-xl leading-relaxed">
            Satu pass punya dua kehidupan: tiket untuk masuk, lalu lencana yang menyimpan kenangan dan membuka akses.
          </p>
        </div>
      </section>

      <section data-nav-theme="light" className="px-6 md:px-12 pb-24">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-4 md:gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-[28px] p-8 md:p-10 min-h-[220px] flex flex-col justify-between overflow-hidden" style={{ background: "#9CFF1E" }}>
              <span className="absolute right-6 top-2 text-[120px] font-extrabold tracking-[-0.06em] text-black/[0.07] leading-none select-none">{i + 1}</span>
              <s.icon className="w-10 h-10" strokeWidth={1.5} />
              <div className="space-y-2 relative">
                <h2 className="text-[26px] font-semibold tracking-[-0.02em]">{s.title}</h2>
                <p className="text-[#141414]/70 leading-snug max-w-sm">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section data-nav-theme="dark" className="bg-black text-white px-6 md:px-12 py-24">
        <div className="max-w-[1280px] mx-auto space-y-12">
          <h2 className="text-[36px] md:text-[52px] font-extrabold tracking-[-0.04em] leading-none">Yang terbuka setelah hadir.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {perks.map((p) => (
              <div key={p.title} className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] space-y-4">
                <p.icon className="w-8 h-8 text-[#9CFF1E]" strokeWidth={1.5} />
                <h3 className="text-xl font-semibold">{p.title}</h3>
                <p className="text-white/60 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-4 px-8 py-4 rounded-full text-[15px] font-semibold text-[#141414] shadow-[0_0_50px_rgba(156,255,30,0.4)]"
            style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
          >
            Cari event <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <EditorialFooter />
    </main>
  );
}
