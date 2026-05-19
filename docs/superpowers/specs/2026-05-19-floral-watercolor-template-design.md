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

## 4. Cakupan

**Termasuk:** template floral baru, decoration style floral berbasis gambar,
komponen `dress-code`, dukungan foto di Hero, restyle `event-detail`, mekanisme
ilustrasi aksen per-section, update data klien Dega & Lauditta.

**Tidak termasuk (untuk klien ini):** Countdown, Story, Cover envelope — desain
Canva tidak memilikinya. Komponen-komponen ini tetap tersedia di platform untuk
klien lain.

## 5. Strategi Ornamen

**Keputusan: ornamen berbasis gambar (PNG watercolor)** — bukan SVG vektor.
Tekstur cat air tidak bisa ditiru meyakinkan dengan SVG. Semua aset (bunga
watercolor, ilustrasi, foto) **disediakan oleh user** sebagai file PNG transparan / foto.

⚠️ **Lisensi:** ornamen pada situs Canva adalah aset stock milik Canva dan **tidak
boleh** diekstrak untuk dipakai di situs lain. Aset harus dari sumber royalty-free
(bebas pakai komersial) atau milik user sendiri.

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
- `defaultSections` (8 slot section, urut): couple-profile, gallery, location-map,
  event-detail, dress-code, rsvp, donation, wishes. (Hero & Footer built-in, tanpa cover.)
- `stylePresets`:
  - `light`: `{ bg: '#F7F3EE', text: '#6E6258' }`
  - `dark`: `{ bg: '#F0E3DC', text: '#8A5A72' }` (varian krem lebih gelap, bukan hitam)
  - `accent`: `{ bg: '#D98FA8', text: '#FFFFFF' }` (kartu rose untuk rsvp/wishes)
  - `image-1`, `image-2`: varian krem netral.

Catatan font: dynamic loader di `page.tsx` menambahkan `:wght@300;400;700` pada URL
Google Fonts. Font script seperti Pinyon Script hanya punya weight 400 — **verifikasi
loader tidak gagal**; bila perlu, sesuaikan agar weight di-handle per-font.

### Item 2 — Decoration style `floral` (berbasis gambar)

- Buat `apps/invitation/src/lib/decorations/floral/index.tsx`:
  - Export `floralColors: DecorColors` (bg krem, accent/primary pink, dark rose, surface krem).
  - `HeroDecor`, `SectionDecor`, `FooterDecor` — me-render `<img>` PNG watercolor
    (bukan SVG), diposisikan absolut di tepi (atas/bawah/sudut), `pointer-events: none`.
  - `SectionDecor` tetap menerima `variant` namun untuk floral cukup menempatkan
    border bunga atas + bawah pada semua varian.
- Daftarkan di `registry.ts` dengan key `floral`.
- Aset di `apps/invitation/public/decorations/floral/`:
  `border-top.png`, `border-bottom.png`, `corner-sprig.png`, `scatter.png`
  (nama final menyesuaikan aset yang dikirim user).

### Item 3 — Komponen `dress-code` (baru)

**Varian A** (sesuai Canva, tanpa swatch warna).

- `packages/shared/src/types/components.ts`:
  - Tambah `'dress-code'` ke `COMPONENT_IDS`.
  - Interface `DressCodeData`: `{ note?: string; groups: { label: string; description: string; image: string }[] }`.
  - Tambah ke `COMPONENT_REGISTRY`: field `note` (text, opsional) + `groups`
    (array; arrayFields: `label` text, `description` text, `image` url).
  - Tambah case di `getDefaultComponentData`.
- `apps/invitation/src/components/sections/DressCode.tsx` — komponen baru:
  judul section, lalu daftar grup; tiap grup = ilustrasi figur + label + deskripsi.
  Bertumpuk vertikal di layar sempit, 2 kolom di layar lebar. Animasi Framer Motion
  konsisten dengan komponen lain.
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

### Item 6 — Ilustrasi aksen per-section

Untuk ilustrasi unik (cupid, cincin, mobil, gelas) yang muncul di section tertentu:

- **Tanpa perubahan schema** — manfaatkan `section.data` yang bertipe `Mixed`.
  Konvensi field opsional: `section.data.accentImage` (URL gambar).
- `SectionRenderer.tsx`: bila `section.data.accentImage` ada, render gambar tersebut
  (kecil, di tengah, di atas konten komponen).
- Editor section di admin: tambah satu field generik opsional "Gambar Aksen".

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
- 8 slot section sesuai `defaultSections`, plus `accentImage` pada couple-profile
  (cupid/cincin), location-map (mobil), donation (gelas sampanye).
- `music` diisi (pemutar musik aktif untuk template ini).
- `customContent.heroPhoto` diisi foto hero.

### Item 8 — Admin template edit

Tambah opsi `floral` pada dropdown `decorationStyle` di form edit template (`apps/web`).

## 7. Aset yang Disediakan User

User akan menyediakan **semua aset** sebagai file:

- **Foto:** hero couple, foto groom, foto bride, foto-foto galeri, foto orang tua.
- **Bunga watercolor (PNG transparan):** border atas, border bawah, sprig sudut,
  scattered blooms.
- **Ilustrasi (PNG transparan):** cupid, wedding rings, mobil vintage, gelas
  sampanye, figur dress code pria, figur dress code wanita.

Implementasi yang bergantung pada aset menggunakan placeholder sampai aset diterima;
penempatan & ukuran final disesuaikan setelah aset masuk.

## 8. Warna & Font (disetujui)

- Background krem `#F7F3EE` · pink aksen `#C9477E` · rose kartu `#D98FA8` · teks `#6E6258`.
- Heading: `Pinyon Script` (Google Font, script). Body: `Poppins` (Google Font, sans).

## 9. Risiko & Catatan

- **Template `decorationStyle`** (Item 0) — kemungkinan field tidak tersimpan;
  prasyarat sebelum decoration floral bisa aktif.
- **Loader font Google** menambah `:wght@300;400;700`; font script umumnya hanya
  weight 400 — perlu diverifikasi agar request tidak gagal.
- **Kualitas aset** menentukan kemiripan akhir; placeholder dipakai sampai aset masuk.
- **Restyle `event-detail`** memengaruhi semua template yang memakai komponen ini —
  pastikan tetap baik di template gelap (Nusantara) setelah diubah jadi theme-aware.

## 10. Verifikasi

Belum ada test otomatis di repo. Verifikasi manual:

- `npm run lint` (type-check) lolos.
- Seed dijalankan: `npx tsx server/src/scripts/seed-dega-lauditta.ts` sukses.
- Undangan dibuka di `http://localhost:3001/dega-lauditta` — 8 section tampil,
  Hero menampilkan foto, dekorasi floral muncul, komponen `dress-code` tampil benar,
  pemutar musik berfungsi.
- Buka dengan tamu `?to=<slug>` — RSVP tampil.
- Template Nusantara lama dibuka — memastikan restyle `event-detail` tidak merusak tampilan gelap.
- Bandingkan berdampingan dengan situs Canva untuk menilai kemiripan.
