import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplateDocument extends Document {
  name: string;
  slug: string;
  thumbnail: string;
  description: string;
  isActive: boolean;
  config: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontHeading: string;
    fontBody: string;
    heroTitle: string;
    heroSubtitle: string;
    bodyGreeting: string;
    footerTitle: string;
    footerMessage: string;
    [key: string]: string;
  };
  defaultSections: {
    componentId: string;
    style: string;
    order: number;
  }[];
  stylePresets: Record<string, { bg: string; text: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplateDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    config: {
      type: Schema.Types.Mixed,
      default: {
        primaryColor: '#D4A373',
        secondaryColor: '#FEFAE0',
        accentColor: '#606C38',
        fontHeading: 'Playfair Display',
        fontBody: 'Lato',
        heroTitle: 'The Wedding of',
        heroSubtitle: 'You are cordially invited',
        bodyGreeting: '',
        footerTitle: 'Thank You',
        footerMessage: 'We are looking forward to celebrating with you',
      },
    },
    defaultSections: {
      type: [
        {
          componentId: { type: String, required: true },
          style: { type: String, default: 'light' },
          order: { type: Number, default: 0 },
        },
      ],
      default: [
        { componentId: 'couple-profile', style: 'light', order: 0 },
        { componentId: 'event-detail', style: 'dark', order: 1 },
        { componentId: 'countdown', style: 'light', order: 2 },
        { componentId: 'gallery', style: 'light', order: 3 },
        { componentId: 'rsvp', style: 'dark', order: 4 },
        { componentId: 'wishes', style: 'light', order: 5 },
        { componentId: 'donation', style: 'dark', order: 6 },
      ],
    },
    stylePresets: {
      type: Schema.Types.Mixed,
      default: {
        light: { bg: '#FEFAE0', text: '#333333' },
        dark: { bg: '#2D2D2D', text: '#FFFFFF' },
        accent: { bg: '#606C38', text: '#FFFFFF' },
        'image-1': { bg: '#F5F0EB', text: '#333333' },
        'image-2': { bg: '#E8E0D8', text: '#333333' },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Template = mongoose.model<ITemplateDocument>('Template', templateSchema);
