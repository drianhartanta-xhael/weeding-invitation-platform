// Run: npx tsx server/src/scripts/seed-floral-template.ts
// Creates/updates the "Floral Watercolor" template.

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Template } from '../models/Template';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

const templateData = {
  name: 'Floral Watercolor',
  slug: 'floral-watercolor',
  decorationStyle: 'floral',
  description: 'Tema floral lembut dengan ornamen bunga vektor, krem dan pink',
  isActive: true,
  config: {
    primaryColor: '#C9477E',
    secondaryColor: '#F7F3EE',
    accentColor: '#D98FA8',
    fontHeading: 'Pinyon Script',
    fontBody: 'Poppins',
    heroTitle: 'The Wedding of',
    heroSubtitle: 'A small celebration in the island full of memories',
    bodyGreeting: '',
    footerTitle: 'Thank You',
    footerMessage: 'We are truly grateful for your heartfelt wishes and prayers for our marriage.',
  },
  defaultSections: [
    { componentId: 'cover', style: 'light', order: 0 },
    { componentId: 'couple-profile', style: 'light', order: 1 },
    { componentId: 'gallery', style: 'light', order: 2 },
    { componentId: 'location-map', style: 'light', order: 3 },
    { componentId: 'event-detail', style: 'light', order: 4 },
    { componentId: 'dress-code', style: 'light', order: 5 },
    { componentId: 'rsvp', style: 'accent', order: 6 },
    { componentId: 'donation', style: 'light', order: 7 },
    { componentId: 'wishes', style: 'accent', order: 8 },
  ],
  stylePresets: {
    light: { bg: '#F7F3EE', text: '#6E6258' },
    dark: { bg: '#F0E3DC', text: '#8A5A72' },
    accent: { bg: '#D98FA8', text: '#FFFFFF' },
    'image-1': { bg: '#F2E7DF', text: '#6E6258' },
    'image-2': { bg: '#EADED4', text: '#6E6258' },
  },
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const template = await Template.findOneAndUpdate(
    { slug: templateData.slug },
    { $set: templateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Template "${template.name}" upserted (${template._id})`);
  console.log(`decorationStyle persisted: ${template.decorationStyle}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
