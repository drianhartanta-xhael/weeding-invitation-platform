import type { GuestCategory } from '@wedding/shared';
export type { GuestCategory };

export interface EventItem {
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
}

export interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface SectionItem {
  id: string;
  componentId: string;
  data: Record<string, any>;
  style: string;
  order: number;
}

export interface Client {
  _id: string;
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: { father: string; mother: string };
  brideParents: { father: string; mother: string };
  eventDate: string;
  events: EventItem[];
  templateId: string;
  slug: string;
  music: { url: string; autoplay: boolean };
  bankAccounts: BankAccount[];
  customContent: {
    heroTitle: string;
    heroSubtitle: string;
    bodyGreeting: string;
    footerTitle: string;
    footerMessage: string;
  };
  sections: SectionItem[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  _id: string;
  name: string;
  invitationName: string;
  slug: string;
  phone: string;
  email: string;
  category: GuestCategory;
  rsvpStatus: 'pending' | 'attending' | 'notAttending';
  numberOfGuests: number;
}

export interface Wish {
  _id: string;
  guestName: string;
  message: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Gift {
  _id: string;
  guestName: string;
  amount: number;
  message: string;
  status: 'pending' | 'success' | 'failed';
  paymentMethod: string;
  createdAt: string;
}

export interface TemplateOption {
  _id: string;
  name: string;
  slug: string;
  description: string;
  config: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontHeading: string;
    fontBody: string;
  };
  defaultSections?: { componentId: string; style: string; order: number }[];
  stylePresets?: Record<string, { bg: string; text: string }>;
}

export interface ClientStats {
  totalGuests: number;
  totalAttending: number;
  totalNotAttending: number;
  totalPending: number;
  totalAttendees: number;
  views: number;
  byCategory: { category: string; count: number }[];
}

export interface BulkGuestRow {
  name: string;
  invitationName: string;
  slug: string;
  phone: string;
  category: GuestCategory;
}

export type Tab = 'overview' | 'couple' | 'events' | 'details' | 'sections' | 'guests' | 'activity';
