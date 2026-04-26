// ============================================================
// Component Registry — defines all available invitation components
// ============================================================

export const COMPONENT_IDS = [
  'couple-profile',
  'event-detail',
  'gallery',
  'donation',
  'rsvp',
  'wishes',
  'countdown',
  'story',
  'location-map',
] as const;

export type ComponentId = (typeof COMPONENT_IDS)[number];

// --- Per-component data schemas ---

export interface CoupleProfileData {
  groomName: string;
  brideName: string;
  groomPhoto: string;
  bridePhoto: string;
  groomParents: { father: string; mother: string };
  brideParents: { father: string; mother: string };
}

export interface EventDetailData {
  events: {
    name: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  }[];
}

export interface GalleryData {
  images: string[];
}

export interface DonationData {
  bankAccounts: {
    bank: string;
    accountNumber: string;
    accountName: string;
  }[];
}

export interface RsvpData {
  // RSVP uses clientSlug + guestSlug from context, no extra data needed
}

export interface WishesData {
  // Wishes uses clientId from context, no extra data needed
}

export interface CountdownData {
  eventDate: string;
}

export interface StoryData {
  stories: {
    title: string;
    date: string;
    description: string;
    image: string;
  }[];
  layout?: 'vertical' | 'horizontal';
}

export interface LocationMapData {
  venue: string;
  address: string;
  mapUrl: string;
}

// Union type for all component data
export type ComponentData =
  | CoupleProfileData
  | EventDetailData
  | GalleryData
  | DonationData
  | RsvpData
  | WishesData
  | CountdownData
  | StoryData
  | LocationMapData;

// --- Section (a component placed in a slot) ---

export const STYLE_PRESETS = ['light', 'dark', 'accent', 'image-1', 'image-2'] as const;
export type StylePreset = (typeof STYLE_PRESETS)[number];

export interface ISection {
  id: string;
  componentId: ComponentId;
  data: Record<string, any>;
  style: StylePreset;
  order: number;
}

// --- Component metadata (for admin UI) ---

export interface ComponentFieldOption {
  value: string;
  label: string;
}

export interface ComponentField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'url' | 'array' | 'image-list' | 'select';
  required?: boolean;
  placeholder?: string;
  arrayFields?: ComponentField[];
  options?: ComponentFieldOption[];
}

export interface ComponentMeta {
  id: ComponentId;
  label: string;
  description: string;
  icon: string;
  fields: ComponentField[];
}

// --- Component registry ---

export const COMPONENT_REGISTRY: ComponentMeta[] = [
  {
    id: 'couple-profile',
    label: 'Couple Profile',
    description: 'Display bride & groom info with photos and parents',
    icon: 'heart',
    fields: [
      { key: 'groomName', label: 'Groom Name', type: 'text', required: true },
      { key: 'brideName', label: 'Bride Name', type: 'text', required: true },
      { key: 'groomPhoto', label: 'Groom Photo URL', type: 'url' },
      { key: 'bridePhoto', label: 'Bride Photo URL', type: 'url' },
      {
        key: 'groomParents',
        label: 'Groom Parents',
        type: 'array',
        arrayFields: [
          { key: 'father', label: 'Father', type: 'text' },
          { key: 'mother', label: 'Mother', type: 'text' },
        ],
      },
      {
        key: 'brideParents',
        label: 'Bride Parents',
        type: 'array',
        arrayFields: [
          { key: 'father', label: 'Father', type: 'text' },
          { key: 'mother', label: 'Mother', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'event-detail',
    label: 'Event Detail',
    description: 'Show event schedule with venue and map',
    icon: 'calendar',
    fields: [
      {
        key: 'events',
        label: 'Events',
        type: 'array',
        arrayFields: [
          { key: 'name', label: 'Event Name', type: 'text', required: true, placeholder: 'e.g. Akad Nikah' },
          { key: 'date', label: 'Date', type: 'date', required: true },
          { key: 'time', label: 'Time', type: 'text', required: true, placeholder: 'e.g. 08:00 - 10:00 WIB' },
          { key: 'venue', label: 'Venue', type: 'text', required: true },
          { key: 'address', label: 'Address', type: 'text', required: true },
          { key: 'mapUrl', label: 'Maps URL', type: 'url', placeholder: 'https://maps.google.com/...' },
        ],
      },
    ],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'Photo gallery section',
    icon: 'image',
    fields: [
      { key: 'images', label: 'Image URLs', type: 'image-list' },
    ],
  },
  {
    id: 'donation',
    label: 'Donation / Gift',
    description: 'Bank accounts for digital gifts',
    icon: 'gift',
    fields: [
      {
        key: 'bankAccounts',
        label: 'Bank Accounts',
        type: 'array',
        arrayFields: [
          { key: 'bank', label: 'Bank', type: 'text', required: true, placeholder: 'e.g. BCA' },
          { key: 'accountNumber', label: 'Account Number', type: 'text', required: true },
          { key: 'accountName', label: 'Account Name', type: 'text', required: true },
        ],
      },
    ],
  },
  {
    id: 'rsvp',
    label: 'RSVP',
    description: 'Guest attendance confirmation form',
    icon: 'check-circle',
    fields: [],
  },
  {
    id: 'wishes',
    label: 'Wishes',
    description: 'Guest wishes and messages wall',
    icon: 'message-circle',
    fields: [],
  },
  {
    id: 'countdown',
    label: 'Countdown',
    description: 'Countdown timer to event date',
    icon: 'clock',
    fields: [
      { key: 'eventDate', label: 'Event Date', type: 'date', required: true },
    ],
  },
  {
    id: 'story',
    label: 'Our Story',
    description: 'Timeline of the couple story',
    icon: 'book-open',
    fields: [
      {
        key: 'layout',
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'vertical', label: 'Vertical' },
          { value: 'horizontal', label: 'Horizontal' },
        ],
      },
      {
        key: 'stories',
        label: 'Story Items',
        type: 'array',
        arrayFields: [
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'date', label: 'Date', type: 'text', placeholder: 'e.g. January 2020' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'image', label: 'Image URL', type: 'url' },
        ],
      },
    ],
  },
  {
    id: 'location-map',
    label: 'Location Map',
    description: 'Embedded Google Maps with venue info',
    icon: 'map-pin',
    fields: [
      { key: 'venue', label: 'Venue Name', type: 'text', required: true },
      { key: 'address', label: 'Address', type: 'textarea', required: true },
      { key: 'mapUrl', label: 'Google Maps Embed URL (optional)', type: 'url', placeholder: 'https://www.google.com/maps/embed?...' },
    ],
  },
];

export function getComponentMeta(id: ComponentId): ComponentMeta | undefined {
  return COMPONENT_REGISTRY.find((c) => c.id === id);
}

// Default empty data for each component
export function getDefaultComponentData(id: ComponentId): Record<string, any> {
  switch (id) {
    case 'couple-profile':
      return { groomName: '', brideName: '', groomPhoto: '', bridePhoto: '', groomParents: { father: '', mother: '' }, brideParents: { father: '', mother: '' } };
    case 'event-detail':
      return { events: [] };
    case 'gallery':
      return { images: [] };
    case 'donation':
      return { bankAccounts: [] };
    case 'rsvp':
      return {};
    case 'wishes':
      return {};
    case 'countdown':
      return { eventDate: '' };
    case 'story':
      return { stories: [], layout: 'vertical' };
    case 'location-map':
      return { venue: '', address: '', mapUrl: '' };
    default:
      return {};
  }
}
