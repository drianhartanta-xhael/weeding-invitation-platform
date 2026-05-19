# Design Spec — Template "Floral Watercolor" (Replika Undangan Dega & Lauditta)

**Tanggal:** 2026-05-19
**Status:** Disetujui untuk masuk tahap perencanaan
**Referensi visual:** https://degadittaday.my.canva.site/ (di-capture 2026-05-19, 10 screenshot)

## 1. Ringkasan

Membuat replika visual undangan Canva "Dega & Ditta" di dalam platform, sebagai
**template baru bergaya floral watercolor** yang bisa dipakai ulang klien lain.
Target: tampilan akhir undangan klien Dega & Lauditta semirip mungkin dengan
desain Canva tersebut.

Pendekatan: **mengikuti arsitektur platform yang sudah ada** (Template + Decoration
style + slot component) — bukan halaman bespoke. Dengan begitu tema floral menjadi
aset reusable dan konsisten dengan sistem Nusantara yang sudah ada.

## 2. Konteks Arsitektur Saat Ini

- Rendering undangan: dual-mode di `apps/invitation/src/app/[slug]/page.tsx`.
  `sections.length > 0` → slot system; selain itu → legacy. Template floral pakai slot system.
- Tiap section: `{ id, componentId, data, style, order }`. `data` bertipe `Mixed`
  (bebas), `style` merujuk ke style preset.
- Komponen tersedia (`COMPONENT_REGISTRY` di `packages/shared/src/types/components.ts`):
  cover, couple-profile, event-detail, gallery, donation, rsvp, wishes, countdown,
  story, location-map.
- Decoration system: `DECORATION_REGISTRY` (`apps/invitation/src/lib/decorations/registry.ts`)
  memetakan `decorationStyle` → `DecorationConfig` (colors + `HeroDecor`/`SectionDecor`/`FooterDecor`).
  Dekorasi existing (jawa, bali, dst.) digambar sebagai **SVG vektor**.
- `Template` doc: `config` (warna + font), `defaultSections`, `stylePresets`.
- Musik: `MusicPlayer` global, sumber dari `Client.music` — sudah berfungsi, tidak perlu komponen.

## 3. Inventaris Desain Canva → Pemetaan

Halaman Canva = 1 halaman scroll (±8000px), 9 bagian:

| # | Bagian Canva | Penanganan di platform |
|---|--------------|------------------------|
| 1 | Hero — nama script, tanggal, venue, **foto pasangan** | `Hero` (built-in) + upgrade foto |
| 2 | Mempelai & orang tua (nama script, "first son/daughter of", foto) | komponen `couple-profile` |
| 3 | Galeri foto + caption | komponen `gallery` |
| 4 | Venue "Hilton Garden Inn Bali Nusa Dua" + tombol Google Maps | komponen `location-map` |
| 5 | Itinerary hari-H (Welcome Cocktail, Dinner Reception) | komponen `event-detail` (restyle) |
| 6 | Dress Code (Gentlemen / Ladies + ilustrasi figur) | komponen **`dress-code` (baru)** |
| 7 | RSVP (form nama + Yes/No) | komponen `rsvp` |
| 8 | Wedding Gift (rekening BCA, nomor bisa di-copy) | komponen `donation` |
| 9 | Thank You + Wishes (form ucapan) | komponen `wishes` |

Gaya visual Canva: background krem, aksen pink, ornamen **bunga cat air**, ilustrasi
tangan (cupid, cincin, mobil vintage, gelas sampanye, figur dress code), heading
**font kaligrafi/script**.

**Tambahan di luar Canva:** atas permintaan user, ditambahkan **Cover/amplop
pembuka** bertema floral (desain Canva tidak punya, tapi diinginkan untuk template ini).

## 4. Cakupan

**Termasuk:** template floral baru, decoration style floral (SVG), komponen
`dress-code`, Cover/amplop bertema floral, dukungan foto di Hero, restyle
`event-detail`, motif aksen per-section, update data klien Dega & Lauditta.

**Tidak termasuk (untuk klien ini):** Countdown & Story — desain Canva tidak
memilikinya. Komponen-komponen ini tetap tersedia di platform untuk klien lain.

## 5. Strategi Ornamen

**Keputusan: pendekatan hybrid.**

- **Ornamen bunga, aksen, & figur dress code → SVG vektor** (gaya flat-vector).
  Digambar lewat kode seperti dekorasi Nusantara yang sudah ada. Ringan, warna
  bisa di-theme, 100% milik sendiri, tanpa file aset, tanpa masalah lisensi.
  Figur dress code dibuat sebagai siluet SVG sederhana (pria & wanita).
- **Foto pasangan → file gambar** disediakan user.

Konsekuensi: tampilan akhir = **floral vektor flat**, bukan tekstur watercolor.
Ini "terinspirasi" desain Canva, bukan replika tekstur persis — disepakati user.

⚠️ **Lisensi:** ornamen pada situs Canva adalah aset stock milik Canva dan **tidak
boleh** diekstrak untuk dipakai di situs lain (meski punya akses edit). Karena
seluruh ornamen + figur dibuat sebagai SVG sendiri, tidak ada isu lisensi. Hanya
foto pasangan yang berupa file (foto asli milik user).

## 6. Item Kerja

### Item 0 — Prasyarat: field `decorationStyle` pada model Template

`server/src/models/Template.ts` **tidak mendeklarasikan** field `decorationStyle`,
padahal `seed-nusantara.ts` menulisnya dan `page.tsx` membacanya. Dengan Mongoose
strict mode (default), field ini kemungkinan **tidak tersimpan** — perlu diverifikasi.

- Tambahkan ke interface `ITemplateDocument` dan schema: `decorationStyle: { type: String, default: 'none' }`.
- Verifikasi `GET /api/invitations/:slug` mengembalikan `templateId.decorationStyle`.
- Catatan: bila benar selama ini ter-drop, dekorasi Nusantara mungkin belum aktif —
  laporkan temuan ini ke user.

### Item 1 — Template "Floral Watercolor"

Buat dokumen `Template` (via seed):

- `slug: 'floral-watercolor'`, `name: 'Floral Watercolor'`, `decorationStyle: 'floral'`.
- `config`:
  - `primaryColor: '#C9477E'` (pink aksen)
  - `secondaryColor: '#F7F3EE'` (krem background)
  - `accentColor: '#D98FA8'` (rose untuk kartu)
  - `fontHeading: 'Pinyon Script'`, `fontBody: 'Poppins'`
  - `heroTitle`, `bodyGreeting`, `footerTitle`, `footerMessage` sesuai konten Dega & Lauditta.
- `defaultSections` (9 slot section, urut): cover, couple-profile, gallery,
  location-map, event-detail, dress-code, rsvp, donation, wishes. (Hero & Footer
  built-in. `cover` dirender sebagai overlay amplop sebelum undangan dibuka.)
- `stylePresets`:
  - `light`: `{ bg: '#F7F3EE', text: '#6E6258' }`
  - `dark`: `{ bg: '#F0E3DC', text: '#8A5A72' }` (varian krem lebih gelap, bukan hitam)
  - `accent`: `{ bg: '#D98FA8', text: '#FFFFFF' }` (kartu rose untuk rsvp/wishes)
  - `image-1`, `image-2`: varian krem netral.

Catatan font: dynamic loader di `page.tsx` menambahkan `:wght@300;400;700` pada URL
Google Fonts. Font script seperti Pinyon Script hanya punya weight 400 — **verifikasi
loader tidak gagal**; bila perlu, sesuaikan agar weight di-handle per-font.

### Item 2 — Decoration style `floral` (SVG vektor)

- Buat `apps/invitation/src/lib/decorations/floral/index.tsx`, mengikuti pola
  dekorasi yang sudah ada (mis. `bali/index.tsx`):
  - Export `floralColors: DecorColors` (bg krem, accent/primary pink, dark rose,
    surface krem).
  - Primitive SVG: kelopak bunga, daun, sprig/ranting — dirangkai jadi motif floral.
    Komponen dekorasi boleh memakai palet internal kecil (pink bunga + hijau daun)
    di luar satu `accent` color.
  - `HeroDecor`, `SectionDecor`, `FooterDecor` — menempatkan motif floral SVG di
    tepi (atas/bawah/sudut), absolut, `pointer-events: none`.
  - `SectionDecor` menerima `variant`; untuk floral cukup border bunga atas + bawah
    pada semua varian.
- Daftarkan di `registry.ts` dengan key `floral`.
- Tanpa file aset — seluruh ornamen digambar SVG.

### Item 3 — Komponen `dress-code` (baru)

**Varian A** (label + keterangan + figur, tanpa swatch). Figur = **siluet SVG bawaan**.

- `packages/shared/src/types/components.ts`:
  - Tambah `'dress-code'` ke `COMPONENT_IDS`.
  - Interface `DressCodeData`:
    `{ note?: string; groups: { label: string; description: string; figure?: string; image?: string }[] }`.
    `figure` = key siluet SVG bawaan (`gentlemen` | `ladies`); `image` = URL gambar
    opsional yang meng-override siluet bila diisi (untuk klien lain).
  - Tambah ke `COMPONENT_REGISTRY`: field `note` (text, opsional) + `groups`
    (array; arrayFields: `label` text, `description` text, `figure` select, `image` url opsional).
  - Tambah case di `getDefaultComponentData`.
- `apps/invitation/src/components/sections/DressCode.tsx` — komponen baru:
  judul section, lalu daftar grup; tiap grup = figur + label + deskripsi. Figur
  dirender dari siluet SVG bawaan (`gentlemen`/`ladies`), atau dari `image` bila diisi.
  Bertumpuk vertikal di layar sempit, 2 kolom di layar lebar. Animasi Framer Motion
  konsisten dengan komponen lain.
- Siluet SVG `gentlemen` & `ladies` (flat-vector) dibuat sebagai bagian komponen ini.
- `apps/invitation/src/components/SectionRenderer.tsx`: tambah `case 'dress-code'`.

### Item 4 — Hero mendukung foto

- `server/src/models/Client.ts`: tambah `customContent.heroPhoto: { type: String, default: '' }`
  (interface + schema).
- Editor `customContent` di admin (`apps/web`): tambah input `heroPhoto`.
- `page.tsx`: teruskan `heroPhoto` (resolusi: `customContent.heroPhoto` > kosong) ke `Hero`.
- `Hero.tsx`: bila `heroPhoto` ada, render foto dengan bingkai melengkung/bulat
  (arched) di atas/di belakang nama, selaras gaya Canva.

### Item 5 — Restyle `event-detail`

`apps/invitation/src/components/sections/Events.tsx` saat ini memakai warna
hardcoded gelap (`rgba(255,255,255,0.07)`, border emas, teks terang).

- Ubah agar **theme-aware**: warna kartu, border, dan teks mengikuti style preset
  section + warna dekorasi, sehingga tampil baik di background krem terang.
- Pertahankan struktur konten (nama acara, waktu, tempat) — untuk itinerary,
  field venue/address/map boleh kosong dan tidak ditampilkan bila kosong.

### Item 6 — Motif aksen per-section (SVG)

Beberapa section punya aksen khas (di Canva: cupid, cincin, mobil, gelas). Karena
jalur SVG, aksen ini disederhanakan jadi **motif SVG flat**.

- Buat pustaka kecil motif SVG (mis. `rings`, `sprig`, `hearts`, `bloom`) di folder
  dekorasi floral.
- **Tanpa perubahan schema** — `section.data` bertipe `Mixed`. Konvensi field
  opsional `section.data.accentMotif` (string key motif).
- `SectionRenderer.tsx`: bila `section.data.accentMotif` ada, render motif terkait
  (kecil, di tengah, di atas konten komponen).
- Editor section di admin: tambah field generik opsional "Motif Aksen" (dropdown
  dari daftar motif).
- Ilustrasi literal Canva (cupid, mobil vintage, gelas sampanye) tidak ditiru
  persis — digantikan motif floral yang setara.

### Item 7 — Data klien Dega & Lauditta

Tulis ulang `server/src/scripts/seed-dega-lauditta.ts` memakai template
`floral-watercolor` dan data asli dari Canva:

- Groom: **Dega Aprillian** — putra pertama dari Bapak Taufikh (Alm.) & Ibu Sri Mujiastuti.
- Bride: **Lauditta Soraya Librata** — putri pertama dari Bapak Johan Librata (Alm.) & Ibu Nina Krisnawati.
- Tanggal: **Minggu, 26 Juli 2026**.
- Venue: **Hilton Garden Inn Bali, Nusa Dua**. Google Maps: `https://maps.app.goo.gl/zbFwMh3ebLwUfrMe7`.
- Itinerary (event-detail): "Welcome Cocktail" 17:00–18:00; "Dinner Reception" 18:00–22:00.
- Dress code: Gentlemen — Earth tone; Ladies — The shades of flowers, except white flowers.
- Gift: BCA — Lauditta Soraya Librata — 6044015492.
- RSVP: batas 15 Juni.
- 9 slot section sesuai `defaultSections` (termasuk `cover`), plus `accentMotif`
  (motif SVG) pada couple-profile, location-map, dan donation.
- Foto: hero = `1.png`; galeri = `2.jpg`–`8.jpg`; `couple-profile` memakai dua
  foto pasangan (tidak ada foto solo terpisah).
- Dress code dua grup dengan `figure: 'gentlemen'` & `figure: 'ladies'` (siluet SVG).
- `music`: `{ videoId: 'dt25SFw8H4Y', autoplay: true }` (YouTube — pemutar musik aktif).
- `customContent.heroPhoto` diisi foto hero (`1.png`).

### Item 8 — Admin template edit

Tambah opsi `floral` pada dropdown `decorationStyle` di form edit template (`apps/web`).

### Item 9 — Cover / amplop bertema floral

`apps/invitation/src/components/Cover.tsx` sudah ada tapi warnanya hardcoded gelap
(`#6B1020`, emas `#C8A84B`, teks krem-di-atas-gelap).

- Buat Cover **theme-aware**: warna background, aksen, dan teks mengikuti style
  preset / warna dekorasi template, bukan nilai hardcoded.
- Untuk floral: background krem, aksen pink, ornamen floral SVG (pakai motif dari
  decoration `floral`) mengelilingi amplop.
- Monogram & "heart seal" tetap, warnanya menyesuaikan tema.
- Verifikasi Cover lama (template Nusantara) tetap tampil benar setelah diubah.

## 7. Aset

**Foto — sudah disediakan.** 8 foto pasangan ada di `dega-dita-asets/` (root repo):

- `1.png` — foto pasangan cut-out (background transparan) → **Hero** & `customContent.heroPhoto`.
- `2.jpg`–`8.jpg` — 7 foto prewedding → **galeri**; dua di antaranya juga dipakai
  pada `couple-profile` (tidak ada foto solo groom/bride terpisah).

Implementasi menyalin foto ke folder publik invitation app
(mis. `apps/invitation/public/assets/dega-lauditta/`) dan merujuknya via path.

**Tidak perlu aset** (semuanya SVG): ornamen bunga, sprig, motif aksen, dekorasi
amplop, dan figur dress code (siluet `gentlemen`/`ladies`).

Tidak ada aset yang tertunda — semua foto sudah ada, sisanya SVG.

## 8. Warna & Font (disetujui)

- Background krem `#F7F3EE` · pink aksen `#C9477E` · rose kartu `#D98FA8` · teks `#6E6258`.
- Heading: `Pinyon Script` (Google Font, script). Body: `Poppins` (Google Font, sans).

## 9. Risiko & Catatan

- **Template `decorationStyle`** (Item 0) — kemungkinan field tidak tersimpan;
  prasyarat sebelum decoration floral bisa aktif.
- **Loader font Google** menambah `:wght@300;400;700`; font script umumnya hanya
  weight 400 — perlu diverifikasi agar request tidak gagal.
- **Estetika flat-vector** — ornamen SVG tidak bertekstur cat air; hasil akhir
  "terinspirasi" Canva, bukan replika tekstur. Sudah disepakati user.
- **Figur dress code = siluet SVG bawaan** — tidak ada dependensi aset eksternal.
- **Restyle `event-detail`** memengaruhi semua template yang memakai komponen ini —
  pastikan tetap baik di template gelap (Nusantara) setelah diubah jadi theme-aware.

## 10. Verifikasi

Belum ada test otomatis di repo. Verifikasi manual:

- `npm run lint` (type-check) lolos.
- Seed dijalankan: `npx tsx server/src/scripts/seed-dega-lauditta.ts` sukses.
- Undangan dibuka di `http://localhost:3001/dega-lauditta` — overlay Cover amplop
  bertema floral tampil; setelah disentuh, Hero (berfoto) + 8 section konten +
  dekorasi floral muncul, komponen `dress-code` tampil benar, pemutar musik berfungsi.
- Buka dengan tamu `?to=<slug>` — RSVP tampil.
- Template Nusantara lama dibuka — memastikan restyle `event-detail` tidak merusak tampilan gelap.
- Bandingkan berdampingan dengan situs Canva untuk menilai kemiripan.
