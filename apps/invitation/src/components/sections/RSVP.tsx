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
      await api.post(`/guests/rsvp/${clientSlug}/${guestSlug}`, { rsvpStatus, numberOfGuests });
      setSubmitted(true);
    } catch {
      console.error('RSVP failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'color-mix(in srgb, currentColor 6%, transparent)',
    border: '1px solid color-mix(in srgb, currentColor 25%, transparent)',
    color: 'currentColor',
  };

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
          Konfirmasi Kehadiran
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'currentColor' }}>
          RSVP
        </h2>
      </motion.div>

      <div className="max-w-md mx-auto">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <p className="font-heading text-2xl italic mb-3" style={{ color: 'var(--wedding-accent, #C8A84B)' }}>
              Terima Kasih
            </p>
            <p className="text-sm" style={{ color: 'currentColor', opacity: 0.7 }}>
              Konfirmasi kehadiran Anda telah kami terima.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'currentColor', opacity: 0.6 }}>
                Konfirmasi Kehadiran
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'attending', label: 'Insya Allah Hadir 🎉' },
                  { value: 'notAttending', label: 'Mohon Maaf, Berhalangan' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRsvpStatus(opt.value)}
                    className="py-3 rounded-lg text-sm transition-all"
                    style={rsvpStatus === opt.value
                      ? { backgroundColor: 'var(--wedding-accent, #C8A84B)', color: '#3D1A0E' }
                      : { backgroundColor: 'color-mix(in srgb, currentColor 6%, transparent)', border: '1px solid color-mix(in srgb, currentColor 22%, transparent)', color: 'currentColor' }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {rsvpStatus === 'attending' && (
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'currentColor', opacity: 0.6 }}>
                  Jumlah Tamu
                </p>
                <select
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={inputStyle}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n} style={{ backgroundColor: '#3D1A0E' }}>
                      {n} orang
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={!rsvpStatus || loading}
              className="w-full py-3 rounded-lg text-sm tracking-widest uppercase transition-opacity disabled:opacity-40"
              style={{ backgroundColor: 'var(--wedding-accent, #C8A84B)', color: '#3D1A0E' }}
            >
              {loading ? 'Mengirim...' : 'Kirim Konfirmasi'}
            </button>
          </motion.form>
        )}
      </div>
    </section>
  );
}
