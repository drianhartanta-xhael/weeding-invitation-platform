import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Gift } from '../models';
import { createGiftSchema } from '../validators/gift';
import { AuthRequest } from '../middleware/auth';
import { snap } from '../config/midtrans';

function verifyMidtransSignature(notification: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const expected = crypto
    .createHash('sha512')
    .update(`${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`)
    .digest('hex');
  const received = notification.signature_key || '';
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export const getGifts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clientId } = req.params;
    const gifts = await Gift.find({ clientId }).sort({ createdAt: -1 });
    res.json({ gifts });
  } catch (error) {
    next(error);
  }
};

// Public - create gift transaction
export const createGift = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = createGiftSchema.parse(req.body);

    const gift = await Gift.create(data);

    // Create Midtrans transaction
    const transactionParams = {
      transaction_details: {
        order_id: `GIFT-${gift._id}`,
        gross_amount: data.amount,
      },
      customer_details: {
        first_name: data.guestName,
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/gift/success`,
      },
    };

    const snapResponse = await snap.createTransaction(transactionParams);

    gift.transactionId = snapResponse.token;
    await gift.save();

    res.status(201).json({
      message: 'Gift transaction created',
      gift,
      snapToken: snapResponse.token,
      redirectUrl: snapResponse.redirect_url,
    });
  } catch (error) {
    next(error);
  }
};

// Midtrans webhook handler
export const handlePaymentNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = req.body;

    if (!verifyMidtransSignature(notification)) {
      res.status(403).json({ message: 'Invalid signature' });
      return;
    }

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    // Extract gift ID from order_id (GIFT-{id})
    const giftId = orderId.replace('GIFT-', '');

    const gift = await Gift.findById(giftId);
    if (!gift) {
      res.status(404).json({ message: 'Gift not found' });
      return;
    }

    gift.paymentMethod = notification.payment_type || '';

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        gift.status = 'success';
      }
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      gift.status = 'failed';
    } else if (transactionStatus === 'pending') {
      gift.status = 'pending';
    }

    await gift.save();

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};
