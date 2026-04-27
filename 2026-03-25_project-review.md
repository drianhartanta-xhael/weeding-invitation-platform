# Project Review — Wedding Invitation Platform

**Tanggal:** 25 Maret 2026
**Reviewer:** Technical & Business PM
**Status:** MVP / Early Development

---

## Ringkasan Eksekutif

Platform ini secara arsitektur sudah solid (Turborepo monorepo, separation of concerns yang jelas, slot-based rendering system). Namun ada **3 bug kritis** yang akan menyebabkan fitur utama tidak berfungsi di production, **beberapa celah keamanan**, dan sejumlah dead code/fitur yang belum tuntas.

**Skor Kesiapan Production: 4/10** — Fungsional untuk demo, belum siap deploy.

---

## Daftar Isi

1. [Bug Kritis](#1-bug-kritis)
2. [Celah Keamanan](#2-celah-keamanan)
3. [Kode Berlebih / Tidak Terpakai](#3-kode-berlebih--tidak-terpakai)
4. [Fitur Belum Tuntas](#4-fitur-belum-tuntas)
5. [Kualitas Kode](#5-kualitas-kode)
6. [Yang Kurang / Perlu Ditambahkan](#6-yang-kurang--perlu-ditambahkan)
7. [Yang Sudah Baik](#7-yang-sudah-baik)
8. [Rekomendasi Prioritas](#8-rekomendasi-prioritas)
9. [Review Bisnis — UX & Data Model](#9-review-bisnis--ux--data-model)

---

## 1. Bug Kritis

### 1.1 Route `/api/clients/slug/:slug` Tidak Bisa Diakses
**File:** `server/src/routes/clients.ts`
**Masalah:** Route `/slug/:slug` didefinisikan SETELAH `/:id`. Express akan mencocokkan `/:id` terlebih dahulu dengan `id='slug'`, sehingga request ke `/api/clients/slug/budi-sari` tidak pernah sampai ke handler yang benar.
**Dampak:** Halaman invitation publik tidak bisa mengambil data client by slug — **fitur inti tidak berfungsi**.
**Solusi:** Pindahkan route `/slug/:slug` ke SEBELUM `/:id`.

### 1.2 Route `/api/invitations/:slug/:guestSlug` Tidak Bisa Diakses
**File:** `server/src/routes/invitations.ts` (tidak ada file terpisah, kemungkinan di `routes/index.ts`)
**Masalah:** Route `/:slug` akan selalu cocok lebih dulu, sehingga `/:slug/:guestSlug` tidak pernah tercapai.
**Dampak:** **Personalisasi undangan per tamu (`?to=guestSlug`) tidak berfungsi** jika menggunakan path-based routing.
**Solusi:** Gunakan query parameter `/:slug?guestSlug=value` atau pindahkan route yang lebih spesifik ke atas.

### 1.3 Dashboard Stats Selalu Menampilkan 0
**File:** `apps/web/src/app/(dashboard)/dashboard/page.tsx`
**Masalah:** Hanya `totalClients` yang diambil dari API (`/clients`). Field `totalGuests`, `totalWishes`, `totalGifts` tetap 0 (hardcoded default). Endpoint `/clients/:id/stats` yang sudah dibuat tidak digunakan.
**Dampak:** Dashboard admin tidak informatif — angka statistik selalu 0.

---

## 2. Celah Keamanan

| # | Masalah | File | Tingkat | Dampak |
|---|---------|------|---------|--------|
| 2.1 | **CORS terbuka untuk semua origin** | `server/src/index.ts` | KRITIS | Rentan terhadap CSRF attack. Harus whitelist origin. |
| 2.2 | **Midtrans webhook tanpa verifikasi signature** | `server/src/controllers/giftController.ts` | KRITIS | Siapapun bisa mengirim notifikasi palsu untuk mengubah status pembayaran. |
| 2.3 | **Fallback JWT secret `'fallback-secret'`** | `server/src/middleware/auth.ts`, `authController.ts` | TINGGI | Jika `JWT_SECRET` env var tidak diset, auth menggunakan secret yang bisa ditebak. Harus error jika tidak ada. |
| 2.4 | **Tidak ada sanitasi input di wishes/gifts** | Controller terkait | SEDANG | Pesan dari user bisa mengandung script (XSS) jika frontend tidak escape. |
| 2.5 | **Tidak ada rate limiting** | `server/src/index.ts` | SEDANG | Endpoint publik (RSVP, wishes, gifts) bisa di-abuse. |

---

## 3. Kode Berlebih / Tidak Terpakai

### 3.1 Dead Code & Unused Exports

| Item | Lokasi | Status |
|------|--------|--------|
| `coreApi` export dari Midtrans config | `server/src/config/midtrans.ts` | Tidak pernah digunakan, hanya `snap` yang terpakai |
| `lucide-react` dependency | `apps/web/package.json` | Package terinstal tapi tidak pernah di-import |
| `contentForm` state (30+ baris) | `apps/web/.../clients/[id]/page.tsx` | State ada tapi tidak ada tab "Content" di UI |
| `LoginDTO`, `UserResponse` types | `packages/shared/src/types/user.ts` | Exported tapi tidak di-import di manapun |
| `UpdateGuestDTO` type | `packages/shared/src/types/guest.ts` | Exported tapi tidak digunakan |

### 3.2 Shared Types Library Tidak Dipakai

**Temuan signifikan:** Seluruh `packages/shared` (type definitions) **tidak di-import** oleh frontend maupun server.
- Server mendefinisikan ulang interface Mongoose sendiri (IClientDocument, dll.)
- Frontend tidak menggunakan TypeScript types untuk API response sama sekali
- Artinya shared package saat ini adalah **dead code** — ada tapi tidak berfungsi sebagai source of truth

### 3.3 Duplikasi Type Definitions

| Definisi 1 | Definisi 2 | Masalah |
|------------|------------|---------|
| `IClient.sections` (inline array) | `ISection` di `components.ts` | Struktur identik, didefinisikan 2x |
| `IClient.sections[].style: string` | `ISection.style: StylePreset` | Typing berbeda untuk field yang sama |

### 3.4 Over-Engineering

| Area | File | Masalah |
|------|------|---------|
| Gallery responsive logic | `apps/invitation/.../Gallery.tsx` | Manual breakpoint detection via resize listener, padahal Tailwind bisa handle |
| Dynamic font loading | `apps/invitation/.../[slug]/page.tsx` | DOM manipulation (`document.head.appendChild`) di samping Next.js Font optimization — duplikasi effort |
| Client detail page | `apps/web/.../clients/[id]/page.tsx` | **1.697 baris** dalam satu file, 30+ useState hooks — "god component" |

---

## 4. Fitur Belum Tuntas

### 4.1 Halaman & Komponen Incomplete

| Fitur | Lokasi | Status |
|-------|--------|--------|
| Settings page | `apps/web/.../settings/page.tsx` | Placeholder "coming soon" (13 baris) |
| Dashboard stats | `apps/web/.../dashboard/page.tsx` | 3 dari 4 metrik hardcoded 0 |
| Error handling di invitation | Semua komponen invitation | `console.error()` tanpa feedback ke user |
| Loading states | RSVP saja yang ada | Wishes, Gift, Gallery tidak ada loading indicator |
| Form validation (frontend) | Semua form di apps/web | Tidak ada validasi sebelum submit — rely sepenuhnya ke server |

### 4.2 Missing Server Features

| Fitur | Dampak |
|-------|--------|
| 404 handler untuk route yang tidak ada | Request ke endpoint salah mendapat blank error |
| Request logging (winston/pino) | Tidak ada audit trail untuk debugging production |
| Token refresh mechanism | JWT expired = user langsung di-redirect ke login tanpa warning |
| Midtrans reject/chargeback handling | Hanya handle capture/settlement/cancel/deny/expire/pending |

### 4.3 Missing Validasi

| Validasi | File |
|----------|------|
| Format warna hex (#RRGGBB) | `server/src/validators/template.ts` |
| Format slug (alphanumeric + hyphen) | `server/src/validators/client.ts`, `guest.ts` |
| Panjang max pesan wish/gift | `server/src/validators/wish.ts`, `gift.ts` |
| Max amount gift | `server/src/validators/gift.ts` |
| Template ID merujuk ke template yang valid | `server/src/validators/client.ts` |

---

## 5. Kualitas Kode

### 5.1 Masalah Type Safety

- **16+ penggunaan `any`** di `clients/[id]/page.tsx` — menghilangkan manfaat TypeScript
- **`catch (err: any)`** di 5+ file — seharusnya menggunakan proper error type
- **`as any` cast** untuk templateId — mengindikasikan mismatch antara API response dan type definition
- **`Schema.Types.Mixed`** di Template model — fleksibel tapi menghilangkan type safety

### 5.2 Hardcoded Values

| Value | Lokasi | Masalah |
|-------|--------|--------|
| `http://localhost:3001/` | `clients/[id]/page.tsx` (3 tempat) | Preview link akan broken di production |
| `'id-ID'` locale | Hero.tsx, Gift.tsx | Hardcoded bahasa Indonesia, tidak configurable |
| `'password123'` | `seed-mvp.ts` | OK untuk dev, pastikan tidak bocor ke production |

### 5.3 Accessibility

- Gallery carousel tidak bisa dinavigasi via keyboard
- Lightbox modal tidak trap focus
- Loading spinner tanpa aria-label
- SVG icons tanpa role/aria-label
- Tidak ada dukungan `prefers-reduced-motion`

---

## 6. Yang Kurang / Perlu Ditambahkan

### 6.1 Kebutuhan Bisnis (Business Requirements)

| Kebutuhan | Prioritas | Catatan |
|-----------|-----------|---------|
| **Testing** (unit + integration) | TINGGI | Belum ada test sama sekali. Minimal test untuk payment flow dan RSVP. |
| **Multi-language support** | SEDANG | Saat ini hardcoded Bahasa Indonesia. Untuk pasar yang lebih luas perlu i18n. |
| **Analytics / tracking** | SEDANG | Tidak ada cara mengetahui berapa tamu yang buka undangan. |
| **SEO / Open Graph** | SEDANG | Undangan perlu preview bagus saat di-share via WhatsApp/sosmed. |
| **Email/WhatsApp notification** | SEDANG | Notifikasi saat ada RSVP atau gift masuk. |
| **Export data** | RENDAH | Export daftar tamu ke Excel/CSV (saat ini hanya import). |
| **Pagination** | RENDAH | Tabel client/guest tanpa pagination — akan lambat jika data banyak. |
| **Audit log** | RENDAH | Tidak ada history siapa mengubah apa. |

### 6.2 Kebutuhan Teknis

| Kebutuhan | Prioritas | Catatan |
|-----------|-----------|---------|
| **CORS whitelist** | KRITIS | `cors({ origin: allowedOrigins })` |
| **Webhook signature verification** | KRITIS | Validasi Midtrans signature hash |
| **Environment-based config** | TINGGI | Ganti semua hardcoded localhost |
| **Error boundary (React)** | TINGGI | Uncaught error sekarang crash seluruh halaman |
| **Proper logging** | TINGGI | Winston/Pino untuk structured logging |
| **CI/CD pipeline** | SEDANG | Belum ada automated build/test/deploy |
| **Image optimization** | SEDANG | Tidak ada resize/compress saat upload |
| **CDN untuk static assets** | RENDAH | Upload gambar dilayani langsung oleh Express |

---

## 7. Yang Sudah Baik

| Aspek | Detail |
|-------|--------|
| **Arsitektur monorepo** | Turborepo + npm workspaces, separation yang jelas antar workspace |
| **Slot-based section system** | Fleksibel, component registry dengan metadata untuk auto-form generation |
| **Dual-mode rendering** | Backward compatible — legacy mode tetap bekerja |
| **Zod validation** | Semua input di-validasi di controller level sebelum masuk ke database |
| **Auth flow** | JWT + bcrypt, proper password hashing, token auto-attach di frontend |
| **Error handler middleware** | Menangani ZodError, CastError, duplicate key dengan status code yang tepat |
| **Payment integration** | Midtrans Snap terintegrasi dengan flow yang benar (create → popup → webhook) |
| **Framer Motion animations** | Scroll-triggered animations yang smooth dan performant |
| **CSS variable theming** | Per-template theming via CSS custom properties |
| **Seed script** | Idempotent seeder untuk quick demo setup |
| **Guest bulk import** | CSV upload + multi-row form — produktif untuk input data banyak |
| **Component registry** | Metadata-driven form generation — skalabel untuk tambah komponen baru |

---

## 8. Rekomendasi Prioritas

### Sprint 1 — Fix Critical (1-2 hari)

1. **Fix route order** di `clients.ts` dan routing invitation — ini bug yang membuat fitur inti tidak jalan
2. **Tambahkan CORS whitelist** — `cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') })`
3. **Verifikasi Midtrans webhook signature** — cegah payment spoofing
4. **Hapus fallback JWT secret** — harus error jika `JWT_SECRET` tidak diset
5. **Ganti hardcoded localhost** dengan environment variable `NEXT_PUBLIC_INVITATION_URL`

### Sprint 2 — Stabilisasi (3-5 hari)

6. **Fix dashboard stats** — gunakan endpoint aggregation yang sudah ada
7. **Tambah error boundary** di kedua Next.js app
8. **Tambah 404 handler** di Express
9. **Hapus dead code** — `lucide-react`, `coreApi`, `contentForm` state, unused types
10. **Refactor `clients/[id]/page.tsx`** — pecah jadi sub-komponen per tab

### Sprint 3 — Production Readiness (1-2 minggu)

11. **Tambah testing** — minimal integration test untuk payment flow, RSVP, dan auth
12. **Implement rate limiting** untuk endpoint publik
13. **Tambah request logging** dengan winston/pino
14. **Image optimization** saat upload (resize, compress)
15. **Gunakan shared types** — import `@wedding/shared` di server dan frontend
16. **CI/CD pipeline** — automated lint, type-check, test, build

### Backlog — Nice to Have

17. Open Graph meta tags untuk preview WhatsApp
18. Analytics (view count per invitation)
19. Email/WhatsApp notification saat RSVP masuk
20. Pagination di tabel admin
21. Guest data export (CSV/Excel)
22. Multi-language support
23. Dark mode admin dashboard
24. Drag-and-drop section reordering

---

## Catatan Penutup

Project ini punya fondasi arsitektur yang bagus — monorepo setup, slot-based rendering, dan component registry menunjukkan perencanaan yang matang. Masalah utama ada di **detail implementasi**: route ordering bugs, security gaps, dan dead code yang menumpuk.

Prioritas utama sebelum production: **fix 3 bug kritis + tutup celah keamanan**. Estimasi effort untuk Sprint 1 cukup ringan (1-2 hari kerja) tapi dampaknya besar terhadap fungsionalitas dan keamanan platform.

---

---

## 9. Review Bisnis — UX & Data Model

> Bagian ini berdasarkan **live testing** — membuat undangan baru dari nol hingga bisa diakses publik via browser.

### 9.1 Hasil Test: Langkah Membuat 1 Undangan

| # | Langkah | Tab/Halaman | Field diisi | Klik/Aksi |
|---|---------|-------------|-------------|-----------|
| 1 | Buat client baru | `/clients/new` | 4 (nama pengantin, slug, tanggal) | 1 submit |
| 2 | Isi data couple | Tab "Couple" | 6 (foto URL × 2, orang tua × 4) | 1 save |
| 3 | Tambah 2 event | Tab "Events" | 12 (6 per event: nama, tanggal, waktu, venue, alamat, maps) | 2 add + 1 save |
| 4 | Pilih template + publish | Tab "Details" | 2 (pilih template, ubah status) | 1 save |
| 5 | Tambah 5 section | Tab "Sections" | 0 (hanya klik pilih komponen) | 5 add + 1 save |
| 6 | Tambah 1 tamu | Tab "Guests" | 4 (nama, invitation name, slug, category) | 1 submit |

**Total: ~28 field, 6 tab berbeda, 13 klik aksi, estimasi 10 menit untuk user berpengalaman.**

**URL hasil:** `http://localhost:3001/andi-pratama-rina-maharani?to=drian-adiputra` — berhasil tampil dengan personalisasi tamu.

---

### 9.2 Masalah UX Kritis: Data Diisi 2 Kali

Ini masalah desain terbesar dari sisi bisnis:

**Alur sekarang (redundan):**
```
Couple Tab: isi nama, foto, orang tua ──→ Save
Events Tab: isi acara-acara            ──→ Save
Details Tab: isi bank account          ──→ Save
                    │
                    ▼
Sections Tab: tambah "Couple Profile"  ──→ auto-fill dari Couple Tab
              tambah "Event Detail"    ──→ auto-fill dari Events Tab
              tambah "Donation"        ──→ auto-fill dari Details Tab
              Save
```

**Masalah:** User mengisi data di 3 tab terpisah, lalu harus ke Sections tab untuk "mengaktifkan" data tersebut. Data di Couple/Events/Details **tidak tampil di undangan** kecuali section-nya ditambahkan manual. Tidak ada petunjuk apapun tentang ini.

**Alur yang seharusnya (salah satu):**

**Opsi A — Hapus tab Couple/Events, langsung isi di Section:**
```
Create Client (4 field) → Details (template + status) → Sections (isi data langsung di sini) → Guests
```

**Opsi B — Auto-create section saat data diisi:**
```
Couple Tab: isi data → otomatis buat section "Couple Profile"
Events Tab: isi data → otomatis buat section "Event Detail"
```

**Opsi C — Guided wizard (rekomendasi):**
```
Step 1: Nama & Tanggal → Step 2: Template → Step 3: Couple → Step 4: Events → Step 5: Sections → Step 6: Guests → Publish
```

---

### 9.3 Form & Field yang Berlebihan

#### Guest Form — 2 Field Tidak Terpakai

| Field | Dipakai? | Keterangan |
|-------|----------|------------|
| `name` | Hanya admin | Tidak pernah tampil di undangan |
| `invitationName` | Ya | Muncul di Hero ("Dear ...") |
| `slug` | Ya | Untuk URL personalisasi |
| `phone` | **TIDAK** | Tidak ada fitur SMS/WA — dead field |
| `email` | **TIDAK** | Tidak ada fitur email — dead field |
| `category` | Hanya admin stats | Tamu tidak pernah lihat |
| `numberOfGuests` | **TIDAK** | Disimpan tapi tidak ditampilkan di manapun |
| `rsvpDate` | **TIDAK** | Disimpan tapi tidak ditampilkan |

**Rekomendasi:** Hapus `phone` dan `email` (atau baru tambahkan saat fitur notifikasi dibangun). Field `numberOfGuests` dan `rsvpDate` bisa dihide dari form tapi tetap di-track internal.

#### Guest Slug Tidak Auto-Generate

Saat buat client baru, slug auto-generate dari nama pengantin. Tapi saat tambah guest, **slug harus diketik manual**. Inkonsistensi ini menciptakan friction — terutama saat bulk add ratusan tamu.

**Rekomendasi:** Auto-generate slug dari `name` field, sama seperti client.

#### Tab Wishes & Gifts — Bukan Form, Tapi Tab

Tab Wishes dan Gifts hanya menampilkan data read-only (ucapan masuk, status pembayaran). Ini bukan form yang perlu diisi admin.

**Rekomendasi:** Gabung jadi 1 tab "Activity" atau pindahkan ke Overview tab sebagai sub-section.

---

### 9.4 Data Model yang Perlu Diredesain

#### A. Client Model — Terlalu Banyak Tanggung Jawab

Client model sekarang menyimpan:
- Identitas pengantin (nama, foto, orang tua)
- Event info (acara-acara)
- Konfigurasi (template, music, status)
- Konten kustom (hero title, footer, dll.)
- Layout (sections array)
- Finansial (bank accounts)

**Masalah:** Semua ini di 1 dokumen MongoDB. Saat sections sudah punya data sendiri (couple-profile punya groomName, event-detail punya events), data di level Client jadi **duplikat**.

**Rekomendasi redesain:**

```
Client (slim):
  - groomName, brideName, slug, eventDate
  - templateId, status, music
  - customContent (hero/footer text)

Sections (array di Client, ATAU koleksi terpisah):
  - componentId, data (semua konten di sini), style, order

Hapus dari Client:
  - groomPhoto, bridePhoto, groomParents, brideParents → masuk ke section "couple-profile" data
  - events[] → masuk ke section "event-detail" data
  - bankAccounts[] → masuk ke section "donation" data
```

Dengan ini, Couple Tab, Events Tab, dan bank account form di Details Tab **tidak perlu ada lagi**. Semua dikelola di Sections.

#### B. Guest Model — Simplifikasi

```
Sekarang (10 field):              Rekomendasi (6 field):
─────────────────────             ─────────────────────
clientId ✓                        clientId
name ✓                            name
invitationName ✓                  invitationName
slug ✓ (harusnya auto)            slug (auto-generate)
phone ✗ (hapus)                   category
email ✗ (hapus)                   rsvpStatus
category ✓
rsvpStatus ✓
numberOfGuests ✗ (hapus/internal)
rsvpDate ✗ (hapus/internal)
```

---

### 9.5 Alur Bisnis — Minimum Viable Invitation

Untuk membuat undangan yang berfungsi, user **minimum** butuh:

| Data | Field | Wajib? |
|------|-------|--------|
| Nama pengantin | 2 | Ya |
| Slug | 1 (auto) | Ya |
| Tanggal event | 1 | Ya |
| Template | 1 (pilih) | Ya |
| Status published | 1 (klik) | Ya |
| Minimal 1 section | 1 (klik) | Ya |
| Minimal 1 tamu | 3 (nama, inv.name, slug) | Ya |

**Total minimum: ~10 field + beberapa klik.**

Tapi saat ini user harus navigasi **6 tab** dan memahami konsep "section" untuk sampai ke situ. Tidak ada panduan, checklist, atau wizard.

**Rekomendasi:** Buat onboarding flow sederhana untuk client baru:
1. Isi data dasar (nama, tanggal, template) → auto-create default sections
2. Review & edit sections jika mau
3. Tambah tamu
4. Publish

---

### 9.6 Temuan Visual dari Live Test

Dari screenshot undangan yang dihasilkan:

1. **Konten sections tidak terlihat di screenshot** — Framer Motion `whileInView` + `viewport={{ once: true }}` membuat konten baru muncul saat di-scroll. Pada full-page screenshot statis, section Couple dan Events terlihat kosong/blank.

2. **Warna tema terlalu pucat** — Template "Elegant Sage" menghasilkan teks olive/sage di atas background krem. Kontras rendah, sulit dibaca terutama di mobile.

3. **Tanggal event format mentah** — Di Event Detail section, tanggal tampil sebagai `2026-08-20` (format ISO), bukan format yang human-friendly seperti "20 Agustus 2026" atau "Kamis, 20 Agustus 2026" (padahal Hero sudah format Indonesia).

4. **Tidak ada foto couple di screenshot** — Foto menggunakan URL Unsplash eksternal. Harusnya ada fallback/placeholder jika gambar gagal load.

---

### 9.7 Ringkasan Masalah Bisnis — Prioritas

| # | Masalah | Dampak | Effort Fix |
|---|---------|--------|------------|
| 1 | **Data diisi 2x** (Couple/Events tab + Sections) | User bingung, data tidak muncul | Besar — redesain flow |
| 2 | **Tidak ada panduan/wizard** untuk client baru | User baru tidak tahu harus mulai dari mana | Sedang — buat wizard |
| 3 | **Guest slug tidak auto-generate** | Friction saat input ratusan tamu | Kecil — tambah auto-slug |
| 4 | **Field phone/email tidak terpakai** | Form lebih panjang dari seharusnya | Kecil — hapus field |
| 5 | **Tab Wishes/Gifts read-only tapi jadi tab** | 8 tab terlalu banyak, membingungkan | Kecil — gabung tab |
| 6 | **Tanggal event format mentah (ISO)** di invitation | Terlihat tidak profesional | Kecil — format tanggal |
| 7 | **Section tidak auto-create** saat isi data | Data "hilang" tanpa section | Sedang — auto-create |
| 8 | **Tidak ada publish checklist** | User bisa publish undangan kosong | Kecil — tambah validasi |

---

*Review bisnis ini berdasarkan live testing pada 25 Maret 2026 — membuat undangan "Andi Pratama & Rina Maharani" dari nol hingga bisa diakses di browser.*

---

*Review ini dihasilkan berdasarkan pembacaan menyeluruh terhadap seluruh source code dan live testing pada 25 Maret 2026.*
