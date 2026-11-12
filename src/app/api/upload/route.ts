import { put } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Unggah gambar event/lencana ke Vercel Blob dan kembalikan URL publiknya. */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "Penyimpanan gambar belum diaktifkan. Tempel link gambar saja untuk sementara." }, { status: 503 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  if (!file) return Response.json({ error: "File tidak ditemukan." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return Response.json({ error: "Format harus JPG, PNG, atau WebP." }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Ukuran maksimal 2 MB." }, { status: 413 });

  const blob = await put(`karcis/${crypto.randomUUID()}.${EXT[file.type]}`, file, {
    access: "public",
    contentType: file.type,
  });
  return Response.json({ url: blob.url });
}
