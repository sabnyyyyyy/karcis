"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, ArrowUp, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROOMS, roomMin, type RoomKey } from "@/lib/community";
import { useChatStore, MAX_LEN } from "@/store/useChatStore";

const serif = "font-[family-name:var(--font-logo)] italic";

const timeOf = (at: number) =>
  at ? new Date(at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";

const initialOf = (name: string) => (name.trim()[0] ?? "?").toUpperCase();

/** Gelembung samar di balik ruang terkunci: memberi gambaran isi ruang tanpa membocorkannya */
function GhostBubbles() {
  const rows = [
    { mine: false, w: "w-[46%]" },
    { mine: false, w: "w-[62%]" },
    { mine: true, w: "w-[38%]" },
    { mine: false, w: "w-[54%]" },
    { mine: true, w: "w-[44%]" },
  ];
  return (
    <div aria-hidden className="absolute inset-0 px-8 py-8 space-y-5 select-none pointer-events-none blur-[7px] opacity-70">
      {rows.map((r, i) => (
        <div key={i} className={cn("flex items-end gap-3", r.mine && "justify-end")}>
          {!r.mine && <span className="w-8 h-8 rounded-full bg-[#EAF3D0] shrink-0" />}
          <span className={cn("h-11 rounded-2xl", r.w, r.mine ? "bg-[#141414]/80 rounded-br-md" : "bg-[#EEF1E6] rounded-bl-md")} />
        </div>
      ))}
    </div>
  );
}

export function ChatPanel({ stamps, accountId, name }: { stamps: number; accountId: string; name: string }) {
  const [active, setActive] = useState<RoomKey>("umum");
  const [text, setText] = useState("");
  const messages = useChatStore((s) => s.messages);
  const send = useChatStore((s) => s.send);
  const endRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const room = ROOMS.find((r) => r.key === active) ?? ROOMS[0];
  const min = roomMin(room);
  const locked = stamps < min;

  const list = useMemo(
    () => messages.filter((m) => m.room === active).sort((a, b) => a.at - b.at),
    [messages, active]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [list.length, active]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || !text.trim()) return;
    send(active, { accountId, name }, text);
    setText("");
  };

  const nearLimit = text.length > MAX_LEN * 0.8;

  return (
    <div className="grid lg:grid-cols-[300px_1fr] rounded-[28px] border border-[#141414]/10 bg-white overflow-hidden min-h-[580px] shadow-[0_30px_60px_-45px_rgba(20,20,20,0.35)]">
      {/* Daftar ruang */}
      <aside className="bg-[#FBFCF7] border-b lg:border-b-0 lg:border-r border-[#141414]/10 flex flex-col">
        <div className="hidden lg:flex items-center justify-between px-6 pt-6 pb-4">
          <span className="text-[11px] tracking-[0.22em] uppercase text-[#141414]/50">Ruang</span>
          <span className="h-px w-10 bg-[#141414]/15" />
        </div>

        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar">
          {ROOMS.map((r, i) => {
            const rMin = roomMin(r);
            const isLocked = stamps < rMin;
            const isActive = active === r.key;
            const pct = Math.min(100, Math.round((stamps / Math.max(rMin, 1)) * 100));
            return (
              <button
                key={r.key}
                onClick={() => setActive(r.key)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group relative text-left shrink-0 w-[230px] lg:w-full px-6 py-5 flex items-start gap-4 border-r lg:border-r-0 lg:border-t border-[#141414]/10 transition-colors duration-300",
                  isActive ? "bg-[#9CFF1E]/[0.17]" : "hover:bg-[#9CFF1E]/[0.08]"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-[#9CFF1E] origin-center transition-transform duration-300",
                    isActive ? "scale-y-100" : "scale-y-0"
                  )}
                />
                <span className="text-[11px] tracking-[0.2em] text-[#3F7D00] pt-2">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      serif,
                      "block text-[24px] leading-[1.05] tracking-[-0.01em] transition-transform duration-300 group-hover:translate-x-0.5",
                      isLocked && !isActive && "text-[#141414]/55"
                    )}
                  >
                    {r.title}
                  </span>
                  {isLocked ? (
                    <span className="mt-2.5 block">
                      <span className="flex items-center gap-1.5 text-[11.5px] text-[#141414]/55">
                        <Lock className="w-3 h-3" strokeWidth={1.75} /> Butuh {rMin} stempel
                      </span>
                      <span className="mt-2 block h-[3px] rounded-full bg-[#141414]/10 overflow-hidden">
                        <span className="block h-full rounded-full bg-[#9CFF1E]" style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                  ) : (
                    <span className="mt-2.5 flex items-center gap-2 text-[11.5px] text-[#3F7D00]">
                      <span className="relative flex w-2 h-2">
                        <span className="absolute inset-0 rounded-full bg-[#5FB800] opacity-60 animate-ping" />
                        <span className="relative w-2 h-2 rounded-full bg-[#5FB800]" />
                      </span>
                      Terbuka
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Total stempel */}
        <div className="hidden lg:block mt-auto border-t border-[#141414]/10 px-6 py-5">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#141414]/50">Stempelmu</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className={cn(serif, "text-[40px] leading-none")}>{stamps}</span>
            <span className="text-[12.5px] text-[#141414]/55">stempel terkumpul</span>
          </p>
        </div>
      </aside>

      {/* Pesan */}
      <motion.div
        key={active}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col min-h-0 min-w-0"
      >
        <div className="px-6 md:px-8 py-5 border-b border-[#141414]/10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={cn(serif, "text-[30px] leading-none tracking-[-0.01em] truncate")}>{room.title}</p>
            <p className="mt-2 text-[13px] text-[#141414]/55">{room.desc}</p>
          </div>
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em]",
              locked ? "border-[#141414]/15 text-[#141414]/55" : "border-[#9CFF1E] bg-[#9CFF1E]/20 text-[#2E5E00]"
            )}
          >
            {locked ? <Lock className="w-3 h-3" strokeWidth={1.75} /> : <span className="w-1.5 h-1.5 rounded-full bg-[#5FB800]" />}
            {locked ? "Terkunci" : "Terbuka"}
          </span>
        </div>

        {locked ? (
          <div className="relative flex-1 overflow-hidden">
            <GhostBubbles />
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/85 to-white" />
            <div className="relative h-full min-h-[380px] flex flex-col items-center justify-center text-center gap-5 px-6 py-12">
              <div className="relative w-[68px] h-[68px] flex items-center justify-center">
                {!reduce && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-[#9CFF1E]"
                    animate={{ scale: [1, 1.7], opacity: [0.8, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <span className="relative w-[68px] h-[68px] rounded-full border border-[#141414]/15 bg-white flex items-center justify-center">
                  <Lock className="w-6 h-6" strokeWidth={1.4} />
                </span>
              </div>

              <div className="space-y-3">
                <p className={cn(serif, "text-[32px] leading-none tracking-[-0.01em]")}>Ruang ini masih terkunci</p>
                <p className="text-[15px] leading-relaxed text-[#141414]/60 max-w-[38ch] mx-auto">
                  Butuh <b className="font-semibold text-[#141414]">{min} stempel</b>. Kamu punya {stamps}, tinggal{" "}
                  <b className="font-semibold text-[#141414]">{min - stamps} lagi</b>. Datangi acara dan scan pass-mu di pintu masuk.
                </p>
              </div>

              {/* progres stempel */}
              <div className="w-full max-w-[260px] space-y-2">
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${min}, minmax(0, 1fr))` }}>
                  {Array.from({ length: min }).map((_, n) => (
                    <span key={n} className={cn("h-[4px] rounded-full", n < stamps ? "bg-[#9CFF1E]" : "bg-[#141414]/12")} />
                  ))}
                </div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-[#141414]/45">
                  {stamps} / {min} stempel
                </p>
              </div>

              <Link
                href="/events"
                className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-[#141414] text-white text-[13px] font-medium tracking-wide hover:bg-[#2a2a2a] transition-colors"
              >
                Cari event
                <span className="w-8 h-8 rounded-full bg-[#9CFF1E] text-[#141414] flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-5 min-h-[320px] max-h-[460px]">
              {list.map((m) => {
                const mine = m.accountId === accountId;
                if (m.system) {
                  return (
                    <div key={m.id} className="flex items-center gap-4 text-[#141414]/45">
                      <span className="h-px flex-1 bg-[#141414]/10" />
                      <p className={cn(serif, "text-[15px] text-center max-w-[44ch]")}>{m.text}</p>
                      <span className="h-px flex-1 bg-[#141414]/10" />
                    </div>
                  );
                }
                return (
                  <motion.div
                    key={m.id}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("flex items-end gap-3", mine && "justify-end")}
                  >
                    {!mine && (
                      <span className="w-8 h-8 rounded-full bg-[#EAF3D0] text-[#3F7D00] text-[12px] font-semibold flex items-center justify-center shrink-0">
                        {initialOf(m.name)}
                      </span>
                    )}
                    <div className={cn("flex flex-col max-w-[78%]", mine ? "items-end" : "items-start")}>
                      <span className="text-[11px] tracking-wide text-[#141414]/45 mb-1.5 px-1">
                        {mine ? "Kamu" : m.name} · {timeOf(m.at)}
                      </span>
                      <p
                        className={cn(
                          "px-4 py-2.5 rounded-[20px] text-[15px] leading-snug break-words whitespace-pre-wrap",
                          mine ? "bg-[#141414] text-white rounded-br-md" : "bg-[#F1F5E8] text-[#141414] rounded-bl-md"
                        )}
                      >
                        {m.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form onSubmit={submit} className="px-4 md:px-6 py-4 border-t border-[#141414]/10">
              <div className="flex items-center gap-2 rounded-full border border-[#141414]/12 bg-[#FBFCF7] pl-5 pr-2 py-2 transition-colors focus-within:border-[#3F7D00]/50 focus-within:bg-white">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={MAX_LEN}
                  placeholder={`Tulis di ${room.title.toLowerCase()}…`}
                  className="flex-1 min-w-0 bg-transparent py-2 text-[15px] outline-none placeholder:text-[#141414]/35"
                />
                {nearLimit && (
                  <span className={cn("text-[11px] tabular-nums", text.length >= MAX_LEN ? "text-[#E5484D]" : "text-[#141414]/45")}>
                    {text.length}/{MAX_LEN}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!text.trim()}
                  aria-label="Kirim"
                  className="w-11 h-11 shrink-0 rounded-full bg-[#9CFF1E] text-[#141414] flex items-center justify-center transition-colors hover:bg-[#141414] hover:text-[#9CFF1E] disabled:opacity-35 disabled:hover:bg-[#9CFF1E] disabled:hover:text-[#141414]"
                >
                  <ArrowUp className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
