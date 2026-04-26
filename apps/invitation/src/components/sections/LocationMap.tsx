'use client';

import { motion } from 'framer-motion';

interface LocationMapProps {
  venue: string;
  address: string;
  mapUrl?: string;
}

export default function LocationMap({ venue, address, mapUrl }: LocationMapProps) {
  if (!venue && !address) return null;

  // Build embed URL: use provided embed URL or construct from address
  let embedSrc = '';
  if (mapUrl && mapUrl.includes('/maps/embed')) {
    embedSrc = mapUrl;
  } else if (address) {
    embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl text-center text-wedding-accent mb-8"
        >
          Location
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/50 rounded-2xl shadow-sm overflow-hidden border border-gray-100"
        >
          {/* Map iframe */}
          {embedSrc && (
            <div className="w-full h-[300px]">
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

          {/* Venue info */}
          <div className="p-6 text-center">
            {venue && (
              <h3 className="font-heading text-xl text-wedding-accent mb-2">{venue}</h3>
            )}
            {address && (
              <p className="text-sm text-gray-600 mb-4">{address}</p>
            )}
            {address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-wedding-primary text-white rounded-full text-sm hover:opacity-90 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Open in Google Maps
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
