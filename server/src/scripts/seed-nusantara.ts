// Run: npx tsx server/src/scripts/seed-nusantara.ts

import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';

// Ensure .env is loaded from server directory
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Template } from '../models/Template';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

const defaultSections = [
  { componentId: 'couple-profile', style: 'light', order: 0 },
  { componentId: 'event-detail', style: 'accent', order: 1 },
  { componentId: 'countdown', style: 'light', order: 2 },
  { componentId: 'story', style: 'image-1', order: 3 },
  { componentId: 'gallery', style: 'light', order: 4 },
  { componentId: 'location-map', style: 'image-2', order: 5 },
  { componentId: 'rsvp', style: 'dark', order: 6 },
  { componentId: 'wishes', style: 'light', order: 7 },
  { componentId: 'donation', style: 'accent', order: 8 },
];

const templates = [
  {
    name: 'Batik Jawa',
    slug: 'batik-jawa',
    decorationStyle: 'jawa',
    description: 'Motif Kawung dari Batik Jawa dengan palet sogan coklat dan gold',
    isActive: true,
    config: {
      primaryColor: '#8B5E3C',
      secondaryColor: '#F5ECD7',
      accentColor: '#C8A84B',
      fontHeading: 'Playfair Display',
      fontBody: 'Lato',
      heroTitle: 'The Wedding of',
      heroSubtitle: 'Together with their families',
      bodyGreeting: 'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.\nYa Allah, perkenankanlah dan Ridhoilah pernikahan kami.',
      footerTitle: 'Terima Kasih',
      footerMessage: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.',
    },
    defaultSections,
    stylePresets: {
      light: { bg: '#F5ECD7', text: '#3D2B1F' },
      dark: { bg: '#3D2B1F', text: '#F5ECD7' },
      accent: { bg: '#C8A84B', text: '#3D2B1F' },
      'image-1': { bg: '#EDE0CC', text: '#3D2B1F' },
      'image-2': { bg: '#D9C9AD', text: '#3D2B1F' },
    },
  },
  {
    name: 'Patra Bali',
    slug: 'patra-bali',
    decorationStyle: 'bali',
    description: 'Ornamen Patra Bali dengan Kori gate, nuansa navy dan gold',
    isActive: true,
    config: {
      primaryColor: '#1B2A4A',
      secondaryColor: '#F2F0EA',
      accentColor: '#C8A84B',
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Lato',
      heroTitle: 'The Wedding of',
      heroSubtitle: 'Together with their families',
      bodyGreeting: 'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.\nYa Allah, perkenankanlah dan Ridhoilah pernikahan kami.',
      footerTitle: 'Terima Kasih',
      footerMessage: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.',
    },
    defaultSections,
    stylePresets: {
      light: { bg: '#F2F0EA', text: '#1B2A4A' },
      dark: { bg: '#1B2A4A', text: '#F2F0EA' },
      accent: { bg: '#C8A84B', text: '#1B2A4A' },
      'image-1': { bg: '#E8E4D8', text: '#1B2A4A' },
      'image-2': { bg: '#D6D0C0', text: '#1B2A4A' },
    },
  },
  {
    name: 'Anyaman Sunda',
    slug: 'anyaman-sunda',
    decorationStyle: 'sunda',
    description: 'Motif anyaman bambu khas Sunda dengan palet hijau dan cream',
    isActive: true,
    config: {
      primaryColor: '#3B6E45',
      secondaryColor: '#F4F1E8',
      accentColor: '#8FA86A',
      fontHeading: 'Playfair Display',
      fontBody: 'Source Sans Pro',
      heroTitle: 'The Wedding of',
      heroSubtitle: 'Together with their families',
      bodyGreeting: 'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.\nYa Allah, perkenankanlah dan Ridhoilah pernikahan kami.',
      footerTitle: 'Terima Kasih',
      footerMessage: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.',
    },
    defaultSections,
    stylePresets: {
      light: { bg: '#F4F1E8', text: '#2C4A30' },
      dark: { bg: '#2C4A30', text: '#F4F1E8' },
      accent: { bg: '#8FA86A', text: '#2C4A30' },
      'image-1': { bg: '#E8E4D4', text: '#2C4A30' },
      'image-2': { bg: '#D8D4C4', text: '#2C4A30' },
    },
  },
  {
    name: 'Songket Minang',
    slug: 'songket-minang',
    decorationStyle: 'minang',
    description: 'Songket diamond dan atap Gonjong Minangkabau, merah tua dan gold',
    isActive: true,
    config: {
      primaryColor: '#7B1C2E',
      secondaryColor: '#FAF0E6',
      accentColor: '#C8A84B',
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Lato',
      heroTitle: 'The Wedding of',
      heroSubtitle: 'Together with their families',
      bodyGreeting: 'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.\nYa Allah, perkenankanlah dan Ridhoilah pernikahan kami.',
      footerTitle: 'Terima Kasih',
      footerMessage: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.',
    },
    defaultSections,
    stylePresets: {
      light: { bg: '#FAF0E6', text: '#5A1020' },
      dark: { bg: '#5A1020', text: '#FAF0E6' },
      accent: { bg: '#C8A84B', text: '#5A1020' },
      'image-1': { bg: '#EFE0CC', text: '#5A1020' },
      'image-2': { bg: '#E0D0B8', text: '#5A1020' },
    },
  },
  {
    name: 'Ondel-Ondel Betawi',
    slug: 'ondel-ondel-betawi',
    decorationStyle: 'betawi',
    description: 'Bunga Peony dan Ondel-Ondel Betawi, merah putih gold',
    isActive: true,
    config: {
      primaryColor: '#C0392B',
      secondaryColor: '#FDFBF7',
      accentColor: '#C8A84B',
      fontHeading: 'Playfair Display',
      fontBody: 'Open Sans',
      heroTitle: 'The Wedding of',
      heroSubtitle: 'Together with their families',
      bodyGreeting: 'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.\nYa Allah, perkenankanlah dan Ridhoilah pernikahan kami.',
      footerTitle: 'Terima Kasih',
      footerMessage: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.',
    },
    defaultSections,
    stylePresets: {
      light: { bg: '#FDFBF7', text: '#333333' },
      dark: { bg: '#8B1A14', text: '#FDFBF7' },
      accent: { bg: '#C8A84B', text: '#333333' },
      'image-1': { bg: '#F5EDE8', text: '#333333' },
      'image-2': { bg: '#EDE0D8', text: '#333333' },
    },
  },
  {
    name: 'Gorga Batak',
    slug: 'gorga-batak',
    decorationStyle: 'batak',
    description: 'Ukiran Gorga Batak dengan zigzag dan spiral Singa',
    isActive: true,
    config: {
      primaryColor: '#1A1A2E',
      secondaryColor: '#F5F3EE',
      accentColor: '#C0392B',
      fontHeading: 'Cormorant Garamond',
      fontBody: 'Lato',
      heroTitle: 'The Wedding of',
      heroSubtitle: 'Together with their families',
      bodyGreeting: 'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.\nYa Allah, perkenankanlah dan Ridhoilah pernikahan kami.',
      footerTitle: 'Terima Kasih',
      footerMessage: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.',
    },
    defaultSections,
    stylePresets: {
      light: { bg: '#F5F3EE', text: '#1A1A2E' },
      dark: { bg: '#1A1A2E', text: '#F5F3EE' },
      accent: { bg: '#C0392B', text: '#F5F3EE' },
      'image-1': { bg: '#EAE8E0', text: '#1A1A2E' },
      'image-2': { bg: '#DEDAD0', text: '#1A1A2E' },
    },
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  for (const templateData of templates) {
    const template = await Template.findOneAndUpdate(
      { slug: templateData.slug },
      { $set: templateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Template "${template.name}" upserted (${template._id})`);
  }

  console.log('\n--- Nusantara Templates Seed Complete ---');
  console.log(`${templates.length} templates seeded:`);
  for (const t of templates) {
    console.log(`  - ${t.name} (${t.slug})`);
  }

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
