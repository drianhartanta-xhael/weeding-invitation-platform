'use client';

import { usePageHeader } from '@/components/admin/PageHeaderProvider';

export default function SettingsPage() {
  usePageHeader({ title: 'Pengaturan', subtitle: 'Akun & preferensi' });

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card p-6">
      <p className="text-gray-500">Settings page - coming soon.</p>
    </div>
  );
}
