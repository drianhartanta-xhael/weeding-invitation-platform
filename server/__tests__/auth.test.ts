import request from 'supertest';
import app from '../src/app';
import { connectTestDB, disconnectTestDB } from './helpers';

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

describe('Auth', () => {
  const credentials = { email: 'test@example.com', password: 'password123', name: 'Test User' };

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/register').send(credentials);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(credentials.email);
    });

    it('rejects duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send(credentials);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: credentials.email, password: credentials.password });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: credentials.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: 'password123' });
      expect(res.status).toBe(401);
    });
  });
});
