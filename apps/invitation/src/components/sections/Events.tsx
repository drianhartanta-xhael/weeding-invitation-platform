'use client';

import { motion } from 'framer-motion';

interface Event {
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
}

interface EventsProps {
  events: Event[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Events({ events }: EventsProps) {
  return (
    <section className="py-20 px-4 bg-wedding-secondary">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading text-3xl md:text-4xl text-center text-wedding-accent mb-16"
      >
        Wedding Events
      </motion.h2>

      <div className="max-w-3xl mx-auto space-y-8">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-2xl p-8 shadow-sm text-center"
          >
            <h3 className="font-heading text-2xl text-wedding-accent mb-4">
              {event.name}
            </h3>
            <p className="text-gray-600 mb-1">{formatDate(event.date)}</p>
            <p className="text-gray-600 mb-4">{event.time}</p>
            <p className="font-medium text-gray-800">{event.venue}</p>
            <p className="text-gray-500 text-sm mb-4">{event.address}</p>
            {event.mapUrl && (
              <a
                href={event.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-wedding-accent text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                Open Maps
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
