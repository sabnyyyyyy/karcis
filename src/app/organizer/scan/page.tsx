"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import {
  Camera,
  CameraOff,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Keyboard,
  Info,
} from "lucide-react";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useHydrated } from "@/lib/useHydrated";
import { parsePassPayload } from "@/lib/passQr";
import { useChainEvents } from "@/lib/chain/hooks";
import { chain } from "@/lib/chain/contract";
import { checkInTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { shortAccount } from "@/lib/chain/format";
import { cn } from "@/lib/utils";

type ScanKind = "success" | "warn" | "error";

interface ScanResult {
  kind: ScanKind;
  title: string;
  detail: string;
  at: number;
}

const kindStyle: Record<ScanKind, { box: string; icon: React.ElementType }> = {
  success: { box: "bg-[#9CFF1E] text-[#141414] border-[#9CFF1E]", icon: CheckCircle2 },
  warn: { box: "bg-[#FFF4D6] text-[#6b4e00] border-[#F5D37A]", icon: AlertTriangle },
  error: { box: "bg-[#FFE5E6] text-[#9b1c22] border-[#F5A3A7]", icon: XCircle },
};

export default function ScanPage() {
  return (
    <OrganizerGuard>
      <Scanner />
    </OrganizerGuard>
  );
}

function Scanner() {
  const hydrated = useHydrated();
  const { accountId, sendTransactions } = useNearWallet();
  const { data: all = [], isLoading, refetch: refetchEvents } = useChainEvents();
  // Event milik akun ini, atau yang menunjuk akun ini sebagai petugas scan
  const events = all.filter((e) => e.ownerAccount === accountId || (!!accountId && e.scanners.includes(accountId)));

  const [eventId, setEventId] = useState<string | null>(null);
  const busy = useRef(false);
  const [cameraState, setCameraState] = useState<"off" | "starting" | "on" | "error">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [last, setLast] = useState<ScanResult | null>(null);
  const [log, setLog] = useState<ScanResult[]>([]);
  const [manual, setManual] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const lastRaw = useRef<{ raw: string; at: number }>({ raw: "", at: 0 });

  const activeEvent = events.find((e) => e.id === (eventId ?? events[0]?.id));

  // Validasi satu pass terhadap event yang dipilih lalu check-in
  const handleCode = useCallback(
    async (raw: string) => {
      if (!activeEvent || busy.current) return;
      const now = Date.now();
      // Kode yang sama beruntun (kamera menangkap berkali-kali) diabaikan selama 3 detik
      if (lastRaw.current.raw === raw && now - lastRaw.current.at < 3000) return;
      lastRaw.current = { raw, at: now };

      const push = (r: Omit<ScanResult, "at">) => {
        const full = { ...r, at: now };
        setLast(full);
        setLog((l) => [full, ...l].slice(0, 30));
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(r.kind === "success" ? 80 : [60, 40, 60]);
      };

      const parsed = parsePassPayload(raw);
      if (!parsed) return push({ kind: "error", title: "Bukan pass Karcis", detail: "QR ini tidak dikenali." });

      busy.current = true;
      try {
        // Selalu baca status terbaru dari kontrak, bukan dari isi QR
        const pass = await chain.pass(parsed.id);
        if (!pass) return push({ kind: "error", title: "Pass tidak ditemukan", detail: `${parsed.id} tidak terdaftar di kontrak.` });
        if (pass.event_id !== activeEvent.id) {
          return push({ kind: "warn", title: "Pass untuk event lain", detail: `${pass.id} bukan untuk "${activeEvent.title}".` });
        }
        if (parsed.owner && parsed.owner !== pass.owner) {
          return push({ kind: "error", title: "QR tidak cocok", detail: `Pemilik di QR berbeda dengan pemilik pass di kontrak.` });
        }
        if (pass.status === "USED") {
          const when = pass.checked_in_at
            ? new Date(Number(BigInt(pass.checked_in_at) / 1_000_000n)).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
            : "";
          return push({ kind: "warn", title: "Pass sudah dipakai", detail: `${pass.id} sudah discan${when ? ` pukul ${when}` : ""}.` });
        }

        try {
          await sendTransactions([checkInTx(pass.id)], { callbackUrl: window.location.href });
        } catch (err) {
          return push({ kind: "error", title: "Check-in ditolak", detail: explainChainError(err) });
        }
        push({
          kind: "success",
          title: "Silakan masuk",
          detail: `${pass.id} · +${pass.stamps} stempel untuk ${shortAccount(pass.owner)}`,
        });
        void refetchEvents();
      } catch (err) {
        push({ kind: "error", title: "Gagal membaca kontrak", detail: explainChainError(err) });
      } finally {
        busy.current = false;
      }
    },
    [activeEvent, sendTransactions, refetchEvents]
  );

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState("off");
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("error");
      setCameraError("Browser ini tidak mendukung kamera. Pakai input manual di samping.");
      return;
    }
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setCameraState("on");
    } catch (err) {
      const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setCameraState("error");
      setCameraError(
        denied
          ? "Izin kamera ditolak. Aktifkan izin kamera di browser, atau pakai input manual."
          : "Kamera tidak bisa dibuka. Pakai input manual di samping."
      );
    }
  }, []);

  // Loop baca frame: ~8 kali per detik sudah cukup untuk QR
  useEffect(() => {
    if (cameraState !== "on") return;
    let lastTick = 0;
    const tick = (t: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (t - lastTick < 120) return;
      lastTick = t;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      // Kecilkan frame supaya decode ringan
      const scale = Math.min(1, 640 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
      if (code?.data) void handleCode(code.data);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cameraState, handleCode]);

  // Matikan kamera saat halaman ditutup
  useEffect(() => stopCamera, [stopCamera]);

  if (!hydrated || isLoading) return <div className="min-h-screen" />;

  if (!activeEvent) {
    return (
      <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col items-center justify-center gap-5 text-center px-6">
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Belum ada event untuk discan.</h1>
        <p className="text-[#5C6157] max-w-md">Buat event dulu, atau minta penyelenggara menambahkan akunmu sebagai petugas scan.</p>
        <Link href="/organizer/create-event" className="px-8 py-3.5 rounded-full bg-[#9CFF1E] font-semibold">Buat event</Link>
      </main>
    );
  }

  const sold = activeEvent.sold;
  const inside = activeEvent.checkedIn;

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manual.trim()) return;
    void handleCode(manual);
    setManual("");
  };

  const LastIcon = last ? kindStyle[last.kind].icon : null;

  return (
    <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col">
      <section className="relative px-6 md:px-12 py-12 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-[1100px] mx-auto space-y-8">
          <div className="space-y-4">
            <Link href="/organizer" className="inline-flex items-center gap-1 text-sm text-[#5C6157] hover:text-[#141414]">
              <ChevronLeft className="w-4 h-4" /> Panel
            </Link>
            <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-[-0.04em] leading-none">Scan pintu masuk</h1>
          </div>

          {/* Pilih event */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEventId(e.id)}
                  className={cn(
                    "px-5 py-2.5 rounded-full border text-[13px] font-semibold transition-all",
                    e.id === activeEvent.id ? "bg-[#9CFF1E] border-[#9CFF1E]" : "border-[#141414]/15 hover:border-[#141414]/40"
                  )}
                >
                  {e.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
            {/* Kamera */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-[28px] overflow-hidden bg-[#07090a]">
                <video ref={videoRef} playsInline muted className={cn("absolute inset-0 w-full h-full object-cover", cameraState !== "on" && "hidden")} />
                <canvas ref={canvasRef} className="hidden" />

                {cameraState === "on" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-[58%] aspect-square">
                      {["top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl"].map((c) => (
                        <span key={c} className={cn("absolute w-10 h-10 border-[#9CFF1E]", c)} />
                      ))}
                    </div>
                  </div>
                )}

                {cameraState !== "on" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8 text-white">
                    {cameraState === "error" ? <CameraOff className="w-10 h-10 text-[#E5484D]" /> : <Camera className="w-10 h-10 text-[#9CFF1E]" />}
                    <p className="text-white/70 max-w-xs">
                      {cameraState === "error" && cameraError
                        ? cameraError
                        : cameraState === "starting"
                          ? "Membuka kamera…"
                          : "Nyalakan kamera lalu arahkan ke QR di ponsel pengunjung."}
                    </p>
                    {cameraState !== "starting" && (
                      <button
                        onClick={startCamera}
                        className="px-7 py-3 rounded-full text-[#141414] font-semibold"
                        style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
                      >
                        Nyalakan kamera
                      </button>
                    )}
                  </div>
                )}
              </div>

              {cameraState === "on" && (
                <button onClick={stopCamera} className="text-sm text-[#5C6157] hover:text-[#141414] underline underline-offset-4">
                  Matikan kamera
                </button>
              )}

              {/* Hasil terakhir */}
              <div
                aria-live="polite"
                className={cn(
                  "rounded-3xl border p-6 flex items-start gap-4 min-h-[104px]",
                  last ? kindStyle[last.kind].box : "border-dashed border-[#141414]/15 text-[#5C6157]"
                )}
              >
                {last && LastIcon ? (
                  <>
                    <LastIcon className="w-9 h-9 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-2xl font-bold tracking-[-0.02em] leading-tight">{last.title}</p>
                      <p className="text-sm opacity-80 break-words">{last.detail}</p>
                    </div>
                  </>
                ) : (
                  <p className="m-auto text-sm">Hasil scan muncul di sini.</p>
                )}
              </div>
            </div>

            {/* Samping */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-5 rounded-3xl bg-[#F5F8EE] border border-black/5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#5C6157]">Sudah masuk</p>
                  <p className="text-4xl font-extrabold tracking-[-0.03em]">{inside}</p>
                </div>
                <div className="p-5 rounded-3xl bg-[#F5F8EE] border border-black/5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#5C6157]">Pass terjual</p>
                  <p className="text-4xl font-extrabold tracking-[-0.03em]">{sold}</p>
                </div>
              </div>

              <form onSubmit={submitManual} className="p-5 rounded-3xl border border-black/10 space-y-3">
                <label className="flex items-center gap-2 text-[13px] font-semibold">
                  <Keyboard className="w-4 h-4" /> Input manual
                </label>
                <div className="flex gap-2">
                  <input
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    placeholder={`${activeEvent.code}-0001`}
                    className="flex-1 min-w-0 rounded-2xl border border-[#141414]/15 px-4 py-3 text-[15px] font-mono outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40"
                  />
                  <button type="submit" className="px-5 rounded-2xl bg-[#141414] text-white text-sm font-semibold hover:bg-[#9CFF1E] hover:text-[#141414] transition-colors">
                    Cek
                  </button>
                </div>
                <p className="text-xs text-[#5C6157]">Untuk pengunjung yang QR-nya tidak terbaca. Masukkan ID pass.</p>
              </form>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#5C6157]">Riwayat scan</p>
                {log.length === 0 ? (
                  <p className="text-sm text-[#5C6157]">Belum ada scan.</p>
                ) : (
                  <ul className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {log.map((l, i) => {
                      const Icon = kindStyle[l.kind].icon;
                      return (
                        <li key={l.at + "-" + i} className="flex items-start gap-3 text-sm">
                          <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", l.kind === "success" ? "text-[#3F7D00]" : l.kind === "warn" ? "text-[#B58100]" : "text-[#E5484D]")} />
                          <div className="min-w-0">
                            <p className="font-semibold leading-tight">{l.title}</p>
                            <p className="text-xs text-[#5C6157] break-words">{l.detail}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <p className="flex items-start gap-2 text-xs text-[#5C6157] max-w-2xl">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            Setiap scan membaca status pass dari kontrak NEAR lalu mencatat check-in on-chain, jadi pemindai bisa dipakai di perangkat mana pun dan satu pass tidak bisa dipakai dua kali. Hanya pemilik event atau petugas scan yang ditunjuk yang boleh check-in.
          </p>
        </div>
      </section>
    </main>
  );
}
