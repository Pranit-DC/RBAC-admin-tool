'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiUsers, 
  FiShield, 
  FiLock, 
  FiSettings, 
  FiArrowRight,
  FiClock,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, roles: 0, permissions: 0 });
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ success: boolean; message: string } | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {}
  };

  const fetchStats = () => {
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
  };

  const handleAiCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await res.json();

      if (data.success) {
        setAiResult({ success: true, message: data.message });
        setCommand('');
        fetchStats();
      } else {
        setAiResult({ success: false, message: data.message || data.error || 'Command failed' });
      }
    } catch (err) {
      setAiResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setAiLoading(false);
    }
  };

  const statsCards = [
    { title: 'Total Users', value: stats.users, icon: FiUsers, color: 'blue', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Total Roles', value: stats.roles, icon: FiShield, color: 'purple', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { title: 'Total Permissions', value: stats.permissions, icon: FiLock, color: 'orange', bgColor: 'bg-orange-50', iconColor: 'text-orange-600' },
  ];

  const quickActions = [
    { title: 'Manage Users', subtitle: 'View & edit users', icon: FiUsers, href: '/dashboard/users', color: 'blue', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Manage Roles', subtitle: 'Configure roles', icon: FiShield, href: '/dashboard/roles', color: 'purple', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { title: 'Permissions', subtitle: 'Control access', icon: FiLock, href: '/dashboard/permissions', color: 'orange', bgColor: 'bg-orange-50', iconColor: 'text-orange-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-600 mt-1">
          Manage your access control and track system activities
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Quick Actions
        </h2>
        <p className="text-gray-600 mb-4">
          Manage your system resources
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all group text-left"
              >
                <div className={`${action.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {action.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Command Box */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          AI Command Assistant
        </h2>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <form onSubmit={handleAiCommand} className="space-y-4">
            <div>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder='Try: "Create permission users.delete" or "Assign Editor role to admin@rbac.com"'
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500:ring-blue-600 text-gray-900 placeholder-gray-500"
                disabled={aiLoading}
              />
            </div>

            {aiResult && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                aiResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {aiResult.success ? (
                  <FiCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <FiAlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${
                  aiResult.success 
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  {aiResult.message}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={aiLoading || !command.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Execute Command
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Example commands:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                "Create a new permission called publish content"
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                "Give the role Content Editor the permission to edit articles"
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                "Assign Admin role to user@example.com"
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                "Delete permission users.test"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

