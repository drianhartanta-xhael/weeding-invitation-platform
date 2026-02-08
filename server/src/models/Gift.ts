import mongoose, { Schema, Document } from 'mongoose';

export interface IGiftDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  guestName: string;
  amount: number;
  message: string;
  paymentMethod: string;
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
}

const giftSchema = new Schema<IGiftDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: '',
    },
    transactionId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const Gift = mongoose.model<IGiftDocument>('Gift', giftSchema);
