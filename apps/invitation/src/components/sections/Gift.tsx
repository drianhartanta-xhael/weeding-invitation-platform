'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

interface GiftProps {
  clientId: string;
  bankAccounts: BankAccount[];
}

export default function Gift({ clientId, bankAccounts }: GiftProps) {
  const [guestName, setGuestName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const presetAmounts = [50000, 100000, 200000, 500000];

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !amount) return;

    setLoading(true);
    try {
      const { data } = await api.post('/gifts', {
        clientId,
        guestName,
        amount: Number(amount),
        message,
      });

      // Open Midtrans Snap popup
      if (data.snapToken && (window as any).snap) {
        (window as any).snap.pay(data.snapToken);
      } else if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
      }
    } catch (error) {
      console.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, bank: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(bank);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <section className="py-20 px-4 bg-wedding-secondary">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading text-3xl md:text-4xl text-center text-wedding-accent mb-4"
      >
        Wedding Gift
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center text-gray-500 mb-12"
      >
        Your blessing means the world to us
      </motion.p>

      <div className="max-w-lg mx-auto space-y-8">
        {/* Bank transfer */}
        {bankAccounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {bankAccounts.map((account) => (
              <div
                key={account.accountNumber}
                className="bg-white rounded-xl p-6 text-center shadow-sm"
              >
                <p className="text-sm text-gray-500 mb-1">{account.bank}</p>
                <p className="text-xl font-mono font-bold text-gray-800 mb-1">
                  {account.accountNumber}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  a.n. {account.accountName}
                </p>
                <button
                  onClick={() =>
                    copyToClipboard(account.accountNumber, account.bank)
                  }
                  className="text-sm text-wedding-accent hover:underline"
                >
                  {copied === account.bank ? 'Copied!' : 'Copy Number'}
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Digital payment */}
        <motion.form
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handlePayment}
          className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h3 className="font-heading text-lg text-wedding-accent text-center">
            Digital Gift
          </h3>

          <input
            type="text"
            placeholder="Your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            required
          />

          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    amount === String(preset)
                      ? 'bg-wedding-accent text-white border-wedding-accent'
                      : 'border-gray-200 text-gray-600 hover:border-wedding-accent'
                  }`}
                >
                  Rp {preset.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Amount (Rp)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
              min="1000"
              required
            />
          </div>

          <textarea
            placeholder="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-wedding-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Send Gift'}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
