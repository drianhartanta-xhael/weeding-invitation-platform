import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export default async function globalSetup() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret-key-for-jest';
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  (global as any).__MONGOD__ = mongod;
}
