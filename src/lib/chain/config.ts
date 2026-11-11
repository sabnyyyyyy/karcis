/**
 * Konfigurasi jaringan NEAR dan kontrak Karcis.
 * Bisa diganti lewat env (.env.local), lihat .env.example.
 */
const network = process.env.NEXT_PUBLIC_NEAR_NETWORK === "mainnet" ? "mainnet" : "testnet";

export const CHAIN = {
  network,
  /** Kontrak Karcis (events, pass, kampanye, voting) */
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID ?? "pass.karcis.testnet",
  /** Kontrak stablecoin (NEP-141) yang dipakai untuk pembayaran */
  stableToken:
    process.env.NEXT_PUBLIC_STABLE_TOKEN ??
    (network === "mainnet" ? "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1" : "usdc.fakes.testnet"),
  stableSymbol: process.env.NEXT_PUBLIC_STABLE_SYMBOL ?? "USDC",
  stableDecimals: 6,
  rpcUrl:
    process.env.NEXT_PUBLIC_NEAR_RPC ??
    (network === "mainnet" ? "https://rpc.mainnet.fastnear.com" : "https://rpc.testnet.fastnear.com"),
  explorerUrl: network === "mainnet" ? "https://nearblocks.io" : "https://testnet.nearblocks.io",
  /** Kurs tampilan saja (bukan kurs pasar): berapa Rupiah untuk 1 USDC */
  idrPerUsd: Number(process.env.NEXT_PUBLIC_IDR_PER_USD ?? 16000),
} as const;

/** Gas (dalam satuan Tgas) untuk tiap jenis panggilan */
export const GAS = {
  default: 30,
  checkIn: 30,
  createEvent: 80,
  join: 60,
  claim: 90,
  /** ft_transfer_call: 100 Tgas terbukti kurang (pembelian dibatalkan), 150 dan 200 berhasil di testnet; 200 untuk margin (sisa gas dikembalikan) */
  payToken: 200,
} as const;

export const txUrl = (hash: string) => `${CHAIN.explorerUrl}/txns/${hash}`;
export const accountUrl = (id: string) => `${CHAIN.explorerUrl}/address/${id}`;
