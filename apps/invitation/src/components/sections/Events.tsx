'use client';

import { motion } from 'framer-motion';

interface Event {
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
  image?: string;
}

interface EventsText {
  dateLabel?: string;
  timeLabel?: string;
  venueLabel?: string;
  mapLabel?: string;
}

interface EventsProps {
  events: Event[];
  eyebrow?: string;
  heading?: string;
  text?: EventsText;
  dateLocale?: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Events({ events, eyebrow, heading, text, dateLocale }: EventsProps) {
  if (!events || events.length === 0) return null;

  const eb = eyebrow === undefined ? 'Rangkaian Acara' : eyebrow;
  const hd = heading || 'Hari Istimewa';
  const locale = dateLocale || 'id-ID';
  const t = {
    dateLabel: 'Tanggal',
    timeLabel: 'Waktu',
    venueLabel: 'Tempat',
    mapLabel: 'Lihat Peta',
    ...text,
  };

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        {eb && (
          <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
            {eb}
          </p>
        )}
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-accent, #ba6193)' }}>
          {hd}
        </h2>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-5">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12 }}
            className="rounded-xl p-8"
            style={{
              backgroundColor: 'color-mix(in srgb, currentColor 6%, transparent)',
              border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
            }}
          >
            {event.image && (
              <img
                src={event.image}
                alt=""
                aria-hidden
                className="w-44 sm:w-52 h-auto mx-auto mb-4 object-contain"
              />
            )}

            <p className="text-xs tracking-widest uppercase mb-5" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
              {ROMAN[index] || String(index + 1)} · {event.name}
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>{t.dateLabel}</p>
                <p>{formatDate(event.date, locale)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>{t.timeLabel}</p>
                <p>{event.time}</p>
              </div>
              {event.venue && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-0.5" style={{ opacity: 0.5 }}>{t.venueLabel}</p>
                  <p>{event.venue}</p>
                  {event.address && <p className="text-xs mt-0.5" style={{ opacity: 0.6 }}>{event.address}</p>}
                </div>
              )}
            </div>

            {event.mapUrl && (
              <a
                href={event.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 px-5 py-2 text-xs tracking-widest uppercase rounded-full"
                style={{
                  backgroundColor: 'var(--wedding-accent, #C8A84B)',
                  color: '#3D1A0E',
                }}
              >
                {t.mapLabel}
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
