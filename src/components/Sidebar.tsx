"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  FolderLock,
  MessageSquare,
  Settings,
  BookOpen,
} from "lucide-react";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/vault", icon: FolderLock, label: "Vault", hasNotif: true },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "#", icon: BookOpen, label: "Resources" },
  { href: "#", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 z-50 flex h-screen w-[68px] flex-col items-center justify-between border-r border-zinc-800/70 bg-black/60 backdrop-blur-xl py-5">
      {/* Logo */}
      <Link href="/">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple text-sm font-black text-white shadow-lg shadow-neon-blue/25">
          EH
        </div>
      </Link>

      {/* Nav Icons */}
      <nav className="flex flex-col items-center gap-1">
        {links.map(({ href, icon: Icon, label, hasNotif }) => {
          const isActive = pathname === href;
          return (
            <Link key={label} href={href} title={label}>
              <motion.div
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                  isActive
                    ? "bg-neon-blue/15 text-neon-blue"
                    : "text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
              >
                <Icon className="h-5 w-5" />

                {/* Active bar */}
                {isActive && (
                  <motion.div
                    className="absolute -left-[17px] h-5 w-[3px] rounded-r-full bg-neon-blue"
                    layoutId="sidebar-active"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                {/* Notification dot */}
                {hasNotif && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 notif-pulse" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom spacer */}
      <div className="h-10" />
    </aside>
  );
}
