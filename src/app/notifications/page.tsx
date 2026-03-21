"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Heart,
  MessageCircle,
  Users,
  Star,
  Download,
  AtSign,
  Repeat2,
  CheckCheck,
  Loader2,
  Shield,
  AlertTriangle,
  Zap,
  Package,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getNotifications, markNotificationsRead } from "@/app/feed/actions";

const typeIcons: Record<string, any> = {
  like: Heart, follow: Users, comment: MessageCircle, mention: AtSign,
  star: Star, download: Download, repost: Repeat2, system: Bell,
  dev_approved: Shield, dev_rejected: AlertTriangle,
  listing_approved: Package, listing_rejected: AlertTriangle,
  ban: AlertTriangle, warn: AlertTriangle,
};

const typeColors: Record<string, string> = {
  like: "text-red-400 bg-red-500/10", follow: "text-accent bg-accent/10",
  comment: "text-neon-green bg-neon-green/10", mention: "text-neon-purple bg-neon-purple/10",
  star: "text-amber-400 bg-amber-500/10", download: "text-emerald-400 bg-emerald-500/10",
  repost: "text-cyan-400 bg-cyan-500/10", system: "text-zinc-400 bg-zinc-500/10",
  dev_approved: "text-neon-green bg-neon-green/10", dev_rejected: "text-red-400 bg-red-500/10",
  listing_approved: "text-neon-green bg-neon-green/10", listing_rejected: "text-red-400 bg-red-500/10",
  ban: "text-red-400 bg-red-500/10", warn: "text-amber-400 bg-amber-500/10",
};

function notifMessage(n: any): string {
  const data = n.data || {};
  switch (n.type) {
    case "like": return `${data.actor_name || "Someone"} liked your post`;
    case "follow": return `${data.actor_name || "Someone"} started following you`;
    case "comment": return `${data.actor_name || "Someone"} commented on your post`;
    case "mention": return `${data.actor_name || "Someone"} mentioned you`;
    case "star": return `${data.actor_name || "Someone"} starred your project`;
    case "download": return `Your project was downloaded`;
    case "repost": return `${data.actor_name || "Someone"} reposted your post`;
    case "dev_approved": return data.message || "Your Dev tag request was approved!";
    case "dev_rejected": return data.message || "Your Dev tag request was declined";
    case "listing_approved": return `Your listing "${data.title}" was approved and is now live!`;
    case "listing_rejected": return `Your listing "${data.title}" was not approved. Reason: ${data.reason || "N/A"}`;
    case "ban": return data.message || "Your account has been suspended";
    case "warn": return data.message || "You received a warning from admin";
    default: return data.message || "New notification";
  }
}

export default function NotificationsPage() {
  const { user } = useUser();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getNotifications(user.id, 50)
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filteredNotifications = filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!user?.id) return;
    await markNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
            <Bell className="text-accent" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Notifications</h1>
            {unreadCount > 0 && <p className="text-[10px] text-accent font-bold tracking-widest uppercase">{unreadCount} unread</p>}
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer uppercase tracking-widest">
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "unread"] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)} className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${filter === tab ? "bg-white/10 text-white" : "text-zinc-600 hover:bg-white/5"}`}>
            {tab}{tab === "unread" && unreadCount > 0 && <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">{unreadCount}</span>}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {filteredNotifications.map((notif, i) => {
          const Icon = typeIcons[notif.type] || Bell;
          const colorClass = typeColors[notif.type] || "text-zinc-400 bg-zinc-500/10";

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all cursor-pointer group ${notif.is_read ? "opacity-60 hover:opacity-80" : "bg-accent/[0.03] hover:bg-accent/[0.06]"}`}
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300">{notifMessage(notif)}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  {new Date(notif.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!notif.is_read && <div className="h-2 w-2 rounded-full bg-accent shrink-0" />}
            </motion.div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-20">
            <Bell size={32} className="mx-auto text-zinc-800 mb-3" />
            <p className="text-sm font-bold text-zinc-700">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
