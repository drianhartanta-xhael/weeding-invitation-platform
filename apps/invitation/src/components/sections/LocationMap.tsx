'use client';

import { motion } from 'framer-motion';

interface LocationMapProps {
  venue: string;
  address: string;
  mapUrl?: string;
}

export default function LocationMap({ venue, address, mapUrl }: LocationMapProps) {
  if (!venue && !address) return null;

  let embedSrc = '';
  if (mapUrl && mapUrl.includes('/maps/embed')) {
    embedSrc = mapUrl;
  } else if (address) {
    embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  const mapsLink = mapUrl
    ? mapUrl
    : address
      ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
      : 'https://maps.google.com';

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Lokasi
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          {venue || 'Lokasi Acara'}
        </h2>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(107,16,32,0.12)' }}
        >
          {embedSrc && (
            <div className="w-full h-64">
              <iframe
                src={embedSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          <div className="p-6 text-center">
            {address && (
              <p className="text-sm mb-5" style={{ color: 'rgba(61,26,14,0.7)' }}>{address}</p>
            )}
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs tracking-widest uppercase"
              style={{
                backgroundColor: 'var(--wedding-primary, #6B1020)',
                color: '#F5EDE0',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Buka di Google Maps
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
