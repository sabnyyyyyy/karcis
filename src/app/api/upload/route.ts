import { put } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Unggah gambar event/lencana ke Vercel Blob dan kembalikan URL publiknya. */
export async function POST(request: Request) {
  // Di Vercel, SDK memakai BLOB_STORE_ID + OIDC; lokal bisa pakai BLOB_READ_WRITE_TOKEN.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return Response.json({ error: "Image storage isn't enabled yet. Paste an image link for now." }, { status: 503 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!file) return Response.json({ error: "File not found." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return Response.json({ error: "The format must be JPG, PNG, or WebP." }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Maximum size is 2 MB." }, { status: 413 });

  try {
    const blob = await put(`karcis/${crypto.randomUUID()}.${EXT[file.type]}`, file, {
      access: "public",
      contentType: file.type,
    });
    return Response.json({ url: blob.url });
  } catch (e) {
    console.error("upload gagal", e);
    return Response.json({ error: "Failed to save the image. Try again or paste an image link." }, { status: 502 });
  }
}
