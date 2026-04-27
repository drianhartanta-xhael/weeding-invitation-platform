// Run: npx tsx server/src/scripts/seed-regions.ts
// Adds 6 regional Nusantara templates (Betawi, Sunda, Batak, Bali, Padang, Jawa Jember)
// Does NOT delete existing templates — runs alongside the base 'nusantara' template.

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Template } from '../models/Template';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

const baseDefaultSections = [
  { componentId: 'cover', style: 'dark', order: 0 },
  { componentId: 'couple-profile', style: 'light', order: 1 },
  { componentId: 'event-detail', style: 'dark', order: 2 },
  { componentId: 'countdown', style: 'light', order: 3 },
  { componentId: 'gallery', style: 'light', order: 4 },
  { componentId: 'location-map', style: 'image-2', order: 5 },
  { componentId: 'rsvp', style: 'dark', order: 6 },
  { componentId: 'wishes', style: 'light', order: 7 },
  { componentId: 'donation', style: 'light', order: 8 },
];

const baseConfigDefaults = {
  fontHeading: 'Cormorant Garamond',
  fontBody: 'Lato',
  heroTitle: 'The Wedding of',
  bodyGreeting:
    'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.\nYa Allah, perkenankanlah dan Ridhoilah pernikahan kami.',
  footerTitle: 'Terima Kasih',
  footerMessage: '',
};

const templates = [
  {
    name: 'Nusantara · Betawi',
    slug: 'nusantara-betawi',
    description: 'Tema Betawi — hijau gelap, merah bata, emas. Aksen ondel-ondel.',
    isActive: true,
    config: {
      ...baseConfigDefaults,
      regionKey: 'betawi',
      regionLabel: 'Jakarta · Betawi',
      primaryColor: '#0d2b1a',
      secondaryColor: '#f5e9d0',
      accentColor: '#d4a017',
    },
    defaultSections: baseDefaultSections,
    stylePresets: {
      light: { bg: '#f5e9d0', text: '#0d2b1a' },
      dark: { bg: '#0d2b1a', text: '#f5e9d0' },
      accent: { bg: '#1a5c2e', text: '#f5e9d0' },
      'image-1': { bg: '#0f3320', text: '#f5e9d0' },
      'image-2': { bg: '#123d25', text: '#f5e9d0' },
    },
  },
  {
    name: 'Nusantara · Sunda',
    slug: 'nusantara-sunda',
    description: 'Tema Sunda — biru teal, hijau, motif kawung. Nuansa elegan & tenang.',
    isActive: true,
    config: {
      ...baseConfigDefaults,
      regionKey: 'sunda',
      regionLabel: 'Tatar Sunda · Jawa Barat',
      primaryColor: '#1a3d4f',
      secondaryColor: '#f0ece2',
      accentColor: '#3a7d8c',
    },
    defaultSections: baseDefaultSections,
    stylePresets: {
      light: { bg: '#f0ece2', text: '#1a2e3b' },
      dark: { bg: '#1a3d4f', text: '#f0ece2' },
      accent: { bg: '#3a6c4a', text: '#f0ece2' },
      'image-1': { bg: '#e8e3d5', text: '#1a2e3b' },
      'image-2': { bg: '#ddd8c8', text: '#1a2e3b' },
    },
  },
  {
    name: 'Nusantara · Batak',
    slug: 'nusantara-batak',
    description: 'Tema Batak — hitam, merah ulos, emas. Pola gorga yang kokoh & berani.',
    isActive: true,
    config: {
      ...baseConfigDefaults,
      regionKey: 'batak',
      regionLabel: 'Tanah Batak · Sumatera Utara',
      primaryColor: '#1a0a0a',
      secondaryColor: '#f5e9d0',
      accentColor: '#d4a017',
    },
    defaultSections: baseDefaultSections,
    stylePresets: {
      light: { bg: '#f5e9d0', text: '#1a0a0a' },
      dark: { bg: '#1a0a0a', text: '#f5e9d0' },
      accent: { bg: '#5a1010', text: '#f5e9d0' },
      'image-1': { bg: '#220d0d', text: '#f5e9d0' },
      'image-2': { bg: '#2a1010', text: '#f5e9d0' },
    },
  },
  {
    name: 'Nusantara · Bali',
    slug: 'nusantara-bali',
    description: 'Tema Bali — coklat tua, kuning emas, siluet pura & poleng checkered.',
    isActive: true,
    config: {
      ...baseConfigDefaults,
      regionKey: 'bali',
      regionLabel: 'Pulau Dewata · Bali',
      primaryColor: '#2d1810',
      secondaryColor: '#fdf6ec',
      accentColor: '#c47a2b',
    },
    defaultSections: baseDefaultSections,
    stylePresets: {
      light: { bg: '#fdf6ec', text: '#2d1810' },
      dark: { bg: '#2d1810', text: '#fdf6ec' },
      accent: { bg: '#7a3520', text: '#fdf6ec' },
      'image-1': { bg: '#f5ede0', text: '#2d1810' },
      'image-2': { bg: '#ede3d5', text: '#2d1810' },
    },
  },
  {
    name: 'Nusantara · Padang',
    slug: 'nusantara-padang',
    description: 'Tema Padang — hitam, merah, emas. Siluet Rumah Gadang & motif songket.',
    isActive: true,
    config: {
      ...baseConfigDefaults,
      regionKey: 'padang',
      regionLabel: 'Minangkabau · Sumatera Barat',
      primaryColor: '#1a1208',
      secondaryColor: '#f5f0e8',
      accentColor: '#c9a030',
    },
    defaultSections: baseDefaultSections,
    stylePresets: {
      light: { bg: '#f5f0e8', text: '#1a1208' },
      dark: { bg: '#1a1208', text: '#f5f0e8' },
      accent: { bg: '#4a1010', text: '#f5f0e8' },
      'image-1': { bg: '#ece7de', text: '#1a1208' },
      'image-2': { bg: '#e2dcd2', text: '#1a1208' },
    },
  },
  {
    name: 'Nusantara · Jawa (Jember)',
    slug: 'nusantara-jawa',
    description: 'Tema Jawa Jember — coklat batik, hijau, emas. Motif Parang diagonal.',
    isActive: true,
    config: {
      ...baseConfigDefaults,
      regionKey: 'jawa',
      regionLabel: 'Jember · Jawa Timur',
      primaryColor: '#2a1a08',
      secondaryColor: '#f7f2ea',
      accentColor: '#b8860b',
    },
    defaultSections: baseDefaultSections,
    stylePresets: {
      light: { bg: '#f7f2ea', text: '#2a1a08' },
      dark: { bg: '#2a1a08', text: '#f7f2ea' },
      accent: { bg: '#4a5c2e', text: '#f7f2ea' },
      'image-1': { bg: '#ede6d8', text: '#2a1a08' },
      'image-2': { bg: '#e3daca', text: '#2a1a08' },
    },
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  for (const t of templates) {
    const tpl = await Template.findOneAndUpdate(
      { slug: t.slug },
      { $set: t },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Template "${tpl.name}" upserted (${tpl._id})`);
  }

  console.log('\n--- Regional Templates Seed Complete ---');
  console.log(`${templates.length} templates seeded:`);
  for (const t of templates) {
    console.log(`  - ${t.name} (${t.slug}) — region: ${t.config.regionKey}`);
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
