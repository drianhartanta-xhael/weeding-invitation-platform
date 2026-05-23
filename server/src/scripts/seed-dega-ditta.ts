// Run: npx tsx server/src/scripts/seed-dega-ditta.ts
// Seeds client Dega & Ditta (plum variant of the same wedding) on the
// Floral Watercolor — Plum template.
// Requires: seed-floral-plum-template.ts has been run first.

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
const P = '/assets/dega-ditta';
const heroPhoto = `${P}/couple.png`;
const galleryImages = [
  `${P}/2.jpg`, `${P}/3.jpg`, `${P}/4.jpg`, `${P}/5.jpg`,
  `${P}/6.jpg`, `${P}/7.jpg`, `${P}/8.jpg`,
];
const envelopeImg = `${P}/envelope.png`;
const heroDecorImg = `${P}/hero-decor.png`;
const bouquetImg = `${P}/bouquet.png`;
const coupleRingsImg = `${P}/couple-rings.png`;
const venueBgImg = `${P}/venue-bg.png`;

const mapUrl = 'https://www.google.com/maps/place/Hilton+Garden+Inn+Bali+Nusa+Dua,+Jl.+Pratama+No.57A,+Tanjung,+Benoa,+South+Kuta,+Badung+Regency,+Bali+80361/data=!4m2!3m1!1s0x2dd243a86595d7c9:0xaaf726486ec6ba56!18m1!1e1?utm_source=mstt_1&entry=gps&coh=192189&skid=7bc97085-e063-4bcc-8d12-721072ca4456';

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

  const template = await Template.findOne({ slug: 'floral-watercolor-plum' });
  if (!template) {
    console.error('Template "floral-watercolor-plum" not found. Run seed-floral-plum-template.ts first.');
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
      image: `${P}/champagne.png`,
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
    brideName: 'Ditta',
    groomPhoto: galleryImages[0],
    bridePhoto: galleryImages[3],
    groomParents: { father: 'Bapak Taufikh (Alm.)', mother: 'Ibu Sri Mujiastuti' },
    brideParents: { father: 'Bapak Johan Librata (Alm.)', mother: 'Ibu Nina Krisnawati' },
    eventDate: new Date(eventDate),
    events,
    templateId: template._id,
    slug: 'dega-ditta',
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
      heroAccent: heroDecorImg,
      footerImage: `${P}/couple-walk.png`,
    },
    sections: [
      {
        id: 's-cover',
        componentId: 'cover',
        data: {
          coverText: 'Kepada Yth.',
          coverImage: envelopeImg,
          inviteText: 'You are cordially invited to celebrate the day of',
          openText: 'Click to open the invitation.',
        },
        style: 'light',
        order: 0,
      },
      {
        id: 's-couple',
        componentId: 'couple-profile',
        data: {
          layout: 'split',
          heading: 'The happy couple and parents',
          centerPhoto: `${P}/2.jpg`,
          bouquetImage: bouquetImg,
          ringsImage: coupleRingsImg,
          groomName: 'Dega Aprillian',
          brideName: 'Lauditta Soraya Librata',
          groomLabel: 'First son of',
          brideLabel: 'First daughter of',
          groomParents: { father: 'Akhmad Taufikh (alm.)', mother: 'Sri Muji Astuti' },
          brideParents: { father: 'Johan Librata (alm.)', mother: 'Nina Krisnawati' },
          accentMotif: 'hearts',
        },
        style: 'light',
        order: 1,
      },
      {
        id: 's-gallery',
        componentId: 'gallery',
        data: { images: galleryImages, layout: 'grid' },
        style: 'light',
        order: 2,
      },
      {
        id: 's-location',
        componentId: 'location-map',
        data: {
          venue: 'Hilton Garden Inn Bali Nusa Dua',
          address: 'Jl. Pratama No.57A, Tanjung, Benoa, South Kuta, Badung Regency, Bali 80361',
          mapUrl,
          backgroundImage: venueBgImg,
          heading: 'Venue',
          buttonLabel: 'GOOGLE MAPS',
          noDecor: true,
        },
        style: 'light',
        order: 3,
      },
      {
        id: 's-itinerary',
        componentId: 'event-detail',
        data: {
          events,
          heading: 'Rundown',
          eyebrow: '',
          dateLocale: 'en-US',
          text: { dateLabel: 'Date', timeLabel: 'Time', venueLabel: 'Venue', mapLabel: 'View Map' },
        },
        style: 'light',
        order: 4,
      },
      {
        id: 's-dresscode',
        componentId: 'dress-code',
        data: {
          note: '',
          groups: [
            { label: 'Gentlemen', description: 'Earth tone', figure: 'gentlemen', image: `${P}/gentlemen.png` },
            { label: 'Ladies', description: 'The shades of flowers, except white flowers', figure: 'ladies', image: `${P}/ladies.png` },
          ],
        },
        style: 'light',
        order: 5,
      },
      {
        id: 's-rsvp',
        componentId: 'rsvp',
        data: {
          text: {
            subtitle: "We can't wait to celebrate with you!",
            question: 'Will you celebrate with us?',
            attend: 'Yes!',
            decline: 'No..',
            guests: 'Number of Guests',
            unit: 'guest(s)',
            sending: 'Sending...',
            submit: 'RSVP here',
            thanksTitle: 'Thank You',
            thanksMsg: "Your RSVP has been received. We can't wait to celebrate with you!",
          },
        },
        style: 'accent',
        order: 6,
      },
      {
        id: 's-gift',
        componentId: 'donation',
        data: {
          bankAccounts,
          bankOnly: true,
          accentMotif: 'sprig',
          text: {
            subtitle: 'With Love',
            title: 'Wedding Gift',
            note: 'Your presence, love, and prayers are the greatest gift to us. Should you wish to share a token of blessing for our new journey, we would receive it with heartfelt gratitude.',
            copy: 'Copy',
            copied: 'Copied ✓',
          },
        },
        style: 'light',
        order: 7,
      },
      {
        id: 's-wishes',
        componentId: 'wishes',
        data: {
          text: {
            eyebrow: 'Wishes & Prayers',
            title: 'Send Your Wishes',
            namePlaceholder: 'Your name',
            messagePlaceholder: 'Write your wishes and prayers...',
            submit: 'Send Wish 🌸',
            sending: 'Sending...',
            dateLocale: 'en-US',
          },
        },
        style: 'accent',
        order: 8,
      },
    ],
    status: 'published',
  };

  const client = await Client.findOneAndUpdate(
    { slug: 'dega-ditta' },
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

  console.log('\n--- Dega & Ditta Seed Complete ---');
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
