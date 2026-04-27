import request from 'supertest';
import app from '../src/app';
import { connectTestDB, disconnectTestDB } from './helpers';

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

describe('RSVP flow', () => {
  let token: string;
  let clientSlug: string;
  let guestSlug: string;

  beforeAll(async () => {
    // Register + login
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'rsvp@example.com', password: 'password123', name: 'RSVP User' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rsvp@example.com', password: 'password123' });
    token = loginRes.body.token;

    // Create client
    clientSlug = `test-couple-${Date.now()}`;
    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        groomName: 'Budi',
        brideName: 'Sari',
        slug: clientSlug,
        eventDate: '2026-12-01',
        status: 'published',
      });
    const clientId = clientRes.body.client._id;

    // Create guest
    guestSlug = 'pak-tono';
    await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId,
        name: 'Pak Tono',
        invitationName: 'Pak Tono & Keluarga',
        slug: guestSlug,
        category: 'family',
      });
  });

  it('guest can submit RSVP attending', async () => {
    const res = await request(app)
      .post(`/api/guests/rsvp/${clientSlug}/${guestSlug}`)
      .send({ rsvpStatus: 'attending', numberOfGuests: 2 });

    expect(res.status).toBe(200);
    expect(res.body.guest.rsvpStatus).toBe('attending');
  });

  it('guest can update RSVP to not attending', async () => {
    const res = await request(app)
      .post(`/api/guests/rsvp/${clientSlug}/${guestSlug}`)
      .send({ rsvpStatus: 'notAttending', numberOfGuests: 0 });

    expect(res.status).toBe(200);
    expect(res.body.guest.rsvpStatus).toBe('notAttending');
  });

  it('returns 404 for unknown guest slug', async () => {
    const res = await request(app)
      .post(`/api/guests/rsvp/${clientSlug}/unknown-slug`)
      .send({ rsvpStatus: 'attending', numberOfGuests: 1 });

    expect(res.status).toBe(404);
  });
});
