"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Send, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROOMS, roomMin, type RoomKey } from "@/lib/community";
import { useChatStore, MAX_LEN } from "@/store/useChatStore";

const timeOf = (at: number) =>
  at ? new Date(at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";

export function ChatPanel({ stamps, accountId, name }: { stamps: number; accountId: string; name: string }) {
  const [active, setActive] = useState<RoomKey>("umum");
  const [text, setText] = useState("");
  const messages = useChatStore((s) => s.messages);
  const send = useChatStore((s) => s.send);
  const endRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="grid md:grid-cols-[240px_1fr] rounded-3xl border border-on-background/10 bg-white overflow-hidden min-h-[520px]">
      {/* Daftar ruang */}
      <div className="border-b md:border-b-0 md:border-r border-on-background/10 bg-[#F5F8EE] p-3 flex md:flex-col gap-2 overflow-x-auto">
        {ROOMS.map((r) => {
          const isLocked = stamps < roomMin(r);
          return (
            <button
              key={r.key}
              onClick={() => setActive(r.key)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all shrink-0 md:shrink",
                active === r.key ? "bg-[#9CFF1E] text-[#141414]" : "hover:bg-black/5",
                isLocked && active !== r.key && "opacity-60"
              )}
            >
              {isLocked ? <Lock className="w-4 h-4 shrink-0" /> : <Hash className="w-4 h-4 shrink-0" />}
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{r.title}</span>
                <span className="block text-[11px] opacity-60">{isLocked ? `Butuh ${roomMin(r)} stempel` : "Terbuka"}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Pesan */}
      <div className="flex flex-col min-h-0">
        <div className="px-6 py-4 border-b border-on-background/10">
          <p className="font-semibold">{room.title}</p>
          <p className="text-xs text-text-muted">{room.desc}</p>
        </div>

        {locked ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-10 text-text-muted">
            <Lock className="w-8 h-8" />
            <p className="font-semibold text-primary">Ruang ini masih terkunci</p>
            <p className="text-sm max-w-xs">
              Butuh {min} stempel. Kamu punya {stamps}, jadi {min - stamps} stempel lagi. Datangi acara dan scan pass-mu di pintu masuk.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[420px]">
              {list.map((m) => {
                const mine = m.accountId === accountId;
                if (m.system) {
                  return (
                    <p key={m.id} className="text-center text-xs text-text-muted bg-black/5 rounded-full px-4 py-2 mx-auto w-fit max-w-full">
                      {m.text}
                    </p>
                  );
                }
                return (
                  <div key={m.id} className={cn("flex flex-col max-w-[80%]", mine ? "ml-auto items-end" : "items-start")}>
                    <span className="text-[11px] text-text-muted mb-1">
                      {mine ? "Kamu" : m.name} · {timeOf(m.at)}
                    </span>
                    <p className={cn("px-4 py-2.5 rounded-2xl text-[15px] leading-snug break-words whitespace-pre-wrap", mine ? "bg-[#9CFF1E] text-[#141414] rounded-br-md" : "bg-black/5 rounded-bl-md")}>
                      {m.text}
                    </p>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form onSubmit={submit} className="p-4 border-t border-on-background/10 flex gap-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={MAX_LEN}
                placeholder={`Tulis di ${room.title.toLowerCase()}`}
                className="flex-1 min-w-0 rounded-full border border-[#141414]/15 px-5 py-3 text-[15px] outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                aria-label="Kirim"
                className="w-12 h-12 rounded-full bg-[#141414] text-white flex items-center justify-center hover:bg-[#9CFF1E] hover:text-[#141414] transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
