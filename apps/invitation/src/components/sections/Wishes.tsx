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
      const { data } = await api.post('/wishes', {
        clientId,
        guestName,
        message,
      });
      setWishes([data.wish, ...wishes]);
      setGuestName('');
      setMessage('');
    } catch (error) {
      console.error('Failed to submit wish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-4 bg-white">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading text-3xl md:text-4xl text-center text-wedding-accent mb-12"
      >
        Wishes & Messages
      </motion.h2>

      <div className="max-w-2xl mx-auto">
        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="bg-wedding-secondary rounded-2xl p-6 mb-8 space-y-4"
        >
          <input
            type="text"
            placeholder="Your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white"
            required
          />
          <textarea
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white resize-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-wedding-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Wish'}
          </button>
        </motion.form>

        {/* Wishes list */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {wishes.map((wish, index) => (
            <motion.div
              key={wish._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-wedding-secondary rounded-xl p-4"
            >
              <p className="font-medium text-wedding-accent text-sm">
                {wish.guestName}
              </p>
              <p className="text-gray-600 mt-1">{wish.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(wish.createdAt).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
