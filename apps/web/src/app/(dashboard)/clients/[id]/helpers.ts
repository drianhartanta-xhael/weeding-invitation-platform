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

