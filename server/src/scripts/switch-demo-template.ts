// Run: npx tsx server/src/scripts/switch-demo-template.ts <template-slug>
// Switches the budi-sari demo client to a different template for visual testing.

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Template } from '../models/Template';
import { Client } from '../models/Client';

async function run() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npx tsx server/src/scripts/switch-demo-template.ts <template-slug>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitation');
  const t = await Template.findOne({ slug });
  if (!t) {
    console.error(`Template "${slug}" not found`);
    process.exit(1);
  }
  await Client.updateOne({ slug: 'budi-sari' }, { $set: { templateId: t._id } });
  console.log(`Client budi-sari -> template ${t.name} (${t.slug})`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
