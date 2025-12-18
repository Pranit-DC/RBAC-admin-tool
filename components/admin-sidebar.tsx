"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { Dispatch, SetStateAction, useState, useEffect } from "react";
import { IconType } from "react-icons";
import {
  FiHome,
  FiLock,
  FiUsers,
  FiShield,
  FiSettings,
  FiHelpCircle,
  FiX,
  FiChevronsRight,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { motion } from "framer-motion";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: FiHome,
  },
  {
    name: "Permissions",
    href: "/dashboard/permissions",
    icon: FiLock,
  },
  {
    name: "Roles",
    href: "/dashboard/roles",
    icon: FiShield,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: FiUsers,
  },
];

interface AdminSidebarProps {
  onMobileClose?: () => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

const Option = ({
  Icon,
  title,
  href,
  pathname,
  open,
}: {
  Icon: IconType;
  title: string;
  href: string;
  pathname: string;
  open: boolean;
}) => {
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <motion.button
        layout
        className={`relative flex h-10 w-full items-center rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-blue-50 text-blue-600 shadow-sm"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <motion.div
          layout
          className="grid h-full w-10 place-content-center text-lg"
        >
          <Icon />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-sm font-medium"
          >
            {title}
          </motion.span>
        )}
      </motion.button>
    </Link>
  );
};

const ToggleClose = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      className="w-full border-t border-gray-200 transition-colors hover:bg-gray-100 rounded-md"
    >
      <div className="flex items-center p-3">
        <motion.div
          layout
          className="grid size-10 place-content-center text-lg"
        >
          <FiChevronsRight
            className={`transition-transform text-gray-500 ${
              open && "rotate-180"
            }`}
          />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Collapse
          </motion.span>
        )}
      </div>
    </motion.button>
  );
};

export function AdminSidebar({
  onMobileClose,
  open = true,
  setOpen,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch current user
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Use internal state only if no external state is provided (for mobile)
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = setOpen ? open : internalOpen;
  const toggleOpen = setOpen
    ? (newOpen: boolean | ((prev: boolean) => boolean)) => {
        if (typeof newOpen === "function") {
          setOpen(newOpen(open));
        } else {
          setOpen(newOpen);
        }
      }
    : setInternalOpen;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <motion.nav
      layout
      className="fixed left-0 top-0 h-full shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden z-40"
      style={{
        width: isOpen ? "256px" : "fit-content",
      }}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-200">
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-3"
          >
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 tracking-tight">
                RBAC Admin
              </span>
            </Link>
          </motion.div>
        ) : (
          <Link href="/dashboard" className="flex justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiShield className="w-5 h-5 text-white" />
            </div>
          </Link>
        )}
      </div>

      {/* Mobile close button */}
      {onMobileClose && (
        <div className="lg:hidden flex justify-end p-2">
          <button
            onClick={onMobileClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex items-center justify-center"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 space-y-2 px-3 py-4 overflow-hidden">
        {navigation.map((item) => (
          <Option
            key={item.name}
            Icon={item.icon}
            title={item.name}
            href={item.href}
            pathname={pathname}
            open={isOpen}
          />
        ))}
      </div>

      {/* User Profile Section */}
      <div className="px-2 py-3 border-t border-gray-200 mb-2">
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="bg-gray-50 rounded-lg p-3"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ring-1 ring-gray-200">
                <FiUser className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || "Admin"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Admin Dashboard
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="h-8 w-8 p-0 hover:bg-gray-200 rounded-md flex items-center justify-center transition-colors"
                title="Logout"
              >
                <FiLogOut className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ring-1 ring-gray-200">
              <FiUser className="w-5 h-5 text-blue-600" />
            </div>
            <button
              onClick={handleLogout}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md flex items-center justify-center transition-colors"
              title="Logout"
            >
              <FiLogOut className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse Button - Now at bottom but visible */}
      <ToggleClose open={isOpen} setOpen={toggleOpen} />
    </motion.nav>
  );
}