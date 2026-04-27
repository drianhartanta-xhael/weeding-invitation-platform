/**
 * MVP Seed Script — creates a polished demo for the `budi-sari` invitation.
 *
 * Usage:  npx tsx server/src/scripts/seed-mvp.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import { User } from '../models/User';
import { Template } from '../models/Template';
import { Client } from '../models/Client';
import { Guest } from '../models/Guest';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // ===== 1. Seed User (admin) =====
  let user = await User.findOne({ email: 'admin@wedding.dev' });
  if (!user) {
    user = await User.create({
      email: 'admin@wedding.dev',
      password: 'password123',
      name: 'Admin',
      role: 'admin',
    });
    console.log('Created admin user (admin@wedding.dev / password123)');
  } else {
    console.log('Admin user already exists');
  }

  // ===== 2. Seed Template — Nusantara =====
  const templateData = {
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

  const template = await Template.findOneAndUpdate(
    { slug: 'nusantara' },
    { $set: templateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Template "${template.name}" upserted (${template._id})`);

  // ===== 3. Seed Client — budi-sari =====
  const clientData = {
    userId: user._id,
    groomName: 'Budi Santoso',
    brideName: 'Sari Wulandari',
    groomPhoto: 'https://picsum.photos/seed/groom/400/500',
    bridePhoto: 'https://picsum.photos/seed/bride/400/500',
    groomParents: { father: 'H. Bambang Santoso', mother: 'Hj. Sri Hartati' },
    brideParents: { father: 'H. Agus Wulandari', mother: 'Hj. Dewi Rahayu' },
    eventDate: new Date('2026-06-15'),
    events: [
      {
        name: 'Akad Nikah',
        date: '2026-06-15',
        time: '08:00 - 10:00 WIB',
        venue: 'Masjid Istiqlal',
        address: 'Jl. Taman Wijaya Kusuma, Ps. Baru, Sawah Besar, Jakarta Pusat 10710',
        mapUrl: '',
      },
      {
        name: 'Resepsi',
        date: '2026-06-15',
        time: '11:00 - 14:00 WIB',
        venue: 'Hotel Mulia Senayan',
        address: 'Jl. Asia Afrika, Senayan, Kebayoran Baru, Jakarta Selatan 10270',
        mapUrl: '',
      },
    ],
    templateId: template._id,
    slug: 'budi-sari',
    music: {
      url: '',
      autoplay: true,
    },
    bankAccounts: [
      { bank: 'BCA', accountNumber: '1234567890', accountName: 'Budi Santoso' },
      { bank: 'Mandiri', accountNumber: '0987654321', accountName: 'Sari Wulandari' },
    ],
    customContent: {
      heroTitle: 'The Wedding of',
      bodyGreeting: 'Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan.\nYa Allah, perkenankanlah dan Ridhoilah pernikahan kami.',
      footerTitle: 'Terima Kasih',
      footerMessage: '',
    },
    sections: [
      {
        id: 's-cover',
        componentId: 'cover',
        data: { coverText: '' },
        style: 'dark',
        order: 0,
      },
      {
        id: 's-couple',
        componentId: 'couple-profile',
        data: {
          groomName: 'Budi Santoso',
          brideName: 'Sari Wulandari',
          groomPhoto: 'https://picsum.photos/seed/groom/400/500',
          bridePhoto: 'https://picsum.photos/seed/bride/400/500',
          groomParents: { father: 'H. Bambang Santoso', mother: 'Hj. Sri Hartati' },
          brideParents: { father: 'H. Agus Wulandari', mother: 'Hj. Dewi Rahayu' },
        },
        style: 'light',
        order: 1,
      },
      {
        id: 's-events',
        componentId: 'event-detail',
        data: {
          events: [
            {
              name: 'Akad Nikah',
              date: '2026-06-15',
              time: '08:00 - 10:00 WIB',
              venue: 'Masjid Istiqlal',
              address: 'Jl. Taman Wijaya Kusuma, Ps. Baru, Sawah Besar, Jakarta Pusat 10710',
              mapUrl: '',
            },
            {
              name: 'Resepsi',
              date: '2026-06-15',
              time: '11:00 - 14:00 WIB',
              venue: 'Hotel Mulia Senayan',
              address: 'Jl. Asia Afrika, Senayan, Kebayoran Baru, Jakarta Selatan 10270',
              mapUrl: '',
            },
          ],
        },
        style: 'dark',
        order: 2,
      },
      {
        id: 's-countdown',
        componentId: 'countdown',
        data: { eventDate: '2026-06-15' },
        style: 'light',
        order: 3,
      },
      {
        id: 's-gallery',
        componentId: 'gallery',
        data: {
          images: [
            'https://picsum.photos/seed/wed1/800/600',
            'https://picsum.photos/seed/wed2/800/600',
            'https://picsum.photos/seed/wed3/800/600',
            'https://picsum.photos/seed/wed4/800/600',
            'https://picsum.photos/seed/wed5/800/600',
            'https://picsum.photos/seed/wed6/800/600',
            'https://picsum.photos/seed/wed7/800/600',
            'https://picsum.photos/seed/wed8/800/600',
          ],
        },
        style: 'light',
        order: 4,
      },
      {
        id: 's-location',
        componentId: 'location-map',
        data: {
          venue: 'Hotel Mulia Senayan',
          address: 'Jl. Asia Afrika, Senayan, Kebayoran Baru, Jakarta Selatan 10270',
          mapUrl: '',
        },
        style: 'image-2',
        order: 5,
      },
      {
        id: 's-rsvp',
        componentId: 'rsvp',
        data: {},
        style: 'dark',
        order: 6,
      },
      {
        id: 's-wishes',
        componentId: 'wishes',
        data: {},
        style: 'light',
        order: 7,
      },
      {
        id: 's-donation',
        componentId: 'donation',
        data: {
          bankAccounts: [
            { bank: 'BCA', accountNumber: '1234567890', accountName: 'Budi Santoso' },
            { bank: 'Mandiri', accountNumber: '0987654321', accountName: 'Sari Wulandari' },
          ],
        },
        style: 'light',
        order: 8,
      },
    ],
    status: 'published',
  };

  const client = await Client.findOneAndUpdate(
    { slug: 'budi-sari' },
    { $set: clientData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Client "${client.groomName} & ${client.brideName}" upserted (${client._id})`);

  // ===== 4. Seed Guests =====
  const guestData = [
    { name: 'Pak Tono Widodo', invitationName: 'Bapak & Ibu Tono Widodo', slug: 'bapak-ibu-tono', phone: '081234567890', category: 'family' as const },
    { name: 'Rina Marlina', invitationName: 'Rina Marlina & Keluarga', slug: 'rina-marlina', phone: '081234567891', category: 'family' as const },
    { name: 'Ahmad Fauzi', invitationName: 'Ahmad Fauzi', slug: 'ahmad-fauzi', phone: '081234567892', category: 'friend' as const },
    { name: 'Dina Pratiwi', invitationName: 'Dina Pratiwi & Partner', slug: 'dina-pratiwi', phone: '081234567893', category: 'friend' as const },
    { name: 'Pak Hendra', invitationName: 'Bapak Hendra Gunawan', slug: 'pak-hendra', phone: '081234567894', category: 'officeFriend' as const },
    { name: 'Ibu Siti Nurhaliza', invitationName: 'Ibu Siti Nurhaliza', slug: 'ibu-siti', phone: '081234567895', category: 'motherFriend' as const },
    { name: 'Pak Joko Susilo', invitationName: 'Bapak & Ibu Joko Susilo', slug: 'pak-joko', phone: '081234567896', category: 'fatherFriend' as const },
    { name: 'Dewi Lestari', invitationName: 'Dewi Lestari', slug: 'dewi-lestari', phone: '081234567897', category: 'friend' as const },
    { name: 'Pak RT Slamet', invitationName: 'Bapak RT Slamet & Keluarga', slug: 'pak-rt-slamet', phone: '081234567898', category: 'neighbor' as const },
    { name: 'Maya Angelica', invitationName: 'Maya Angelica & Keluarga', slug: 'maya-angelica', phone: '081234567899', category: 'officeFriend' as const },
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

  // ===== Summary =====
  console.log('\n--- MVP Seed Complete ---');
  console.log(`Admin login:  admin@wedding.dev / password123`);
  console.log(`Template:     ${template.name} (${template.slug})`);
  console.log(`Client:       ${client.groomName} & ${client.brideName}`);
  console.log(`Invitation:   http://localhost:3001/${client.slug}`);
  console.log(`With guest:   http://localhost:3001/${client.slug}?to=ahmad-fauzi`);
  console.log(`Guests:       ${guestCount} seeded`);

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
