'use client';

import GalleryCarousel from './GalleryCarousel';
import GalleryGrid from './GalleryGrid';

interface GalleryProps {
  images: string[];
  layout?: 'carousel' | 'grid';
}

export default function Gallery({ images, layout }: GalleryProps) {
  if (!images || images.length === 0) return null;
  return layout === 'grid' ? (
    <GalleryGrid images={images} />
  ) : (
    <GalleryCarousel images={images} />
  );
}
