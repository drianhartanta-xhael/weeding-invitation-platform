import mongoose, { Schema, Document } from 'mongoose';

export interface IClientDocument extends Document {
  userId: mongoose.Types.ObjectId;
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: {
    father: string;
    mother: string;
  };
  brideParents: {
    father: string;
    mother: string;
  };
  eventDate: Date;
  events: {
    name: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  }[];
  templateId: mongoose.Types.ObjectId;
  slug: string;
  music: {
    url: string;
    autoplay: boolean;
  };
  bankAccounts: {
    bank: string;
    accountNumber: string;
    accountName: string;
  }[];
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClientDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groomName: {
      type: String,
      required: true,
      trim: true,
    },
    brideName: {
      type: String,
      required: true,
      trim: true,
    },
    groomPhoto: {
      type: String,
      default: '',
    },
    bridePhoto: {
      type: String,
      default: '',
    },
    groomParents: {
      father: { type: String, default: '' },
      mother: { type: String, default: '' },
    },
    brideParents: {
      father: { type: String, default: '' },
      mother: { type: String, default: '' },
    },
    eventDate: {
      type: Date,
      required: true,
    },
    events: [
      {
        name: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        venue: { type: String, required: true },
        address: { type: String, required: true },
        mapUrl: { type: String, default: '' },
      },
    ],
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    music: {
      url: { type: String, default: '' },
      autoplay: { type: Boolean, default: true },
    },
    bankAccounts: [
      {
        bank: { type: String, required: true },
        accountNumber: { type: String, required: true },
        accountName: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

export const Client = mongoose.model<IClientDocument>('Client', clientSchema);
