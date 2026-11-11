/**
 * Smart pass: satu aset untuk dua fase.
 * - VALID: tiket, belum discan (ada QR untuk pintu masuk)
 * - USED : sudah discan, berubah jadi lencana permanen + stempel
 *
 * Data utamanya dari kontrak (ChainPass); field event digabung dari data event untuk tampilan.
 */
export type PassStatus = "VALID" | "USED";

export interface Pass {
  /** ID token: `{KODE EVENT}-{nomor urut}`, mis. GIGS12-0042 */
  id: string;
  serial: number;
  eventId: string;
  eventCode: string;
  eventTitle: string;
  /** Nama NFT yang dipilih penyelenggara */
  nftName: string;
  organizer: string;
  /** Akun NEAR pemilik event (dipakai untuk stempel per penyelenggara) */
  organizerAccount: string;
  city: string;
  venue: string;
  dateFull: string;
  time: string;
  /** Gambar yang tampil: gambar lencana jika sudah discan dan penyelenggara mengisinya, selain itu gambar event */
  image: string;
  tierId: string;
  tierName: string;
  /** Akun NEAR pemilik pass */
  owner: string;
  status: PassStatus;
  stamps: number;
  mintedAt: string; // ISO
  checkedInAt?: string; // ISO
  checkedInBy?: string;
}
