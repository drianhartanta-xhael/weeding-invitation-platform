export interface IGift {
  _id: string;
  clientId: string;
  guestName: string;
  amount: number;
  message: string;
  paymentMethod: string;
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
}

export type CreateGiftDTO = Pick<IGift, 'clientId' | 'guestName' | 'amount' | 'message'>;
