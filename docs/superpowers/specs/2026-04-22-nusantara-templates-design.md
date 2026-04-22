# Nusantara Wedding Templates Design Spec
Date: 2026-04-22

## Overview

Tambah 6 template undangan bertema daerah Indonesia ke platform. Setiap template punya identitas visual unik (warna, motif SVG, tipografi) yang muncul otomatis di seluruh halaman undangan — Hero, setiap section, dan Footer. Dekorasi dibuat pure SVG/CSS (tidak butuh aset gambar eksternal).

## Templates

| Slug | Nama | Motif | Palet Utama |
|------|------|-------|-------------|
| `jawa` | Batik Jawa | Kawung (4 oval + center) | Sogan coklat `#3d2b1f` · Cream `#f5ede0` · Gold `#c8a96e` |
| `bali` | Patra Bali | Patra sinusoidal + Kori gate | Navy `#1a0e00` · Gold `#c9920a` · Merah `#8b1a1a` |
| `sunda` | Anyaman Sunda | Anyaman bambu diagonal + frame | Hijau `#2d4a1e` · Earth gold `#8b6914` · Cream `#f0ead8` |
| `minang` | Songket Minang | Diamond songket + gonjong atap | Merah tua `#8b0000` · Hitam `#1a0000` · Gold `#c9920a` |
| `betawi` | Ondel-Ondel Betawi | Peony Cina + ondel-ondel corner | Merah `#cc2200` · Hijau `#1a6600` · Gold `#c9920a` |
| `batak` | Gorga Batak | Zigzag + kotak spiral singa | Merah `#cc0000` · Hitam `#1a1a1a` · Krem `#f5f0e8` |

## Arsitektur

### DECORATION_REGISTRY (extensibility pattern)

```
apps/invitation/src/lib/decorations/
  registry.ts          ← central map: decorationStyle → DecorationConfig
  types.ts             ← shared types: DecorationConfig, DecorProps
  jawa/
    index.tsx          ← exports: HeroDecor, SectionDecor, FooterDecor, colors
  bali/index.tsx
  sunda/index.tsx
  minang/index.tsx
  betawi/index.tsx
  batak/index.tsx
```

Menambah template baru ke depan = buat 1 folder baru + tambah 1 entry ke `registry.ts`. Tidak ada komponen lain yang perlu diubah.

### DecorationConfig type

```ts
// types.ts
export interface DecorColors {
  bg: string;          // background utama halaman
  surface: string;     // background section light
  accent: string;      // warna accent (gold, dll)
  primary: string;     // warna teks/heading utama
  dark: string;        // warna section gelap
}

export interface DecorProps {
  colors: DecorColors;
}

export interface DecorationConfig {
  colors: DecorColors;
  HeroDecor: React.FC<DecorProps>;
  SectionDecor: React.FC<DecorProps & { variant: 'light' | 'dark' | 'accent' | 'image-1' | 'image-2' }>;
  FooterDecor: React.FC<DecorProps>;
  fontHeading?: string;   // Google Font override (opsional)
  fontBody?: string;
}
```

### Data flow

```
MongoDB Template.decorationStyle
  → GET /api/invitations/:slug (response: client + template.decorationStyle + template.colors)
  → apps/invitation/src/app/[slug]/page.tsx
      → const config = DECORATION_REGISTRY[decorationStyle] ?? DECORATION_REGISTRY['none']
      → pass config ke Hero, SectionRenderer, Footer
  → Hero: render <config.HeroDecor />
  → SectionRenderer: render <config.SectionDecor variant={section.style} /> per section
  → Footer: render <config.FooterDecor />
```

## Perubahan File

### Server

**`server/src/models/Template.ts`**
- Tambah field: `decorationStyle: { type: String, default: 'none' }`

**`server/src/controllers/invitationController.ts`**
- `GET /api/invitations/:slug` — populate `templateId` dan include `decorationStyle` + `colors` dalam response

### Shared types

**`packages/shared/src/types/template.ts`**
- Tambah `decorationStyle?: string` ke `Template` type

### Invitation App

**`apps/invitation/src/lib/decorations/types.ts`** ← file baru
- Define `DecorColors`, `DecorProps`, `DecorationConfig`

**`apps/invitation/src/lib/decorations/registry.ts`** ← file baru
- Export `DECORATION_REGISTRY: Record<string, DecorationConfig>`
- Include 6 entries + fallback `'none'` (current design, tanpa ornamen)

**`apps/invitation/src/lib/decorations/jawa/index.tsx`** ← baru (× 6 template)
- Export `HeroDecor`, `SectionDecor`, `FooterDecor`, `colors`
- SVG ornamen Kawung corners, divider emas, tile pattern untuk section

**`apps/invitation/src/app/[slug]/page.tsx`**
- Baca `decorationStyle` dari API response
- Lookup config dari registry
- Apply `colors.bg` ke root `<div>` via inline style (override CSS variable `--wedding-secondary`)
- Pass `config` sebagai prop ke `Hero`, `SectionRenderer`, `Footer`

**`apps/invitation/src/components/sections/Hero.tsx`**
- Tambah prop: `decorConfig?: DecorationConfig`
- Render `<decorConfig.HeroDecor colors={decorConfig.colors} />` jika ada

**`apps/invitation/src/components/SectionRenderer.tsx`**
- Tambah prop: `decorConfig?: DecorationConfig`
- Render `<decorConfig.SectionDecor variant={section.style} colors={decorConfig.colors} />` per section

**`apps/invitation/src/components/sections/Footer.tsx`**
- Tambah prop: `decorConfig?: DecorationConfig`
- Render `<decorConfig.FooterDecor colors={decorConfig.colors} />` jika ada

### Admin (apps/web)

**`apps/web/src/app/(dashboard)/templates/[id]/page.tsx`**
- Tambah field `decorationStyle` ke form edit template (dropdown: none, jawa, bali, sunda, minang, betawi, batak)

**`apps/web/src/app/(dashboard)/clients/new/page.tsx`**
- Step 2: tampilkan badge dekorasi di kartu template (e.g. "Batik Kawung")

### Database

Buat/update 6 Template records via seed atau admin UI dengan `decorationStyle` yang sesuai.

## Backward Compatibility

- Template lama tanpa `decorationStyle` → fallback ke `'none'` → tampilan existing tidak berubah sama sekali
- CSS variables (`--wedding-primary`, dll) tetap dipakai oleh legacy renderer; DecorationConfig colors override via inline style di halaman baru

## Tidak Termasuk dalam Scope

- Font Google per-template (bisa ditambah ke depan via `fontHeading` field, infrastruktur sudah ada)
- Animasi Framer Motion pada ornamen (bisa ditambah per komponen dekorasi tanpa ubah arsitektur)
- Preview live dekorasi di admin (cukup pakai link Preview yang sudah ada)
- Upload gambar motif (murni SVG/CSS sesuai keputusan)
