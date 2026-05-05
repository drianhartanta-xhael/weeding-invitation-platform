'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthCard } from '../_components/AuthCard';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Buat akun baru ✨"
      subtitle="Daftar untuk mulai membuat undangan"
      footer={
        <>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Masuk di sini
          </Link>
        </>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-foreground">
            Nama
          </label>
          <Input
            type="text"
            placeholder="Nama lengkap"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="h-11 rounded-lg border-[1.5px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-foreground">
            Email
          </label>
          <Input
            type="email"
            placeholder="kamu@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="h-11 rounded-lg border-[1.5px]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.03em] text-foreground">
            Kata Sandi
          </label>
          <Input
            type="password"
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            className="h-11 rounded-lg border-[1.5px]"
          />
        </div>
        <Button type="submit" className="mt-2 h-11 w-full rounded-lg text-[13px] font-semibold" disabled={loading}>
          {loading ? 'Membuat akun...' : 'Buat Akun →'}
        </Button>
      </form>
    </AuthCard>
  );
}
