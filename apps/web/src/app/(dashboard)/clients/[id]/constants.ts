import {
  COMPONENT_REGISTRY as SHARED_REGISTRY,
  STYLE_PRESETS as SHARED_STYLE_PRESETS,
} from '@wedding/shared';
import type { GuestCategory, EventItem, BankAccount, BulkGuestRow, Tab } from './types';

export const GUEST_CATEGORIES: { value: GuestCategory; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'friend', label: 'Friend' },
  { value: 'officeFriend', label: 'Office Friend' },
  { value: 'fatherFriend', label: "Father's Friend" },
  { value: 'motherFriend', label: "Mother's Friend" },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'other', label: 'Other' },
];

export const COMPONENT_REGISTRY = SHARED_REGISTRY;
export const STYLE_PRESETS = SHARED_STYLE_PRESETS;

export const EMPTY_EVENT: EventItem = { name: '', date: '', time: '', venue: '', address: '', mapUrl: '' };
export const EMPTY_BANK: BankAccount = { bank: '', accountNumber: '', accountName: '' };
export const EMPTY_BULK_ROW: BulkGuestRow = { name: '', invitationName: '', slug: '', phone: '', category: 'other' };

export const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'couple', label: 'Couple' },
  { key: 'events', label: 'Events' },
  { key: 'details', label: 'Details' },
  { key: 'sections', label: 'Sections' },
  { key: 'guests', label: 'Guests' },
  { key: 'activity', label: 'Activity' },
];

