# Karcis: kontrak smart pass + kampanye promosi (NEAR)

Tiket event komunitas yang berubah jadi lencana permanen setelah discan di pintu masuk.
Setiap lencana menambah stempel di paspor pemiliknya. Penyelenggara juga bisa membuka
**kampanye promosi**: clipper (pembuat konten) dibayar per view video dan per tiket yang
terjual lewat link referral mereka.

Kode: [`src/lib.rs`](src/lib.rs). Tes: [`src/tests.rs`](src/tests.rs) (99 tes).

## Keputusan bisnis (dicatat)

| Hal | Keputusan |
|---|---|
| **Biaya platform** | **3,4%** dari harga tiket. Selalu ada, seluruhnya ke akun `treasury`. |
| **Biaya promosi** | **3,0%** dari harga tiket (2,0% dana clip + 1,0% dana referral). **Hanya jika event memakai kampanye**, di luar biaya platform. Tanpa kampanye tidak ada biaya promosi. |
| **Siapa menanggung biaya** | Pilihan penyelenggara per event: **pembeli** (biaya ditambahkan di atas harga) atau **penjual** (dipotong dari pendapatannya). |
| **Mata uang** | Stablecoin NEP-141 (USDC). Bukan NEAR. |
| **Deposit kampanye** | 10% dari anggaran promosi = kapasitas tiket × harga pass berbayar termurah × 3% × 10%. Tiket berbayar baru bisa dijual setelah deposit masuk. |
| **Pencairan hadiah** | Setelah event selesai (`settle_campaign`). Penerima mengambilnya lewat `claim_unclaimed`. |
| **Hadiah clip** | view ÷ 1.000.000 × tarif yang ditetapkan penyelenggara. |
| **Hadiah referral** | Nominal tetap per tiket terjual lewat link clipper. Self-referral diabaikan. |
| **Verifikasi view** | Akun `verifier` (Karcis) melaporkan view setelah event selesai. Kalau verifier tidak melapor dalam 14 hari, siapa pun boleh menyelesaikan kampanye (view dianggap 0, referral tetap dibayar). |
| **Dana kurang** | Semua hadiah dibayar **proporsional**. |
| **Sisa dana** | Sisa biaya promosi yang tidak terpakai ke `treasury`. Sisa deposit kembali ke penyelenggara. |
| **Harga minimum pass berbayar** | Diatur saat `new(...)` (rekomendasi 0,5 USDC), supaya biaya platform selalu menutup biaya penyimpanan pass. |
| **ID & nama NFT** | Diatur penyelenggara per event: **kode event** (3 sampai 8 huruf besar/angka, unik) jadi awalan ID pass `GIGS12-0001`; **nama NFT** (default judul event) tampil di wallet sebagai `Nama #0001 (Tiket)` lalu `(Lencana)` setelah discan; **gambar lencana** opsional menggantikan gambar tiket setelah discan. Nomor urut per event. |
| **Transfer pass** | Tidak ada (soulbound, anti-calo). |
| **Hak suara** | Minimal 3 stempel **dari event milik pembuat voting**, bukan stempel global. |

### Contoh: tiket Rp100.000

Dicetak oleh tes `price_breakdown_report` (`cargo test price_breakdown_report -- --nocapture`):

| | Biaya platform 3,4% | Biaya promosi | **Pembeli bayar** | **Penyelenggara terima** |
|---|---|---|---|---|
| Tanpa kampanye, **pembeli** menanggung | Rp3.400 | - | **Rp103.400** | Rp100.000 |
| Tanpa kampanye, **penjual** menanggung | Rp3.400 | - | **Rp100.000** | Rp96.600 |
| Dengan kampanye, **pembeli** menanggung | Rp3.400 | Rp3.000 (clip 2.000 + referral 1.000) | **Rp106.400** | Rp100.000 |
| Dengan kampanye, **penjual** menanggung | Rp3.400 | Rp3.000 (clip 2.000 + referral 1.000) | **Rp100.000** | Rp93.600 |

Saat tiket dibeli: penyelenggara dan `treasury` langsung dikirimi bagiannya; biaya promosi
**tidak keluar**, disimpan di kontrak sampai kampanye diselesaikan.

### Contoh anggaran kampanye

500 tiket × Rp100.000 × 3% = **Rp1.500.000** anggaran promosi. Penyelenggara setor deposit 10% = **Rp150.000**
di muka. Sisanya terkumpul dari biaya promosi seiring tiket terjual.

Catatan kecukupan dana: dana referral hanya Rp1.000 per tiket, sedangkan hadiah per tiket lewat link
misalnya Rp5.000. Dana referral baru cukup penuh jika sekitar 20% tiket terjual lewat link.
Lebih dari itu hadiah dibayar proporsional.

## Alur pembelian

```
pembeli ──ft_transfer_call(receiver=karcis, amount, msg)──▶ kontrak USDC
                                                               │ ft_on_transfer
                                                               ▼
                                                        kontrak Karcis
                                       cetak pass + bagi pembayaran
                                        ├─ ft_transfer ─▶ penyelenggara
                                        ├─ ft_transfer ─▶ treasury (3,4%)
                                        └─ biaya promosi ditahan di kontrak (jika kampanye)
```

`msg` beli: `{"event_id":"1","tier_id":"reguler","referrer":"clipper.testnet"}` (`referrer` opsional).
`msg` setor deposit kampanye: `{"action":"fund_campaign","event_id":"1"}`.

Kelebihan bayar dikembalikan otomatis oleh kontrak token. Jika kontrak Karcis menolak (panic),
seluruh pembayaran dikembalikan ke pembeli. Gunakan view `quote(event_id, tier_id)` untuk
mengetahui jumlah yang harus dikirim.

Pembayaran yang gagal dikirim (penerima belum terdaftar di kontrak token) tidak hilang: dicatat
di `unclaimed` dan diambil lewat `claim_unclaimed()`.

## Alur kampanye

1. Penyelenggara `create_event` dengan `campaign: { clip_rate_per_million, referral_reward }`, kapasitas, dan `ends_at`.
2. Penyelenggara setor deposit lewat `ft_transfer_call` (`fund_campaign`). Setelah itu tiket berbayar bisa dijual.
3. Clipper `join_campaign(event_id)` lalu `submit_clip(event_id, platform, url)` (maks 5 per peserta).
   Link referral clipper: `/events/<id>?ref=<akun clipper>`.
4. Pembeli membayar dengan `referrer` di `msg`. Penjualan dicatat jika `referrer` peserta kampanye dan bukan pembeli itu sendiri.
5. Event selesai. Verifier `report_views(event_id, [{clip_id, views}])`.
6. Siapa pun `settle_campaign(event_id)`. Hadiah, pengembalian deposit, dan sisa dana dicatat sebagai `unclaimed`.
7. Masing-masing `claim_unclaimed()`.

## Biaya penyimpanan (NEAR)

NEAR menarik 0,00001 NEAR per byte yang disimpan. Hasil ukur (`storage_cost_report`):

| Data | Ukuran | Biaya |
|---|---|---|
| Event normal | sekitar 890 byte | sekitar 0,009 NEAR |
| Event maksimal (semua kolom penuh) | 6.882 byte | 0,069 NEAR |
| Pass pertama pemilik | sekitar 173 byte | 0,0017 NEAR |
| Voting 6 pilihan | 394 byte | 0,0039 NEAR |

- `create_event`, `create_poll`, `join_campaign`, dan `submit_clip` memakai pola **storage deposit**: pemanggil membayar **tepat**
  sebesar byte yang dipakai (dihitung kontrak), kelebihan dikembalikan. Kontrak tidak nombok untuk spam.
- `create_event` dengan pass berbayar dan `join_campaign` menambah 0,00125 NEAR untuk mendaftarkan akun di kontrak
  stablecoin (supaya bisa menerima pembayaran).
- Penyimpanan pass berbayar ditanggung saldo kontrak (pembelian lewat `ft_transfer_call` hanya bisa melampirkan
  1 yoctoNEAR). Kontrak perlu didanai NEAR di awal.

## Fungsi

| Fungsi | Siapa | Keterangan |
|---|---|---|
| `new(stable_token, treasury, verifier, min_paid_price)` | deployer | Sekali. `treasury` harus sudah terdaftar di kontrak stablecoin. |
| `create_event(input)` | siapa saja (payable) | Pemanggil jadi pemilik. Kapasitas, `ends_at`, `fee_bearer`, **`code`**, `nft_name`, `badge_image`, kampanye opsional. |
| `add_scanner(event_id, account)` | pemilik event | Petugas scan tambahan (maks 20). |
| `ft_on_transfer(sender, amount, msg)` | kontrak stablecoin | Beli pass berbayar atau setor deposit kampanye. Jangan dipanggil manual. |
| `mint_free_pass(event_id, tier_id)` | siapa saja (payable 0,005 NEAR) | Pass gratis (tanpa biaya platform/promosi). |
| `check_in(pass_id)` | pemilik event / petugas | Tiket jadi lencana + stempel. |
| `join_campaign`, `submit_clip` | clipper (payable) | Ikut kampanye dan kirim tautan video. |
| `report_views(event_id, reports)` | verifier | Setelah event selesai. |
| `settle_campaign(event_id)` | siapa saja | Setelah event selesai dan view dilaporkan (atau 14 hari). |
| `claim_unclaimed()` | penerima | Ambil hadiah, pengembalian deposit, atau payout gagal. |
| `create_poll`, `close_poll`, `vote` | penyelenggara / pemegang stempel | Voting bintang tamu. |
| view: `get_config`, `quote`, `get_events`, `get_event`, `get_event_by_code`, `get_campaign`, `campaigns_joined_by`, `get_pass`, `passes_for_owner`, `stamps_of`, `stamps_with`, `get_polls`, `my_vote`, `unclaimed_of`, `nft_*` | siapa saja | |

Event log: `nft_mint` (NEP-171), serta `pass_minted`, `check_in`, `event_created`, `campaign_funded`, `campaign_joined`,
`campaign_settled`, `payout_failed` (standar `karcis`).

## Token stablecoin

| Jaringan | Token | Alamat | Desimal |
|---|---|---|---|
| testnet (demo) | Bridged USDC (USDC.e), punya fungsi `mint` | `usdc.fakes.testnet` | 6 |
| testnet | Circle USDC | `3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af` | 6 |
| mainnet | Circle USDC (native) | `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` | 6 |

Alamat dicek lewat RPC (`ft_metadata`) saat dokumen ini ditulis. Fungsi `mint` publik pada `usdc.fakes.testnet`
belum dicoba (baru terlihat ada).

## Build & tes

```bash
# Tes unit (Windows: workaround NASM untuk aws-lc-sys)
AWS_LC_SYS_PREBUILT_NASM=1 cargo test

# Rincian harga dan laporan biaya penyimpanan
AWS_LC_SYS_PREBUILT_NASM=1 cargo test price_breakdown_report -- --nocapture
AWS_LC_SYS_PREBUILT_NASM=1 cargo test storage_cost_report -- --nocapture

# Build wasm. WAJIB --cfg near (cargo-near memasangnya otomatis). Tanpa itu near-sdk memakai
# jalur "local" untuk panic, dan semua pesan error on-chain jadi "WasmTrap(Unreachable)".
RUSTFLAGS="--cfg near -C link-arg=-s" cargo build --target wasm32-unknown-unknown --release
```

## Deploy testnet

| | |
|---|---|
| Kontrak | `pass.karcis.testnet` (didanai 4,2 NEAR; kodenya menahan sekitar 4,0) |
| Admin / treasury / verifier | `karcis.testnet` |
| Token pembayaran | `usdc.fakes.testnet` (6 desimal, `mint` publik) |
| Harga minimum pass berbayar | 500000 (0,5 USDC) |

Skrip: [`deploy/deploy.sh`](deploy/deploy.sh). Update kode tanpa mengubah state:

```bash
near contract deploy pass.karcis.testnet use-file target/wasm32-unknown-unknown/release/karcis.wasm without-init-call network-config testnet sign-with-keychain send
```

### Hasil uji on-chain (testnet)

Dijalankan dengan akun uji `org.`, `buyer.`, `clip.karcis.testnet`. Tiket 10 USDC, pembeli menanggung biaya, ada kampanye:

| Cek | Hasil |
|---|---|
| `quote` | total 10,64 = 10,00 + platform 0,34 + promosi 0,30 (sesuai hitungan) |
| Danai kampanye dengan kelebihan | kelebihan 0,5 USDC dikembalikan; kontrak memegang 1,5 USDC deposit |
| ID & nama NFT (uji kedua) | event dibuat dengan kode `GIGS12`, nama NFT custom, dan gambar lencana. Pass jadi `GIGS12-0001`/`-0002`, judul `Gigs Basement: Malam Pembuka #0001 (Tiket)`. Setelah check-in judul jadi `(Lencana)` dan gambar berganti ke gambar lencana. Kode duplikat ditolak: `Kode event sudah dipakai` |
| Beli lewat link referral | penyelenggara +10,00, treasury +0,34, kontrak +0,30 (ditahan). Pass `KRC-000001` tercetak (event `nft_mint`) |
| Bayar kurang (10 dari 10,64) | ditolak, saldo pembeli tidak berubah |
| Check-in oleh penyelenggara | tiket jadi lencana, stempel pembeli 1 |
| Check-in kedua | ditolak: `Pass sudah dipakai` |
| `mint` di `usdc.fakes.testnet` | publik, bisa dipakai siapa saja |
| Settle sebelum view dilaporkan | ditolak: `Menunggu verifier melaporkan view` |
| `report_views` oleh non-verifier | ditolak: `Hanya verifier` |
| Verifier melaporkan 2.000.000 view | tercatat di clip |
| `settle_campaign` (oleh pembeli) | terutang 0,90 = view 0,60 + referral 0,30; dana 1,80 (0,30 biaya promosi + 1,50 deposit); sisa deposit 0,90 dikreditkan ke penyelenggara; treasury 0 |
| Settle kedua kali | ditolak: `Kampanye sudah diselesaikan` |
| `claim_unclaimed` clipper dan penyelenggara | clipper +0,90 USDC, penyelenggara +0,90 USDC; saldo USDC kontrak kembali 0 (semua dana terbagi) |

Temuan saat uji: build tanpa `--cfg near` membuat pesan error hilang (lihat di atas). Sudah diperbaiki dan di-deploy ulang.


## Keterbatasan yang diketahui

- **Verifier terpusat.** Kontrak tidak bisa membaca view TikTok/Instagram/YouTube. Angka view datang dari akun
  verifier. Ini keterbatasan MVP; jalur ke depan adalah oracle atau verifikasi otomatis di server.
- Sisa biaya promosi yang tidak terpakai masuk ke platform (`treasury`). Pembeli melihatnya sebagai biaya
  promosi, jadi tampilkan rincian ini dengan jelas di checkout.
- QR pass berisi ID dan akun pemilik, jadi bisa di-screenshot dan dipakai orang lain sebelum pemiliknya.
  Perbaikan penuh butuh QR dinamis atau tanda tangan NEP-413.
- Batas ukuran: 100 peserta dan 300 clip per kampanye (state disimpan sebagai satu entri).
- Belum ada pengembalian dana, pembatalan event, atau penutupan penjualan manual.
- Kontrak belum diaudit. Jangan dipakai dengan uang sungguhan tanpa audit.
