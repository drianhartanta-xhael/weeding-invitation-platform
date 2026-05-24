import type { ComponentId } from '@wedding/shared';
import { getComponentMeta as sharedGetComponentMeta, getDefaultComponentData as sharedGetDefaultData } from '@wedding/shared';
import { GUEST_CATEGORIES } from './constants';

export function categoryLabel(val: string) {
  return GUEST_CATEGORIES.find((c) => c.value === val)?.label || val;
}

export function getComponentMeta(id: string) {
  return sharedGetComponentMeta(id as ComponentId);
}

export function getDefaultComponentData(id: string) {
  return sharedGetDefaultData(id as ComponentId);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export function dateToInput(iso: string) {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const DEFAULT_WA_TEMPLATE =
  "Dear {invitationName}, you're warmly invited to {couple}'s wedding. Please open your personal invitation here: {link}";

const INVITATION_BASE_URL =
  process.env.NEXT_PUBLIC_INVITATION_BASE_URL || 'http://localhost:3001';

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  return digits.length >= 8 ? digits : '';
}

export function invitationUrl(clientSlug: string, guestSlug: string): string {
  return `${INVITATION_BASE_URL}/${clientSlug}?to=${encodeURIComponent(guestSlug)}`;
}

export function buildWaMessage(
  template: string,
  vars: { invitationName: string; couple: string; link: string }
): string {
  return template
    .replace(/\{invitationName\}/g, vars.invitationName)
    .replace(/\{couple\}/g, vars.couple)
    .replace(/\{link\}/g, vars.link);
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

