import mongoose from 'mongoose';

export async function connectTestDB() {
  await mongoose.connect(process.env.MONGODB_URI!);
}

export async function disconnectTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
