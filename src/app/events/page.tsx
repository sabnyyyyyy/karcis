"use client";

import React, { useMemo, useState } from "react";
import { EditorialFooter } from "@/components/layout/Footer";
import { Search, MapPin, Calendar, Stamp, Megaphone, Ticket } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { Badge } from "@/components/ui/badge";
import { EVENT_CATEGORIES, lowestPrice, isEnded, isSoldOut, type CommunityEvent } from "@/data/events";
import { useChainEvents } from "@/lib/chain/hooks";
import { fmtShort } from "@/lib/chain/format";
import { explainChainError } from "@/lib/chain/errors";

export default function EventsPage() {
  const [category, setCategory] = useState<string>("SEMUA");
  const [query, setQuery] = useState("");
  const { data: events = [], isLoading, error, refetch } = useChainEvents();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) =>
        (category === "SEMUA" || e.category === category) &&
        (!q ||
          e.title.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q))
    );
  }, [events, category, query]);

  return (
    <main className="min-h-screen bg-background text-text-main flex flex-col pt-0 font-inter transition-all duration-500">
      {/* HEADER */}
      <section className="pt-32 pb-12 px-6 md:px-12 border-b border-on-background/5 bg-surface-low">
        <div className="max-w-[1440px] mx-auto space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <h1 className="font-bodoni text-4xl md:text-5xl font-black tracking-tight text-primary">Cari event komunitas.</h1>
              <p className="text-base text-text-muted max-w-md">
                Gigs, pameran, festival, dan workshop dari akar rumput. Setiap event menambah stempel di paspormu.
              </p>
            </div>
            <div className="relative w-full md:w-[420px]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama event, kolektif, kota, atau kode"
                className="w-full bg-background border border-on-background/10 px-12 py-4 text-sm font-medium focus:border-accent outline-none transition-all rounded-full shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {EVENT_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                  category === c
                    ? "bg-primary text-on-primary border-primary"
                    : "border-on-background/15 text-text-muted hover:border-accent hover:text-accent-ink"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="py-16 px-6 md:px-12 bg-background relative z-10 flex-1">
        <div className="max-w-[1440px] mx-auto">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[480px] rounded-2xl bg-surface-low animate-pulse" />
              ))}
            </div>
          )}

          {error && !isLoading && (
            <div className="py-24 text-center space-y-4">
              <p className="text-xl text-text-muted">Event belum bisa dimuat dari jaringan NEAR.</p>
              <p className="text-sm text-text-muted">{explainChainError(error)}</p>
              <button onClick={() => refetch()} className="text-accent-ink font-bold uppercase tracking-widest text-sm underline underline-offset-4">
                Coba lagi
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map((event) => (
                  <ScrollReveal key={event.id}>
                    <EventCard event={event} />
                  </ScrollReveal>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="py-32 text-center space-y-4">
                  <p className="text-xl text-text-muted">
                    {events.length === 0 ? "Belum ada event di kontrak. Jadilah yang pertama membuatnya." : "Belum ada event yang cocok."}
                  </p>
                  {events.length === 0 ? (
                    <Link href="/organizer/create-event" className="text-accent-ink font-bold uppercase tracking-widest text-sm underline underline-offset-4">
                      Buat event
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        setCategory("SEMUA");
                        setQuery("");
                      }}
                      className="text-accent-ink font-bold uppercase tracking-widest text-sm underline underline-offset-4"
                    >
                      Reset pencarian
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <EditorialFooter />
    </main>
  );
}

function EventCard({ event }: { event: CommunityEvent }) {
  const ended = isEnded(event);
  const soldOut = isSoldOut(event);
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col bg-surface-low border border-on-background/5 rounded-2xl overflow-hidden h-[480px] shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1"
    >
      <div className="relative h-[62%] overflow-hidden bg-surface-lowest">
        {event.image && (
          <img
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            src={event.image}
            alt={event.title}
          />
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="default" className="bg-background/90 backdrop-blur-md border border-on-background/5 text-[9px] px-2 py-0.5 font-black tracking-widest">
            {event.category}
          </Badge>
          {event.campaign && (
            <Badge variant="teal" className="text-[9px] px-2 py-0.5 flex items-center gap-1">
              <Megaphone className="w-3 h-3" /> Kampanye
            </Badge>
          )}
        </div>
        <div className="absolute top-4 right-4 stamp bg-background/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
          <Stamp className="w-3 h-3" /> +{event.stamps}
        </div>
        {(ended || soldOut) && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="px-4 py-2 rounded-full bg-background text-xs font-bold uppercase tracking-widest">
              {ended ? "Event selesai" : "Tiket habis"}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted leading-none">{event.organizer}</p>
          <h3 className="font-bodoni text-xl font-bold tracking-tight text-primary leading-tight group-hover:text-accent-ink transition-colors line-clamp-2">
            {event.title}
          </h3>
        </div>

        <div className="space-y-3 pt-3 border-t border-on-background/5">
          <div className="flex justify-between items-center text-text-muted text-[11px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.city}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {event.dateLabel}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              <Ticket className="w-3.5 h-3.5" /> {event.sold}/{event.capacity}
            </span>
            <span className="text-lg font-bold tracking-tight leading-none">{fmtShort(lowestPrice(event))}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
