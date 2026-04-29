import { extractVideoId } from './youtubeService';

const cases: Array<{ input: string; expected: string | null }> = [
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=ABC', expected: 'dQw4w9WgXcQ' },
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s', expected: 'dQw4w9WgXcQ' },
  { input: '  https://youtu.be/dQw4w9WgXcQ  ', expected: 'dQw4w9WgXcQ' },
  { input: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'not-a-url', expected: null },
  { input: '', expected: null },
  { input: 'https://example.com/foo', expected: null },
];

let failed = 0;
for (const c of cases) {
  const actual = extractVideoId(c.input);
  if (actual !== c.expected) {
    console.error(`FAIL: input=${JSON.stringify(c.input)} expected=${c.expected} actual=${actual}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`${failed}/${cases.length} cases failed`);
  process.exit(1);
}
console.log(`${cases.length}/${cases.length} cases passed`);
