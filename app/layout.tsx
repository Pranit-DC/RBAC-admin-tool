import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RBAC Admin Dashboard',
  description: 'Role-Based Access Control Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
