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
    [key: string]: string;
  };
  decorationStyle: string;
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
      },
    },
    decorationStyle: {
      type: String,
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

export const Template = mongoose.model<ITemplateDocument>('Template', templateSchema);
