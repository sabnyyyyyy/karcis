use super::*;
use near_sdk::mock::MockAction;
use near_sdk::test_utils::{accounts, get_created_receipts, VMContextBuilder};
use near_sdk::{test_vm_config, testing_env, PromiseResult, RuntimeFeesConfig};

const ONE_NEAR: u128 = 1_000_000_000_000_000_000_000_000;
/// Stablecoin 6 desimal: 1_000_000 = 1 USD
const USD: u128 = 1_000_000;
const NOW: u64 = 1_700_000_000_000_000_000;
const ENDS: u64 = NOW + 30 * DAY_NS;

fn owner() -> AccountId {
    accounts(0)
}
fn buyer() -> AccountId {
    accounts(1)
}
fn stranger() -> AccountId {
    accounts(2)
}
fn scanner() -> AccountId {
    accounts(3)
}
fn treasury() -> AccountId {
    accounts(4)
}
fn token() -> AccountId {
    accounts(5)
}
fn verifier() -> AccountId {
    "verifier.testnet".parse().unwrap()
}
fn clip1() -> AccountId {
    "clip1.testnet".parse().unwrap()
}
fn clip2() -> AccountId {
    "clip2.testnet".parse().unwrap()
}
fn other_org() -> AccountId {
    "org2.testnet".parse().unwrap()
}

fn ctx_at(who: AccountId, deposit: u128, ts: u64) {
    testing_env!(VMContextBuilder::new()
        .predecessor_account_id(who)
        .attached_deposit(NearToken::from_yoctonear(deposit))
        .block_timestamp(ts)
        .build());
}

fn ctx(who: AccountId, deposit: u128) {
    ctx_at(who, deposit, NOW);
}

fn admin() -> AccountId {
    verifier()
}

fn org_profile(name: &str) -> OrganizerProfile {
    OrganizerProfile {
        name: name.into(),
        org_type: "Kolektif".into(),
        city: "Bandung".into(),
        contact: "@gelombangpendek".into(),
        description: "Kolektif musik lokal.".into(),
    }
}

fn register(c: &mut Contract, who: AccountId) {
    ctx(who, ONE_NEAR / 10);
    c.register_organizer(org_profile("Kolektif Gelombang Pendek"));
}

/// Kontrak baru dengan owner() dan other_org() sudah terdaftar sebagai penyelenggara.
/// Konteks (pemanggil, deposit, waktu) dikembalikan seperti sebelum dipanggil.
fn new_contract() -> Contract {
    let who = env::predecessor_account_id();
    let deposit = env::attached_deposit().as_yoctonear();
    let ts = env::block_timestamp();
    // testing_env! membawa storage lintas pemanggilan: kosongkan supaya kontrak baru benar-benar baru
    let _ = near_sdk::mock::with_mocked_blockchain(|b| b.take_storage());
    let mut c = Contract::new(token(), treasury(), verifier(), U128(500_000));
    register(&mut c, owner());
    register(&mut c, other_org());
    ctx_at(who, deposit, ts);
    c
}

fn bare_contract() -> Contract {
    let _ = near_sdk::mock::with_mocked_blockchain(|b| b.take_storage());
    Contract::new(token(), treasury(), verifier(), U128(500_000))
}

fn campaign_terms() -> Option<NewCampaign> {
    // 0,3 USD per 1 juta view, 0,3 USD per tiket lewat referral
    Some(NewCampaign { clip_rate_per_million: U128(300_000), referral_reward: U128(300_000) })
}

fn sample_event(stamps: u8, price: u128, bearer: FeeBearer, campaign: Option<NewCampaign>, capacity: u32) -> NewEvent {
    NewEvent {
        title: "Gigs Basement Vol. 12".into(),
        category: "GIGS".into(),
        organizer_name: "Kolektif Gelombang Pendek".into(),
        city: "Bandung".into(),
        venue: "Basement Studio".into(),
        address: "Jl. Cikapundung".into(),
        date_label: "14 Des".into(),
        date_full: "14 Desember 2026".into(),
        time: "19:00 - 23:30".into(),
        image: "https://example.com/a.jpg".into(),
        description: "Malam gigs rutin.".into(),
        lineup: vec![],
        tiers: vec![
            Tier { id: "reguler".into(), name: "Reguler".into(), price: U128(price), perk: "Masuk".into() },
            Tier { id: "gratis".into(), name: "Gratis".into(), price: U128(0), perk: "Masuk".into() },
        ],
        stamps,
        capacity,
        ends_at: U64(ENDS),
        fee_bearer: bearer,
        campaign,
        code: "GIGS12".into(),
        nft_name: None,
        badge_image: None,
    }
}

/// Event "1" milik owner(): penjual menanggung biaya, tanpa kampanye, kapasitas 500
fn setup(stamps: u8, price: u128) -> Contract {
    setup_with(stamps, price, FeeBearer::Seller, None, 500)
}

fn setup_with(stamps: u8, price: u128, bearer: FeeBearer, campaign: Option<NewCampaign>, capacity: u32) -> Contract {
    ctx(owner(), ONE_NEAR);
    let mut c = new_contract();
    c.create_event(sample_event(stamps, price, bearer, campaign, capacity));
    c
}

fn buy_msg(referrer: Option<&str>) -> String {
    match referrer {
        Some(r) => format!(r#"{{"event_id":"1","tier_id":"reguler","referrer":"{r}"}}"#),
        None => r#"{"event_id":"1","tier_id":"reguler"}"#.to_string(),
    }
}

/// Pembayaran stablecoin: kontrak token memanggil ft_on_transfer. Mengembalikan jumlah tak terpakai.
fn pay_msg(c: &mut Contract, who: AccountId, amount: u128, msg: String) -> u128 {
    ctx(token(), 0);
    match c.ft_on_transfer(who, U128(amount), msg) {
        PromiseOrValue::Value(unused) => unused.0,
        PromiseOrValue::Promise(_) => panic!("seharusnya Value"),
    }
}

fn pay(c: &mut Contract, who: AccountId, amount: u128) -> u128 {
    pay_msg(c, who, amount, buy_msg(None))
}

fn last_pass(c: &Contract, who: AccountId) -> Pass {
    c.passes_for_owner(who).last().cloned().expect("belum punya pass")
}

/// Beli pass dengan jumlah yang pasti cukup; kelebihan dikembalikan token (diabaikan)
fn buy(c: &mut Contract, who: AccountId) -> Pass {
    pay(c, who.clone(), 20 * USD);
    last_pass(c, who)
}

fn fund_msg() -> String {
    r#"{"action":"fund_campaign","event_id":"1"}"#.to_string()
}

fn fund(c: &mut Contract) {
    let required = c.get_event("1".into()).unwrap().campaign.unwrap().deposit_required.0;
    pay_msg(c, owner(), required, fund_msg());
}

/// Event berkampanye yang sudah didanai: harga 10 USD, penjual menanggung biaya
fn funded_campaign(bearer: FeeBearer) -> Contract {
    let mut c = setup_with(1, 10 * USD, bearer, campaign_terms(), 500);
    fund(&mut c);
    c
}

fn join(c: &mut Contract, who: AccountId) {
    ctx(who, ONE_NEAR / 10);
    c.join_campaign("1".into());
}

fn submit(c: &mut Contract, who: AccountId, url: &str) -> Clip {
    ctx(who, ONE_NEAR / 10);
    c.submit_clip("1".into(), "tiktok".into(), url.into())
}

/// Semua ft_transfer yang dibuat kontrak pada transaksi terakhir: (penerima, jumlah)
fn ft_transfers() -> Vec<(String, u128)> {
    let mut out = Vec::new();
    for r in get_created_receipts() {
        for a in &r.actions {
            if let MockAction::FunctionCallWeight { method_name, args, .. } = a {
                if method_name.as_slice() == b"ft_transfer" {
                    let v: serde_json::Value = serde_json::from_slice(args).unwrap();
                    out.push((
                        v["receiver_id"].as_str().unwrap().to_string(),
                        v["amount"].as_str().unwrap().parse().unwrap(),
                    ));
                }
            }
        }
    }
    out
}

/// Transfer NEAR pada transaksi terakhir: (penerima, yoctoNEAR)
fn near_transfers() -> Vec<(String, u128)> {
    let mut out = Vec::new();
    for r in get_created_receipts() {
        for a in &r.actions {
            if let MockAction::Transfer { deposit, .. } = a {
                out.push((r.receiver_id.to_string(), deposit.as_yoctonear()));
            }
        }
    }
    out
}

fn called_methods() -> Vec<(String, String)> {
    let mut out = Vec::new();
    for r in get_created_receipts() {
        for a in &r.actions {
            if let MockAction::FunctionCallWeight { method_name, .. } = a {
                out.push((r.receiver_id.to_string(), String::from_utf8(method_name.clone()).unwrap()));
            }
        }
    }
    out
}

fn report(c: &mut Contract, reports: Vec<(u32, u64)>) {
    ctx_at(verifier(), 0, ENDS + 1);
    c.report_views(
        "1".into(),
        reports.into_iter().map(|(clip_id, views)| ViewReport { clip_id, views: U64(views) }).collect(),
    );
}

fn settle(c: &mut Contract) {
    ctx_at(stranger(), 0, ENDS + 2);
    c.settle_campaign("1".into());
}

// ================================================================ event

#[test]
fn create_event_sets_owner_id_and_defaults() {
    let c = setup(1, USD);
    let e = c.get_event("1".into()).unwrap();
    assert_eq!(e.owner, owner());
    assert_eq!(e.sold, 0);
    assert_eq!(e.capacity, 500);
    assert!(e.campaign.is_none());
    assert!(c.is_organizer(owner()));
    assert!(!c.is_organizer(buyer()));
}

#[test]
#[should_panic(expected = "Stempel per event harus 1 sampai 3")]
fn create_event_rejects_bad_stamps() {
    setup(5, USD);
}

#[test]
#[should_panic(expected = "Harga pass berbayar di bawah harga minimum")]
fn create_event_rejects_tiny_paid_price() {
    setup(1, 10);
}

#[test]
#[should_panic(expected = "Kapasitas tiket harus 1 sampai 100.000")]
fn create_event_rejects_zero_capacity() {
    setup_with(1, USD, FeeBearer::Seller, None, 0);
}

#[test]
#[should_panic(expected = "Waktu selesai event harus di masa depan")]
fn create_event_rejects_past_end_time() {
    ctx(owner(), ONE_NEAR);
    let mut c = new_contract();
    let mut ev = sample_event(1, USD, FeeBearer::Seller, None, 10);
    ev.ends_at = U64(NOW - 1);
    c.create_event(ev);
}

#[test]
#[should_panic(expected = "Deposit penyimpanan kurang")]
fn create_event_requires_storage_deposit() {
    ctx(owner(), 0);
    let mut c = new_contract();
    c.create_event(sample_event(1, USD, FeeBearer::Seller, None, 10));
}

#[test]
fn create_event_refunds_excess_and_registers_owner_on_token() {
    ctx(owner(), 5 * ONE_NEAR);
    let mut c = new_contract();
    c.create_event(sample_event(1, USD, FeeBearer::Seller, None, 10));

    let refund: u128 = near_transfers().iter().filter(|(r, _)| *r == owner().to_string()).map(|(_, a)| a).sum();
    assert!(refund > 49 * ONE_NEAR / 10 && refund < 5 * ONE_NEAR, "refund = {refund}");
    assert!(called_methods().contains(&(token().to_string(), "storage_deposit".into())));
}

#[test]
fn free_only_event_does_not_register_on_token() {
    ctx(owner(), ONE_NEAR);
    let mut c = new_contract();
    let mut ev = sample_event(1, 0, FeeBearer::Seller, None, 10);
    ev.tiers.retain(|t| t.id == "gratis");
    c.create_event(ev);
    assert!(!called_methods().iter().any(|(_, m)| m == "storage_deposit"));
}

// ================================================================ rincian biaya (quote)

#[test]
fn quote_without_campaign_has_only_platform_fee() {
    // Tiket 100.000 (anggap 100 USD): hanya biaya platform 3,4% = 3.400
    let c = setup_with(1, 100 * USD, FeeBearer::Buyer, None, 500);
    let q = c.quote("1".into(), "reguler".into());
    assert_eq!(q.platform_fee.0, 3_400_000);
    assert_eq!(q.promo_fee.0, 0);
    assert_eq!(q.total.0, 103_400_000);
    assert_eq!(q.seller_receives.0, 100 * USD);

    let c = setup_with(1, 100 * USD, FeeBearer::Seller, None, 500);
    let q = c.quote("1".into(), "reguler".into());
    assert_eq!(q.total.0, 100 * USD);
    assert_eq!(q.seller_receives.0, 96_600_000);
}

#[test]
fn quote_with_campaign_adds_promo_fee_on_top_of_platform_fee() {
    // Contoh dari spesifikasi: tiket 100.000 + 3,4% platform (3.400) + 3.000 promosi (2.000 clip + 1.000 referral)
    let c = setup_with(1, 100 * USD, FeeBearer::Buyer, campaign_terms(), 500);
    let q = c.quote("1".into(), "reguler".into());
    assert_eq!(q.platform_fee.0, 3_400_000);
    assert_eq!(q.clip_pool.0, 2_000_000);
    assert_eq!(q.referral_pool.0, 1_000_000);
    assert_eq!(q.promo_fee.0, 3_000_000);
    assert_eq!(q.total.0, 106_400_000); // Rp106.400
    assert_eq!(q.seller_receives.0, 100 * USD);

    // Penjual yang menanggung: pembeli tetap bayar harga dasar
    let c = setup_with(1, 100 * USD, FeeBearer::Seller, campaign_terms(), 500);
    let q = c.quote("1".into(), "reguler".into());
    assert_eq!(q.total.0, 100 * USD);
    assert_eq!(q.seller_receives.0, 93_600_000); // Rp93.600
}

#[test]
fn quote_for_free_tier_is_zero() {
    let c = setup(1, 10 * USD);
    let q = c.quote("1".into(), "gratis".into());
    assert_eq!((q.total.0, q.platform_fee.0, q.promo_fee.0), (0, 0, 0));
}

// ================================================================ beli dengan stablecoin

#[test]
fn paying_with_stablecoin_mints_valid_pass() {
    let mut c = setup(2, 10 * USD);
    let unused = pay(&mut c, buyer(), 10 * USD);
    assert_eq!(unused, 0);

    let p = last_pass(&c, buyer());
    assert_eq!(p.id, "GIGS12-0001");
    assert_eq!(p.owner, buyer());
    assert_eq!(p.status, PassStatus::Valid);
    assert_eq!(p.stamps, 2);
    assert_eq!(c.get_event("1".into()).unwrap().sold, 1);
    assert_eq!(c.stamps_of(buyer()), 0);
}

#[test]
fn seller_bears_fee_buyer_pays_base_price() {
    let mut c = setup(1, 10 * USD);
    let unused = pay(&mut c, buyer(), 10 * USD);
    assert_eq!(unused, 0);
    let t = ft_transfers();
    // 10 USD: platform 3,4% = 0,34 ke treasury, penjual terima 9,66
    assert!(t.contains(&(treasury().to_string(), 340_000)), "{t:?}");
    assert!(t.contains(&(owner().to_string(), 9_660_000)), "{t:?}");
    assert_eq!(t.len(), 2);
}

#[test]
fn buyer_bears_fee_buyer_pays_price_plus_fee() {
    let mut c = setup_with(1, 10 * USD, FeeBearer::Buyer, None, 500);
    let unused = pay(&mut c, buyer(), 10_340_000);
    assert_eq!(unused, 0);
    let t = ft_transfers();
    assert!(t.contains(&(owner().to_string(), 10 * USD)), "{t:?}");
    assert!(t.contains(&(treasury().to_string(), 340_000)), "{t:?}");
}

#[test]
#[should_panic(expected = "Pembayaran kurang dari total yang harus dibayar")]
fn buyer_bears_fee_rejects_base_price_only() {
    let mut c = setup_with(1, 10 * USD, FeeBearer::Buyer, None, 500);
    pay(&mut c, buyer(), 10 * USD);
}

#[test]
fn fee_rounds_down_and_all_money_is_accounted_for() {
    // 0,500001 USD: 3,4% = 17000,034 -> 17000
    let mut c = setup(1, 500_001);
    pay(&mut c, buyer(), 500_001);
    let t = ft_transfers();
    let fee = t.iter().find(|(r, _)| *r == treasury().to_string()).unwrap().1;
    let net = t.iter().find(|(r, _)| *r == owner().to_string()).unwrap().1;
    assert_eq!(fee, 17_000);
    assert_eq!(fee + net, 500_001);
}

#[test]
fn overpayment_is_returned_as_unused_amount() {
    let mut c = setup(1, 10 * USD);
    let unused = pay(&mut c, buyer(), 15 * USD);
    assert_eq!(unused, 5 * USD);
    let total: u128 = ft_transfers().iter().map(|(_, a)| a).sum();
    assert_eq!(total, 10 * USD);
}

#[test]
#[should_panic(expected = "Pembayaran kurang dari total yang harus dibayar")]
fn underpayment_is_rejected() {
    let mut c = setup(1, 10 * USD);
    pay(&mut c, buyer(), 9 * USD);
}

#[test]
#[should_panic(expected = "Token pembayaran tidak diterima")]
fn only_the_configured_stablecoin_is_accepted() {
    let mut c = setup(1, 10 * USD);
    ctx(stranger(), 0);
    let _ = c.ft_on_transfer(buyer(), U128(10 * USD), buy_msg(None));
}

#[test]
#[should_panic(expected = "Format pesan pembayaran salah")]
fn malformed_message_is_rejected() {
    let mut c = setup(1, 10 * USD);
    pay_msg(&mut c, buyer(), 10 * USD, "bukan json".into());
}

#[test]
#[should_panic(expected = "Jenis pass tidak ditemukan")]
fn unknown_tier_is_rejected() {
    let mut c = setup(1, 10 * USD);
    pay_msg(&mut c, buyer(), 10 * USD, r#"{"event_id":"1","tier_id":"vip"}"#.into());
}

#[test]
#[should_panic(expected = "Event tidak ditemukan")]
fn unknown_event_is_rejected() {
    let mut c = setup(1, 10 * USD);
    pay_msg(&mut c, buyer(), 10 * USD, r#"{"event_id":"99","tier_id":"reguler"}"#.into());
}

#[test]
#[should_panic(expected = "Pass gratis tidak dibeli dengan token")]
fn free_tier_cannot_be_bought_with_token() {
    let mut c = setup(1, 10 * USD);
    pay_msg(&mut c, buyer(), USD, r#"{"event_id":"1","tier_id":"gratis"}"#.into());
}

#[test]
#[should_panic(expected = "Aksi pembayaran tidak dikenal")]
fn unknown_action_is_rejected() {
    let mut c = setup(1, 10 * USD);
    pay_msg(&mut c, buyer(), USD, r#"{"action":"hack","event_id":"1"}"#.into());
}

#[test]
#[should_panic(expected = "Tiket sudah habis")]
fn capacity_is_enforced() {
    let mut c = setup_with(1, 10 * USD, FeeBearer::Seller, None, 1);
    pay(&mut c, buyer(), 10 * USD);
    pay(&mut c, stranger(), 10 * USD);
}

#[test]
#[should_panic(expected = "Penjualan sudah ditutup")]
fn sales_close_when_event_ends() {
    let mut c = setup(1, 10 * USD);
    ctx_at(token(), 0, ENDS + 1);
    let _ = c.ft_on_transfer(buyer(), U128(10 * USD), buy_msg(None));
}

// ================================================================ pass gratis

#[test]
fn free_pass_needs_storage_fee_and_refunds_excess() {
    let mut c = setup(1, 10 * USD);
    ctx(buyer(), ONE_NEAR);
    let p = c.mint_free_pass("1".into(), "gratis".into());
    assert_eq!(p.status, PassStatus::Valid);
    let refund: u128 = near_transfers().iter().filter(|(r, _)| *r == buyer().to_string()).map(|(_, a)| a).sum();
    assert_eq!(refund, ONE_NEAR - 5_000_000_000_000_000_000_000);
    assert!(ft_transfers().is_empty());
}

#[test]
#[should_panic(expected = "Deposit kurang")]
fn free_pass_rejects_missing_storage_fee() {
    let mut c = setup(1, 10 * USD);
    ctx(buyer(), 0);
    c.mint_free_pass("1".into(), "gratis".into());
}

#[test]
#[should_panic(expected = "Pass ini berbayar")]
fn paid_tier_cannot_be_minted_for_free() {
    let mut c = setup(1, 10 * USD);
    ctx(buyer(), ONE_NEAR);
    c.mint_free_pass("1".into(), "reguler".into());
}

// ================================================================ kampanye: pembuatan & deposit

#[test]
fn campaign_deposit_is_10_percent_of_promo_budget() {
    // 500 tiket × 10 USD × 3% = 150 USD anggaran promosi; deposit 10% = 15 USD
    let c = setup_with(1, 10 * USD, FeeBearer::Seller, campaign_terms(), 500);
    let t = c.get_event("1".into()).unwrap().campaign.unwrap();
    assert_eq!(t.deposit_required.0, 15 * USD);
    assert!(!t.funded && !t.settled && !t.views_reported);
}

#[test]
fn campaign_deposit_uses_cheapest_paid_tier() {
    ctx(owner(), ONE_NEAR);
    let mut c = new_contract();
    let mut ev = sample_event(1, 10 * USD, FeeBearer::Seller, campaign_terms(), 500);
    ev.tiers.push(Tier { id: "murah".into(), name: "Murah".into(), price: U128(5 * USD), perk: "".into() });
    c.create_event(ev);
    // 500 × 5 USD × 3% × 10% = 7,5 USD
    assert_eq!(c.get_event("1".into()).unwrap().campaign.unwrap().deposit_required.0, 7_500_000);
}

#[test]
#[should_panic(expected = "Kampanye butuh minimal satu pass berbayar")]
fn campaign_requires_a_paid_tier() {
    ctx(owner(), ONE_NEAR);
    let mut c = new_contract();
    let mut ev = sample_event(1, 0, FeeBearer::Seller, campaign_terms(), 10);
    ev.tiers.retain(|t| t.id == "gratis");
    c.create_event(ev);
}

#[test]
#[should_panic(expected = "Hadiah referral tidak boleh melebihi harga pass termurah")]
fn referral_reward_cannot_exceed_ticket_price() {
    setup_with(1, USD, FeeBearer::Seller, Some(NewCampaign { clip_rate_per_million: U128(1), referral_reward: U128(2 * USD) }), 10);
}

#[test]
#[should_panic(expected = "Tarif clip harus lebih dari 0")]
fn campaign_rejects_zero_clip_rate() {
    setup_with(1, 10 * USD, FeeBearer::Seller, Some(NewCampaign { clip_rate_per_million: U128(0), referral_reward: U128(1) }), 10);
}

#[test]
#[should_panic(expected = "Kampanye belum didanai, tiket belum bisa dijual")]
fn paid_tickets_are_blocked_until_campaign_is_funded() {
    let mut c = setup_with(1, 10 * USD, FeeBearer::Seller, campaign_terms(), 500);
    pay(&mut c, buyer(), 10 * USD);
}

#[test]
fn funding_marks_campaign_funded_and_returns_excess() {
    let mut c = setup_with(1, 10 * USD, FeeBearer::Seller, campaign_terms(), 500);
    let unused = pay_msg(&mut c, owner(), 20 * USD, fund_msg());
    assert_eq!(unused, 5 * USD); // setor 20, butuh 15
    let v = c.get_campaign("1".into()).unwrap();
    assert!(v.terms.funded);
    assert_eq!(v.deposit.0, 15 * USD);
}

#[test]
#[should_panic(expected = "Deposit kurang dari yang dibutuhkan")]
fn funding_below_required_is_rejected() {
    let mut c = setup_with(1, 10 * USD, FeeBearer::Seller, campaign_terms(), 500);
    pay_msg(&mut c, owner(), 10 * USD, fund_msg());
}

#[test]
#[should_panic(expected = "Hanya pemilik event yang bisa mendanai kampanye")]
fn only_owner_can_fund_campaign() {
    let mut c = setup_with(1, 10 * USD, FeeBearer::Seller, campaign_terms(), 500);
    pay_msg(&mut c, stranger(), 15 * USD, fund_msg());
}

#[test]
#[should_panic(expected = "Kampanye sudah didanai")]
fn campaign_cannot_be_funded_twice() {
    let mut c = funded_campaign(FeeBearer::Seller);
    pay_msg(&mut c, owner(), 15 * USD, fund_msg());
}

// ================================================================ kampanye: biaya promosi masuk dana

#[test]
fn promo_fee_is_escrowed_and_platform_fee_goes_out() {
    let mut c = funded_campaign(FeeBearer::Buyer);
    // 10 USD: total = 10 + 0,34 (platform) + 0,3 (promosi) = 10,64
    let unused = pay(&mut c, buyer(), 10_640_000);
    assert_eq!(unused, 0);

    let t = ft_transfers();
    assert!(t.contains(&(owner().to_string(), 10 * USD)), "{t:?}");
    assert!(t.contains(&(treasury().to_string(), 340_000)), "{t:?}");
    assert_eq!(t.len(), 2, "dana promosi tidak boleh keluar: {t:?}");
    assert_eq!(c.get_campaign("1".into()).unwrap().collected.0, 300_000);
}

#[test]
fn seller_bearing_campaign_fees_nets_less() {
    let mut c = funded_campaign(FeeBearer::Seller);
    pay(&mut c, buyer(), 10 * USD);
    let t = ft_transfers();
    // 10 − 0,34 − 0,3 = 9,36
    assert!(t.contains(&(owner().to_string(), 9_360_000)), "{t:?}");
    assert!(t.contains(&(treasury().to_string(), 340_000)), "{t:?}");
    assert_eq!(c.get_campaign("1".into()).unwrap().collected.0, 300_000);
}

// ================================================================ kampanye: peserta, clip, referral

#[test]
fn clipper_can_join_and_is_registered_on_token() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    assert!(called_methods().contains(&(token().to_string(), "storage_deposit".into())));
    assert_eq!(c.get_campaign("1".into()).unwrap().participants, vec![clip1()]);
    assert_eq!(c.campaigns_joined_by(clip1()), vec!["1".to_string()]);
}

#[test]
#[should_panic(expected = "Kampanye belum didanai penyelenggara")]
fn cannot_join_before_funding() {
    let mut c = setup_with(1, 10 * USD, FeeBearer::Seller, campaign_terms(), 500);
    join(&mut c, clip1());
}

#[test]
#[should_panic(expected = "Penyelenggara tidak bisa ikut kampanyenya sendiri")]
fn organizer_cannot_join_own_campaign() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, owner());
}

#[test]
#[should_panic(expected = "Sudah ikut kampanye ini")]
fn cannot_join_twice() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    join(&mut c, clip1());
}

#[test]
#[should_panic(expected = "Event sudah selesai")]
fn cannot_join_after_event_ends() {
    let mut c = funded_campaign(FeeBearer::Seller);
    ctx_at(clip1(), ONE_NEAR / 10, ENDS + 1);
    c.join_campaign("1".into());
}

#[test]
fn participant_can_submit_clips_with_unique_ids() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    let a = submit(&mut c, clip1(), "https://www.tiktok.com/@a/video/1");
    let b = submit(&mut c, clip1(), "https://www.tiktok.com/@a/video/2");
    assert_eq!((a.id, b.id), (1, 2));
    assert!(a.views.is_none());
    assert_eq!(c.get_campaign("1".into()).unwrap().clips.len(), 2);
}

#[test]
#[should_panic(expected = "Ikut kampanye dulu sebelum mengirim clip")]
fn non_participant_cannot_submit_clip() {
    let mut c = funded_campaign(FeeBearer::Seller);
    submit(&mut c, clip1(), "https://www.tiktok.com/@a/video/1");
}

#[test]
#[should_panic(expected = "Tautan ini sudah dikirim")]
fn duplicate_clip_url_is_rejected() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    join(&mut c, clip2());
    submit(&mut c, clip1(), "https://www.tiktok.com/@a/video/1");
    submit(&mut c, clip2(), "https://www.tiktok.com/@a/video/1");
}

#[test]
#[should_panic(expected = "Maksimal 5 clip per peserta")]
fn clip_limit_per_participant() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    for i in 0..6 {
        submit(&mut c, clip1(), &format!("https://www.tiktok.com/@a/video/{i}"));
    }
}

#[test]
#[should_panic(expected = "Platform dan tautan video wajib diisi")]
fn clip_url_must_be_a_link() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    submit(&mut c, clip1(), "bukan-link");
}

#[test]
fn referral_sales_are_counted_for_valid_participants_only() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());

    pay_msg(&mut c, buyer(), 10 * USD, buy_msg(Some("clip1.testnet")));
    pay_msg(&mut c, stranger(), 10 * USD, buy_msg(Some("clip1.testnet")));
    // bukan peserta: diabaikan, pembelian tetap berhasil
    pay_msg(&mut c, scanner(), 10 * USD, buy_msg(Some("clip2.testnet")));
    // referral ke diri sendiri: diabaikan
    pay_msg(&mut c, clip1(), 10 * USD, buy_msg(Some("clip1.testnet")));

    let v = c.get_campaign("1".into()).unwrap();
    assert_eq!(v.referrals.len(), 1);
    assert_eq!(v.referrals[0].account, clip1());
    assert_eq!(v.referrals[0].sales, 2);
    assert_eq!(c.get_event("1".into()).unwrap().sold, 4);
}

// ================================================================ kampanye: verifier & settle

#[test]
#[should_panic(expected = "Hanya verifier")]
fn only_verifier_reports_views() {
    let mut c = funded_campaign(FeeBearer::Seller);
    ctx_at(owner(), 0, ENDS + 1);
    c.report_views("1".into(), vec![]);
}

#[test]
#[should_panic(expected = "Event belum selesai")]
fn views_cannot_be_reported_before_event_ends() {
    let mut c = funded_campaign(FeeBearer::Seller);
    ctx_at(verifier(), 0, NOW + 1);
    c.report_views("1".into(), vec![]);
}

#[test]
#[should_panic(expected = "Clip tidak ditemukan")]
fn report_for_unknown_clip_is_rejected() {
    let mut c = funded_campaign(FeeBearer::Seller);
    report(&mut c, vec![(99, 1_000_000)]);
}

#[test]
#[should_panic(expected = "Event belum selesai")]
fn cannot_settle_before_event_ends() {
    let mut c = funded_campaign(FeeBearer::Seller);
    ctx_at(stranger(), 0, NOW + 1);
    c.settle_campaign("1".into());
}

#[test]
#[should_panic(expected = "Menunggu verifier melaporkan view")]
fn cannot_settle_before_views_are_reported() {
    let mut c = funded_campaign(FeeBearer::Seller);
    settle(&mut c);
}

#[test]
#[should_panic(expected = "Kampanye belum didanai")]
fn unfunded_campaign_cannot_be_settled() {
    let mut c = setup_with(1, 10 * USD, FeeBearer::Seller, campaign_terms(), 500);
    ctx_at(stranger(), 0, ENDS + 20 * DAY_NS);
    c.settle_campaign("1".into());
}

/// Skenario A: dana biaya promosi cukup. Sisa deposit balik ke penyelenggara, sisa promosi ke treasury.
#[test]
fn settle_pays_rewards_refunds_deposit_and_sends_leftover_to_treasury() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    submit(&mut c, clip1(), "https://www.tiktok.com/@a/video/1");

    // 10 tiket terjual; 2 di antaranya lewat link clip1. Dana promosi terkumpul 10 × 0,3 = 3 USD
    for i in 0..10 {
        let who = AccountId::try_from(format!("buyer{i}.testnet")).unwrap();
        let referrer = if i < 2 { Some("clip1.testnet") } else { None };
        pay_msg(&mut c, who, 10 * USD, buy_msg(referrer));
    }
    assert_eq!(c.get_campaign("1".into()).unwrap().collected.0, 3 * USD);

    // 5 juta view × 0,3 per juta = 1,5 USD; referral 2 × 0,3 = 0,6 USD; total 2,1 USD
    report(&mut c, vec![(1, 5_000_000)]);
    settle(&mut c);

    assert_eq!(c.unclaimed_of(clip1()).0, 2_100_000);
    assert_eq!(c.unclaimed_of(owner()).0, 15 * USD, "deposit kembali utuh");
    assert_eq!(c.unclaimed_of(treasury()).0, 900_000, "sisa dana promosi 3 − 2,1");
    let t = c.get_event("1".into()).unwrap().campaign.unwrap();
    assert!(t.settled && t.views_reported);
    // semua uang tercatat: tidak ada yang hilang
    let credited = c.unclaimed_of(clip1()).0 + c.unclaimed_of(owner()).0 + c.unclaimed_of(treasury()).0;
    assert_eq!(credited, 3 * USD + 15 * USD);
}

/// Skenario B: hadiah melebihi dana promosi, selisihnya diambil dari deposit
#[test]
fn settle_uses_deposit_when_collected_funds_are_not_enough() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    submit(&mut c, clip1(), "https://www.tiktok.com/@a/video/1");
    pay(&mut c, buyer(), 10 * USD); // terkumpul 0,3 USD

    // 4 juta view × 0,3 = 1,2 USD > 0,3 terkumpul: kekurangan 0,9 diambil dari deposit
    report(&mut c, vec![(1, 4_000_000)]);
    settle(&mut c);

    assert_eq!(c.unclaimed_of(clip1()).0, 1_200_000);
    assert_eq!(c.unclaimed_of(owner()).0, 15 * USD - 900_000);
    assert_eq!(c.unclaimed_of(treasury()).0, 0);
}

/// Skenario C: dana kurang walau deposit dipakai, semua hadiah dibayar proporsional
#[test]
fn settle_is_pro_rata_when_total_funds_are_short() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    join(&mut c, clip2());
    submit(&mut c, clip1(), "https://www.tiktok.com/@a/video/1");
    submit(&mut c, clip2(), "https://www.tiktok.com/@b/video/1");
    pay(&mut c, buyer(), 10 * USD); // terkumpul 0,3; deposit 15 -> dana 15,3

    // clip1: 100 juta view = 30 USD; clip2: 50 juta = 15 USD; terutang 45 USD, dana 15,3 USD
    report(&mut c, vec![(1, 100_000_000), (2, 50_000_000)]);
    settle(&mut c);

    let a = c.unclaimed_of(clip1()).0;
    let b = c.unclaimed_of(clip2()).0;
    assert_eq!(a, 10_200_000);
    assert_eq!(b, 5_100_000);
    assert_eq!(a + b, 15_300_000, "seluruh dana terbagi, tidak lebih");
    assert_eq!(c.unclaimed_of(owner()).0, 0, "deposit habis dipakai");
    assert_eq!(c.unclaimed_of(treasury()).0, 0);
}

#[test]
fn settle_after_grace_period_works_without_verifier_and_clips_get_nothing() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    submit(&mut c, clip1(), "https://www.tiktok.com/@a/video/1");
    pay_msg(&mut c, buyer(), 10 * USD, buy_msg(Some("clip1.testnet")));

    ctx_at(stranger(), 0, ENDS + VERIFY_GRACE_NS);
    c.settle_campaign("1".into());
    // view tidak dilaporkan = 0, tapi referral tetap dibayar (0,3)
    assert_eq!(c.unclaimed_of(clip1()).0, 300_000);
    assert_eq!(c.unclaimed_of(owner()).0, 15 * USD);
}

#[test]
#[should_panic(expected = "Kampanye sudah diselesaikan")]
fn campaign_cannot_be_settled_twice() {
    let mut c = funded_campaign(FeeBearer::Seller);
    report(&mut c, vec![]);
    settle(&mut c);
    settle(&mut c);
}

#[test]
fn clipper_claims_reward_after_settlement() {
    let mut c = funded_campaign(FeeBearer::Seller);
    join(&mut c, clip1());
    submit(&mut c, clip1(), "https://www.tiktok.com/@a/video/1");
    pay(&mut c, buyer(), 10 * USD);
    report(&mut c, vec![(1, 2_000_000)]); // 0,6 USD
    settle(&mut c);
    assert_eq!(c.unclaimed_of(clip1()).0, 600_000);

    ctx(clip1(), 0);
    let _ = c.claim_unclaimed();
    assert_eq!(c.unclaimed_of(clip1()).0, 0);
    assert!(ft_transfers().contains(&(clip1().to_string(), 600_000)));
}

// ================================================================ payout gagal

fn callback_ctx(result: PromiseResult) {
    testing_env!(
        VMContextBuilder::new()
            .current_account_id("karcis.testnet".parse().unwrap())
            .predecessor_account_id("karcis.testnet".parse().unwrap())
            .build(),
        test_vm_config(),
        RuntimeFeesConfig::test(),
        Default::default(),
        vec![result]
    );
}

#[test]
fn failed_payout_is_recorded_and_can_be_claimed() {
    let mut c = setup(1, 10 * USD);
    callback_ctx(PromiseResult::Failed);
    c.on_payout(owner(), U128(9_660_000));
    assert_eq!(c.unclaimed_of(owner()), U128(9_660_000));

    ctx(owner(), 0);
    let _ = c.claim_unclaimed();
    assert_eq!(c.unclaimed_of(owner()), U128(0));
    assert!(ft_transfers().contains(&(owner().to_string(), 9_660_000)));
}

#[test]
fn successful_payout_records_nothing() {
    let mut c = setup(1, 10 * USD);
    callback_ctx(PromiseResult::Successful(vec![]));
    c.on_payout(owner(), U128(9_660_000));
    assert_eq!(c.unclaimed_of(owner()), U128(0));
}

#[test]
#[should_panic(expected = "Tidak ada pembayaran yang tertahan")]
fn claim_without_unclaimed_funds_is_rejected() {
    let mut c = setup(1, 10 * USD);
    ctx(owner(), 0);
    let _ = c.claim_unclaimed();
}

// ================================================================ check-in

#[test]
fn check_in_turns_ticket_into_badge_and_adds_stamps() {
    let mut c = setup(2, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(owner(), 0);
    let used = c.check_in(p.id.clone());
    assert_eq!(used.status, PassStatus::Used);
    assert_eq!(used.checked_in_by, Some(owner()));
    assert!(used.checked_in_at.is_some());
    assert_eq!(c.stamps_of(buyer()), 2);
    assert_eq!(c.get_event("1".into()).unwrap().checked_in, 1);
}

#[test]
#[should_panic(expected = "Pass sudah dipakai")]
fn check_in_twice_is_rejected() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(owner(), 0);
    c.check_in(p.id.clone());
    c.check_in(p.id);
}

#[test]
#[should_panic(expected = "Hanya penyelenggara atau petugas scan")]
fn check_in_by_stranger_is_rejected() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(stranger(), 0);
    c.check_in(p.id);
}

#[test]
#[should_panic(expected = "Hanya penyelenggara atau petugas scan")]
fn buyer_cannot_check_in_own_pass() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(buyer(), 0);
    c.check_in(p.id);
}

#[test]
fn scanner_added_by_owner_can_check_in() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(owner(), 0);
    c.add_scanner("1".into(), scanner());
    ctx(scanner(), 0);
    assert_eq!(c.check_in(p.id).status, PassStatus::Used);
}

#[test]
#[should_panic(expected = "Hanya pemilik event")]
fn only_owner_adds_scanner() {
    let mut c = setup(1, 10 * USD);
    ctx(stranger(), 0);
    c.add_scanner("1".into(), scanner());
}

// ================================================================ voting

fn attend(c: &mut Contract, who: AccountId, times: u32) {
    for _ in 0..times {
        let p = buy(c, who.clone());
        ctx(owner(), 0);
        c.check_in(p.id);
    }
}

fn new_poll(c: &mut Contract) -> PollView {
    ctx(owner(), ONE_NEAR);
    c.create_poll("Siapa bintang tamu?".into(), vec!["A".into(), "B".into()])
}

#[test]
fn voting_requires_three_stamps_and_counts_once() {
    let mut c = setup(1, 10 * USD);
    let poll = new_poll(&mut c);

    attend(&mut c, buyer(), 3);
    ctx(buyer(), 0);
    let v = c.vote(poll.id.clone(), 1);
    assert_eq!(v.counts, vec![0, 1]);
    assert_eq!(c.my_vote(poll.id.clone(), buyer()), Some(1));

    ctx(owner(), 0);
    c.close_poll(poll.id.clone());
    assert!(c.get_polls()[0].closed);
}

#[test]
#[should_panic(expected = "Butuh minimal 3 stempel")]
fn voting_blocked_below_three_stamps() {
    let mut c = setup(1, 10 * USD);
    let poll = new_poll(&mut c);
    attend(&mut c, buyer(), 2);
    ctx(buyer(), 0);
    c.vote(poll.id, 0);
}

#[test]
#[should_panic(expected = "Akun ini sudah memilih")]
fn double_vote_is_rejected() {
    let mut c = setup(1, 10 * USD);
    let poll = new_poll(&mut c);
    attend(&mut c, buyer(), 3);
    ctx(buyer(), 0);
    c.vote(poll.id.clone(), 0);
    c.vote(poll.id, 1);
}

#[test]
#[should_panic(expected = "Daftar sebagai penyelenggara dulu")]
fn only_organizer_creates_poll() {
    let mut c = setup(1, 10 * USD);
    ctx(stranger(), ONE_NEAR);
    c.create_poll("Q?".into(), vec!["A".into(), "B".into()]);
}

#[test]
#[should_panic(expected = "Voting sudah ditutup")]
fn closed_poll_rejects_votes() {
    let mut c = setup(1, 10 * USD);
    let poll = new_poll(&mut c);
    ctx(owner(), 0);
    c.close_poll(poll.id.clone());
    attend(&mut c, buyer(), 3);
    ctx(buyer(), 0);
    c.vote(poll.id, 0);
}

#[test]
#[should_panic(expected = "Deposit penyimpanan kurang")]
fn create_poll_requires_storage_deposit() {
    let mut c = setup(1, 10 * USD);
    ctx(owner(), 0);
    c.create_poll("Q?".into(), vec!["A".into(), "B".into()]);
}

#[test]
#[should_panic(expected = "Butuh minimal 3 stempel dari event penyelenggara ini")]
fn stamps_from_other_organizers_do_not_count_for_voting() {
    let mut c = setup(1, 10 * USD);
    // Penyelenggara kedua membuat event "2" dan memberi 3 stempel ke buyer
    ctx(other_org(), ONE_NEAR);
    let mut ev2 = sample_event(1, 10 * USD, FeeBearer::Seller, None, 500);
    ev2.code = "ORG2EV".into();
    c.create_event(ev2);
    for _ in 0..3 {
        pay_msg(&mut c, buyer(), 10 * USD, r#"{"event_id":"2","tier_id":"reguler"}"#.into());
        let p = last_pass(&c, buyer());
        ctx(other_org(), 0);
        c.check_in(p.id);
    }
    assert_eq!(c.stamps_of(buyer()), 3);
    assert_eq!(c.stamps_with(buyer(), other_org()), 3);
    assert_eq!(c.stamps_with(buyer(), owner()), 0);

    let poll = new_poll(&mut c);
    ctx(buyer(), 0);
    c.vote(poll.id, 0);
}

// ================================================================ NFT

#[test]
fn nft_views_expose_pass_as_token() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    let t = c.nft_token(p.id.clone()).unwrap();
    assert_eq!(t.owner_id, buyer());
    assert!(t.metadata.title.unwrap().contains("(Tiket)"));
    assert_eq!(c.nft_tokens_for_owner(buyer(), None, None).len(), 1);
    assert_eq!(c.nft_total_supply(), U128(1));
}

// ================================================================ biaya penyimpanan

/// Laporan biaya penyimpanan (jalankan: cargo test storage_cost_report -- --nocapture)
#[test]
fn storage_cost_report() {
    const BYTE_COST: u128 = 10_000_000_000_000_000_000; // 1e19 yocto per byte
    let near = |bytes: u64| bytes as f64 * BYTE_COST as f64 / 1e24;

    ctx(owner(), 2 * ONE_NEAR);
    let mut c = new_contract();
    let base = env::storage_usage();

    let mut typical = sample_event(1, 10 * USD, FeeBearer::Seller, None, 500);
    typical.description = "Malam gigs rutin kolektif Gelombang Pendek di basement studio. Lima band lokal, sound system seadanya, dan penonton yang saling kenal. Tiketmu jadi lencana permanen setelah discan di pintu masuk.".into();
    typical.image = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200".into();
    typical.lineup = vec![
        LineupItem { name: "Paku Bumi".into(), role: "Penutup".into(), time: "22:15".into() },
        LineupItem { name: "Sore Sunyi".into(), role: "Band tamu".into(), time: "21:00".into() },
        LineupItem { name: "Tetangga Berisik".into(), role: "Pembuka".into(), time: "19:45".into() },
    ];
    c.create_event(typical);
    c.events.flush();
    c.organizers.flush();
    let after_event = env::storage_usage();

    let mut with_campaign = sample_event(1, 10 * USD, FeeBearer::Buyer, campaign_terms(), 500);
    with_campaign.title = "Event dengan kampanye".into();
    with_campaign.code = "CAMP1".into();
    c.create_event(with_campaign);
    c.events.flush();
    c.campaigns.flush();
    let after_campaign_event = env::storage_usage();

    let mut max = sample_event(3, 10 * USD, FeeBearer::Seller, None, 500);
    max.title = "T".repeat(120);
    max.code = "MAXEV1".into();
    max.description = "D".repeat(2000);
    max.image = "I".repeat(500);
    max.organizer_name = "O".repeat(80);
    max.venue = "V".repeat(120);
    max.address = "A".repeat(200);
    max.lineup = (0..12).map(|_| LineupItem { name: "N".repeat(80), role: "R".repeat(60), time: "T".repeat(20) }).collect();
    max.tiers = (0..6)
        .map(|i| Tier { id: format!("tier-{i}"), name: "N".repeat(60), price: U128(0), perk: "P".repeat(160) })
        .collect();
    c.create_event(max);
    c.events.flush();
    let after_max = env::storage_usage();

    c.mint_free_pass("1".into(), "gratis".into());
    c.passes.flush();
    c.owner_passes.flush();
    let after_pass = env::storage_usage();

    c.create_poll(
        "Siapa bintang tamu untuk Gigs Basement Vol. 13 nanti malam?".into(),
        (0..6).map(|i| format!("Pilihan band nomor {i}")).collect(),
    );
    c.polls.flush();
    let after_poll = env::storage_usage();

    println!("\n===== LAPORAN BIAYA PENYIMPANAN (1 byte = 0.00001 NEAR) =====");
    println!("Event tipikal        : {:>5} byte = {:.4} NEAR", after_event - base, near(after_event - base));
    println!(
        "Event + kampanye     : {:>5} byte = {:.4} NEAR",
        after_campaign_event - after_event,
        near(after_campaign_event - after_event)
    );
    println!("Event maksimal       : {:>5} byte = {:.4} NEAR", after_max - after_campaign_event, near(after_max - after_campaign_event));
    println!("Pass pertama         : {:>5} byte = {:.4} NEAR", after_pass - after_max, near(after_pass - after_max));
    println!("Voting 6 pilihan     : {:>5} byte = {:.4} NEAR", after_poll - after_pass, near(after_poll - after_pass));
}

// ================================================================ rincian harga (dicetak)

/// Cetak rincian uang tiap kombinasi (jalankan: cargo test price_breakdown_report -- --nocapture).
/// Skala: tiket 100 USD dibaca sebagai Rp100.000 (1 USD = Rp1.000) supaya mudah dibandingkan dengan contoh.
#[test]
fn price_breakdown_report() {
    let rp = |units: u128| {
        let v = units / 1_000; // 1_000 unit token = Rp1
        let s = v.to_string();
        let mut out = String::new();
        for (i, ch) in s.chars().rev().enumerate() {
            if i > 0 && i % 3 == 0 {
                out.push('.');
            }
            out.push(ch);
        }
        format!("Rp{}", out.chars().rev().collect::<String>())
    };

    println!("\n===== RINCIAN HARGA TIKET Rp100.000 =====");
    for (campaign, label) in [(None, "TANPA kampanye"), (campaign_terms(), "DENGAN kampanye")] {
        for bearer in [FeeBearer::Buyer, FeeBearer::Seller] {
            let c = setup_with(1, 100 * USD, bearer, campaign.as_ref().map(|c| NewCampaign {
                clip_rate_per_million: c.clip_rate_per_million,
                referral_reward: c.referral_reward,
            }), 500);
            let q = c.quote("1".into(), "reguler".into());
            let who = if bearer == FeeBearer::Buyer { "ditanggung PEMBELI" } else { "ditanggung PENJUAL" };
            println!("\n[{label}, biaya {who}]");
            println!("  Harga tiket              : {}", rp(q.price.0));
            println!("  Biaya platform 3,4%      : {}   (ke platform)", rp(q.platform_fee.0));
            println!("  Biaya promosi            : {}   (clip {} + referral {})", rp(q.promo_fee.0), rp(q.clip_pool.0), rp(q.referral_pool.0));
            println!("  PEMBELI BAYAR            : {}", rp(q.total.0));
            println!("  PENYELENGGARA TERIMA     : {}", rp(q.seller_receives.0));
            // semua uang pembeli habis terbagi: penjual + platform + dana promosi
            assert_eq!(q.total.0, q.seller_receives.0 + q.platform_fee.0 + q.promo_fee.0);
        }
    }
}

#[test]
#[should_panic(expected = "Treasury tidak boleh sama dengan akun kontrak")]
fn treasury_cannot_be_the_contract_account() {
    testing_env!(VMContextBuilder::new()
        .current_account_id("pass.karcis.testnet".parse().unwrap())
        .predecessor_account_id(owner())
        .build());
    Contract::new(token(), "pass.karcis.testnet".parse().unwrap(), verifier(), U128(500_000));
}

// ================================================================ kode event, ID & nama NFT

fn setup_event(ev: NewEvent) -> Contract {
    ctx(owner(), ONE_NEAR);
    let mut c = new_contract();
    c.create_event(ev);
    c
}

#[test]
fn pass_id_uses_event_code_and_serial_restarts_per_event() {
    let mut c = setup(1, 10 * USD);
    ctx(other_org(), ONE_NEAR);
    let mut ev2 = sample_event(1, 10 * USD, FeeBearer::Seller, None, 500);
    ev2.code = "ORG2EV".into();
    c.create_event(ev2);

    pay(&mut c, buyer(), 20 * USD);
    pay(&mut c, stranger(), 20 * USD);
    pay_msg(&mut c, scanner(), 20 * USD, r#"{"event_id":"2","tier_id":"reguler"}"#.into());

    assert_eq!(last_pass(&c, buyer()).id, "GIGS12-0001");
    assert_eq!(last_pass(&c, stranger()).id, "GIGS12-0002");
    assert_eq!(last_pass(&c, scanner()).id, "ORG2EV-0001");
    assert_eq!(last_pass(&c, stranger()).serial, 2);
    assert!(c.get_pass("GIGS12-0002".into()).is_some());
}

#[test]
fn free_pass_also_uses_event_code() {
    let mut c = setup(1, 10 * USD);
    ctx(buyer(), ONE_NEAR);
    assert_eq!(c.mint_free_pass("1".into(), "gratis".into()).id, "GIGS12-0001");
}

#[test]
#[should_panic(expected = "Kode event sudah dipakai")]
fn duplicate_event_code_is_rejected() {
    let mut c = setup(1, 10 * USD);
    ctx(other_org(), ONE_NEAR);
    c.create_event(sample_event(1, 10 * USD, FeeBearer::Seller, None, 500)); // kode GIGS12 lagi
}

#[test]
#[should_panic(expected = "Kode event harus 3 sampai 8 huruf besar atau angka")]
fn event_code_rejects_lowercase() {
    let mut ev = sample_event(1, USD, FeeBearer::Seller, None, 10);
    ev.code = "gigs12".into();
    setup_event(ev);
}

#[test]
#[should_panic(expected = "Kode event harus 3 sampai 8 huruf besar atau angka")]
fn event_code_rejects_too_short() {
    let mut ev = sample_event(1, USD, FeeBearer::Seller, None, 10);
    ev.code = "AB".into();
    setup_event(ev);
}

#[test]
#[should_panic(expected = "Kode event harus 3 sampai 8 huruf besar atau angka")]
fn event_code_rejects_too_long() {
    let mut ev = sample_event(1, USD, FeeBearer::Seller, None, 10);
    ev.code = "ABCDEFGHI".into();
    setup_event(ev);
}

#[test]
#[should_panic(expected = "Kode event harus 3 sampai 8 huruf besar atau angka")]
fn event_code_rejects_symbols() {
    let mut ev = sample_event(1, USD, FeeBearer::Seller, None, 10);
    ev.code = "GIGS-12".into();
    setup_event(ev);
}

#[test]
fn event_code_accepts_letters_and_digits() {
    for code in ["ABC", "GIGS12", "12345678", "A1B2C3D4"] {
        let mut ev = sample_event(1, USD, FeeBearer::Seller, None, 10);
        ev.code = code.into();
        let c = setup_event(ev);
        assert_eq!(c.get_event("1".into()).unwrap().code, code);
    }
}

#[test]
fn event_can_be_found_by_code() {
    let c = setup(1, 10 * USD);
    assert_eq!(c.get_event_by_code("GIGS12".into()).unwrap().id, "1");
    assert!(c.get_event_by_code("NOPE1".into()).is_none());
}

#[test]
fn nft_name_defaults_to_event_title_with_serial_and_status() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    let t = c.nft_token(p.id).unwrap();
    assert_eq!(t.token_id, "GIGS12-0001");
    assert_eq!(t.metadata.title.unwrap(), "Gigs Basement Vol. 12 #0001 (Tiket)");
}

#[test]
fn organizer_chosen_nft_name_is_used_and_status_changes_after_check_in() {
    let mut ev = sample_event(1, 10 * USD, FeeBearer::Seller, None, 500);
    ev.nft_name = Some("  Malam Pembuka  ".into());
    let mut c = setup_event(ev);
    let p = buy(&mut c, buyer());
    assert_eq!(c.nft_token(p.id.clone()).unwrap().metadata.title.unwrap(), "Malam Pembuka #0001 (Tiket)");

    ctx(owner(), 0);
    c.check_in(p.id.clone());
    assert_eq!(c.nft_token(p.id).unwrap().metadata.title.unwrap(), "Malam Pembuka #0001 (Lencana)");
}

#[test]
fn blank_nft_name_falls_back_to_title() {
    let mut ev = sample_event(1, 10 * USD, FeeBearer::Seller, None, 500);
    ev.nft_name = Some("   ".into());
    let mut c = setup_event(ev);
    let p = buy(&mut c, buyer());
    assert_eq!(c.nft_token(p.id).unwrap().metadata.title.unwrap(), "Gigs Basement Vol. 12 #0001 (Tiket)");
}

#[test]
#[should_panic(expected = "Nama NFT terlalu panjang")]
fn nft_name_length_is_limited() {
    let mut ev = sample_event(1, USD, FeeBearer::Seller, None, 10);
    ev.nft_name = Some("N".repeat(121));
    setup_event(ev);
}

#[test]
fn badge_image_replaces_ticket_image_only_after_check_in() {
    let mut ev = sample_event(1, 10 * USD, FeeBearer::Seller, None, 500);
    ev.badge_image = Some("https://example.com/badge.png".into());
    let mut c = setup_event(ev);
    let p = buy(&mut c, buyer());
    assert_eq!(c.nft_token(p.id.clone()).unwrap().metadata.media.unwrap(), "https://example.com/a.jpg");

    ctx(owner(), 0);
    c.check_in(p.id.clone());
    assert_eq!(c.nft_token(p.id).unwrap().metadata.media.unwrap(), "https://example.com/badge.png");
}

#[test]
fn without_badge_image_media_stays_the_event_image() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(owner(), 0);
    c.check_in(p.id.clone());
    assert_eq!(c.nft_token(p.id).unwrap().metadata.media.unwrap(), "https://example.com/a.jpg");
}

// ------------------------------------------------------------------
// Registri penyelenggara
// ------------------------------------------------------------------

#[test]
fn register_organizer_stores_profile_on_chain() {
    let mut c = bare_contract();
    ctx_at(buyer(), ONE_NEAR / 10, NOW);
    let v = c.register_organizer(org_profile("  Basement Kolektif "));
    assert_eq!(v.profile.name, "Basement Kolektif");
    assert_eq!(v.profile.org_type, "kolektif");
    assert_eq!(v.status, OrganizerStatus::Active);
    assert_eq!(v.registered_at.0, NOW);
    let got = c.get_organizer(buyer()).unwrap();
    assert_eq!(got.profile.contact, "@gelombangpendek");
    assert_eq!(got.reports, 0);
    assert!(c.is_organizer(buyer()));
    assert_eq!(c.organizers_count(), 1);
    assert_eq!(c.get_organizers(0, 10).len(), 1);
    assert!(c.get_organizer(stranger()).is_none());
}

#[test]
#[should_panic(expected = "sudah terdaftar")]
fn register_organizer_twice_is_rejected() {
    let mut c = bare_contract();
    register(&mut c, buyer());
    register(&mut c, buyer());
}

#[test]
#[should_panic(expected = "Kontak wajib diisi")]
fn register_organizer_requires_contact() {
    let mut c = bare_contract();
    ctx(buyer(), ONE_NEAR / 10);
    let mut p = org_profile("Basement Kolektif");
    p.contact = "  ".into();
    c.register_organizer(p);
}

#[test]
#[should_panic(expected = "Nama penyelenggara minimal 2 karakter")]
fn register_organizer_requires_name() {
    let mut c = bare_contract();
    ctx(buyer(), ONE_NEAR / 10);
    c.register_organizer(org_profile("A"));
}

#[test]
#[should_panic(expected = "Deposit penyimpanan kurang")]
fn register_organizer_requires_storage_deposit() {
    let mut c = bare_contract();
    ctx(buyer(), 0);
    c.register_organizer(org_profile("Basement Kolektif"));
}

#[test]
#[should_panic(expected = "Daftar sebagai penyelenggara dulu")]
fn create_event_requires_registration() {
    let mut c = bare_contract();
    ctx(buyer(), ONE_NEAR);
    c.create_event(sample_event(1, USD, FeeBearer::Seller, None, 10));
}

#[test]
fn suspend_blocks_new_events_polls_and_sales_until_reinstated() {
    let mut c = setup(1, 10 * USD);
    // satu pembelian sebelum ditangguhkan
    let p = buy(&mut c, buyer());

    ctx(admin(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Laporan penipuan dari beberapa pembeli".into());
    let v = c.get_organizer(owner()).unwrap();
    assert_eq!(v.status, OrganizerStatus::Suspended);
    assert_eq!(v.cases.len(), 1);
    assert_eq!(v.cases[0].kind, CaseKind::Suspend);
    assert_eq!(v.cases[0].by, admin());
    assert!(!c.is_organizer(owner()));

    // check-in pembeli yang sudah bayar tetap boleh saat ditangguhkan
    ctx(owner(), 0);
    let used = c.check_in(p.id);
    assert_eq!(used.status, PassStatus::Used);

    // dipulihkan: semuanya jalan lagi
    ctx(admin(), ONE_NEAR / 100);
    c.reinstate_organizer(owner(), "Sudah diselesaikan dengan pembeli".into());
    assert_eq!(c.get_organizer(owner()).unwrap().status, OrganizerStatus::Active);
    assert_eq!(c.get_organizer(owner()).unwrap().cases.len(), 2);
    let again = buy(&mut c, stranger());
    assert_eq!(again.serial, 2);
}

#[test]
#[should_panic(expected = "sedang ditangguhkan")]
fn suspended_organizer_cannot_create_event() {
    let mut c = setup(1, USD);
    ctx(admin(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Sedang diselidiki".into());
    let mut ev = sample_event(1, USD, FeeBearer::Seller, None, 10);
    ev.code = "BARU01".into();
    ctx(owner(), ONE_NEAR);
    c.create_event(ev);
}

#[test]
#[should_panic(expected = "sedang ditangguhkan")]
fn suspended_organizer_cannot_create_poll() {
    let mut c = setup(1, USD);
    ctx(admin(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Sedang diselidiki".into());
    ctx(owner(), ONE_NEAR / 10);
    c.create_poll("Q?".into(), vec!["A".into(), "B".into()]);
}

#[test]
#[should_panic(expected = "Penjualan dihentikan")]
fn suspended_organizer_paid_sales_are_stopped() {
    let mut c = setup(1, 10 * USD);
    ctx(admin(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Sedang diselidiki".into());
    let _ = buy(&mut c, buyer());
}

#[test]
#[should_panic(expected = "Penjualan dihentikan")]
fn suspended_organizer_free_passes_are_stopped() {
    let mut c = setup(1, 10 * USD);
    ctx(admin(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Sedang diselidiki".into());
    ctx(buyer(), ONE_NEAR / 100);
    c.mint_free_pass("1".into(), "gratis".into());
}

#[test]
#[should_panic(expected = "diblokir, check-in ditolak")]
fn banned_organizer_check_in_is_rejected() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(admin(), ONE_NEAR / 100);
    c.ban_organizer(owner(), "Terbukti menipu".into());
    assert_eq!(c.get_organizer(owner()).unwrap().status, OrganizerStatus::Banned);
    ctx(owner(), 0);
    c.check_in(p.id);
}

#[test]
#[should_panic(expected = "Hanya admin")]
fn only_admin_can_suspend() {
    let mut c = setup(1, USD);
    ctx(stranger(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Coba-coba menangguhkan".into());
}

#[test]
#[should_panic(expected = "Alasan wajib diisi")]
fn admin_action_requires_reason() {
    let mut c = setup(1, USD);
    ctx(admin(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "  ".into());
}

#[test]
#[should_panic(expected = "Hanya penyelenggara aktif yang bisa ditangguhkan")]
fn cannot_suspend_twice() {
    let mut c = setup(1, USD);
    ctx(admin(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Sedang diselidiki".into());
    c.suspend_organizer(owner(), "Sekali lagi".into());
}

#[test]
fn admin_can_be_handed_over() {
    let mut c = setup(1, USD);
    ctx(admin(), 0);
    c.set_admin(stranger());
    assert_eq!(c.get_admin(), stranger());
    ctx(stranger(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Admin baru menangguhkan".into());
    assert_eq!(c.get_organizer(owner()).unwrap().status, OrganizerStatus::Suspended);
}

#[test]
fn buyer_with_pass_can_report_once() {
    let mut c = setup(1, 10 * USD);
    let _ = buy(&mut c, buyer());
    ctx(buyer(), ONE_NEAR / 100);
    c.report_organizer(owner(), "Acara tidak sesuai deskripsi dan tidak ada refund".into());
    let v = c.get_organizer(owner()).unwrap();
    assert_eq!(v.reports, 1);
    assert_eq!(v.cases[0].kind, CaseKind::Report);
    assert_eq!(v.cases[0].by, buyer());
    // laporan tidak menangguhkan otomatis
    assert_eq!(v.status, OrganizerStatus::Active);
}

#[test]
#[should_panic(expected = "sudah melaporkan")]
fn duplicate_report_is_rejected() {
    let mut c = setup(1, 10 * USD);
    let _ = buy(&mut c, buyer());
    ctx(buyer(), ONE_NEAR / 100);
    c.report_organizer(owner(), "Acara tidak sesuai deskripsi dan tidak ada refund".into());
    ctx(buyer(), ONE_NEAR / 100);
    c.report_organizer(owner(), "Laporan kedua dengan alasan yang sama".into());
}

#[test]
#[should_panic(expected = "Hanya pemegang pass")]
fn report_requires_a_pass_from_that_organizer() {
    let mut c = setup(1, 10 * USD);
    ctx(stranger(), ONE_NEAR / 100);
    c.report_organizer(owner(), "Saya tidak pernah datang tapi melapor".into());
}

#[test]
#[should_panic(expected = "Hanya pemegang pass")]
fn pass_from_another_organizer_does_not_allow_report() {
    let mut c = setup(1, 10 * USD);
    let _ = buy(&mut c, buyer());
    ctx(buyer(), ONE_NEAR / 100);
    c.report_organizer(other_org(), "Saya hanya punya pass dari penyelenggara lain".into());
}

#[test]
#[should_panic(expected = "Alasan laporan minimal 10 karakter")]
fn report_needs_a_real_reason() {
    let mut c = setup(1, 10 * USD);
    let _ = buy(&mut c, buyer());
    ctx(buyer(), ONE_NEAR / 100);
    c.report_organizer(owner(), "buruk".into());
}

#[test]
fn migrate_keeps_all_data_and_adds_empty_market() {
    // kontrak dengan satu event, satu pass, dan organizer terdaftar (layout V2)
    let mut donor = setup(1, 10 * USD);
    let p = buy(&mut donor, buyer());
    let ev = donor.get_event("1".into()).unwrap();
    let pass = donor.get_pass(p.id.clone()).unwrap();
    let org = donor.organizers.get(&owner()).unwrap().clone();

    let _ = near_sdk::mock::with_mocked_blockchain(|b| b.take_storage());
    let me: AccountId = "pass.testnet".parse().unwrap();
    testing_env!(VMContextBuilder::new()
        .current_account_id(me.clone())
        .predecessor_account_id(me.clone())
        .block_timestamp(NOW)
        .build());

    let mut events: IterableMap<String, Event> = IterableMap::new(StorageKey::Events);
    events.insert("1".into(), ev);
    events.flush();
    let mut passes: LookupMap<String, Pass> = LookupMap::new(StorageKey::Passes);
    passes.insert(p.id.clone(), pass);
    passes.flush();
    let mut owner_passes: LookupMap<AccountId, Vec<String>> = LookupMap::new(StorageKey::OwnerPasses);
    owner_passes.insert(buyer(), vec![p.id.clone()]);
    owner_passes.flush();
    let mut organizers: IterableMap<AccountId, OrganizerRecord> = IterableMap::new(StorageKey::OrganizerRecords);
    organizers.insert(owner(), org);
    organizers.flush();
    let old = ContractV2 {
        events,
        passes,
        owner_passes,
        organizers,
        polls: IterableMap::new(StorageKey::Polls),
        campaigns: LookupMap::new(StorageKey::Campaigns),
        event_codes: LookupMap::new(StorageKey::EventCodes),
        unclaimed: LookupMap::new(StorageKey::Unclaimed),
        stable_token: token(),
        treasury: treasury(),
        verifier: verifier(),
        admin: stranger(),
        min_paid_price: 500_000,
        next_event: 1,
        next_pass: 1,
        next_poll: 0,
    };
    env::state_write(&old);

    let c = Contract::migrate();
    assert_eq!(c.get_admin(), stranger());
    assert!(c.get_event("1".into()).is_some());
    assert_eq!(c.get_pass(p.id.clone()).unwrap().owner, buyer());
    assert!(c.is_organizer(owner()));
    assert_eq!(c.listings_count(), 0);
    assert_eq!(c.nft_total_supply().0, 1);
}

#[test]
fn organizer_can_move_city_and_history_keeps_the_old_value() {
    let mut c = setup(1, USD);
    ctx(owner(), ONE_NEAR / 100);
    let mut p = org_profile("Kolektif Gelombang Pendek");
    p.city = "Jakarta".into();
    p.contact = "@gelombang.jkt".into();
    let v = c.update_organizer_profile(p);
    assert_eq!(v.profile.city, "Jakarta");
    assert_eq!(v.profile.contact, "@gelombang.jkt");
    // pindah kota bukan laporan dan tidak mengubah status
    assert_eq!(v.reports, 0);
    assert_eq!(v.status, OrganizerStatus::Active);
    assert_eq!(v.cases.len(), 1);
    assert_eq!(v.cases[0].kind, CaseKind::ProfileUpdate);
    assert_eq!(v.cases[0].by, owner());
    assert!(v.cases[0].reason.contains("kota: Bandung -> Jakarta"));
    assert!(v.cases[0].reason.contains("kontak: @gelombangpendek -> @gelombang.jkt"));
    // event yang sudah dibuat tidak berubah
    assert_eq!(c.get_event("1".into()).unwrap().city, "Bandung");
}

#[test]
#[should_panic(expected = "Tidak ada perubahan")]
fn profile_update_requires_a_change() {
    let mut c = setup(1, USD);
    ctx(owner(), ONE_NEAR / 100);
    c.update_organizer_profile(org_profile("Kolektif Gelombang Pendek"));
}

#[test]
#[should_panic(expected = "Penyelenggara tidak terdaftar")]
fn profile_update_requires_registration() {
    let mut c = setup(1, USD);
    ctx(stranger(), ONE_NEAR / 100);
    let mut p = org_profile("Siapa Saja");
    p.city = "Medan".into();
    c.update_organizer_profile(p);
}

#[test]
#[should_panic(expected = "diblokir tidak bisa mengubah profil")]
fn banned_organizer_cannot_rewrite_profile() {
    let mut c = setup(1, USD);
    ctx(admin(), ONE_NEAR / 100);
    c.ban_organizer(owner(), "Terbukti menipu".into());
    ctx(owner(), ONE_NEAR / 100);
    let mut p = org_profile("Nama Baru Biar Tidak Ketahuan");
    p.city = "Surabaya".into();
    c.update_organizer_profile(p);
}

#[test]
fn suspended_organizer_can_update_profile_and_history_stays_ordered() {
    let mut c = setup(1, USD);
    ctx(admin(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Sedang diselidiki".into());
    ctx(owner(), ONE_NEAR / 100);
    let mut p = org_profile("Kolektif Gelombang Pendek");
    p.city = "Yogyakarta".into();
    let v = c.update_organizer_profile(p);
    assert_eq!(v.status, OrganizerStatus::Suspended);
    let kinds: Vec<CaseKind> = v.cases.iter().map(|x| x.kind).collect();
    assert_eq!(kinds, vec![CaseKind::Suspend, CaseKind::ProfileUpdate]);
}

// ------------------------------------------------------------------
// Pasar tiket (jual ulang): pass lama di-burn, pembeli dapat pass baru
// ------------------------------------------------------------------

fn resale_msg(pass_id: &str) -> String {
    format!(r#"{{"action":"buy_resale","pass_id":"{pass_id}"}}"#)
}

/// Pass milik buyer() sudah terdaftar di pasar dengan harga 8 USD (harga asli 10 USD)
fn listed() -> (Contract, Pass) {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(buyer(), ONE_NEAR / 100);
    c.list_pass_for_resale(p.id.clone(), U128(8 * USD));
    (c, p)
}

#[test]
fn listing_shows_price_fee_and_face_value() {
    let (c, p) = listed();
    let l = c.get_listing(p.id.clone()).unwrap();
    assert_eq!(l.seller, buyer());
    assert_eq!(l.price.0, 8 * USD);
    assert_eq!(l.face_value.0, 10 * USD);
    assert_eq!(l.platform_fee.0, 272_000); // 3,4% dari 8 USD
    assert_eq!(l.seller_receives.0, 8 * USD - 272_000);
    assert_eq!(c.listings_count(), 1);
    assert_eq!(c.get_listings(0, 10).len(), 1);
}

#[test]
fn buying_a_listing_burns_the_old_pass_and_mints_a_new_one() {
    let (mut c, old) = listed();
    let supply_before = c.nft_total_supply().0;
    let unused = pay_msg(&mut c, stranger(), 8 * USD, resale_msg(&old.id));
    assert_eq!(unused, 0);

    // pass lama hilang dari penjual dan dari kontrak
    assert!(c.get_pass(old.id.clone()).is_none());
    assert!(c.nft_token(old.id.clone()).is_none());
    assert!(c.passes_for_owner(buyer()).is_empty());
    assert!(c.get_listing(old.id.clone()).is_none());
    assert_eq!(c.listings_count(), 0);

    // pembeli baru memegang pass baru dengan nomor urut di atas kapasitas
    let fresh = last_pass(&c, stranger());
    assert_ne!(fresh.id, old.id);
    assert_eq!(fresh.id, "GIGS12-0501");
    assert_eq!(fresh.serial, 501);
    assert_eq!(fresh.status, PassStatus::Valid);
    assert_eq!(fresh.tier_id, old.tier_id);
    assert_eq!(fresh.stamps, old.stamps);
    assert_eq!(fresh.event_id, old.event_id);

    // kapasitas dan hitungan terjual tidak berubah; suplai NFT tetap (1 burn, 1 mint)
    let e = c.get_event("1".into()).unwrap();
    assert_eq!(e.sold, 1);
    assert_eq!(c.nft_total_supply().0, supply_before);
}

#[test]
fn resale_pays_seller_minus_platform_fee() {
    let (mut c, old) = listed();
    pay_msg(&mut c, stranger(), 8 * USD, resale_msg(&old.id));
    let t = ft_transfers();
    let to = |who: &str| t.iter().filter(|(r, _)| r == who).map(|(_, a)| *a).sum::<u128>();
    assert_eq!(to(buyer().as_str()), 8 * USD - 272_000);
    assert_eq!(to(treasury().as_str()), 272_000);
    // seluruh pembayaran habis dibagi
    assert_eq!(t.iter().map(|(_, a)| *a).sum::<u128>(), 8 * USD);
}

#[test]
fn resale_overpayment_is_returned() {
    let (mut c, old) = listed();
    let unused = pay_msg(&mut c, stranger(), 11 * USD, resale_msg(&old.id));
    assert_eq!(unused, 3 * USD);
}

#[test]
fn multiple_resales_get_unique_serials() {
    let (mut c, old) = listed();
    pay_msg(&mut c, stranger(), 8 * USD, resale_msg(&old.id));
    let first = last_pass(&c, stranger());
    // pembeli kedua menjual lagi, pembeli ketiga membeli
    ctx(stranger(), ONE_NEAR / 100);
    c.list_pass_for_resale(first.id.clone(), U128(7 * USD));
    pay_msg(&mut c, scanner(), 7 * USD, resale_msg(&first.id));
    let second = last_pass(&c, scanner());
    assert_eq!(first.id, "GIGS12-0501");
    assert_eq!(second.id, "GIGS12-0502");
    assert!(c.get_pass(first.id).is_none());
}

#[test]
#[should_panic(expected = "tidak boleh melebihi harga asli")]
fn resale_price_cannot_exceed_face_value() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(buyer(), ONE_NEAR / 100);
    c.list_pass_for_resale(p.id, U128(10 * USD + 1));
}

#[test]
fn resale_at_face_value_is_allowed() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(buyer(), ONE_NEAR / 100);
    assert_eq!(c.list_pass_for_resale(p.id, U128(10 * USD)).price.0, 10 * USD);
}

#[test]
#[should_panic(expected = "Hanya pemilik pass")]
fn only_the_owner_can_list() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(stranger(), ONE_NEAR / 100);
    c.list_pass_for_resale(p.id, U128(5 * USD));
}

#[test]
#[should_panic(expected = "sudah dijual")]
fn cannot_list_twice() {
    let (mut c, p) = listed();
    ctx(buyer(), ONE_NEAR / 100);
    c.list_pass_for_resale(p.id, U128(7 * USD));
}

#[test]
#[should_panic(expected = "Pass gratis tidak bisa dijual ulang")]
fn free_passes_cannot_be_resold() {
    let mut c = setup(1, 10 * USD);
    ctx(buyer(), ONE_NEAR / 100);
    let free = c.mint_free_pass("1".into(), "gratis".into());
    ctx(buyer(), ONE_NEAR / 100);
    c.list_pass_for_resale(free.id, U128(USD));
}

#[test]
#[should_panic(expected = "di bawah harga minimum")]
fn resale_price_has_a_floor() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(buyer(), ONE_NEAR / 100);
    c.list_pass_for_resale(p.id, U128(1));
}

#[test]
#[should_panic(expected = "sudah dipakai tidak bisa dijual")]
fn used_pass_cannot_be_listed() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(owner(), 0);
    c.check_in(p.id.clone());
    ctx(buyer(), ONE_NEAR / 100);
    c.list_pass_for_resale(p.id, U128(5 * USD));
}

#[test]
#[should_panic(expected = "Deposit penyimpanan kurang")]
fn listing_needs_a_storage_deposit() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx(buyer(), 0);
    c.list_pass_for_resale(p.id, U128(5 * USD));
}

#[test]
fn seller_can_cancel_and_nobody_else() {
    let (mut c, p) = listed();
    ctx(buyer(), 0);
    c.cancel_resale(p.id.clone());
    assert!(c.get_listing(p.id.clone()).is_none());
    // pass tetap milik penjual
    assert_eq!(c.get_pass(p.id).unwrap().owner, buyer());
}

#[test]
#[should_panic(expected = "Hanya penjual")]
fn stranger_cannot_cancel_a_listing() {
    let (mut c, p) = listed();
    ctx(stranger(), 0);
    c.cancel_resale(p.id);
}

#[test]
#[should_panic(expected = "Pass ini tidak sedang dijual")]
fn cancelled_listing_cannot_be_bought() {
    let (mut c, p) = listed();
    ctx(buyer(), 0);
    c.cancel_resale(p.id.clone());
    pay_msg(&mut c, stranger(), 8 * USD, resale_msg(&p.id));
}

#[test]
#[should_panic(expected = "Pembayaran kurang dari harga jual")]
fn underpaying_a_listing_is_rejected() {
    let (mut c, p) = listed();
    pay_msg(&mut c, stranger(), 8 * USD - 1, resale_msg(&p.id));
}

#[test]
#[should_panic(expected = "Tidak bisa membeli pass sendiri")]
fn seller_cannot_buy_own_listing() {
    let (mut c, p) = listed();
    pay_msg(&mut c, buyer(), 8 * USD, resale_msg(&p.id));
}

#[test]
#[should_panic(expected = "Pass ini tidak sedang dijual")]
fn checking_in_removes_the_listing() {
    let (mut c, p) = listed();
    ctx(owner(), 0);
    c.check_in(p.id.clone());
    assert!(c.get_listing(p.id.clone()).is_none());
    pay_msg(&mut c, stranger(), 8 * USD, resale_msg(&p.id));
}

#[test]
#[should_panic(expected = "Penjualan dihentikan")]
fn suspended_organizer_stops_resale_purchases() {
    let (mut c, p) = listed();
    ctx(admin(), ONE_NEAR / 100);
    c.suspend_organizer(owner(), "Sedang diselidiki".into());
    pay_msg(&mut c, stranger(), 8 * USD, resale_msg(&p.id));
}

#[test]
#[should_panic(expected = "Penjualan sudah ditutup")]
fn resale_closes_when_the_event_ends() {
    let (mut c, p) = listed();
    ctx_at(token(), 0, ENDS + 1);
    let _ = c.ft_on_transfer(stranger(), U128(8 * USD), resale_msg(&p.id));
}

#[test]
#[should_panic(expected = "Event sudah selesai")]
fn cannot_list_after_the_event_ends() {
    let mut c = setup(1, 10 * USD);
    let p = buy(&mut c, buyer());
    ctx_at(buyer(), ONE_NEAR / 100, ENDS + 1);
    c.list_pass_for_resale(p.id, U128(5 * USD));
}

#[test]
fn new_pass_owner_can_check_in_and_gets_the_stamps() {
    let (mut c, old) = listed();
    pay_msg(&mut c, stranger(), 8 * USD, resale_msg(&old.id));
    let fresh = last_pass(&c, stranger());
    ctx(owner(), 0);
    c.check_in(fresh.id.clone());
    assert_eq!(c.stamps_of(stranger()), 1);
    assert_eq!(c.stamps_of(buyer()), 0);
    assert_eq!(c.get_event("1".into()).unwrap().checked_in, 1);
}
