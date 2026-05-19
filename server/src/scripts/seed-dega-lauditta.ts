// Run: npx tsx server/src/scripts/seed-dega-lauditta.ts
// Seeds client Dega & Lauditta on the Floral Watercolor template.
// Requires: seed-floral-template.ts has been run first.

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Template } from '../models/Template';
import { Client } from '../models/Client';
import { Guest } from '../models/Guest';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

// Photos are served by the invitation app from apps/invitation/public.
const P = '/assets/dega-lauditta';
const heroPhoto = `${P}/1.png`;
const galleryImages = [
  `${P}/2.jpg`, `${P}/3.jpg`, `${P}/4.jpg`, `${P}/5.jpg`,
  `${P}/6.jpg`, `${P}/7.jpg`, `${P}/8.jpg`,
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  let user = await User.findOne({ email: 'admin@wedding.dev' });
  if (!user) {
    user = await User.create({
      email: 'admin@wedding.dev',
      password: 'password123',
      name: 'Admin',
      role: 'admin',
    });
    console.log('Created admin user');
  }

  const template = await Template.findOne({ slug: 'floral-watercolor' });
  if (!template) {
    console.error('Template "floral-watercolor" not found. Run seed-floral-template.ts first.');
    process.exit(1);
  }
  console.log(`Using template: ${template.name}`);

  const eventDate = '2026-07-26';

  const events = [
    {
      name: 'Welcome Cocktail',
      date: eventDate,
      time: '17:00 - 18:00 WITA',
      venue: '',
      address: '',
      mapUrl: '',
    },
    {
      name: 'Dinner Reception',
      date: eventDate,
      time: '18:00 - 22:00 WITA',
      venue: '',
      address: '',
      mapUrl: '',
    },
  ];

  const bankAccounts = [
    { bank: 'BCA', accountNumber: '6044015492', accountName: 'Lauditta Soraya Librata' },
  ];

  const clientData = {
    userId: user._id,
    groomName: 'Dega',
    brideName: 'Lauditta',
    groomPhoto: galleryImages[0],
    bridePhoto: galleryImages[3],
    groomParents: { father: 'Bapak Taufikh (Alm.)', mother: 'Ibu Sri Mujiastuti' },
    brideParents: { father: 'Bapak Johan Librata (Alm.)', mother: 'Ibu Nina Krisnawati' },
    eventDate: new Date(eventDate),
    events,
    templateId: template._id,
    slug: 'dega-lauditta',
    venue: 'Hilton Garden Inn Bali, Nusa Dua',
    music: {
      videoId: 'dt25SFw8H4Y',
      autoplay: true,
    },
    bankAccounts,
    customContent: {
      heroTitle: 'The Wedding of',
      heroSubtitle: 'A small celebration in the island full of memories',
      bodyGreeting: '',
      footerTitle: 'Thank You',
      footerMessage: 'We are truly grateful for your heartfelt wishes and prayers for our marriage.',
      heroPhoto,
    },
    sections: [
      {
        id: 's-cover',
        componentId: 'cover',
        data: { coverText: 'Kepada Yth.' },
        style: 'light',
        order: 0,
      },
      {
        id: 's-couple',
        componentId: 'couple-profile',
        data: {
          groomName: 'Dega Aprillian',
          brideName: 'Lauditta Soraya Librata',
          groomPhoto: galleryImages[0],
          bridePhoto: galleryImages[3],
          groomParents: { father: 'Bapak Taufikh (Alm.)', mother: 'Ibu Sri Mujiastuti' },
          brideParents: { father: 'Bapak Johan Librata (Alm.)', mother: 'Ibu Nina Krisnawati' },
          accentMotif: 'hearts',
        },
        style: 'light',
        order: 1,
      },
      {
        id: 's-gallery',
        componentId: 'gallery',
        data: { images: galleryImages, layout: 'carousel' },
        style: 'light',
        order: 2,
      },
      {
        id: 's-location',
        componentId: 'location-map',
        data: {
          venue: 'Hilton Garden Inn Bali, Nusa Dua',
          address: 'Kawasan Pariwisata Nusa Dua, Bali',
          mapUrl: 'https://maps.app.goo.gl/zbFwMh3ebLwUfrMe7',
          accentMotif: 'sprig',
        },
        style: 'light',
        order: 3,
      },
      {
        id: 's-itinerary',
        componentId: 'event-detail',
        data: { events },
        style: 'light',
        order: 4,
      },
      {
        id: 's-dresscode',
        componentId: 'dress-code',
        data: {
          note: '',
          groups: [
            { label: 'Gentlemen', description: 'Earth tone', figure: 'gentlemen' },
            { label: 'Ladies', description: 'The shades of flowers, except white flowers', figure: 'ladies' },
          ],
        },
        style: 'light',
        order: 5,
      },
      {
        id: 's-rsvp',
        componentId: 'rsvp',
        data: {},
        style: 'accent',
        order: 6,
      },
      {
        id: 's-donation',
        componentId: 'donation',
        data: { bankAccounts, accentMotif: 'bloom' },
        style: 'light',
        order: 7,
      },
      {
        id: 's-wishes',
        componentId: 'wishes',
        data: {},
        style: 'accent',
        order: 8,
      },
    ],
    status: 'published',
  };

  const client = await Client.findOneAndUpdate(
    { slug: 'dega-lauditta' },
    { $set: clientData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Client "${client.groomName} & ${client.brideName}" upserted (${client._id})`);

  const guestData = [
    { name: 'Wayan Sudana', invitationName: 'Bapak & Ibu Wayan Sudana', slug: 'wayan-sudana', phone: '081234500001', category: 'family' as const },
    { name: 'Komang Ayu', invitationName: 'Komang Ayu & Keluarga', slug: 'komang-ayu', phone: '081234500002', category: 'friend' as const },
    { name: 'Ahmad Rizki', invitationName: 'Ahmad Rizki & Pasangan', slug: 'ahmad-rizki', phone: '081234500003', category: 'officeFriend' as const },
  ];

  let guestCount = 0;
  for (const g of guestData) {
    await Guest.findOneAndUpdate(
      { clientId: client._id, slug: g.slug },
      { $set: { ...g, clientId: client._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    guestCount++;
  }
  console.log(`${guestCount} guests upserted`);

  console.log('\n--- Dega & Lauditta Seed Complete ---');
  console.log(`Template:    ${template.name} (${template.slug})`);
  console.log(`Invitation:  http://localhost:3001/${client.slug}`);
  console.log(`With guest:  http://localhost:3001/${client.slug}?to=wayan-sudana`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
