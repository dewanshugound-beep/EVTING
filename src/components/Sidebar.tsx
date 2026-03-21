"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  Store,
  Rss,
  MessageSquare,
  Bell,
  Compass,
  Upload,
  Shield,
  Settings,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";

const mainLinks = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/store", icon: Store, label: "Store" },
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/explore", icon: Compass, label: "Explore" },
];

const secondaryLinks = [
  { href: "/upload", icon: Upload, label: "Upload" },
  { href: "/notifications", icon: Bell, label: "Alerts", hasNotif: true },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      if (isSignedIn && user?.id) {
        const sb = createBrowserSupabase();
        const [{ data: userData }, { count }] = await Promise.all([
          sb.from("users").select("role").eq("id", user.id).single(),
          sb.from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false),
        ]);
        if (userData) setRole((userData as any).role);
        setUnreadCount(count || 0);
      }
    }
    fetchUserData();
    // Poll every 30s
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn, user?.id]);

  return (
    <aside className="fixed top-0 left-0 z-50 flex h-screen w-[68px] flex-col items-center justify-between border-r border-zinc-800/50 bg-[#08080d]/90 backdrop-blur-2xl py-5">
      {/* Logo */}
      <Link href="/" className="relative group">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-green text-[10px] font-black text-white shadow-lg shadow-neon-blue/25 transition-transform group-hover:scale-110">
          MX
        </div>
        <motion.div
          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-neon-green shadow-[0_0_10px_rgba(57,211,83,0.8)]"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </Link>

      {/* Main Nav Icons */}
      <nav className="flex flex-col items-center gap-1">
        {mainLinks.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={label} href={href} title={label}>
              <motion.div
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
              >
                <Icon className="h-[18px] w-[18px]" />
                {isActive && (
                  <motion.div
                    className="absolute -left-[17px] h-5 w-[3px] rounded-r-full bg-accent"
                    layoutId="sidebar-active"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-2 h-px w-6 bg-zinc-800/60" />

        {/* Secondary Links */}
        {secondaryLinks.map(({ href, icon: Icon, label, hasNotif }) => {
          const isActive = pathname === href;
          return (
            <Link key={label} href={href} title={label}>
              <motion.div
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-zinc-700 hover:bg-white/5 hover:text-zinc-400"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
              >
                <Icon className="h-[18px] w-[18px]" />
                {hasNotif && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[9px] font-black text-white flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Admin Link */}
        {role === "admin" && (
          <Link href="/admin" title="Admin">
            <motion.div
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                pathname === "/admin"
                  ? "bg-red-500/15 text-red-400"
                  : "text-zinc-700 hover:bg-red-500/10 hover:text-red-400"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.93 }}
            >
              <Shield className="h-[18px] w-[18px]" />
              {pathname === "/admin" && (
                <motion.div
                  className="absolute -left-[17px] h-5 w-[3px] rounded-r-full bg-red-500"
                  layoutId="sidebar-admin"
                />
              )}
            </motion.div>
          </Link>
        )}
      </nav>

      {/* Bottom spacer */}
      <div className="h-10" />
    </aside>
  );
}
