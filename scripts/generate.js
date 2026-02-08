#!/usr/bin/env node

/**
 * Static site generator for wedding invitations
 * Usage: node scripts/generate.js --slug=john-jane
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const slugArg = args.find((arg) => arg.startsWith('--slug='));

if (!slugArg) {
  console.error('Usage: node scripts/generate.js --slug=<client-slug>');
  process.exit(1);
}

const slug = slugArg.split('=')[1];
const outputDir = path.join(__dirname, '..', 'generated', slug);

console.log(`Generating static site for: ${slug}`);
console.log(`Output directory: ${outputDir}`);

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

try {
  // Build the invitation app with the specific slug
  execSync(
    `npx next build`,
    {
      cwd: path.join(__dirname, '..', 'apps', 'invitation'),
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_PUBLIC_CLIENT_SLUG: slug,
      },
    }
  );

  console.log(`\nStatic site generated successfully at: ${outputDir}`);
} catch (error) {
  console.error('Failed to generate static site:', error.message);
  process.exit(1);
}
