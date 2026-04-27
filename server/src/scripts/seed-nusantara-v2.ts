// Run: npx tsx server/src/scripts/seed-nusantara-v2.ts

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Template } from '../models/Template';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

const nusantaraTemplate = {
  name: 'Nusantara',
  slug: 'nusantara',
  description: 'Template Nusantara dengan palet wine-red, cream, dan gold',
  isActive: true,
  config: {
    primaryColor: '#6B1020',
    secondaryColor: '#F5EDE0',
    accentColor: '#C8A84B',
    fontHeading: 'Cormorant Garamond',
    fontBody: 'Lato',
    heroTitle: 'The Wedding of',
    bodyGreeting: 'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.\nYa Allah, perkenankanlah dan Ridhoilah pernikahan kami.',
    footerTitle: 'Terima Kasih',
    footerMessage: '',
  },
  defaultSections: [
    { componentId: 'cover', style: 'dark', order: 0 },
    { componentId: 'couple-profile', style: 'light', order: 1 },
    { componentId: 'event-detail', style: 'dark', order: 2 },
    { componentId: 'countdown', style: 'light', order: 3 },
    { componentId: 'gallery', style: 'light', order: 4 },
    { componentId: 'location-map', style: 'image-2', order: 5 },
    { componentId: 'rsvp', style: 'dark', order: 6 },
    { componentId: 'wishes', style: 'light', order: 7 },
    { componentId: 'donation', style: 'light', order: 8 },
  ],
  stylePresets: {
    light: { bg: '#F5EDE0', text: '#3D1A0E' },
    dark: { bg: '#6B1020', text: '#F5EDE0' },
    accent: { bg: '#C8A84B', text: '#3D1A0E' },
    'image-1': { bg: '#EDE0CC', text: '#3D1A0E' },
    'image-2': { bg: '#D9C9AD', text: '#3D1A0E' },
  },
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const deleted = await Template.deleteMany({});
  console.log(`Deleted ${deleted.deletedCount} existing template(s)`);

  const template = await Template.create(nusantaraTemplate);
  console.log(`Template "${template.name}" created (${template._id})`);

  console.log('\n--- Nusantara v2 Seed Complete ---');
  console.log('1 template: Nusantara (nusantara)');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
