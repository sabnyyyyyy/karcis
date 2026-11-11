import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoomKey } from "@/lib/community";

export interface ChatMessage {
  id: string;
  room: RoomKey;
  accountId: string;
  name: string;
  text: string;
  at: number;
  /** Pesan sistem (sambutan) */
  system?: boolean;
}

const MAX_PER_ROOM = 200;
export const MAX_LEN = 500;

const KEY = "karcis-chat-storage";

const welcome = (room: RoomKey, text: string): ChatMessage => ({
  id: `welcome-${room}`,
  room,
  accountId: "karcis",
  name: "Karcis",
  text,
  at: 0,
  system: true,
});

interface ChatState {
  messages: ChatMessage[];
  send: (room: RoomKey, author: { accountId: string; name: string }, text: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [
        welcome("umum", "Selamat datang di obrolan umum. Ceritakan acara terakhir yang kamu datangi."),
        welcome("privat", "Ruang ini khusus pengunjung langganan. Sapa sesamamu."),
        welcome("kreator", "Ruang kreator: tempat diskusi karya dan kolaborasi."),
      ],
      send: (room, author, text) => {
        const clean = text.trim().slice(0, MAX_LEN);
        if (!clean) return;
        const msg: ChatMessage = {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          room,
          accountId: author.accountId,
          name: author.name,
          text: clean,
          at: Date.now(),
        };
        set((s) => {
          const inRoom = s.messages.filter((m) => m.room === room);
          const others = s.messages.filter((m) => m.room !== room);
          return { messages: [...others, ...[...inRoom, msg].slice(-MAX_PER_ROOM)] };
        });
      },
    }),
    { name: KEY }
  )
);

// Dua tab di browser yang sama bisa jadi "dua orang": sinkronkan saat localStorage berubah
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) useChatStore.persist.rehydrate();
  });
}
