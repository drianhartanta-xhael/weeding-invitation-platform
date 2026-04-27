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
      const { data } = await api.post('/gifts', { clientId, guestName, amount: Number(amount), message });
      if (data.snapToken && (window as any).snap) {
        (window as any).snap.pay(data.snapToken);
      } else if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
      }
    } catch {
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
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs tracking-[0.25em] uppercase mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Hadiah
        </p>
        <h2 className="font-heading text-3xl md:text-4xl italic mb-3" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
          Amplop Digital
        </h2>
        <p className="text-sm max-w-sm mx-auto" style={{ color: 'rgba(61,26,14,0.65)' }}>
          Doa restu Anda adalah hadiah terbaik bagi kami.
        </p>
      </motion.div>

      <div className="max-w-lg mx-auto space-y-8">
        {bankAccounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {bankAccounts.map((account) => (
              <div
                key={account.accountNumber}
                className="rounded-xl p-6 text-center"
                style={{
                  border: '1px solid rgba(107,16,32,0.15)',
                  backgroundColor: 'rgba(200,168,75,0.05)',
                }}
              >
                <p className="text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
                  {account.bank}
                </p>
                <p className="font-mono text-lg font-bold mb-1" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
                  {account.accountNumber}
                </p>
                <p className="text-xs mb-4" style={{ color: 'rgba(61,26,14,0.6)' }}>
                  a.n. {account.accountName}
                </p>
                <button
                  onClick={() => copyToClipboard(account.accountNumber, account.bank)}
                  className="px-5 py-2 rounded-full text-xs tracking-widest uppercase transition-all"
                  style={copied === account.bank
                    ? { backgroundColor: 'var(--wedding-primary, #6B1020)', color: '#F5EDE0' }
                    : { border: '1px solid var(--wedding-primary, #6B1020)', color: 'var(--wedding-primary, #6B1020)' }
                  }
                >
                  {copied === account.bank ? 'Tersalin ✓' : 'Salin Nomor'}
                </button>
              </div>
            ))}
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handlePayment}
          className="rounded-xl p-6 space-y-4"
          style={{ border: '1px solid rgba(107,16,32,0.12)', backgroundColor: 'rgba(200,168,75,0.03)' }}
        >
          <h3 className="font-heading text-lg italic text-center mb-2" style={{ color: 'var(--wedding-primary, #6B1020)' }}>
            Kirim Hadiah Digital
          </h3>
          <input
            type="text"
            placeholder="Nama Anda"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid rgba(107,16,32,0.2)', color: '#3D1A0E' }}
            required
          />
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="px-3 py-1.5 rounded-full text-xs transition-all"
                  style={amount === String(preset)
                    ? { backgroundColor: 'var(--wedding-primary, #6B1020)', color: '#F5EDE0' }
                    : { border: '1px solid rgba(107,16,32,0.25)', color: 'var(--wedding-primary, #6B1020)' }
                  }
                >
                  Rp {preset.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Nominal (Rp)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: '1px solid rgba(107,16,32,0.2)', color: '#3D1A0E' }}
              min="1000"
              required
            />
          </div>
          <textarea
            placeholder="Pesan (opsional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={{ border: '1px solid rgba(107,16,32,0.2)', color: '#3D1A0E' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm tracking-widest uppercase transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--wedding-primary, #6B1020)', color: '#F5EDE0' }}
          >
            {loading ? 'Memproses...' : 'Kirim Hadiah'}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
