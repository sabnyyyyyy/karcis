import type { Pass } from "@/types/pass";

const PREFIX = "karcis://pass/";
/** ID pass: kode event (3-8 huruf besar/angka) + nomor urut, mis. GIGS12-0042 */
const ID_RE = /^[A-Z0-9]{3,8}-\d{4,6}$/i;

/** Isi QR di pass: dibuat oleh pembeli, dibaca oleh pemindai penyelenggara */
export const buildPassPayload = (pass: Pick<Pass, "id" | "owner">) =>
  `${PREFIX}${pass.id}?owner=${encodeURIComponent(pass.owner)}`;

/** Menerima isi QR penuh atau ID pass saja (untuk input manual). Mengembalikan null jika bukan pass Karcis. */
export const parsePassPayload = (raw: string): { id: string; owner?: string } | null => {
  const text = raw.trim();
  if (ID_RE.test(text)) return { id: text.toUpperCase() };
  if (!text.startsWith(PREFIX)) return null;
  const rest = text.slice(PREFIX.length);
  const [id, query = ""] = rest.split("?");
  if (!ID_RE.test(id)) return null;
  const owner = new URLSearchParams(query).get("owner") ?? undefined;
  return { id: id.toUpperCase(), owner };
};
