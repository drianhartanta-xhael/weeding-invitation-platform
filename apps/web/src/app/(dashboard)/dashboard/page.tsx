'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Stats {
  totalClients: number;
  totalGuests: number;
  totalWishes: number;
  totalGifts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalGuests: 0,
    totalWishes: 0,
    totalGifts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/clients');
        setStats((prev) => ({
          ...prev,
          totalClients: data.clients?.length || 0,
        }));
      } catch (error) {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Clients', value: stats.totalClients, color: 'bg-blue-500' },
    { label: 'Total Guests', value: stats.totalGuests, color: 'bg-green-500' },
    { label: 'Total Wishes', value: stats.totalWishes, color: 'bg-purple-500' },
    { label: 'Total Gifts', value: stats.totalGifts, color: 'bg-amber-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-lg mb-3`} />
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
