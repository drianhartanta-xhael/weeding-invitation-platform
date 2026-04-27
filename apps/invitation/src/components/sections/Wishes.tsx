'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface Wish {
  _id: string;
  guestName: string;
  message: string;
  createdAt: string;
}

interface WishesProps {
  clientId: string;
  initialWishes: Wish[];
}

export default function Wishes({ clientId, initialWishes }: WishesProps) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !message) return;
    setLoading(true);
    try {
      const { data } = await api.post('/wishes', { clientId, guestName, message });
      setWishes([data.wish, ...wishes]);
      setGuestName('');
      setMessage('');
    } catch {
      console.error('Failed to submit wish');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: '1px solid rgba(107,16,32,0.18)',
    color: '#3D1A0E',
    backgroundColor: 'white',
  };

  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Pesan &amp; Doa
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Ucapan &amp; Doa
        </h2>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="rounded-xl p-6 mb-8 space-y-4"
          style={{ border: '1px solid rgba(107,16,32,0.12)', backgroundColor: 'rgba(200,168,75,0.04)' }}
        >
          <input
            type="text"
            placeholder="Nama Anda"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
            required
          />
          <textarea
            placeholder="Tulis ucapan dan doa Anda..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={inputStyle}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-full text-xs tracking-widest uppercase transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--wedding-primary, #6B1020)', color: '#F5EDE0' }}
          >
            {loading ? 'Mengirim...' : 'Kirim Ucapan 🌸'}
          </button>
        </motion.form>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {wishes.map((wish, index) => (
            <motion.div
              key={wish._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-xl p-5"
              style={{ border: '1px solid rgba(107,16,32,0.1)', backgroundColor: 'rgba(200,168,75,0.04)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
                  {wish.guestName}
                </p>
              </div>
              <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(61,26,14,0.75)' }}>
                &ldquo;{wish.message}&rdquo;
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(61,26,14,0.4)' }}>
                {new Date(wish.createdAt).toLocaleDateString('id-ID')}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
