'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface RSVPProps {
  clientSlug: string;
  guestSlug?: string;
  currentStatus?: string;
}

export default function RSVP({ clientSlug, guestSlug, currentStatus }: RSVPProps) {
  const [rsvpStatus, setRsvpStatus] = useState(currentStatus || '');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestSlug || !rsvpStatus) return;

    setLoading(true);
    try {
      await api.post(`/guests/rsvp/${clientSlug}/${guestSlug}`, {
        rsvpStatus,
        numberOfGuests,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('RSVP failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-4 bg-wedding-secondary">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading text-3xl md:text-4xl text-center text-wedding-accent mb-12"
      >
        RSVP
      </motion.h2>

      <div className="max-w-md mx-auto">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white rounded-2xl p-8 shadow-sm"
          >
            <p className="text-xl text-wedding-accent font-heading">
              Thank you for your response!
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-8 shadow-sm space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Will you attend?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRsvpStatus('attending')}
                  className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
                    rsvpStatus === 'attending'
                      ? 'border-wedding-accent bg-wedding-accent text-white'
                      : 'border-gray-200 text-gray-600 hover:border-wedding-accent'
                  }`}
                >
                  Yes, I&apos;ll be there
                </button>
                <button
                  type="button"
                  onClick={() => setRsvpStatus('notAttending')}
                  className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
                    rsvpStatus === 'notAttending'
                      ? 'border-gray-400 bg-gray-400 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  Sorry, can&apos;t make it
                </button>
              </div>
            </div>

            {rsvpStatus === 'attending' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of guests
                </label>
                <select
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'person' : 'people'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={!rsvpStatus || loading}
              className="w-full py-3 bg-wedding-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit RSVP'}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
}
