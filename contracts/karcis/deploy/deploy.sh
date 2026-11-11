#!/usr/bin/env bash
# Deploy kontrak Karcis ke NEAR testnet.
#
# Prasyarat:
#   1. near CLI (near-cli-rs) terpasang.
#   2. Akun ADMIN sudah dibuat dan kuncinya ada di keychain kamu:
#        near account create-account sponsor-by-faucet-service karcis.testnet autogenerate-new-keypair save-to-keychain network-config testnet create
#   3. wasm sudah di-build (WAJIB --cfg near, kalau tidak pesan error on-chain hilang):
#        RUSTFLAGS="--cfg near -C link-arg=-s" cargo build --target wasm32-unknown-unknown --release
#
# Catatan penting: akun KONTRAK harus BERBEDA dari TREASURY. Standar NEP-141 menolak transfer
# dari akun ke dirinya sendiri, jadi pembayaran ke treasury akan gagal kalau keduanya sama.
# Di sini: ADMIN = treasury = verifier, CONTRACT = subakun milik ADMIN.
set -euo pipefail

ADMIN="${ADMIN:-karcis.testnet}"
CONTRACT="${CONTRACT:-pass.karcis.testnet}"
TOKEN="${TOKEN:-usdc.fakes.testnet}"
MIN_PAID_PRICE="${MIN_PAID_PRICE:-500000}"   # 0,5 USDC (6 desimal)
CONTRACT_FUNDING="${CONTRACT_FUNDING:-4.2 NEAR}" # ~4 NEAR untuk kode + sisanya penyimpanan pass
WASM="${WASM:-target/wasm32-unknown-unknown/release/karcis.wasm}"

echo "== Saldo ADMIN ($ADMIN)"
near tokens "$ADMIN" view-near-balance network-config testnet now

echo "== 1. Buat subakun kontrak $CONTRACT (didanai $CONTRACT_FUNDING dari $ADMIN)"
near account create-account fund-myself "$CONTRACT" "$CONTRACT_FUNDING" \
  autogenerate-new-keypair save-to-keychain \
  sign-as "$ADMIN" network-config testnet sign-with-keychain send

echo "== 2. Deploy wasm + panggil new(...)"
near contract deploy "$CONTRACT" use-file "$WASM" \
  with-init-call new \
  json-args "{\"stable_token\":\"$TOKEN\",\"treasury\":\"$ADMIN\",\"verifier\":\"$ADMIN\",\"min_paid_price\":\"$MIN_PAID_PRICE\"}" \
  prepaid-gas '30 Tgas' attached-deposit '0 NEAR' \
  network-config testnet sign-with-keychain send

echo "== 3. Daftarkan treasury ($ADMIN) dan kontrak ($CONTRACT) di kontrak token $TOKEN"
for ACC in "$ADMIN" "$CONTRACT"; do
  near contract call-function as-transaction "$TOKEN" storage_deposit \
    json-args "{\"account_id\":\"$ACC\",\"registration_only\":true}" \
    prepaid-gas '30 Tgas' attached-deposit '0.00125 NEAR' \
    sign-as "$ADMIN" network-config testnet sign-with-keychain send
done

echo "== 4. Cek konfigurasi on-chain"
near contract call-function as-read-only "$CONTRACT" get_config json-args '{}' network-config testnet now

echo "Selesai. Kontrak: $CONTRACT"
