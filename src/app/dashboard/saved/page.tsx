"use client";

import React from "react";
import Link from "next/link";
import { Heart, MapPin, Calendar } from "lucide-react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { useSavedStore } from "@/store/useSavedStore";
import { useChainEvents } from "@/lib/chain/hooks";
import { useHydrated } from "@/lib/useHydrated";
import { lowestPrice } from "@/data/events";
import { fmtShort } from "@/lib/chain/format";

export default function SavedPage() {
  const hydrated = useHydrated();
  const ids = useSavedStore((s) => s.ids);
  const toggle = useSavedStore((s) => s.toggle);
  const { data: all = [], isLoading } = useChainEvents();

  if (!hydrated || isLoading) return <div className="min-h-[50vh]" />;

  const saved = ids.map((id) => all.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e);

  return (
    <div className="space-y-12">
      <section className="border-b border-on-background/10 pb-8">
        <ScrollReveal>
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-accent-ink uppercase tracking-[0.3em]">Tersimpan</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-none">Event yang kamu incar</h1>
          </div>
        </ScrollReveal>
      </section>

      {saved.length === 0 ? (
        <div className="p-12 border border-dashed border-on-background/15 rounded-3xl text-center space-y-4 text-text-muted">
          <Heart className="w-8 h-8 mx-auto text-accent-ink" />
          <p>Belum ada event tersimpan. Tekan ikon hati di halaman event untuk menyimpannya.</p>
          <Link href="/events" className="inline-block text-accent-ink font-semibold underline underline-offset-4">
            Cari event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {saved.map((e) => (
            <div key={e.id} className="group bg-white border border-on-background/10 rounded-3xl overflow-hidden hover:border-accent transition-colors">
              <Link href={`/events/${e.id}`} className="block">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={e.image} alt={e.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{e.organizer}</p>
                  <h3 className="text-xl font-semibold tracking-[-0.02em] leading-tight">{e.title}</h3>
                  <div className="flex items-center justify-between text-xs font-medium text-text-muted">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {e.city}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {e.dateLabel}</span>
                  </div>
                  <p className="font-bold">Mulai {fmtShort(lowestPrice(e))}</p>
                </div>
              </Link>
              <button
                onClick={() => toggle(e.id)}
                className="w-full py-3 border-t border-on-background/10 text-xs font-semibold uppercase tracking-widest text-text-muted hover:text-accent-coral transition-colors"
              >
                Hapus dari tersimpan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
