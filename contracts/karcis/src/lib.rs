//! Karcis: smart pass untuk event komunitas, dengan kampanye promosi (clipper + referral).
//!
//! Alur dasar:
//! 1. Penyelenggara `create_event` (membayar tepat biaya penyimpanan), menentukan kapasitas tiket,
//!    waktu selesai, siapa yang menanggung biaya layanan, dan (opsional) kampanye promosi.
//! 2. Pembeli membayar dengan **stablecoin** (NEP-141) lewat `ft_transfer_call` ke kontrak ini.
//!    Kontrak mencetak pass lalu membagi pembayaran.
//! 3. Di pintu masuk, penyelenggara/petugas `check_in`: tiket jadi lencana + stempel.
//! 4. Hak suara dihitung dari stempel di event milik pembuat voting.
//!
//! Dua jenis biaya, keduanya dihitung dari harga pass dan ditanggung pembeli (ditambahkan di atas
//! harga) atau penjual (dipotong dari pendapatannya), sesuai pilihan penyelenggara:
//! - **Biaya platform 3,4%**: selalu, seluruhnya ke platform (treasury).
//! - **Biaya promosi 3,0%**: hanya jika event memakai kampanye. 2,0% masuk dana clip dan 1,0% masuk
//!   dana referral (disimpan di kontrak sampai kampanye diselesaikan).
//! Tanpa kampanye tidak ada biaya promosi.
//!
//! Kampanye:
//! - Penyelenggara menyetor deposit 10% dari anggaran promosi (kapasitas × harga pass termurah × 3%).
//!   Tiket berbayar baru bisa dijual setelah deposit masuk.
//! - Clipper `join_campaign`, lalu `submit_clip` (tautan video). Pembelian lewat referral clipper
//!   dicatat; hadiah referral = `referral_reward` per tiket terjual.
//! - Setelah event selesai, verifier (akun Karcis) melaporkan view lewat `report_views`, lalu siapa
//!   pun bisa `settle_campaign`. Hadiah clip = view / 1.000.000 × tarif. Kalau dana kurang, semua
//!   hadiah dibayar proporsional. Sisa dana promosi ke treasury, sisa deposit balik ke penyelenggara.
//!
//! Pass bersifat soulbound (tanpa transfer). Pembayaran yang gagal dikirim dicatat di `unclaimed`
//! dan diambil lewat `claim_unclaimed` (hadiah kampanye juga dibayar lewat jalur ini).

use near_sdk::json_types::{U128, U64};
use near_sdk::serde_json::{self, json};
use near_sdk::store::{IterableMap, LookupMap};
use near_sdk::{
    env, ext_contract, near, require, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise,
    PromiseOrValue,
};

/// Biaya penyimpanan pass gratis yang ditahan kontrak (0.005 NEAR ≈ 500 byte)
const FREE_MINT_STORAGE_FEE: NearToken = NearToken::from_millinear(5);
/// Deposit registrasi akun di kontrak token (NEP-145, kebanyakan FT: 0.00125 NEAR)
const TOKEN_REGISTRATION_DEPOSIT: NearToken = NearToken::from_yoctonear(1_250_000_000_000_000_000_000);
/// Stempel minimum untuk ikut voting
pub const VOTE_MIN_STAMPS: u32 = 3;
const MAX_TIERS: usize = 6;
const MAX_STAMPS_PER_EVENT: u8 = 3;
const MAX_POLL_OPTIONS: usize = 6;
const MAX_SCANNERS: usize = 20;
const MAX_CAPACITY: u32 = 100_000;
const MAX_PARTICIPANTS: usize = 100;
const MAX_CLIPS: usize = 300;
const MAX_CLIPS_PER_PARTICIPANT: usize = 5;
/// Catatan kasus (laporan + tindakan admin) yang disimpan per penyelenggara
const MAX_CASES: usize = 100;

/// Biaya platform: 3,4% (340 basis point per 10.000), selalu, seluruhnya ke platform
pub const SERVICE_FEE_BPS: u128 = 340;
/// Biaya promosi (hanya jika ada kampanye), di luar biaya platform:
/// 2,0% untuk dana clip dan 1,0% untuk dana referral
pub const CLIP_POOL_BPS: u128 = 200;
pub const REFERRAL_POOL_BPS: u128 = 100;
/// Deposit penyelenggara = 10% dari anggaran promosi
pub const DEPOSIT_PERCENT: u128 = 10;
const BPS_DENOMINATOR: u128 = 10_000;
const VIEWS_PER_UNIT: u128 = 1_000_000;

const DAY_NS: u64 = 86_400_000_000_000;
/// Jika verifier tidak melapor, siapa pun boleh menyelesaikan kampanye setelah masa tunggu ini
const VERIFY_GRACE_NS: u64 = 14 * DAY_NS;

const GAS_FT_TRANSFER: Gas = Gas::from_tgas(30);
const GAS_CALLBACK: Gas = Gas::from_tgas(15);
const ONE_YOCTO: NearToken = NearToken::from_yoctonear(1);
const ZERO: NearToken = NearToken::from_yoctonear(0);

#[derive(BorshStorageKey)]
#[near(serializers = [borsh])]
enum StorageKey {
    Events,
    Passes,
    OwnerPasses,
    Organizers,
    Polls,
    Unclaimed,
    Campaigns,
    EventCodes,
    OrganizerRecords,
    Listings,
    Reissued,
}

/// Antarmuka kontrak token (NEP-141 + NEP-145) yang kita panggil
#[ext_contract(ext_ft)]
pub trait FungibleTokenExt {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
    fn storage_deposit(&mut self, account_id: Option<AccountId>, registration_only: Option<bool>);
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Tier {
    pub id: String,
    pub name: String,
    /// Harga dasar dalam satuan terkecil token stablecoin (USDC 6 desimal: 1_000_000 = 1 USDC).
    /// 0 berarti pass gratis.
    pub price: U128,
    pub perk: String,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct LineupItem {
    pub name: String,
    pub role: String,
    pub time: String,
}

/// Siapa yang menanggung biaya layanan 3,4%
#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub enum FeeBearer {
    /// Ditambahkan di atas harga yang dibayar pembeli
    Buyer,
    /// Dipotong dari pendapatan penyelenggara
    Seller,
}

/// Syarat kampanye promosi yang ditetapkan penyelenggara
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct CampaignTerms {
    /// Hadiah clip per 1.000.000 view (satuan terkecil token)
    pub clip_rate_per_million: U128,
    /// Hadiah per tiket yang terjual lewat link referral
    pub referral_reward: U128,
    /// Deposit yang harus disetor penyelenggara sebelum tiket berbayar bisa dijual
    pub deposit_required: U128,
    pub funded: bool,
    pub views_reported: bool,
    pub settled: bool,
}

#[near(serializers = [json])]
pub struct NewCampaign {
    pub clip_rate_per_million: U128,
    pub referral_reward: U128,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Event {
    pub id: String,
    /// Kode event: awalan ID pass, mis. "GIGS12". Unik antar event dan tidak bisa diubah.
    pub code: String,
    pub owner: AccountId,
    pub title: String,
    pub category: String,
    pub organizer_name: String,
    pub city: String,
    pub venue: String,
    pub address: String,
    pub date_label: String,
    pub date_full: String,
    pub time: String,
    pub image: String,
    pub description: String,
    pub lineup: Vec<LineupItem>,
    pub tiers: Vec<Tier>,
    /// Stempel yang didapat setiap pemegang pass yang hadir
    pub stamps: u8,
    /// Jumlah tiket yang dicetak (maksimal terjual)
    pub capacity: u32,
    /// Waktu event selesai (nanodetik sejak epoch). Pembelian ditutup dan kampanye bisa diselesaikan setelahnya.
    pub ends_at: U64,
    pub fee_bearer: FeeBearer,
    pub campaign: Option<CampaignTerms>,
    /// Petugas scan tambahan selain pemilik
    pub scanners: Vec<AccountId>,
    pub sold: u32,
    pub checked_in: u32,
    pub created_at: U64,
    /// Nama NFT yang tampil di wallet (judul event jika penyelenggara tidak mengisi)
    pub nft_name: String,
    /// Gambar NFT setelah pass discan jadi lencana (kosong = tetap pakai gambar event)
    pub badge_image: String,
}

/// Input `create_event`: pemilik, hitungan, dan waktu dibuat diisi kontrak
#[near(serializers = [json])]
pub struct NewEvent {
    pub title: String,
    pub category: String,
    pub organizer_name: String,
    pub city: String,
    pub venue: String,
    pub address: String,
    pub date_label: String,
    pub date_full: String,
    pub time: String,
    pub image: String,
    pub description: String,
    pub lineup: Vec<LineupItem>,
    pub tiers: Vec<Tier>,
    pub stamps: u8,
    pub capacity: u32,
    pub ends_at: U64,
    pub fee_bearer: FeeBearer,
    /// Kosongkan jika event tidak memakai kampanye
    pub campaign: Option<NewCampaign>,
    /// Kode event (3 sampai 8 huruf besar atau angka), jadi awalan ID pass: `GIGS12-0001`
    pub code: String,
    /// Nama NFT. Kosong = pakai judul event. Nomor urut dan status ditambahkan otomatis.
    pub nft_name: Option<String>,
    /// Gambar NFT untuk lencana (setelah discan). Kosong = pakai gambar event.
    pub badge_image: Option<String>,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub enum PassStatus {
    /// Tiket, belum discan
    Valid,
    /// Sudah discan: lencana permanen
    Used,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Pass {
    /// ID token: `{KODE EVENT}-{nomor urut per event}`, mis. `GIGS12-0042`
    pub id: String,
    pub event_id: String,
    pub tier_id: String,
    /// Nomor urut pass di event ini (mulai 1)
    pub serial: u32,
    pub owner: AccountId,
    pub status: PassStatus,
    pub stamps: u8,
    pub minted_at: U64,
    pub checked_in_at: Option<U64>,
    pub checked_in_by: Option<AccountId>,
}

#[near(serializers = [borsh])]
#[derive(Clone, Debug)]
pub struct Poll {
    pub id: String,
    pub creator: AccountId,
    pub organizer_name: String,
    pub question: String,
    pub options: Vec<String>,
    /// (akun, indeks pilihan). Satu akun satu suara.
    pub votes: Vec<(AccountId, u8)>,
    pub closed: bool,
    pub created_at: u64,
}

#[near(serializers = [json])]
pub struct PollView {
    pub id: String,
    pub creator: AccountId,
    pub organizer_name: String,
    pub question: String,
    pub options: Vec<String>,
    pub counts: Vec<u32>,
    pub total: u32,
    pub closed: bool,
    pub created_at: U64,
}

// ------------------------------------------------------------------
// Kampanye
// ------------------------------------------------------------------

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Clip {
    pub id: u32,
    pub clipper: AccountId,
    /// Mis. "tiktok", "instagram", "youtube"
    pub platform: String,
    pub url: String,
    /// Diisi verifier setelah event selesai
    pub views: Option<U64>,
}

#[near(serializers = [borsh])]
#[derive(Clone, Debug)]
pub struct CampaignState {
    /// Biaya promosi yang terkumpul untuk dana kampanye (2,0% + 1,0% dari harga tiap tiket)
    pub collected: u128,
    /// Deposit penyelenggara
    pub deposit: u128,
    pub participants: Vec<AccountId>,
    pub clips: Vec<Clip>,
    /// (clipper, jumlah tiket terjual lewat link-nya)
    pub referrals: Vec<(AccountId, u32)>,
}

#[near(serializers = [json])]
pub struct ReferralStat {
    pub account: AccountId,
    pub sales: u32,
}

#[near(serializers = [json])]
pub struct CampaignView {
    pub event_id: String,
    pub terms: CampaignTerms,
    pub collected: U128,
    pub deposit: U128,
    pub participants: Vec<AccountId>,
    pub clips: Vec<Clip>,
    pub referrals: Vec<ReferralStat>,
}

#[near(serializers = [json])]
pub struct ViewReport {
    pub clip_id: u32,
    pub views: U64,
}

/// Rincian harga satu tiket (semua dalam satuan terkecil token)
#[near(serializers = [json])]
pub struct Quote {
    /// Harga dasar tiket
    pub price: U128,
    /// Biaya platform 3,4% (ke treasury)
    pub platform_fee: U128,
    /// Biaya promosi 3,0% = dana clip + dana referral (0 jika tanpa kampanye)
    pub promo_fee: U128,
    pub clip_pool: U128,
    pub referral_pool: U128,
    /// Total yang harus dibayar pembeli
    pub total: U128,
    /// Yang diterima penyelenggara
    pub seller_receives: U128,
}

/// Isi `msg` pada `ft_transfer_call`
#[near(serializers = [json])]
pub struct TokenMessage {
    /// `"buy"` (default), `"fund_campaign"`, atau `"buy_resale"`
    pub action: Option<String>,
    #[serde(default)]
    pub event_id: String,
    /// Untuk `buy_resale`: id pass yang dibeli dari pasar tiket
    pub pass_id: Option<String>,
    pub tier_id: Option<String>,
    /// Akun clipper pemilik link referral
    pub referrer: Option<AccountId>,
}

#[near(serializers = [json])]
pub struct Config {
    pub stable_token: AccountId,
    pub treasury: AccountId,
    pub verifier: AccountId,
    pub admin: AccountId,
    pub service_fee_bps: u32,
    pub clip_pool_bps: u32,
    pub referral_pool_bps: u32,
    pub deposit_percent: u32,
    pub min_paid_price: U128,
    pub free_mint_storage_fee: U128,
    pub token_registration_deposit: U128,
}

// ---- NEP-171 / NEP-177 (view saja; tidak ada transfer) ----

#[near(serializers = [json])]
pub struct NftContractMetadata {
    pub spec: String,
    pub name: String,
    pub symbol: String,
    pub icon: Option<String>,
    pub base_uri: Option<String>,
    pub reference: Option<String>,
    pub reference_hash: Option<String>,
}

#[near(serializers = [json])]
pub struct TokenMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub media: Option<String>,
    pub issued_at: Option<String>,
    pub extra: Option<String>,
}

#[near(serializers = [json])]
pub struct NftToken {
    pub token_id: String,
    pub owner_id: AccountId,
    pub metadata: TokenMetadata,
}

/// Status penyelenggara di platform
#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub enum OrganizerStatus {
    /// Boleh membuat event, voting, dan menjual tiket
    Active,
    /// Ditangguhkan sementara: tidak bisa membuat event/voting dan penjualan tiketnya berhenti
    Suspended,
    /// Diblokir permanen kecuali dipulihkan admin: sama seperti ditangguhkan, ditambah check-in ditolak
    Banned,
}

/// Data diri penyelenggara yang diisi saat mendaftar (tidak bisa diubah, supaya jejaknya utuh)
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct OrganizerProfile {
    pub name: String,
    /// Mis. "komunitas", "kolektif", "venue", "individu"
    pub org_type: String,
    pub city: String,
    /// Kontak publik (Instagram, email, dsb.) supaya pembeli bisa menghubungi
    pub contact: String,
    pub description: String,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[serde(rename_all = "UPPERCASE")]
pub enum CaseKind {
    /// Laporan dari pemegang pass
    Report,
    Suspend,
    Ban,
    Reinstate,
    /// Penyelenggara mengubah profilnya (nilai lama dicatat di alasan)
    ProfileUpdate,
}

/// Satu catatan di riwayat kasus penyelenggara
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct CaseEntry {
    pub at: U64,
    pub kind: CaseKind,
    pub by: AccountId,
    pub reason: String,
}

#[near(serializers = [borsh])]
#[derive(Clone, Debug)]
pub struct OrganizerRecord {
    pub profile: OrganizerProfile,
    pub status: OrganizerStatus,
    pub registered_at: u64,
    pub status_changed_at: u64,
    pub cases: Vec<CaseEntry>,
}

#[near(serializers = [json])]
pub struct OrganizerView {
    pub account_id: AccountId,
    pub profile: OrganizerProfile,
    pub status: OrganizerStatus,
    pub registered_at: U64,
    pub status_changed_at: U64,
    /// Jumlah laporan dari pembeli
    pub reports: u32,
    pub cases: Vec<CaseEntry>,
}

/// Pass yang dijual ulang oleh pemiliknya (pasar tiket)
#[near(serializers = [borsh])]
#[derive(Clone, Debug)]
pub struct Listing {
    pub pass_id: String,
    pub seller: AccountId,
    /// Harga jual (satuan terkecil token), maksimal harga asli pass
    pub price: u128,
    pub listed_at: u64,
}

#[near(serializers = [json])]
pub struct ListingView {
    pub pass_id: String,
    pub event_id: String,
    pub tier_id: String,
    pub seller: AccountId,
    /// Harga yang dibayar pembeli
    pub price: U128,
    /// Harga asli pass (batas harga jual ulang)
    pub face_value: U128,
    /// Biaya platform 3,4% yang dipotong dari penjual
    pub platform_fee: U128,
    pub seller_receives: U128,
    pub listed_at: U64,
}

/// State versi sebelumnya (dengan registri penyelenggara, sebelum pasar tiket), dipakai `migrate`
#[near(serializers = [borsh])]
struct ContractV2 {
    events: IterableMap<String, Event>,
    passes: LookupMap<String, Pass>,
    owner_passes: LookupMap<AccountId, Vec<String>>,
    organizers: IterableMap<AccountId, OrganizerRecord>,
    polls: IterableMap<String, Poll>,
    campaigns: LookupMap<String, CampaignState>,
    event_codes: LookupMap<String, String>,
    unclaimed: LookupMap<AccountId, u128>,
    stable_token: AccountId,
    treasury: AccountId,
    verifier: AccountId,
    admin: AccountId,
    min_paid_price: u128,
    next_event: u64,
    next_pass: u64,
    next_poll: u64,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    events: IterableMap<String, Event>,
    passes: LookupMap<String, Pass>,
    owner_passes: LookupMap<AccountId, Vec<String>>,
    /// Registri penyelenggara (profil, status, riwayat kasus)
    organizers: IterableMap<AccountId, OrganizerRecord>,
    polls: IterableMap<String, Poll>,
    campaigns: LookupMap<String, CampaignState>,
    /// kode event -> id event (menjamin kode unik)
    event_codes: LookupMap<String, String>,
    /// Pembayaran stablecoin yang menunggu diklaim penerimanya (hadiah kampanye, sisa dana, payout gagal)
    unclaimed: LookupMap<AccountId, u128>,
    /// Kontrak stablecoin (NEP-141) yang diterima sebagai pembayaran
    stable_token: AccountId,
    /// Penerima bagian platform dari biaya layanan
    treasury: AccountId,
    /// Akun yang melaporkan jumlah view clip setelah event selesai
    verifier: AccountId,
    /// Pasar tiket: pass yang sedang dijual ulang, kunci = id pass
    listings: IterableMap<String, Listing>,
    /// event id -> jumlah pass yang sudah diterbitkan ulang lewat jual ulang (untuk nomor urut unik)
    reissued: LookupMap<String, u32>,
    /// Jumlah pass yang di-burn (diganti pass baru saat jual ulang)
    burned: u64,
    /// Admin platform: menangguhkan/memblokir/memulihkan penyelenggara
    admin: AccountId,
    /// Harga minimum untuk pass berbayar (satuan terkecil token)
    min_paid_price: u128,
    next_event: u64,
    next_pass: u64,
    next_poll: u64,
}

fn check_len(value: &str, max: usize, field: &str) {
    require!(value.len() <= max, format!("{field} terlalu panjang (maks {max} karakter)"));
}

/// Kode event: 3 sampai 8 karakter, hanya huruf besar A-Z dan angka 0-9
fn valid_code(code: &str) -> bool {
    (3..=8).contains(&code.len()) && code.bytes().all(|b| b.is_ascii_uppercase() || b.is_ascii_digit())
}

fn emit(event: &str, data: serde_json::Value) {
    env::log_str(&format!(
        "EVENT_JSON:{}",
        json!({ "standard": "karcis", "version": "1.0.0", "event": event, "data": data })
    ));
}

/// Tambah `amount` ke entri `account` (gabungkan jika sudah ada)
fn add_amount(list: &mut Vec<(AccountId, u128)>, account: &AccountId, amount: u128) {
    if amount == 0 {
        return;
    }
    if let Some(entry) = list.iter_mut().find(|(a, _)| a == account) {
        entry.1 += amount;
    } else {
        list.push((account.clone(), amount));
    }
}

/// Hitung rincian biaya untuk satu tiket
fn compute_quote(event: &Event, tier: &Tier) -> Quote {
    let price = tier.price.0;
    if price == 0 {
        return Quote {
            price: U128(0),
            platform_fee: U128(0),
            promo_fee: U128(0),
            clip_pool: U128(0),
            referral_pool: U128(0),
            total: U128(0),
            seller_receives: U128(0),
        };
    }
    let bps = |rate: u128| price.checked_mul(rate).unwrap_or_else(|| env::panic_str("Harga terlalu besar")) / BPS_DENOMINATOR;
    let platform_fee = bps(SERVICE_FEE_BPS);
    let (clip, referral) = if event.campaign.is_some() { (bps(CLIP_POOL_BPS), bps(REFERRAL_POOL_BPS)) } else { (0, 0) };
    let promo_fee = clip + referral;
    let all_fees = platform_fee + promo_fee;
    let (total, seller_receives) = match event.fee_bearer {
        FeeBearer::Buyer => (price + all_fees, price),
        FeeBearer::Seller => (price, price - all_fees),
    };
    Quote {
        price: U128(price),
        platform_fee: U128(platform_fee),
        promo_fee: U128(promo_fee),
        clip_pool: U128(clip),
        referral_pool: U128(referral),
        total: U128(total),
        seller_receives: U128(seller_receives),
    }
}

#[near]
impl Contract {
    /// `stable_token`: kontrak stablecoin yang diterima. `treasury`: penerima bagian platform
    /// (harus sudah terdaftar di kontrak token). `verifier`: akun pelapor view clip.
    /// `min_paid_price`: harga minimum pass berbayar (mis. 500000 = 0,5 USDC), supaya bagian
    /// platform dan biaya penyimpanan pass selalu tertutup.
    #[init]
    pub fn new(stable_token: AccountId, treasury: AccountId, verifier: AccountId, min_paid_price: U128) -> Self {
        // NEP-141 menolak transfer dari akun ke dirinya sendiri: pembayaran ke treasury akan gagal terus
        require!(
            treasury != env::current_account_id(),
            "Treasury tidak boleh sama dengan akun kontrak"
        );
        Self {
            events: IterableMap::new(StorageKey::Events),
            passes: LookupMap::new(StorageKey::Passes),
            owner_passes: LookupMap::new(StorageKey::OwnerPasses),
            organizers: IterableMap::new(StorageKey::OrganizerRecords),
            polls: IterableMap::new(StorageKey::Polls),
            campaigns: LookupMap::new(StorageKey::Campaigns),
            event_codes: LookupMap::new(StorageKey::EventCodes),
            unclaimed: LookupMap::new(StorageKey::Unclaimed),
            stable_token,
            treasury,
            listings: IterableMap::new(StorageKey::Listings),
            reissued: LookupMap::new(StorageKey::Reissued),
            burned: 0,
            admin: verifier.clone(),
            verifier,
            min_paid_price: min_paid_price.0,
            next_event: 0,
            next_pass: 0,
            next_poll: 0,
        }
    }

    // ------------------------------------------------------------------
    // Event
    // ------------------------------------------------------------------

    /// Buat event baru. Pemanggil menjadi pemilik, membayar tepat biaya penyimpanan event
    /// (+ deposit registrasi di kontrak token jika ada pass berbayar). Kelebihan deposit dikembalikan.
    #[payable]
    pub fn create_event(&mut self, input: NewEvent) -> Event {
        let storage_before = env::storage_usage();
        let owner = env::predecessor_account_id();

        self.require_active_organizer(&owner);
        require!(!input.title.trim().is_empty(), "Judul event wajib diisi");
        require!(!input.tiers.is_empty() && input.tiers.len() <= MAX_TIERS, "Event butuh 1 sampai 6 jenis pass");
        require!(
            input.stamps >= 1 && input.stamps <= MAX_STAMPS_PER_EVENT,
            "Stempel per event harus 1 sampai 3"
        );
        require!(input.capacity >= 1 && input.capacity <= MAX_CAPACITY, "Kapasitas tiket harus 1 sampai 100.000");
        require!(input.ends_at.0 > env::block_timestamp(), "Waktu selesai event harus di masa depan");
        check_len(&input.title, 120, "Judul");
        require!(valid_code(&input.code), "Kode event harus 3 sampai 8 huruf besar atau angka");
        require!(!self.event_codes.contains_key(&input.code), "Kode event sudah dipakai");
        let nft_name = input
            .nft_name
            .as_deref()
            .map(str::trim)
            .filter(|n| !n.is_empty())
            .map(str::to_string)
            .unwrap_or_else(|| input.title.clone());
        check_len(&nft_name, 120, "Nama NFT");
        let badge_image = input.badge_image.clone().unwrap_or_default();
        check_len(&badge_image, 500, "Gambar lencana");
        check_len(&input.description, 2000, "Deskripsi");
        check_len(&input.image, 500, "Link gambar");
        check_len(&input.organizer_name, 80, "Nama penyelenggara");
        check_len(&input.category, 20, "Kategori");
        check_len(&input.city, 60, "Kota");
        check_len(&input.venue, 120, "Tempat");
        check_len(&input.address, 200, "Alamat");
        check_len(&input.date_label, 30, "Label tanggal");
        check_len(&input.date_full, 50, "Tanggal");
        check_len(&input.time, 30, "Waktu");
        require!(input.lineup.len() <= 12, "Maksimal 12 susunan acara");
        for item in &input.lineup {
            check_len(&item.name, 80, "Nama pengisi acara");
            check_len(&item.role, 60, "Peran");
            check_len(&item.time, 20, "Jam");
        }
        let mut lowest_paid: Option<u128> = None;
        for (i, t) in input.tiers.iter().enumerate() {
            require!(!t.id.trim().is_empty() && !t.name.trim().is_empty(), "Pass butuh id dan nama");
            check_len(&t.id, 20, "ID pass");
            check_len(&t.name, 60, "Nama pass");
            check_len(&t.perk, 160, "Perk pass");
            require!(input.tiers.iter().skip(i + 1).all(|o| o.id != t.id), "ID pass harus unik");
            if t.price.0 > 0 {
                require!(t.price.0 >= self.min_paid_price, "Harga pass berbayar di bawah harga minimum");
                lowest_paid = Some(lowest_paid.map_or(t.price.0, |l| l.min(t.price.0)));
            }
        }
        let has_paid = lowest_paid.is_some();

        // Kampanye: butuh pass berbayar; deposit = 10% dari anggaran promosi (kapasitas × harga termurah × 3%)
        let campaign = match input.campaign {
            None => None,
            Some(c) => {
                let lowest = lowest_paid.unwrap_or_else(|| env::panic_str("Kampanye butuh minimal satu pass berbayar"));
                require!(c.clip_rate_per_million.0 > 0, "Tarif clip harus lebih dari 0");
                require!(c.referral_reward.0 > 0, "Hadiah referral harus lebih dari 0");
                require!(c.referral_reward.0 <= lowest, "Hadiah referral tidak boleh melebihi harga pass termurah");
                let budget = (input.capacity as u128)
                    .checked_mul(lowest)
                    .and_then(|v| v.checked_mul(CLIP_POOL_BPS + REFERRAL_POOL_BPS))
                    .unwrap_or_else(|| env::panic_str("Anggaran terlalu besar"))
                    / BPS_DENOMINATOR;
                Some(CampaignTerms {
                    clip_rate_per_million: c.clip_rate_per_million,
                    referral_reward: c.referral_reward,
                    deposit_required: U128(budget * DEPOSIT_PERCENT / 100),
                    funded: false,
                    views_reported: false,
                    settled: false,
                })
            }
        };

        self.next_event += 1;
        let id = self.next_event.to_string();
        let has_campaign = campaign.is_some();
        let code = input.code.clone();
        let event = Event {
            id: id.clone(),
            code: code.clone(),
            owner: owner.clone(),
            title: input.title,
            category: input.category,
            organizer_name: input.organizer_name,
            city: input.city,
            venue: input.venue,
            address: input.address,
            date_label: input.date_label,
            date_full: input.date_full,
            time: input.time,
            image: input.image,
            description: input.description,
            lineup: input.lineup,
            tiers: input.tiers,
            stamps: input.stamps,
            capacity: input.capacity,
            ends_at: input.ends_at,
            fee_bearer: input.fee_bearer,
            campaign,
            nft_name,
            badge_image,
            scanners: Vec::new(),
            sold: 0,
            checked_in: 0,
            created_at: U64(env::block_timestamp()),
        };
        self.events.insert(id.clone(), event.clone());
        self.event_codes.insert(code, id.clone());
        if has_campaign {
            self.campaigns.insert(
                id.clone(),
                CampaignState { collected: 0, deposit: 0, participants: vec![], clips: vec![], referrals: vec![] },
            );
        }
        // Tulis ke storage sekarang supaya ukurannya bisa dihitung
        self.events.flush();
        self.event_codes.flush();
        self.campaigns.flush();

        // Daftarkan pemilik di kontrak token supaya bisa menerima pembayaran
        let registration = if has_paid { TOKEN_REGISTRATION_DEPOSIT } else { ZERO };
        if has_paid {
            let _ = register_on_token(self.stable_token.clone(), registration, owner.clone());
        }
        Self::settle_storage(storage_before, owner, registration);
        emit("event_created", json!({ "event_id": id, "campaign": has_campaign }));
        event
    }

    /// Tambah akun petugas scan untuk event ini (hanya pemilik event)
    pub fn add_scanner(&mut self, event_id: String, account_id: AccountId) {
        let caller = env::predecessor_account_id();
        let event = self.events.get_mut(&event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
        require!(event.owner == caller, "Hanya pemilik event");
        require!(event.scanners.len() < MAX_SCANNERS, "Petugas scan sudah penuh");
        if !event.scanners.contains(&account_id) {
            event.scanners.push(account_id);
        }
    }

    // ------------------------------------------------------------------
    // Registri penyelenggara: pendaftaran, laporan, dan tindakan admin tercatat on-chain
    // ------------------------------------------------------------------

    /// Daftar sebagai penyelenggara. Wajib sebelum membuat event atau voting. Data diri dicatat
    /// permanen di sini supaya bisa dilacak jika ada kasus. Pendaftar membayar biaya penyimpanan
    /// (kelebihan deposit dikembalikan).
    #[payable]
    pub fn register_organizer(&mut self, profile: OrganizerProfile) -> OrganizerView {
        let storage_before = env::storage_usage();
        let who = env::predecessor_account_id();
        require!(!self.organizers.contains_key(&who), "Akun ini sudah terdaftar sebagai penyelenggara");
        let profile = Self::clean_profile(profile);
        let now = env::block_timestamp();
        let record = OrganizerRecord {
            profile,
            status: OrganizerStatus::Active,
            registered_at: now,
            status_changed_at: now,
            cases: Vec::new(),
        };
        let view = Self::organizer_view(&who, &record);
        self.organizers.insert(who.clone(), record);
        self.organizers.flush();
        Self::settle_storage(storage_before, who.clone(), ZERO);
        emit("organizer_registered", json!({ "account": who }));
        view
    }

    /// Laporkan penyelenggara. Hanya pemegang pass dari event milik penyelenggara itu, satu laporan
    /// per akun. Pelapor membayar biaya penyimpanan catatannya.
    #[payable]
    pub fn report_organizer(&mut self, organizer: AccountId, reason: String) {
        let storage_before = env::storage_usage();
        let reporter = env::predecessor_account_id();
        let reason = reason.trim().to_string();
        require!(reason.len() >= 10, "Alasan laporan minimal 10 karakter");
        check_len(&reason, 500, "Alasan");
        require!(reporter != organizer, "Tidak bisa melaporkan diri sendiri");
        require!(
            self.has_pass_from(&reporter, &organizer),
            "Hanya pemegang pass dari event penyelenggara ini yang bisa melapor"
        );
        let now = env::block_timestamp();
        let record = self
            .organizers
            .get_mut(&organizer)
            .unwrap_or_else(|| env::panic_str("Penyelenggara tidak terdaftar"));
        require!(
            !record.cases.iter().any(|c| c.kind == CaseKind::Report && c.by == reporter),
            "Kamu sudah melaporkan penyelenggara ini"
        );
        require!(record.cases.len() < MAX_CASES, "Catatan kasus penyelenggara ini sudah penuh");
        record.cases.push(CaseEntry { at: U64(now), kind: CaseKind::Report, by: reporter.clone(), reason });
        self.organizers.flush();
        Self::settle_storage(storage_before, reporter.clone(), ZERO);
        emit("organizer_reported", json!({ "organizer": organizer, "reporter": reporter }));
    }

    /// Ubah profil (mis. pindah kota). Nilai lama dicatat di riwayat kasus, jadi perubahan tetap
    /// bisa dilacak. Pengubah membayar penyimpanan catatannya. Akun yang diblokir tidak bisa mengubah.
    #[payable]
    pub fn update_organizer_profile(&mut self, profile: OrganizerProfile) -> OrganizerView {
        let storage_before = env::storage_usage();
        let who = env::predecessor_account_id();
        let profile = Self::clean_profile(profile);
        let now = env::block_timestamp();
        let record = self
            .organizers
            .get_mut(&who)
            .unwrap_or_else(|| env::panic_str("Penyelenggara tidak terdaftar"));
        require!(record.status != OrganizerStatus::Banned, "Akun yang diblokir tidak bisa mengubah profil");
        require!(record.cases.len() < MAX_CASES, "Catatan kasus penyelenggara ini sudah penuh");

        let old = &record.profile;
        let mut changes: Vec<String> = Vec::new();
        if old.name != profile.name {
            changes.push(format!("nama: {} -> {}", old.name, profile.name));
        }
        if old.org_type != profile.org_type {
            changes.push(format!("jenis: {} -> {}", old.org_type, profile.org_type));
        }
        if old.city != profile.city {
            changes.push(format!("kota: {} -> {}", old.city, profile.city));
        }
        if old.contact != profile.contact {
            changes.push(format!("kontak: {} -> {}", old.contact, profile.contact));
        }
        if old.description != profile.description {
            changes.push("deskripsi diubah".to_string());
        }
        require!(!changes.is_empty(), "Tidak ada perubahan");
        let mut summary = changes.join("; ");
        if summary.len() > 500 {
            let mut cut = 500;
            while !summary.is_char_boundary(cut) {
                cut -= 1;
            }
            summary.truncate(cut);
        }

        record.profile = profile;
        record.cases.push(CaseEntry { at: U64(now), kind: CaseKind::ProfileUpdate, by: who.clone(), reason: summary });
        let view = Self::organizer_view(&who, record);
        self.organizers.flush();
        Self::settle_storage(storage_before, who.clone(), ZERO);
        emit("organizer_updated", json!({ "account": who }));
        view
    }

    /// Admin: tangguhkan penyelenggara (penjualan tiketnya berhenti, tidak bisa buat event/voting)
    #[payable]
    pub fn suspend_organizer(&mut self, organizer: AccountId, reason: String) {
        self.apply_status(organizer, OrganizerStatus::Suspended, CaseKind::Suspend, reason);
    }

    /// Admin: blokir penyelenggara (seperti ditangguhkan, ditambah check-in event-nya ditolak)
    #[payable]
    pub fn ban_organizer(&mut self, organizer: AccountId, reason: String) {
        self.apply_status(organizer, OrganizerStatus::Banned, CaseKind::Ban, reason);
    }

    /// Admin: pulihkan penyelenggara yang ditangguhkan/diblokir
    #[payable]
    pub fn reinstate_organizer(&mut self, organizer: AccountId, reason: String) {
        self.apply_status(organizer, OrganizerStatus::Active, CaseKind::Reinstate, reason);
    }

    /// Admin: serahkan peran admin ke akun lain
    pub fn set_admin(&mut self, new_admin: AccountId) {
        require!(env::predecessor_account_id() == self.admin, "Hanya admin");
        self.admin = new_admin.clone();
        emit("admin_changed", json!({ "admin": new_admin }));
    }

    /// Migrasi dari state sebelum pasar tiket. Hanya akun kontrak sendiri; semua data lama dipertahankan.
    #[private]
    #[init(ignore_state)]
    pub fn migrate() -> Self {
        let old: ContractV2 = env::state_read().unwrap_or_else(|| env::panic_str("State lama tidak ditemukan"));
        Self {
            events: old.events,
            passes: old.passes,
            owner_passes: old.owner_passes,
            organizers: old.organizers,
            polls: old.polls,
            campaigns: old.campaigns,
            event_codes: old.event_codes,
            unclaimed: old.unclaimed,
            stable_token: old.stable_token,
            treasury: old.treasury,
            verifier: old.verifier,
            listings: IterableMap::new(StorageKey::Listings),
            reissued: LookupMap::new(StorageKey::Reissued),
            burned: 0,
            admin: old.admin,
            min_paid_price: old.min_paid_price,
            next_event: old.next_event,
            next_pass: old.next_pass,
            next_poll: old.next_poll,
        }
    }

    // ------------------------------------------------------------------
    // Pasar tiket: jual ulang pass yang tidak jadi dipakai
    // ------------------------------------------------------------------

    /// Jual pass yang belum dipakai. Harga maksimal harga asli pass (anti calo). Saat ada yang membeli,
    /// pass lama di-burn dan pembeli menerima pass baru; penjual menerima harga dikurangi biaya platform 3,4%.
    /// Penjual membayar tepat biaya penyimpanan listing (kelebihan dikembalikan).
    #[payable]
    pub fn list_pass_for_resale(&mut self, pass_id: String, price: U128) -> ListingView {
        let storage_before = env::storage_usage();
        let seller = env::predecessor_account_id();
        let pass = self.passes.get(&pass_id).unwrap_or_else(|| env::panic_str("Pass tidak ditemukan")).clone();
        require!(pass.owner == seller, "Hanya pemilik pass yang bisa menjualnya");
        require!(pass.status == PassStatus::Valid, "Pass yang sudah dipakai tidak bisa dijual");
        require!(!self.listings.contains_key(&pass_id), "Pass ini sudah dijual");
        let (event_owner, ends_at, face) = {
            let event = self.events.get(&pass.event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
            let tier = event
                .tiers
                .iter()
                .find(|t| t.id == pass.tier_id)
                .unwrap_or_else(|| env::panic_str("Jenis pass tidak ditemukan"));
            (event.owner.clone(), event.ends_at.0, tier.price.0)
        };
        require!(env::block_timestamp() < ends_at, "Event sudah selesai, pass tidak bisa dijual");
        require!(face > 0, "Pass gratis tidak bisa dijual ulang");
        require!(
            self.status_of(&event_owner) == OrganizerStatus::Active,
            "Penjualan dihentikan: penyelenggara event ini sedang ditangguhkan"
        );
        require!(price.0 >= self.min_paid_price, "Harga jual di bawah harga minimum");
        require!(price.0 <= face, "Harga jual ulang tidak boleh melebihi harga asli pass");

        let listing = Listing { pass_id: pass_id.clone(), seller: seller.clone(), price: price.0, listed_at: env::block_timestamp() };
        let view = Self::listing_view(&listing, &pass, face);
        self.listings.insert(pass_id.clone(), listing);
        self.listings.flush();
        Self::settle_storage(storage_before, seller.clone(), ZERO);
        emit("pass_listed", json!({ "pass_id": pass_id, "seller": seller, "price": price }));
        view
    }

    /// Batalkan penjualan (hanya penjual)
    pub fn cancel_resale(&mut self, pass_id: String) {
        let caller = env::predecessor_account_id();
        let listing = self.listings.get(&pass_id).unwrap_or_else(|| env::panic_str("Pass ini tidak sedang dijual"));
        require!(listing.seller == caller, "Hanya penjual yang bisa membatalkan");
        self.listings.remove(&pass_id);
        emit("pass_unlisted", json!({ "pass_id": pass_id, "seller": caller }));
    }

    // ------------------------------------------------------------------
    // Pembayaran masuk (stablecoin): beli pass atau setor deposit kampanye
    // ------------------------------------------------------------------

    /// Dipanggil kontrak stablecoin saat seseorang `ft_transfer_call` ke kontrak ini.
    /// `msg` untuk beli: `{"event_id":"1","tier_id":"reguler","referrer":"clipper.testnet"}`.
    /// `msg` untuk setor deposit: `{"action":"fund_campaign","event_id":"1"}`.
    ///
    /// Jika di sini terjadi panic, kontrak token mengembalikan seluruh pembayaran ke pengirim.
    /// Mengembalikan jumlah yang TIDAK terpakai (kelebihan bayar), sesuai standar NEP-141.
    pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> PromiseOrValue<U128> {
        require!(env::predecessor_account_id() == self.stable_token, "Token pembayaran tidak diterima");
        let m: TokenMessage =
            serde_json::from_str(&msg).unwrap_or_else(|_| env::panic_str("Format pesan pembayaran salah"));
        let unused = match m.action.as_deref() {
            None | Some("buy") => self.buy(sender_id, amount.0, m),
            Some("fund_campaign") => self.fund_campaign(sender_id, amount.0, m.event_id),
            Some("buy_resale") => self.buy_resale(sender_id, amount.0, m),
            Some(_) => env::panic_str("Aksi pembayaran tidak dikenal"),
        };
        PromiseOrValue::Value(U128(unused))
    }

    /// Ambil pass gratis. Bayar biaya penyimpanan 0.005 NEAR (kelebihan dikembalikan).
    #[payable]
    pub fn mint_free_pass(&mut self, event_id: String, tier_id: String) -> Pass {
        let buyer = env::predecessor_account_id();
        let deposit = env::attached_deposit();
        {
            let event = self.events.get(&event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
            let tier = event
                .tiers
                .iter()
                .find(|t| t.id == tier_id)
                .unwrap_or_else(|| env::panic_str("Jenis pass tidak ditemukan"));
            require!(tier.price.0 == 0, "Pass ini berbayar, bayar dengan stablecoin");
        }
        require!(
            deposit >= FREE_MINT_STORAGE_FEE,
            format!("Deposit kurang. Dibutuhkan {} yoctoNEAR", FREE_MINT_STORAGE_FEE.as_yoctonear())
        );
        let pass = self.create_pass(buyer.clone(), &event_id, &tier_id);
        let refund = deposit.saturating_sub(FREE_MINT_STORAGE_FEE);
        if refund > ZERO {
            let _ = Promise::new(buyer).transfer(refund);
        }
        pass
    }

    /// Scan di pintu masuk: tiket jadi lencana + stempel. Hanya pemilik event atau petugasnya.
    pub fn check_in(&mut self, pass_id: String) -> Pass {
        let caller = env::predecessor_account_id();
        let current = self
            .passes
            .get(&pass_id)
            .unwrap_or_else(|| env::panic_str("Pass tidak ditemukan"))
            .clone();

        {
            let event = self
                .events
                .get_mut(&current.event_id)
                .unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
            require!(
                event.owner == caller || event.scanners.contains(&caller),
                "Hanya penyelenggara atau petugas scan event ini"
            );
            require!(
                self.organizers.get(&event.owner).map(|r| r.status != OrganizerStatus::Banned).unwrap_or(true),
                "Penyelenggara event ini diblokir, check-in ditolak"
            );
            require!(current.status == PassStatus::Valid, "Pass sudah dipakai");
            event.checked_in += 1;
        }

        let updated = Pass {
            status: PassStatus::Used,
            checked_in_at: Some(U64(env::block_timestamp())),
            checked_in_by: Some(caller),
            ..current
        };
        self.passes.insert(pass_id.clone(), updated.clone());
        // Pass yang dipakai masuk tidak boleh lagi dijual
        self.listings.remove(&pass_id);
        emit("check_in", json!({ "pass_id": pass_id, "owner": updated.owner, "stamps": updated.stamps }));
        updated
    }

    // ------------------------------------------------------------------
    // Kampanye promosi
    // ------------------------------------------------------------------

    /// Ikut kampanye sebagai clipper. Mendapat link referral (`?ref=<akunmu>`).
    /// Bayar tepat biaya penyimpanan + deposit registrasi di kontrak token (supaya bisa menerima hadiah).
    #[payable]
    pub fn join_campaign(&mut self, event_id: String) {
        let storage_before = env::storage_usage();
        let who = env::predecessor_account_id();
        let event = self.events.get(&event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
        let terms = event.campaign.as_ref().unwrap_or_else(|| env::panic_str("Event ini tidak punya kampanye"));
        require!(terms.funded, "Kampanye belum didanai penyelenggara");
        require!(!terms.settled, "Kampanye sudah diselesaikan");
        require!(env::block_timestamp() < event.ends_at.0, "Event sudah selesai");
        require!(event.owner != who, "Penyelenggara tidak bisa ikut kampanyenya sendiri");

        let state = self.campaigns.get_mut(&event_id).unwrap_or_else(|| env::panic_str("Kampanye tidak ditemukan"));
        require!(!state.participants.contains(&who), "Sudah ikut kampanye ini");
        require!(state.participants.len() < MAX_PARTICIPANTS, "Peserta kampanye sudah penuh");
        state.participants.push(who.clone());
        self.campaigns.flush();

        let _ = register_on_token(self.stable_token.clone(), TOKEN_REGISTRATION_DEPOSIT, who.clone());
        Self::settle_storage(storage_before, who.clone(), TOKEN_REGISTRATION_DEPOSIT);
        emit("campaign_joined", json!({ "event_id": event_id, "clipper": who }));
    }

    /// Kirim tautan video untuk dinilai. Hanya peserta, sebelum event selesai (maks 5 per peserta).
    #[payable]
    pub fn submit_clip(&mut self, event_id: String, platform: String, url: String) -> Clip {
        let storage_before = env::storage_usage();
        let who = env::predecessor_account_id();
        check_len(&platform, 20, "Platform");
        check_len(&url, 300, "Tautan");
        require!(!platform.trim().is_empty() && url.starts_with("http"), "Platform dan tautan video wajib diisi");

        let ends_at = self.events.get(&event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan")).ends_at.0;
        require!(env::block_timestamp() < ends_at, "Event sudah selesai");
        let state = self.campaigns.get_mut(&event_id).unwrap_or_else(|| env::panic_str("Kampanye tidak ditemukan"));
        require!(state.participants.contains(&who), "Ikut kampanye dulu sebelum mengirim clip");
        require!(state.clips.len() < MAX_CLIPS, "Jumlah clip kampanye sudah penuh");
        require!(
            state.clips.iter().filter(|c| c.clipper == who).count() < MAX_CLIPS_PER_PARTICIPANT,
            "Maksimal 5 clip per peserta"
        );
        require!(!state.clips.iter().any(|c| c.url == url), "Tautan ini sudah dikirim");
        let clip = Clip { id: state.clips.len() as u32 + 1, clipper: who, platform, url, views: None };
        state.clips.push(clip.clone());
        self.campaigns.flush();

        Self::settle_storage(storage_before, clip.clipper.clone(), ZERO);
        clip
    }

    /// Verifier melaporkan jumlah view tiap clip setelah event selesai.
    /// Boleh dipanggil ulang sampai kampanye diselesaikan.
    pub fn report_views(&mut self, event_id: String, reports: Vec<ViewReport>) {
        require!(env::predecessor_account_id() == self.verifier, "Hanya verifier");
        let event = self.events.get_mut(&event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
        require!(env::block_timestamp() >= event.ends_at.0, "Event belum selesai");
        let terms = event.campaign.as_mut().unwrap_or_else(|| env::panic_str("Event ini tidak punya kampanye"));
        require!(terms.funded && !terms.settled, "Kampanye tidak bisa dilaporkan");
        terms.views_reported = true;

        let state = self.campaigns.get_mut(&event_id).unwrap_or_else(|| env::panic_str("Kampanye tidak ditemukan"));
        for r in reports {
            let clip = state
                .clips
                .iter_mut()
                .find(|c| c.id == r.clip_id)
                .unwrap_or_else(|| env::panic_str("Clip tidak ditemukan"));
            clip.views = Some(r.views);
        }
    }

    /// Selesaikan kampanye setelah event selesai dan view dilaporkan (atau masa tunggu 14 hari lewat).
    /// Siapa pun boleh memanggil. Hadiah, sisa dana, dan pengembalian deposit dicatat sebagai
    /// `unclaimed` dan diambil masing-masing lewat `claim_unclaimed`.
    pub fn settle_campaign(&mut self, event_id: String) {
        let now = env::block_timestamp();
        let (owner, ends_at, terms) = {
            let e = self.events.get(&event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
            (e.owner.clone(), e.ends_at.0, e.campaign.clone().unwrap_or_else(|| env::panic_str("Event ini tidak punya kampanye")))
        };
        require!(terms.funded, "Kampanye belum didanai");
        require!(!terms.settled, "Kampanye sudah diselesaikan");
        require!(now >= ends_at, "Event belum selesai");
        require!(
            terms.views_reported || now >= ends_at + VERIFY_GRACE_NS,
            "Menunggu verifier melaporkan view"
        );

        let state = self.campaigns.get(&event_id).unwrap_or_else(|| env::panic_str("Kampanye tidak ditemukan")).clone();
        let rate = terms.clip_rate_per_million.0;
        let reward = terms.referral_reward.0;

        // Hadiah terutang per akun
        let mut owed: Vec<(AccountId, u128)> = Vec::new();
        for clip in &state.clips {
            if let Some(v) = clip.views {
                add_amount(&mut owed, &clip.clipper, (v.0 as u128) * rate / VIEWS_PER_UNIT);
            }
        }
        for (account, sales) in &state.referrals {
            add_amount(&mut owed, account, (*sales as u128) * reward);
        }
        let total_owed: u128 = owed.iter().map(|(_, a)| a).sum();
        let pool = state.collected + state.deposit;

        let mut deposit_refund = 0u128;
        let mut to_treasury = 0u128;
        let mut payouts: Vec<(AccountId, u128)> = Vec::new();
        if total_owed <= state.collected {
            payouts = owed;
            deposit_refund = state.deposit;
            to_treasury = state.collected - total_owed;
        } else if total_owed <= pool {
            payouts = owed;
            deposit_refund = pool - total_owed; // dana biaya layanan habis terpakai, sisanya dari deposit
        } else {
            // Dana kurang: semua hadiah dibayar proporsional
            let mut paid = 0u128;
            for (account, amount) in owed {
                let part = amount * pool / total_owed;
                paid += part;
                payouts.push((account, part));
            }
            to_treasury = pool - paid; // sisa pembulatan
        }

        for (account, amount) in payouts {
            self.credit(&account, amount);
        }
        self.credit(&owner, deposit_refund);
        self.credit(&self.treasury.clone(), to_treasury);

        if let Some(e) = self.events.get_mut(&event_id) {
            if let Some(c) = e.campaign.as_mut() {
                c.settled = true;
            }
        }
        if let Some(st) = self.campaigns.get_mut(&event_id) {
            st.collected = 0;
            st.deposit = 0;
        }
        emit(
            "campaign_settled",
            json!({
                "event_id": event_id,
                "total_owed": U128(total_owed),
                "pool": U128(pool),
                "deposit_refund": U128(deposit_refund),
                "to_treasury": U128(to_treasury)
            }),
        );
    }

    // ------------------------------------------------------------------
    // Pembayaran yang tertahan / gagal terkirim
    // ------------------------------------------------------------------

    /// Callback setelah `ft_transfer` payout. Jika gagal (mis. penerima belum terdaftar di
    /// kontrak token), jumlahnya dicatat supaya bisa diklaim nanti.
    #[private]
    pub fn on_payout(&mut self, to: AccountId, amount: U128) {
        if env::promise_result_checked(0, 1024).is_err() {
            self.credit(&to, amount.0);
            emit("payout_failed", json!({ "to": to, "amount": amount }));
        }
    }

    /// Ambil pembayaran yang tertahan (hadiah kampanye, pengembalian deposit, payout yang gagal).
    /// Pastikan akunmu sudah terdaftar di kontrak token.
    pub fn claim_unclaimed(&mut self) -> Promise {
        let who = env::predecessor_account_id();
        let amount = self.unclaimed.remove(&who).unwrap_or(0);
        require!(amount > 0, "Tidak ada pembayaran yang tertahan");
        self.pay_out(who, amount)
    }

    // ------------------------------------------------------------------
    // Voting (hanya pemegang stempel cukup)
    // ------------------------------------------------------------------

    /// Buat voting bintang tamu. Hanya akun yang pernah membuat event.
    /// Pembuat membayar tepat sebesar biaya penyimpanan voting.
    #[payable]
    pub fn create_poll(&mut self, question: String, options: Vec<String>) -> PollView {
        let storage_before = env::storage_usage();
        let creator = env::predecessor_account_id();
        self.require_active_organizer(&creator);
        let question = question.trim().to_string();
        require!(!question.is_empty(), "Pertanyaan wajib diisi");
        check_len(&question, 200, "Pertanyaan");
        let options: Vec<String> = options.into_iter().map(|o| o.trim().to_string()).filter(|o| !o.is_empty()).collect();
        require!(options.len() >= 2 && options.len() <= MAX_POLL_OPTIONS, "Voting butuh 2 sampai 6 pilihan");
        for o in &options {
            check_len(o, 80, "Pilihan");
        }

        let organizer_name = self
            .events
            .values()
            .find(|e| e.owner == creator)
            .map(|e| e.organizer_name.clone())
            .unwrap_or_default();

        self.next_poll += 1;
        let id = self.next_poll.to_string();
        let poll = Poll {
            id: id.clone(),
            creator: creator.clone(),
            organizer_name,
            question,
            options,
            votes: Vec::new(),
            closed: false,
            created_at: env::block_timestamp(),
        };
        let view = Self::poll_view(&poll);
        self.polls.insert(id, poll);
        self.polls.flush();
        Self::settle_storage(storage_before, creator, ZERO);
        view
    }

    /// Beri suara. Butuh minimal 3 stempel dari event milik pembuat voting; satu akun satu suara.
    pub fn vote(&mut self, poll_id: String, option_index: u8) -> PollView {
        let voter = env::predecessor_account_id();
        let creator = self
            .polls
            .get(&poll_id)
            .unwrap_or_else(|| env::panic_str("Voting tidak ditemukan"))
            .creator
            .clone();
        // Hanya stempel dari event milik pembuat voting yang dihitung (anti ternak stempel lintas penyelenggara)
        require!(
            self.stamps_with(voter.clone(), creator) >= VOTE_MIN_STAMPS,
            "Butuh minimal 3 stempel dari event penyelenggara ini untuk memilih"
        );
        let poll = self.polls.get_mut(&poll_id).unwrap_or_else(|| env::panic_str("Voting tidak ditemukan"));
        require!(!poll.closed, "Voting sudah ditutup");
        require!((option_index as usize) < poll.options.len(), "Pilihan tidak valid");
        require!(!poll.votes.iter().any(|(a, _)| *a == voter), "Akun ini sudah memilih");
        poll.votes.push((voter, option_index));
        Self::poll_view(poll)
    }

    /// Tutup voting (hanya pembuatnya)
    pub fn close_poll(&mut self, poll_id: String) {
        let caller = env::predecessor_account_id();
        let poll = self.polls.get_mut(&poll_id).unwrap_or_else(|| env::panic_str("Voting tidak ditemukan"));
        require!(poll.creator == caller, "Hanya pembuat voting");
        poll.closed = true;
    }

    // ------------------------------------------------------------------
    // View
    // ------------------------------------------------------------------

    pub fn get_config(&self) -> Config {
        Config {
            stable_token: self.stable_token.clone(),
            treasury: self.treasury.clone(),
            verifier: self.verifier.clone(),
            admin: self.admin.clone(),
            service_fee_bps: SERVICE_FEE_BPS as u32,
            clip_pool_bps: CLIP_POOL_BPS as u32,
            referral_pool_bps: REFERRAL_POOL_BPS as u32,
            deposit_percent: DEPOSIT_PERCENT as u32,
            min_paid_price: U128(self.min_paid_price),
            free_mint_storage_fee: U128(FREE_MINT_STORAGE_FEE.as_yoctonear()),
            token_registration_deposit: U128(TOKEN_REGISTRATION_DEPOSIT.as_yoctonear()),
        }
    }

    /// Rincian harga satu tiket: harga, biaya layanan 3,4%, total bayar pembeli, dan pembagiannya
    pub fn quote(&self, event_id: String, tier_id: String) -> Quote {
        let event = self.events.get(&event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
        let tier = event
            .tiers
            .iter()
            .find(|t| t.id == tier_id)
            .unwrap_or_else(|| env::panic_str("Jenis pass tidak ditemukan"));
        compute_quote(event, tier)
    }

    pub fn get_event(&self, event_id: String) -> Option<Event> {
        self.events.get(&event_id).cloned()
    }

    /// Cari event lewat kode, mis. "GIGS12"
    pub fn get_event_by_code(&self, code: String) -> Option<Event> {
        let id = self.event_codes.get(&code)?;
        self.events.get(id).cloned()
    }

    pub fn get_events(&self, from_index: Option<u32>, limit: Option<u32>) -> Vec<Event> {
        self.events
            .iter()
            .skip(from_index.unwrap_or(0) as usize)
            .take(limit.unwrap_or(50).min(100) as usize)
            .map(|(_, e)| e.clone())
            .collect()
    }

    pub fn events_count(&self) -> u32 {
        self.events.len()
    }

    pub fn get_campaign(&self, event_id: String) -> Option<CampaignView> {
        let terms = self.events.get(&event_id)?.campaign.clone()?;
        let st = self.campaigns.get(&event_id)?;
        Some(CampaignView {
            event_id,
            terms,
            collected: U128(st.collected),
            deposit: U128(st.deposit),
            participants: st.participants.clone(),
            clips: st.clips.clone(),
            referrals: st.referrals.iter().map(|(a, n)| ReferralStat { account: a.clone(), sales: *n }).collect(),
        })
    }

    /// Event yang kampanyenya diikuti akun ini
    pub fn campaigns_joined_by(&self, account_id: AccountId) -> Vec<String> {
        self.events
            .iter()
            .filter(|(id, _)| self.campaigns.get(*id).map(|s| s.participants.contains(&account_id)).unwrap_or(false))
            .map(|(id, _)| id.clone())
            .collect()
    }

    pub fn get_pass(&self, pass_id: String) -> Option<Pass> {
        self.passes.get(&pass_id).cloned()
    }

    pub fn passes_for_owner(&self, owner: AccountId) -> Vec<Pass> {
        self.owner_passes
            .get(&owner)
            .map(|ids| ids.iter().filter_map(|id| self.passes.get(id).cloned()).collect())
            .unwrap_or_default()
    }

    /// Total stempel dari semua pass yang sudah discan
    pub fn stamps_of(&self, account_id: AccountId) -> u32 {
        self.owner_passes
            .get(&account_id)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.passes.get(id))
                    .filter(|p| p.status == PassStatus::Used)
                    .map(|p| p.stamps as u32)
                    .sum()
            })
            .unwrap_or(0)
    }

    /// Stempel yang didapat akun ini dari event milik `organizer` saja
    pub fn stamps_with(&self, account_id: AccountId, organizer: AccountId) -> u32 {
        self.owner_passes
            .get(&account_id)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.passes.get(id))
                    .filter(|p| p.status == PassStatus::Used)
                    .filter(|p| self.events.get(&p.event_id).map(|e| e.owner == organizer).unwrap_or(false))
                    .map(|p| p.stamps as u32)
                    .sum()
            })
            .unwrap_or(0)
    }

    /// Semua pass yang sedang dijual (terbaru di atas)
    pub fn get_listings(&self, from_index: u64, limit: u64) -> Vec<ListingView> {
        let mut all: Vec<ListingView> = self.listings.values().filter_map(|l| self.listing_view_of(l)).collect();
        all.sort_by(|a, b| b.listed_at.0.cmp(&a.listed_at.0));
        all.into_iter().skip(from_index as usize).take(limit.min(100) as usize).collect()
    }

    pub fn get_listing(&self, pass_id: String) -> Option<ListingView> {
        self.listings.get(&pass_id).and_then(|l| self.listing_view_of(l))
    }

    pub fn listings_count(&self) -> u32 {
        self.listings.len()
    }

    pub fn get_organizer(&self, account_id: AccountId) -> Option<OrganizerView> {
        self.organizers.get(&account_id).map(|r| Self::organizer_view(&account_id, r))
    }

    /// Semua penyelenggara terdaftar (urut pendaftaran), untuk pelacakan
    pub fn get_organizers(&self, from_index: u64, limit: u64) -> Vec<OrganizerView> {
        self.organizers
            .iter()
            .skip(from_index as usize)
            .take(limit.min(100) as usize)
            .map(|(a, r)| Self::organizer_view(a, r))
            .collect()
    }

    pub fn organizers_count(&self) -> u32 {
        self.organizers.len()
    }

    pub fn get_admin(&self) -> AccountId {
        self.admin.clone()
    }

    pub fn is_organizer(&self, account_id: AccountId) -> bool {
        self.organizers.get(&account_id).map(|r| r.status == OrganizerStatus::Active).unwrap_or(false)
    }

    /// Jumlah stablecoin yang menunggu diklaim akun ini
    pub fn unclaimed_of(&self, account_id: AccountId) -> U128 {
        U128(self.unclaimed.get(&account_id).copied().unwrap_or(0))
    }

    pub fn get_polls(&self) -> Vec<PollView> {
        let mut polls: Vec<PollView> = self.polls.values().map(Self::poll_view).collect();
        polls.reverse();
        polls
    }

    /// Pilihan akun ini di voting tertentu (indeks), jika sudah memilih
    pub fn my_vote(&self, poll_id: String, account_id: AccountId) -> Option<u8> {
        self.polls
            .get(&poll_id)
            .and_then(|p| p.votes.iter().find(|(a, _)| *a == account_id).map(|(_, i)| *i))
    }

    // ---- NEP-171 views (soulbound: tidak ada nft_transfer) ----

    pub fn nft_metadata(&self) -> NftContractMetadata {
        NftContractMetadata {
            spec: "nft-1.0.0".to_string(),
            name: "Karcis Pass".to_string(),
            symbol: "KRC".to_string(),
            icon: None,
            base_uri: None,
            reference: None,
            reference_hash: None,
        }
    }

    pub fn nft_total_supply(&self) -> U128 {
        U128(self.next_pass.saturating_sub(self.burned) as u128)
    }

    pub fn nft_token(&self, token_id: String) -> Option<NftToken> {
        self.passes.get(&token_id).map(|p| self.to_nft(p))
    }

    pub fn nft_tokens_for_owner(&self, account_id: AccountId, from_index: Option<U128>, limit: Option<u64>) -> Vec<NftToken> {
        self.owner_passes
            .get(&account_id)
            .map(|ids| {
                ids.iter()
                    .skip(from_index.map(|i| i.0 as usize).unwrap_or(0))
                    .take(limit.unwrap_or(50).min(100) as usize)
                    .filter_map(|id| self.passes.get(id))
                    .map(|p| self.to_nft(p))
                    .collect()
            })
            .unwrap_or_default()
    }
}

/// Registrasi akun di kontrak token (NEP-145), dibayar dari deposit pemanggil
fn register_on_token(token: AccountId, deposit: NearToken, account: AccountId) -> Promise {
    ext_ft::ext(token)
        .with_attached_deposit(deposit)
        .with_static_gas(GAS_FT_TRANSFER)
        .storage_deposit(Some(account), Some(true))
}

impl Contract {
    /// Beli pass dari pasar tiket: pass lama di-burn, pembeli menerima pass baru. Mengembalikan kelebihan bayar.
    fn buy_resale(&mut self, buyer: AccountId, amount: u128, m: TokenMessage) -> u128 {
        let pass_id = m.pass_id.unwrap_or_else(|| env::panic_str("pass_id wajib diisi"));
        let listing = self.listings.get(&pass_id).unwrap_or_else(|| env::panic_str("Pass ini tidak sedang dijual")).clone();
        require!(listing.seller != buyer, "Tidak bisa membeli pass sendiri");
        let old = self.passes.get(&pass_id).unwrap_or_else(|| env::panic_str("Pass tidak ditemukan")).clone();
        require!(old.owner == listing.seller && old.status == PassStatus::Valid, "Pass ini sudah tidak tersedia");
        let (event_owner, ends_at) = {
            let e = self.events.get(&old.event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
            (e.owner.clone(), e.ends_at.0)
        };
        require!(env::block_timestamp() < ends_at, "Penjualan sudah ditutup, event telah selesai");
        require!(
            self.status_of(&event_owner) == OrganizerStatus::Active,
            "Penjualan dihentikan: penyelenggara event ini sedang ditangguhkan"
        );
        require!(amount >= listing.price, "Pembayaran kurang dari harga jual");

        let fee = listing.price * SERVICE_FEE_BPS / BPS_DENOMINATOR;
        let seller_gets = listing.price - fee;

        self.listings.remove(&pass_id);
        self.burn_pass(&old);
        let new_pass = self.reissue_pass(buyer.clone(), &old);

        if seller_gets > 0 {
            let _ = self.pay_out(listing.seller.clone(), seller_gets);
        }
        if fee > 0 {
            let _ = self.pay_out(self.treasury.clone(), fee);
        }
        emit(
            "pass_resold",
            json!({
                "old_pass_id": old.id, "new_pass_id": new_pass.id, "event_id": old.event_id,
                "seller": listing.seller, "buyer": buyer, "price": U128(listing.price), "fee": U128(fee)
            }),
        );
        amount - listing.price
    }

    /// Hapus pass dari kontrak (NEP-171 nft_burn). Penghitung penjualan event tidak berubah.
    fn burn_pass(&mut self, pass: &Pass) {
        self.passes.remove(&pass.id);
        if let Some(list) = self.owner_passes.get_mut(&pass.owner) {
            list.retain(|id| *id != pass.id);
        }
        self.burned += 1;
        env::log_str(&format!(
            "EVENT_JSON:{}",
            json!({
                "standard": "nep171",
                "version": "1.2.0",
                "event": "nft_burn",
                "data": [{ "owner_id": pass.owner, "token_ids": [pass.id] }]
            })
        ));
    }

    /// Cetak pass pengganti untuk pembeli. Nomor urut = kapasitas + urutan penerbitan ulang, jadi
    /// tidak pernah bentrok dengan nomor penjualan awal (1..kapasitas).
    fn reissue_pass(&mut self, owner: AccountId, old: &Pass) -> Pass {
        let (capacity, code) = self
            .events
            .get(&old.event_id)
            .map(|e| (e.capacity, e.code.clone()))
            .unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
        let n = self.reissued.get(&old.event_id).copied().unwrap_or(0) + 1;
        self.reissued.insert(old.event_id.clone(), n);
        let serial = capacity + n;
        self.next_pass += 1;
        let id = format!("{code}-{serial:04}");
        let pass = Pass {
            id: id.clone(),
            event_id: old.event_id.clone(),
            tier_id: old.tier_id.clone(),
            serial,
            owner: owner.clone(),
            status: PassStatus::Valid,
            stamps: old.stamps,
            minted_at: U64(env::block_timestamp()),
            checked_in_at: None,
            checked_in_by: None,
        };
        self.passes.insert(id.clone(), pass.clone());
        if let Some(list) = self.owner_passes.get_mut(&owner) {
            list.push(id.clone());
        } else {
            self.owner_passes.insert(owner.clone(), vec![id.clone()]);
        }
        env::log_str(&format!(
            "EVENT_JSON:{}",
            json!({
                "standard": "nep171",
                "version": "1.2.0",
                "event": "nft_mint",
                "data": [{ "owner_id": owner, "token_ids": [id] }]
            })
        ));
        pass
    }

    fn listing_view(l: &Listing, pass: &Pass, face: u128) -> ListingView {
        let fee = l.price * SERVICE_FEE_BPS / BPS_DENOMINATOR;
        ListingView {
            pass_id: l.pass_id.clone(),
            event_id: pass.event_id.clone(),
            tier_id: pass.tier_id.clone(),
            seller: l.seller.clone(),
            price: U128(l.price),
            face_value: U128(face),
            platform_fee: U128(fee),
            seller_receives: U128(l.price - fee),
            listed_at: U64(l.listed_at),
        }
    }

    fn listing_view_of(&self, l: &Listing) -> Option<ListingView> {
        let pass = self.passes.get(&l.pass_id)?;
        let face = self.events.get(&pass.event_id)?.tiers.iter().find(|t| t.id == pass.tier_id)?.price.0;
        Some(Self::listing_view(l, pass, face))
    }

    /// Beli pass berbayar dengan stablecoin. Mengembalikan jumlah yang tidak terpakai.
    fn buy(&mut self, buyer: AccountId, amount: u128, m: TokenMessage) -> u128 {
        let tier_id = m.tier_id.unwrap_or_else(|| env::panic_str("tier_id wajib diisi"));
        let (event, tier) = {
            let event = self.events.get(&m.event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
            let tier = event
                .tiers
                .iter()
                .find(|t| t.id == tier_id)
                .unwrap_or_else(|| env::panic_str("Jenis pass tidak ditemukan"))
                .clone();
            (event.clone(), tier)
        };
        require!(tier.price.0 > 0, "Pass gratis tidak dibeli dengan token, pakai mint_free_pass");
        require!(env::block_timestamp() < event.ends_at.0, "Penjualan sudah ditutup, event telah selesai");
        if let Some(terms) = &event.campaign {
            require!(terms.funded, "Kampanye belum didanai, tiket belum bisa dijual");
        }

        let q = compute_quote(&event, &tier);
        require!(amount >= q.total.0, "Pembayaran kurang dari total yang harus dibayar");

        self.create_pass(buyer.clone(), &m.event_id, &tier_id);

        // Catat penjualan lewat referral (diabaikan jika tidak valid; pembelian tetap berjalan)
        if event.campaign.is_some() {
            if let Some(referrer) = m.referrer {
                if referrer != buyer {
                    if let Some(state) = self.campaigns.get_mut(&m.event_id) {
                        if state.participants.contains(&referrer) {
                            if let Some(r) = state.referrals.iter_mut().find(|(a, _)| *a == referrer) {
                                r.1 += 1;
                            } else {
                                state.referrals.push((referrer, 1));
                            }
                        }
                    }
                }
            }
            if let Some(state) = self.campaigns.get_mut(&m.event_id) {
                state.collected += q.clip_pool.0 + q.referral_pool.0;
            }
        }

        // Pembagian: penyelenggara + biaya platform keluar sekarang; biaya promosi tetap di kontrak
        if q.seller_receives.0 > 0 {
            let _ = self.pay_out(event.owner.clone(), q.seller_receives.0);
        }
        if q.platform_fee.0 > 0 {
            let _ = self.pay_out(self.treasury.clone(), q.platform_fee.0);
        }
        amount - q.total.0
    }

    /// Penyelenggara menyetor deposit kampanye. Mengembalikan kelebihan.
    fn fund_campaign(&mut self, sender: AccountId, amount: u128, event_id: String) -> u128 {
        let event = self.events.get_mut(&event_id).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
        require!(event.owner == sender, "Hanya pemilik event yang bisa mendanai kampanye");
        let terms = event.campaign.as_mut().unwrap_or_else(|| env::panic_str("Event ini tidak punya kampanye"));
        require!(!terms.funded, "Kampanye sudah didanai");
        let required = terms.deposit_required.0;
        require!(amount >= required, "Deposit kurang dari yang dibutuhkan");
        terms.funded = true;
        if let Some(st) = self.campaigns.get_mut(&event_id) {
            st.deposit = required;
        }
        emit("campaign_funded", json!({ "event_id": event_id, "deposit": U128(required) }));
        amount - required
    }

    /// Catat jumlah stablecoin yang menunggu diklaim `to`
    fn credit(&mut self, to: &AccountId, amount: u128) {
        if amount == 0 {
            return;
        }
        let current = self.unclaimed.get(to).copied().unwrap_or(0);
        self.unclaimed.insert(to.clone(), current + amount);
    }

    /// Cetak pass baru untuk `owner` dan perbarui hitungan event
    fn create_pass(&mut self, owner: AccountId, event_id: &str, tier_id: &str) -> Pass {
        let (stamps, capacity, sold, code) = self
            .events
            .get(event_id)
            .map(|e| (e.stamps, e.capacity, e.sold, e.code.clone()))
            .unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
        require!(sold < capacity, "Tiket sudah habis");
        let owner_acc = self.events.get(event_id).map(|e| e.owner.clone()).unwrap_or_else(|| env::panic_str("Event tidak ditemukan"));
        require!(
            self.status_of(&owner_acc) == OrganizerStatus::Active,
            "Penjualan dihentikan: penyelenggara event ini sedang ditangguhkan"
        );

        // ID = kode event + nomor urut per event: GIGS12-0001, GIGS12-0002, ...
        let serial = sold + 1;
        self.next_pass += 1;
        let id = format!("{code}-{serial:04}");
        let pass = Pass {
            id: id.clone(),
            event_id: event_id.to_string(),
            tier_id: tier_id.to_string(),
            serial,
            owner: owner.clone(),
            status: PassStatus::Valid,
            stamps,
            minted_at: U64(env::block_timestamp()),
            checked_in_at: None,
            checked_in_by: None,
        };
        self.passes.insert(id.clone(), pass.clone());

        if let Some(list) = self.owner_passes.get_mut(&owner) {
            list.push(id.clone());
        } else {
            self.owner_passes.insert(owner.clone(), vec![id.clone()]);
        }
        if let Some(event) = self.events.get_mut(event_id) {
            event.sold += 1;
        }

        // NEP-171 nft_mint + event Karcis
        env::log_str(&format!(
            "EVENT_JSON:{}",
            json!({
                "standard": "nep171",
                "version": "1.2.0",
                "event": "nft_mint",
                "data": [{ "owner_id": owner, "token_ids": [id] }]
            })
        ));
        emit("pass_minted", json!({ "pass_id": pass.id, "event_id": event_id, "tier_id": tier_id, "owner": pass.owner }));
        pass
    }

    /// Kirim stablecoin ke `to`. Jika gagal, jumlahnya dicatat di `unclaimed` (lihat `on_payout`).
    fn pay_out(&self, to: AccountId, amount: u128) -> Promise {
        ext_ft::ext(self.stable_token.clone())
            .with_attached_deposit(ONE_YOCTO)
            .with_static_gas(GAS_FT_TRANSFER)
            .ft_transfer(to.clone(), U128(amount), None)
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_CALLBACK)
                    .on_payout(to, U128(amount)),
            )
    }

    /// Pola storage deposit: pemanggil membayar tepat sebesar byte yang ia pakai (+ `extra`).
    /// Kelebihan deposit dikembalikan; kekurangan membatalkan seluruh transaksi.
    fn settle_storage(storage_before: u64, payer: AccountId, extra: NearToken) {
        let used = env::storage_usage().saturating_sub(storage_before);
        let cost = env::storage_byte_cost().saturating_mul(used as u128).saturating_add(extra);
        let deposit = env::attached_deposit();
        require!(
            deposit >= cost,
            format!("Deposit penyimpanan kurang. Dibutuhkan {} yoctoNEAR", cost.as_yoctonear())
        );
        let refund = deposit.saturating_sub(cost);
        if refund > ZERO {
            let _ = Promise::new(payer).transfer(refund);
        }
    }

    fn status_of(&self, account: &AccountId) -> OrganizerStatus {
        self.organizers.get(account).map(|r| r.status).unwrap_or(OrganizerStatus::Active)
    }

    /// Hanya penyelenggara terdaftar dan aktif
    fn require_active_organizer(&self, account: &AccountId) {
        let record = self
            .organizers
            .get(account)
            .unwrap_or_else(|| env::panic_str("Daftar sebagai penyelenggara dulu (register_organizer)"));
        require!(record.status == OrganizerStatus::Active, "Akun penyelenggara ini sedang ditangguhkan atau diblokir");
    }

    fn has_pass_from(&self, holder: &AccountId, organizer: &AccountId) -> bool {
        self.owner_passes
            .get(holder)
            .map(|ids| {
                ids.iter().any(|id| {
                    self.passes
                        .get(id)
                        .and_then(|p| self.events.get(&p.event_id))
                        .map(|e| e.owner == *organizer)
                        .unwrap_or(false)
                })
            })
            .unwrap_or(false)
    }

    fn apply_status(&mut self, organizer: AccountId, to: OrganizerStatus, kind: CaseKind, reason: String) {
        let storage_before = env::storage_usage();
        let admin = env::predecessor_account_id();
        require!(admin == self.admin, "Hanya admin");
        let reason = reason.trim().to_string();
        require!(reason.len() >= 5, "Alasan wajib diisi (minimal 5 karakter)");
        check_len(&reason, 500, "Alasan");
        let now = env::block_timestamp();
        let record = self
            .organizers
            .get_mut(&organizer)
            .unwrap_or_else(|| env::panic_str("Penyelenggara tidak terdaftar"));
        match to {
            OrganizerStatus::Active => require!(record.status != OrganizerStatus::Active, "Penyelenggara sudah aktif"),
            OrganizerStatus::Suspended => {
                require!(record.status == OrganizerStatus::Active, "Hanya penyelenggara aktif yang bisa ditangguhkan")
            }
            OrganizerStatus::Banned => require!(record.status != OrganizerStatus::Banned, "Penyelenggara sudah diblokir"),
        }
        require!(record.cases.len() < MAX_CASES, "Catatan kasus penyelenggara ini sudah penuh");
        record.status = to;
        record.status_changed_at = now;
        record.cases.push(CaseEntry { at: U64(now), kind, by: admin.clone(), reason });
        self.organizers.flush();
        Self::settle_storage(storage_before, admin, ZERO);
        emit("organizer_status", json!({ "organizer": organizer, "status": to }));
    }

    fn clean_profile(p: OrganizerProfile) -> OrganizerProfile {
        let p = OrganizerProfile {
            name: p.name.trim().to_string(),
            org_type: p.org_type.trim().to_ascii_lowercase(),
            city: p.city.trim().to_string(),
            contact: p.contact.trim().to_string(),
            description: p.description.trim().to_string(),
        };
        require!(p.name.len() >= 2, "Nama penyelenggara minimal 2 karakter");
        require!(!p.contact.is_empty(), "Kontak wajib diisi supaya pembeli bisa menghubungi");
        check_len(&p.name, 80, "Nama penyelenggara");
        check_len(&p.org_type, 20, "Jenis penyelenggara");
        check_len(&p.city, 60, "Kota");
        check_len(&p.contact, 120, "Kontak");
        check_len(&p.description, 300, "Deskripsi");
        OrganizerProfile { org_type: if p.org_type.is_empty() { "komunitas".to_string() } else { p.org_type }, ..p }
    }

    fn organizer_view(account: &AccountId, r: &OrganizerRecord) -> OrganizerView {
        OrganizerView {
            account_id: account.clone(),
            profile: r.profile.clone(),
            status: r.status,
            registered_at: U64(r.registered_at),
            status_changed_at: U64(r.status_changed_at),
            reports: r.cases.iter().filter(|c| c.kind == CaseKind::Report).count() as u32,
            cases: r.cases.clone(),
        }
    }

    fn poll_view(poll: &Poll) -> PollView {
        let mut counts = vec![0u32; poll.options.len()];
        for (_, idx) in &poll.votes {
            if let Some(c) = counts.get_mut(*idx as usize) {
                *c += 1;
            }
        }
        PollView {
            id: poll.id.clone(),
            creator: poll.creator.clone(),
            organizer_name: poll.organizer_name.clone(),
            question: poll.question.clone(),
            options: poll.options.clone(),
            total: counts.iter().sum(),
            counts,
            closed: poll.closed,
            created_at: U64(poll.created_at),
        }
    }

    fn to_nft(&self, pass: &Pass) -> NftToken {
        let event = self.events.get(&pass.event_id);
        let status = match pass.status {
            PassStatus::Valid => "Tiket",
            PassStatus::Used => "Lencana",
        };
        NftToken {
            token_id: pass.id.clone(),
            owner_id: pass.owner.clone(),
            metadata: TokenMetadata {
                title: event.map(|e| format!("{} #{:04} ({})", e.nft_name, pass.serial, status)),
                description: event.map(|e| format!("{} · {} · {} · {}", e.title, e.organizer_name, e.venue, e.date_full)),
                media: event
                    .map(|e| {
                        if pass.status == PassStatus::Used && !e.badge_image.is_empty() {
                            e.badge_image.clone()
                        } else {
                            e.image.clone()
                        }
                    })
                    .filter(|m| !m.is_empty()),
                issued_at: Some(pass.minted_at.0.to_string()),
                extra: Some(format!("status={:?};stamps={}", pass.status, pass.stamps)),
            },
        }
    }
}

#[cfg(test)]
mod tests;
