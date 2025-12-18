'use client';

import { AdminSidebar } from '@/components/admin-sidebar';
import { ReactNode, useState, useEffect } from 'react';
import { FiMenu } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (!data.user) {
        router.push('/');
        return;
      }

      // Check if user has admin role
      const rolesRes = await fetch('/api/users');
      const usersData = await rolesRes.json();
      const currentUser = usersData.find((u: any) => u.id === data.user.id);
      
      if (!currentUser) {
        router.push('/');
        return;
      }

      const hasAdminRole = currentUser.user_roles?.some(
        (ur: any) => ur.role.name.toLowerCase() === 'admin'
      );

      if (!hasAdminRole) {
        router.push('/access-denied');
        return;
      }

      setIsAdmin(true);
    } catch (err) {
      router.push('/');
    }
  };

  // Show loading while checking admin access
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render dashboard if user is admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for desktop */}
      <div className="hidden lg:block">
        <AdminSidebar open={desktopSidebarOpen} setOpen={setDesktopSidebarOpen} />
      </div>

      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <AdminSidebar onMobileClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div 
        className={`min-h-screen transition-all duration-300 ${
          mounted ? (desktopSidebarOpen ? 'lg:ml-64' : 'lg:ml-20') : 'lg:ml-64'
        }`}
      >
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100:bg-gray-800 rounded-lg transition-colors"
          >
            <FiMenu className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

