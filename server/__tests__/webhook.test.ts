import crypto from 'crypto';
import request from 'supertest';
import app from '../src/app';
import { connectTestDB, disconnectTestDB } from './helpers';
import { Gift } from '../src/models';

beforeAll(async () => {
  await connectTestDB();
  process.env.MIDTRANS_SERVER_KEY = 'test-server-key';
});
afterAll(disconnectTestDB);

function makeSignature(orderId: string, statusCode: string, grossAmount: string) {
  return crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest('hex');
}

describe('Midtrans webhook', () => {
  let giftId: string;

  beforeAll(async () => {
    const gift = await Gift.create({
      clientId: '507f1f77bcf86cd799439011',
      guestName: 'Test Guest',
      amount: 100000,
      status: 'pending',
    });
    giftId = gift._id.toString();
  });

  it('rejects notification with invalid signature', async () => {
    const res = await request(app)
      .post('/api/gifts/notification')
      .send({
        order_id: `GIFT-${giftId}`,
        status_code: '200',
        gross_amount: '100000.00',
        transaction_status: 'settlement',
        signature_key: 'invalid-signature',
      });

    expect(res.status).toBe(403);
  });

  it('processes valid settlement notification', async () => {
    const orderId = `GIFT-${giftId}`;
    const statusCode = '200';
    const grossAmount = '100000.00';
    const signature = makeSignature(orderId, statusCode, grossAmount);

    const res = await request(app)
      .post('/api/gifts/notification')
      .send({
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        signature_key: signature,
      });

    expect(res.status).toBe(200);

    const updated = await Gift.findById(giftId);
    expect(updated?.status).toBe('success');
  });

  it('processes valid cancel notification', async () => {
    const anotherGift = await Gift.create({
      clientId: '507f1f77bcf86cd799439011',
      guestName: 'Test Guest 2',
      amount: 50000,
      status: 'pending',
    });
    const orderId = `GIFT-${anotherGift._id}`;
    const statusCode = '202';
    const grossAmount = '50000.00';
    const signature = makeSignature(orderId, statusCode, grossAmount);

    const res = await request(app)
      .post('/api/gifts/notification')
      .send({
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        transaction_status: 'cancel',
        signature_key: signature,
      });

    expect(res.status).toBe(200);
    const updated = await Gift.findById(anotherGift._id);
    expect(updated?.status).toBe('failed');
  });
});
