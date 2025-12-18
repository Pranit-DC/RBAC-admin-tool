'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, roles: 0, permissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/roles').then(r => r.json()),
      fetch('/api/permissions').then(r => r.json()),
    ])
      .then(([users, roles, permissions]) => {
        setStats({
          users: users.length,
          roles: roles.length,
          permissions: permissions.length,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Total Users', value: stats.users, icon: '👤', link: '/dashboard/users' },
    { title: 'Total Roles', value: stats.roles, icon: '👥', link: '/dashboard/roles' },
    { title: 'Total Permissions', value: stats.permissions, icon: '🔑', link: '/dashboard/permissions' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to RBAC Admin Dashboard</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <button
              key={card.title}
              onClick={() => router.push(card.link)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <span className="text-4xl">{card.icon}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
