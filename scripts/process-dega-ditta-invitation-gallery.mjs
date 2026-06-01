// Resize the dega-dita-asets2/gallery/INVITATION/* photos for the invitation
// gallery carousel — max 1400px on long edge, JPEG q80 with mozjpeg.
// Run: node scripts/process-dega-ditta-invitation-gallery.mjs

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'dega-dita-asets2/gallery/INVITATION');
const out = path.join(root, 'apps/invitation/public/assets/dega-ditta/invitation');

await fs.mkdir(out, { recursive: true });

const files = (await fs.readdir(src))
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
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
