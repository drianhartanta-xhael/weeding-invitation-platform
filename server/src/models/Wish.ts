import mongoose, { Schema, Document } from 'mongoose';

export interface IWishDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  guestName: string;
  message: string;
  isApproved: boolean;
  createdAt: Date;
}

const wishSchema = new Schema<IWishDocument>(
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
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Wish = mongoose.model<IWishDocument>('Wish', wishSchema);
