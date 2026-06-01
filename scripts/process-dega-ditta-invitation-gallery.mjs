// Resize the dega-dita-asets2/gallery/INVITATION/* photos for the invitation
// gallery carousel — max 1400px on long edge, JPEG q80 with mozjpeg.
// Run: node scripts/process-dega-ditta-invitation-gallery.mjs

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Source: the curated gallery dump from the photographer. Supported layouts:
//   dega-dita-asets2/gallery/INVITATION/                                  (flat)
//   dega-dita-asets2/gallery/INVITATION-<timestamp>/INVITATION/           (Google Drive export)
// Update this path when a fresh export arrives.
const src = path.join(
  root,
  'dega-dita-asets2/gallery/INVITATION-20260601T061335Z-3-001/INVITATION'
);
const out = path.join(root, 'apps/invitation/public/assets/dega-ditta/invitation');

await fs.mkdir(out, { recursive: true });

const files = (await fs.readdir(src))
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  // Skip anything tagged with "NAMA" in the filename — the photographer marks photos
  // that are NOT meant for the gallery (e.g. "FOTO NAMA, GA USAH DI GALLERY.jpg").
  .filter((f) => !/nama/i.test(f))
  .sort();

const MAX_LONG_EDGE = 1400;
const QUALITY = 80;

let totalIn = 0;
let totalOut = 0;
for (let i = 0; i < files.length; i++) {
  const inFile = path.join(src, files[i]);
  const outFile = path.join(out, `${String(i + 1).padStart(2, '0')}.jpg`);
  const before = (await fs.stat(inFile)).size;
  totalIn += before;
  await sharp(inFile)
    .rotate() // honor EXIF orientation
    .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(outFile);
  const after = (await fs.stat(outFile)).size;
  totalOut += after;
  console.log(
    `${files[i]} -> ${path.basename(outFile)}  ` +
    `${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`
  );
}

console.log(
  `\nTotal: ${(totalIn / 1024 / 1024).toFixed(1)} MB -> ${(totalOut / 1024 / 1024).toFixed(2)} MB ` +
  `(${(100 - (totalOut / totalIn) * 100).toFixed(1)}% smaller)`
);

// Separately process the "FOTO NAMA" file (if present) to dega-ditta/couple-name.jpg —
// the photographer tags one image "FOTO NAMA, GA USAH DI GALLERY" meaning "not for
// gallery"; we use it as the centerPhoto in the couple-profile section instead.
const namaFile = (await fs.readdir(src))
  .find((f) => /\.(jpe?g|png)$/i.test(f) && /nama/i.test(f));
if (namaFile) {
  const inFile = path.join(src, namaFile);
  const outFile = path.join(path.dirname(out), 'couple-name.jpg');
  const before = (await fs.stat(inFile)).size;
  await sharp(inFile)
    .rotate()
    .resize({ width: MAX_LONG_EDGE, height: MAX_LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(outFile);
  const after = (await fs.stat(outFile)).size;
  console.log(
    `\n[couple-name] ${namaFile} -> ${path.relative(root, outFile)}  ` +
    `${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`
  );
}
