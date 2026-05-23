'use client';

import GalleryCarousel from './GalleryCarousel';
import GalleryGrid from './GalleryGrid';

interface GalleryProps {
  images: string[];
  layout?: 'carousel' | 'grid';
  eyebrow?: string;
  heading?: string;
}

export default function Gallery({ images, layout, eyebrow, heading }: GalleryProps) {
  if (!images || images.length === 0) return null;
  return layout === 'grid' ? (
    <GalleryGrid images={images} eyebrow={eyebrow} heading={heading} />
  ) : (
    <GalleryCarousel images={images} eyebrow={eyebrow} heading={heading} />
  );
}
