import mongoose, { Schema, Document } from 'mongoose';

export interface IGuestDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  invitationName: string;
  slug: string;
  rsvpStatus: 'pending' | 'attending' | 'notAttending';
  numberOfGuests: number;
  rsvpDate: Date | null;
  createdAt: Date;
}

const guestSchema = new Schema<IGuestDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    invitationName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    rsvpStatus: {
      type: String,
      enum: ['pending', 'attending', 'notAttending'],
      default: 'pending',
    },
    numberOfGuests: {
      type: Number,
      default: 1,
    },
    rsvpDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

guestSchema.index({ clientId: 1, slug: 1 }, { unique: true });

export const Guest = mongoose.model<IGuestDocument>('Guest', guestSchema);
