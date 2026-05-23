import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'apps/invitation/public/assets/dega-ditta');
const trt = path.join(root, 'dega-dita-asets2/TRT');

// in === out is safe: each source is fully read into a buffer before writing.
const jobs = [
  { src: path.join(trt, 'IMG_2288.PNG'), out: path.join(pub, 'cake.png') },
  { src: path.join(trt, 'bunga.png'), out: path.join(pub, 'bunga.png') },
  { src: path.join(pub, 'bouquet.png'), out: path.join(pub, 'bouquet.png') },
];

for (const job of jobs) {
  const before = await sharp(job.src).metadata();
  const buf = await sharp(job.src).trim().png().toBuffer();
  const after = await sharp(buf).metadata();
  await sharp(buf).toFile(job.out);
  console.log(`${path.basename(job.out)}: ${before.width}x${before.height} -> ${after.width}x${after.height}`);
}
