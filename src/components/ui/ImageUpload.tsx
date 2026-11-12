"use client";

import React, { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_SIDE = 1600;

/** Perkecil gambar di browser supaya upload cepat dan di bawah batas server. */
async function shrink(file: File): Promise<Blob> {
  if (file.size <= 600 * 1024) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  return blob ?? file;
}

/**
 * Unggah gambar dari file. Hasilnya URL publik (disimpan di kontrak sebagai teks).
 * Kolom link tetap ada sebagai cadangan.
 */
export function ImageUpload({
  value,
  onChange,
  placeholder,
  fieldClass,
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder: string;
  fieldClass: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Format harus JPG, PNG, atau WebP.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      const small = await shrink(file);
      body.append("file", small, small.type === "image/jpeg" ? "image.jpg" : file.name);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Gagal mengunggah.");
      onChange(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-2xl overflow-hidden border border-[#141414]/10 bg-[#F5F8EE]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Pratinjau" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Hapus gambar"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-[#141414] flex items-center justify-center shadow"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-dashed border-[#141414]/30 px-5 py-3 text-sm font-semibold transition hover:border-[#9CFF1E] hover:bg-[#9CFF1E]/20",
          busy && "opacity-60 cursor-wait"
        )}
      >
        <ImagePlus className="w-4 h-4" />
        {busy ? "Mengunggah…" : value ? "Ganti file" : "Unggah file gambar"}
      </button>
      <span className="ml-3 text-xs text-[#5C6157]">JPG, PNG, atau WebP, maks 2 MB</span>

      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={fieldClass} />
      {error && <p className="text-xs text-[#E5484D]">{error}</p>}
    </div>
  );
}
