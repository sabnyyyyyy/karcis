/** Error dari chain/wallet dengan pesan yang sudah ramah pengguna */
export class ChainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChainError";
  }
}

const PANIC_PATTERNS = [
  /Smart contract panicked:\s*(.+?)(?:["\\\]}]|$)/,
  /GuestPanic\s*\{\s*panic_msg:\s*\\?"(.+?)\\?"\s*\}/,
  /panic_msg:\s*\\?"(.+?)\\?"/,
];

/**
 * Ambil pesan yang bisa dibaca dari error apa pun (RPC, wallet, kontrak).
 * Pesan panic dari kontrak sudah berbahasa Indonesia, jadi dikembalikan apa adanya.
 */
export function explainChainError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return String(error);
            }
          })();

  for (const re of PANIC_PATTERNS) {
    const m = raw.match(re);
    if (m?.[1]) return m[1].trim();
  }
  if (/User rejected|rejected the request|user closed|cancelled|canceled/i.test(raw)) return "Transaksi dibatalkan di wallet.";
  if (/does not have enough balance|NotEnoughBalance|LackBalanceForState/i.test(raw)) return "Saldo NEAR di wallet tidak cukup untuk biaya gas dan deposit.";
  if (/not registered|storage_deposit|The account .* is not registered/i.test(raw)) return "Akun belum terdaftar di kontrak token USDC.";
  if (/Failed to fetch|NetworkError|network/i.test(raw)) return "Tidak bisa menghubungi jaringan NEAR. Coba lagi sebentar.";
  if (/UnknownAccount|does not exist/i.test(raw)) return "Akun tidak ditemukan di jaringan.";
  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
}

/** Cek hasil eksekusi transaksi dari wallet; lempar ChainError jika ada langkah yang gagal */
export function assertOutcomeOk(outcomes: unknown) {
  const list = Array.isArray(outcomes) ? outcomes : [outcomes];
  for (const o of list) {
    if (!o || typeof o !== "object") continue;
    const text = JSON.stringify(o);
    if (text.includes('"Failure"')) throw new ChainError(explainChainError(text));
  }
}

/** Nilai kembalian (SuccessValue, JSON) dari hasil eksekusi transaksi; undefined jika tidak ada */
export function readSuccessValue(outcome: unknown): unknown {
  const o = (Array.isArray(outcome) ? outcome[outcome.length - 1] : outcome) as
    | { status?: { SuccessValue?: string } }
    | undefined;
  const b64 = o?.status?.SuccessValue;
  if (!b64) return undefined;
  try {
    return JSON.parse(atob(b64));
  } catch {
    return undefined;
  }
}
