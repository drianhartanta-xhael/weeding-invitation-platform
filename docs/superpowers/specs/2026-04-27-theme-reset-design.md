# Theme Reset — Nusantara Template

**Date:** 2026-04-27  
**Status:** Approved  
**Reference:** [Nusantara Wedding Invitation Design](https://a106255e-ef36-4909-bd87-5eefcb9fe704.claudeusercontent.com/v1/design/projects/a106255e-ef36-4909-bd87-5eefcb9fe704/serve/Wedding%20Invitation.html)

---

## Overview

Reset semua template dari 6 template lama (Batik Jawa, Patra Bali, dll) ke **1 template tunggal "Nusantara"** yang mengikuti referensi desain baru. Semua komponen invitation di-redesign agar match palette wine-red + cream + gold. Arsitektur slot-based section dipertahankan; Cover ditambah sebagai section type baru.

---

## Scope

### Dihapus
- Semua 6 template lama dari DB
- `seed-nusantara.ts` (diganti v2)
- Decoration registry usage (tidak dipakai di template Nusantara)

### Dipertahankan
- Slot-based section system (`SectionRenderer`, sections array)
- Data model: Client, Guest, Wish, Gift, Template (schema tidak berubah)
- Server routes & controllers
- Admin dashboard pages (tidak ada code change)

### Baru / Berubah
| Item | Status |
|------|--------|
| `Cover` component | Baru |
| `culturalQuotes` di `couple-profile` | Baru (field + UI) |
| Visual redesign semua komponen | Redesign |
| `seed-nusantara-v2.ts` | Ganti |
| `packages/shared/src/types/components.ts` | Update |

---

## Desain Komponen

### Cover (baru)
- `componentId: 'cover'`
- Full-screen overlay wine-red, dirender di atas semua konten
- Elemen: teks "Kepada Yth. [nama tamu]", amplop animasi (Framer Motion), monogram inisial pasangan (huruf pertama `groomName` & `brideName` dari client data), tombol hati, teks "Sentuh untuk membuka undangan"
- Klik → overlay fade-out, konten muncul
- Props yang diterima dari `page.tsx`: `groomName`, `brideName`, `guestName`, `sectionData` (coverText override), `stylePreset`
- Section data field: `coverText` (text, opsional — override teks "Kepada Yth.")
- Background warna dikontrol via style preset (`dark` = wine-red)

### Hero (redesign)
- Full-screen, background wine-red
- Teks Bismillah/pembuka dari `bodyGreeting`
- Nama pasangan besar (script font Cormorant Garamond)
- Tanggal + venue ringkas
- Tombol scroll "Gulir ↓"
- Countdown tetap section terpisah (bisa di-toggle)

### Couple (redesign + cultural quotes)
- Background cream
- Label "Mempelai" + heading "Dua Insan, Satu Jiwa"
- Dua kartu portrait (Pria/Wanita): foto, nama pendek, nama lengkap, orang tua
- Ampersand dekorasi di tengah
- Panel kutipan budaya: grid horizontal, tiap item `{ ethnic, quote }`
- Default quotes (5): Betawi, Sunda, Batak, Bali, Padang
- Admin edit via array field di section editor

### Events (redesign)
- Background wine-red
- Label "Rangkaian Acara" + heading "Hari Istimewa"
- Kartu bernomor (I · Akad, II · Resepsi) dengan tanggal, waktu, tempat
- Tidak ada field dress code

### Gallery (redesign)
- Background cream
- Label "Galeri" + heading "Momen Berharga"
- Grid 2–3 kolom responsif

### LocationMap (redesign)
- Background cream/image-2
- Nama venue sebagai heading
- Google Maps embed
- Detail lokasi per acara di bawah map

### RSVP (redesign)
- Background wine-red
- Form: nama, konfirmasi hadir, jumlah tamu, pesan
- Styled dark theme

### Gift / Donation (redesign)
- Background cream
- Label "Hadiah" + heading "Amplop Digital"
- Kartu per rekening bank dengan tombol **salin nomor** (copy-to-clipboard)

### Wishes (redesign)
- Background cream
- Label "Pesan & Doa" + heading "Ucapan & Doa"
- Form kirim ucapan + daftar ucapan existing

### Footer (redesign)
- Background wine-red
- Branding "NUSANTARA WEDDING"
- Nama pasangan + tanggal
- Ayat QS. Ar-Rum : 21

---

## Data Model Changes

### packages/shared/src/types/components.ts

```typescript
// COMPONENT_IDS — tambah 'cover'
export const COMPONENT_IDS = [
  'cover',
  'couple-profile',
  'event-detail',
  // ... existing
] as const;

// CoverData — baru
export interface CoverData {
  coverText?: string; // override "Kepada Yth."
}

// CoupleProfileData — tambah culturalQuotes
export interface CoupleProfileData {
  // ... existing fields
  culturalQuotes?: { ethnic: string; quote: string }[];
}
```

**Registry changes:**
- `cover`: fields → `coverText` (text, opsional)
- `couple-profile`: tambah `culturalQuotes` (array, arrayFields: `ethnic` + `quote`)

**Default data:**
- `cover`: `{ coverText: '' }`
- `couple-profile`: tambah `culturalQuotes` default 5 item (Betawi, Sunda, Batak, Bali, Padang)

### Template — config Nusantara
```
primaryColor:   '#6B1020'  (wine red)
secondaryColor: '#F5EDE0'  (cream)
accentColor:    '#C8A84B'  (gold)
fontHeading:    'Cormorant Garamond'
fontBody:       'Lato'
```

**Style presets:**
```
dark:    { bg: '#6B1020', text: '#F5EDE0' }
light:   { bg: '#F5EDE0', text: '#3D1A0E' }
accent:  { bg: '#C8A84B', text: '#3D1A0E' }
image-1: { bg: '#EDE0CC', text: '#3D1A0E' }
image-2: { bg: '#D9C9AD', text: '#3D1A0E' }
```

**Default sections (urutan):**
```
cover        → dark
couple-profile → light
event-detail → dark
countdown    → light
gallery      → light
location-map → image-2
rsvp         → dark
wishes       → light
donation     → light
```

---

## SectionRenderer — Cover Handling

`SectionRenderer` mendeteksi section dengan `componentId === 'cover'` dan **tidak** merendernya di dalam scroll. Section `cover` dirender oleh `[slug]/page.tsx` sebagai full-screen overlay terpisah.

`page.tsx` logic:
```
const coverSection = sections.find(s => s.componentId === 'cover')
const contentSections = sections.filter(s => s.componentId !== 'cover')

render:
  {coverSection && <Cover ... />}   ← overlay, z-index tinggi
  <Hero ... />
  <SectionRenderer sections={contentSections} ... />
  <Footer ... />
```

---

## Urutan Implementasi

```
Phase 1 — Fondasi
  1. packages/shared/src/types/components.ts — tambah cover, culturalQuotes

Phase 2 — Komponen invitation (apps/invitation)
  2. Cover.tsx (baru)
  3. Hero.tsx (redesign)
  4. Couple.tsx (redesign + culturalQuotes)
  5. Events.tsx (redesign)
  6. Gallery.tsx (redesign)
  7. LocationMap.tsx (redesign)
  8. RSVP.tsx (redesign)
  9. Gift.tsx (redesign + copy-to-clipboard)
  10. Wishes.tsx (redesign)
  11. Footer.tsx (redesign)

Phase 3 — Wiring
  12. SectionRenderer.tsx (skip cover dari render loop)
  13. [slug]/page.tsx (render Cover overlay + contentSections)

Phase 4 — Template & seed
  14. seed-nusantara-v2.ts (1 template Nusantara)
  15. seed-mvp.ts (update templateId ke Nusantara)

Phase 5 — Fonts & CSS
  16. Import Cormorant Garamond di invitation app (next/font atau Google Fonts link)
  17. Pastikan CSS variables (--wedding-primary dll) ter-inject dari template config
```

---

## Out of Scope

- Multiple template support (akan didesain nanti, mulai dari 1 dulu)
- Dress code per event
- Story section redesign (tetap ada tapi tidak diubah)
- MusicPlayer redesign (tetap ada tapi tidak diubah)
- Admin dashboard code changes (registry update sudah cukup untuk auto-generate form)
