import { CHAIN } from "./config";

/** Satuan terkecil token: 1 USDC = 1_000_000 unit (6 desimal) */
const UNIT = 10 ** CHAIN.stableDecimals;

const num = (v: number | string | bigint) => Number(v);

/** unit token -> angka USDC */
export const unitsToUsd = (units: number | string | bigint) => num(units) / UNIT;

/** angka USDC -> unit token, dibulatkan ke 0,01 USDC supaya harga rapi */
export const usdToUnits = (usd: number) => Math.round(usd * 100) * (UNIT / 100);

/** unit token -> Rupiah tampilan (kurs tetap, hanya perkiraan) */
export const unitsToIdr = (units: number | string | bigint) => unitsToUsd(units) * CHAIN.idrPerUsd;

/** Rupiah -> unit token (dibulatkan ke 0,01 USDC) */
export const idrToUnits = (idr: number) => usdToUnits(idr / CHAIN.idrPerUsd);

const idNumber = (n: number, digits: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** "3,13 USDC" */
export const fmtUsdc = (units: number | string | bigint) => {
  const usd = unitsToUsd(units);
  if (usd === 0) return `0 ${CHAIN.stableSymbol}`;
  const digits = usd < 0.01 ? 4 : 2;
  return `${idNumber(usd, digits)} ${CHAIN.stableSymbol}`;
};

/** "Rp50.000" (perkiraan, dibulatkan ke Rp100) */
export const fmtIdr = (units: number | string | bigint) => {
  const idr = Math.round(unitsToIdr(units) / 100) * 100;
  return `Rp${idr.toLocaleString("en-US")}`;
};

/** "3,13 USDC (≈ Rp50.000)" */
export const fmtPrice = (units: number | string | bigint) =>
  num(units) === 0 ? "Free" : `${fmtUsdc(units)} (≈ ${fmtIdr(units)})`;

/** Harga ringkas untuk kartu: "3,13 USDC" or "Gratis" */
export const fmtShort = (units: number | string | bigint) => (num(units) === 0 ? "Free" : fmtUsdc(units));

/** Nanodetik (string dari kontrak) -> milidetik */
export const nsToMs = (ns: string | number | bigint) => Number(BigInt(ns) / 1_000_000n);

/** Milidetik -> nanodetik (string, untuk U64 di JSON) */
export const msToNs = (ms: number) => (BigInt(Math.round(ms)) * 1_000_000n).toString();

export const nsToIso = (ns: string | number | bigint) => new Date(nsToMs(ns)).toISOString();

/** "0.05" NEAR -> yoctoNEAR (string) tanpa kehilangan presisi */
export const nearToYocto = (near: string | number) => {
  const [whole, frac = ""] = String(near).split(".");
  const padded = (frac + "0".repeat(24)).slice(0, 24);
  return (BigInt(whole || "0") * 10n ** 24n + BigInt(padded || "0")).toString();
};

/** yoctoNEAR -> teks NEAR ("0,0123 NEAR") */
export const fmtNear = (yocto: string | bigint) => {
  const n = Number(BigInt(yocto) / 10n ** 18n) / 1e6;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 4 })} NEAR`;
};

export const shortAccount = (id: string) => (id.length > 22 ? `${id.slice(0, 10)}…${id.slice(-8)}` : id);
