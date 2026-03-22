"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Package, Flag, Bell, ToggleLeft, LayoutDashboard,
  CheckCircle, XCircle, Loader2, Search, Filter, MoreHorizontal,
  TrendingUp, AlertTriangle, Trash2, Ban, Star, Eye, RefreshCw,
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "dev-requests", label: "Dev Requests", icon: Star },
  { id: "store-queue", label: "Store Queue", icon: Package },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "feature-flags", label: "Feature Flags", icon: ToggleLeft },
  { id: "announcements", label: "Announcements", icon: Bell },
];

export default function AdminClient({
  initialUsers,
  initialReports,
  visitorCount,
}: {
  initialUsers: any[];
  initialReports: any[];
  visitorCount: number;
}) {
  const [tab, setTab] = useState("dashboard");
  const [users, setUsers] = useState(initialUsers);
  const [reports, setReports] = useState(initialReports);
  const [devRequests, setDevRequests] = useState<any[]>([]);
  const [storeQueue, setStoreQueue] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, posts: 0, listings: 0, openReports: 0, pendingDev: 0, pendingStore: 0 });
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [devRequestsLoading, setDevRequestsLoading] = useState(false);
  const [storeQueueLoading, setStoreQueueLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const sb = createBrowserSupabase() as any;

  useEffect(() => {
    loadStats();
    loadFeatureFlags();
  }, []);

  useEffect(() => {
    if (tab === "dev-requests") loadDevRequests();
    if (tab === "store-queue") loadStoreQueue();
  }, [tab]);

  async function loadStats() {
    try {
      const results = await Promise.allSettled([
        sb.from("users").select("*", { count: "exact", head: true }),
        sb.from("posts").select("*", { count: "exact", head: true }),
        sb.from("store_listings").select("*", { count: "exact", head: true }),
        sb.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
        sb.from("dev_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        sb.from("store_listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const [usersRes, postsRes, listingsRes, reportsRes, devRes, queueRes] = results;

      setStats({
        users: usersRes.status === 'fulfilled' ? (usersRes.value as any).count || 0 : stats.users,
        posts: postsRes.status === 'fulfilled' ? (postsRes.value as any).count || 0 : stats.posts,
        listings: listingsRes.status === 'fulfilled' ? (listingsRes.value as any).count || 0 : stats.listings,
        openReports: reportsRes.status === 'fulfilled' ? (reportsRes.value as any).count || 0 : stats.openReports,
        pendingDev: devRes.status === 'fulfilled' ? (devRes.value as any).count || 0 : stats.pendingDev,
        pendingStore: queueRes.status === 'fulfilled' ? (queueRes.value as any).count || 0 : stats.pendingStore,
      });

      // Log errors if any
      results.forEach((res, i) => {
        if (res.status === 'rejected') console.error(`Admin stat query ${i} failed:`, res.reason);
      });
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      toast.error("Dashboard stats sync failed");
    }
  }

  async function loadDevRequests() {
    setDevRequestsLoading(true);
    try {
      const { data, error } = await sb.from("dev_requests")
        .select("*, users(id, username, display_name, avatar_url, email, created_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDevRequests(data || []);
    } catch (err: any) {
      console.error("Failed to load dev requests:", err);
      toast.error(`Queue error: ${err.message || 'Transmission failed'}`);
    } finally {
      setDevRequestsLoading(false);
    }
  }

  async function loadStoreQueue() {
    setStoreQueueLoading(true);
    try {
      const { data, error } = await sb.from("store_listings")
        .select("*, users(id, username, display_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setStoreQueue(data || []);
    } catch (err: any) {
      console.error("Failed to load store queue:", err);
      toast.error(`Queue error: ${err.message || 'Transmission failed'}`);
    } finally {
      setStoreQueueLoading(false);
    }
  }

  async function loadFeatureFlags() {
    try {
      const { data, error } = await sb.from("feature_flags").select("*").order("key");
      if (error) throw error;
      setFeatureFlags(data || []);
    } catch (err: any) {
      console.error("Failed to load feature flags:", err);
    }
  }

  async function handleDevRequest(id: string, userId: string, action: "dev" | "certified_dev" | "reject", reason?: string) {
    setLoading(true);
    try {
      const { error } = await sb.rpc("process_dev_request", {
        p_request_id: id,
        p_target_user_id: userId,
        p_new_status: action === "reject" ? "rejected" : "approved",
        p_new_role: action === "reject" ? "member" : action,
        p_admin_note: reason || (action === "reject" ? "Rejected" : "Approved"),
        p_notif_type: action === "reject" ? "dev_rejected" : "dev_approved",
        p_notif_message: action === "reject" 
          ? "Your Dev tag request was not approved. " + (reason || "")
          : `Congratulations! You've been granted the ${action === "certified_dev" ? "Certified Dev" : "Dev"} role.`
      });

      if (error) throw error;

      toast.success(`Dev request ${action === "reject" ? "rejected" : "approved"}`);
      await Promise.all([loadDevRequests(), loadStats()]);
    } catch (err: any) {
      console.error("Dev request processing failed:", err);
      toast.error(`Permission update failed: ${err.message || "Unknown anomaly"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleStoreListing(id: string, userId: string, action: "approve" | "reject", reason?: string) {
    setLoading(true);
    try {
      const status = action === "approve" ? "approved" : "rejected";
      const { error: updateError } = await sb.from("store_listings").update({ status, admin_note: reason || null }).eq("id", id);
      if (updateError) throw updateError;

      const { error: notifError } = await sb.from("notifications").insert({
        user_id: userId, type: `listing_${action === "approve" ? "approved" : "rejected"}`,
        data: { message: action === "approve" ? "Your store listing is now live!" : `Listing rejected: ${reason || "Does not meet guidelines"}` },
      });
      if (notifError) throw notifError;

      toast.success(`Listing ${action}d`);
      await Promise.all([loadStoreQueue(), loadStats()]);
    } catch (err: any) {
      console.error("Store listing update failed:", err);
      toast.error(`Listing update failed: ${err.message || 'Operation aborted'}`);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeatureFlag(id: string, currentValue: boolean) {
    try {
      const { error } = await sb.from("feature_flags").update({ value: !currentValue }).eq("id", id);
      if (error) throw error;
      setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, value: !currentValue } : f));
      toast.success("Feature flag updated");
    } catch (err: any) {
      console.error("Feature flag update failed:", err);
      toast.error(`Update failed: ${err.message || 'System error'}`);
    }
  }

  async function handleUserAction(userId: string, action: string) {
    try {
      let updatedFields: any = {};
      let successMsg = "";

      if (action === "ban") {
        updatedFields = { is_banned: true, ban_reason: "Banned by admin" };
        successMsg = "User banned";
      } else if (action === "unban") {
        updatedFields = { is_banned: false, ban_reason: null };
        successMsg = "User unbanned";
      } else if (action === "make_admin") {
        updatedFields = { role: "admin" };
        successMsg = "User promoted to admin";
      } else if (action === "make_mod") {
        updatedFields = { role: "moderator" };
        successMsg = "User promoted to moderator";
      } else if (action === "make_member") {
        updatedFields = { role: "member" };
        successMsg = "User demoted to member";
      }

      const { error } = await sb.from("users").update(updatedFields).eq("id", userId);
      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedFields } : u));
      toast.success(successMsg);
    } catch (err: any) {
      console.error("User action failed:", err);
      toast.error(`Action failed: ${err.message || 'Transmission compromised'}`);
    }
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex">
      {/* Admin Sidebar */}
      <aside className="w-52 shrink-0 border-r border-white/5 p-4 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <Shield size={16} className="text-red-400" />
          <span className="text-sm font-black text-white">Admin Panel</span>
        </div>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
              tab === id ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
            }`}
          >
            <Icon size={14} />
            {label}
            {id === "dev-requests" && stats.pendingDev > 0 && (
              <span className="ml-auto text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{stats.pendingDev}</span>
            )}
            {id === "store-queue" && stats.pendingStore > 0 && (
              <span className="ml-auto text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{stats.pendingStore}</span>
            )}
            {id === "reports" && stats.openReports > 0 && (
              <span className="ml-auto text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{stats.openReports}</span>
            )}
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <h1 className="text-2xl font-black text-white mb-6">Overview</h1>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Users", value: stats.users, color: "text-accent", bg: "bg-accent/10" },
                { label: "Total Posts", value: stats.posts, color: "text-neon-green", bg: "bg-neon-green/10" },
                { label: "Store Listings", value: stats.listings, color: "text-neon-purple", bg: "bg-neon-purple/10" },
                { label: "Open Reports", value: stats.openReports, color: "text-red-400", bg: "bg-red-500/10", alert: stats.openReports > 0 },
                { label: "Dev Requests", value: stats.pendingDev, color: "text-amber-400", bg: "bg-amber-500/10", alert: stats.pendingDev > 0 },
                { label: "Store Queue", value: stats.pendingStore, color: "text-orange-400", bg: "bg-orange-500/10", alert: stats.pendingStore > 0 },
              ].map(({ label, value, color, bg, alert }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border ${alert ? "border-red-500/20" : "border-white/5"} bg-white/[0.02]`}
                >
                  <p className="text-xs text-zinc-600 mb-2">{label}</p>
                  <p className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</p>
                  {alert && <p className="text-[10px] text-red-400 mt-1 font-medium">Needs attention</p>}
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Review Dev Requests", action: () => setTab("dev-requests"), count: stats.pendingDev },
                    { label: "Review Store Submissions", action: () => setTab("store-queue"), count: stats.pendingStore },
                    { label: "Handle Reports", action: () => setTab("reports"), count: stats.openReports },
                  ].map(({ label, action, count }) => (
                    <button key={label} onClick={action} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-zinc-400 hover:text-white transition-all cursor-pointer">
                      <span>{label}</span>
                      {count > 0 && <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{count}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white mb-3">Platform Health</h3>
                <div className="space-y-3">
                  {[
                    { label: "Database", status: "Operational", ok: true },
                    { label: "Auth Service", status: "Operational", ok: true },
                    { label: "Storage", status: "Operational", ok: true },
                    { label: "Realtime", status: "Operational", ok: true },
                  ].map(({ label, status, ok }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">{label}</span>
                      <span className={`text-[10px] font-bold ${ok ? "text-neon-green" : "text-red-400"}`}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-white">Users ({stats.users})</h1>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by username or email..."
                  className="h-9 pl-9 pr-4 rounded-xl bg-white/5 border border-white/8 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-accent/30 w-72"
                />
              </div>
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u: any) => (
                <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-400 shrink-0">
                    {(u.display_name || u.username || "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{u.display_name || u.username}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                        u.role === "admin" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                        u.role === "certified_dev" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                        u.role === "dev" ? "text-accent bg-accent/10 border-accent/20" :
                        u.role === "moderator" ? "text-violet-400 bg-violet-500/10 border-violet-500/20" :
                        "text-zinc-500 bg-zinc-800 border-zinc-700"
                      }`}>{u.role}</span>
                      {u.is_banned && <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">BANNED</span>}
                    </div>
                    <p className="text-[11px] text-zinc-600">@{u.username} • {u.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/u/${u.username}`} className="p-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                      <Eye size={13} />
                    </Link>
                    {!u.is_banned ? (
                      <button onClick={() => handleUserAction(u.id, "ban")} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer" title="Ban">
                        <Ban size={13} />
                      </button>
                    ) : (
                      <button onClick={() => handleUserAction(u.id, "unban")} className="p-2 text-zinc-600 hover:text-neon-green hover:bg-neon-green/10 rounded-lg transition-all cursor-pointer" title="Unban">
                        <CheckCircle size={13} />
                      </button>
                    )}
                    <select
                      onChange={e => { if (e.target.value) handleUserAction(u.id, e.target.value); e.target.value = ""; }}
                      className="h-8 px-2 text-[11px] bg-white/5 border border-white/8 rounded-lg text-zinc-400 cursor-pointer outline-none"
                    >
                      <option value="">Role...</option>
                      <option value="make_member">→ Member</option>
                      <option value="make_mod">→ Moderator</option>
                      <option value="make_admin">→ Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEV REQUESTS */}
        {tab === "dev-requests" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-white">Dev Tag Requests</h1>
              <button onClick={loadDevRequests} className="p-2 text-zinc-600 hover:text-white cursor-pointer">
                <RefreshCw size={14} />
              </button>
            </div>
            {devRequestsLoading && <div className="flex justify-center py-10"><Loader2 size={20} className="text-accent animate-spin" /></div>}
            <div className="space-y-3">
              {devRequests.filter(r => r.status === "pending").map((req: any) => (
                <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                      {(req.users?.display_name || req.users?.username || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{req.users?.display_name || req.users?.username}</p>
                      <p className="text-[11px] text-zinc-600">@{req.users?.username} · {new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => handleDevRequest(req.id, req.user_id, "dev")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-xs font-bold text-accent hover:bg-accent/20 transition-all cursor-pointer">
                        <CheckCircle size={12} /> Approve Dev
                      </button>
                      <button onClick={() => handleDevRequest(req.id, req.user_id, "certified_dev")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer">
                        <Star size={12} /> Certified Dev
                      </button>
                      <button onClick={() => handleDevRequest(req.id, req.user_id, "reject", "Does not meet requirements")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                  <div className="pl-13 ml-13 space-y-1 border-l border-white/5 ml-12 pl-4">
                    <p className="text-xs text-zinc-400"><span className="text-zinc-600">Reason:</span> {req.reason}</p>
                    {req.portfolio_url && <p className="text-xs text-accent">{req.portfolio_url}</p>}
                    {req.skills && <p className="text-xs text-zinc-500"><span className="text-zinc-600">Skills:</span> {req.skills}</p>}
                  </div>
                </motion.div>
              ))}
              {devRequests.filter(r => r.status === "pending").length === 0 && !devRequestsLoading && (
                <div className="text-center py-16">
                  <CheckCircle size={30} className="mx-auto text-neon-green mb-3" />
                  <p className="text-sm font-bold text-zinc-600">All caught up! No pending requests.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STORE QUEUE */}
        {tab === "store-queue" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-white">Store Submissions</h1>
              <button onClick={loadStoreQueue} className="p-2 text-zinc-600 hover:text-white cursor-pointer">
                <RefreshCw size={14} />
              </button>
            </div>
            {storeQueueLoading && <div className="flex justify-center py-10"><Loader2 size={20} className="text-accent animate-spin" /></div>}
            <div className="space-y-3">
              {storeQueue.map((listing: any) => (
                <motion.div key={listing.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white">{listing.title}</p>
                        <span className="text-[10px] text-zinc-600">v{listing.version}</span>
                        {listing.is_paid && <span className="text-[10px] font-bold text-neon-green bg-neon-green/10 border border-neon-green/20 px-1.5 py-0.5 rounded-full">${listing.price}</span>}
                      </div>
                      <p className="text-xs text-zinc-500 mb-1">by @{listing.users?.username} · {listing.category}</p>
                      <p className="text-xs text-zinc-600 line-clamp-2">{listing.tagline}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleStoreListing(listing.id, listing.user_id, "approve")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-green/10 border border-neon-green/20 text-xs font-bold text-neon-green hover:bg-neon-green/20 transition-all cursor-pointer">
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button onClick={() => handleStoreListing(listing.id, listing.user_id, "reject", "Does not meet guidelines")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {storeQueue.length === 0 && !storeQueueLoading && (
                <div className="text-center py-16">
                  <Package size={30} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-sm font-bold text-zinc-600">No pending submissions.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORTS */}
        {tab === "reports" && (
          <div>
            <h1 className="text-2xl font-black text-white mb-6">Reports ({stats.openReports} open)</h1>
            <div className="space-y-3">
              {reports.map((r: any) => (
                <div key={r.id} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">{r.target_type}</span>
                      <p className="text-sm text-zinc-300 mt-2">{r.reason}</p>
                      {r.detail && <p className="text-xs text-zinc-600 mt-0.5">{r.detail}</p>}
                      <p className="text-[10px] text-zinc-700 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        try {
                          const { error } = await sb.from("reports").update({ status: "dismissed" }).eq("id", r.id);
                          if (error) throw error;
                          setReports(prev => prev.filter(x => x.id !== r.id));
                          toast.success("Report dismissed");
                        } catch (err: any) {
                          console.error("Failed to dismiss report:", err);
                          toast.error(`Dismissal failed: ${err.message || 'System error'}`);
                        }
                      }} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-zinc-500 hover:bg-white/10 cursor-pointer">Dismiss</button>
                    </div>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-16">
                  <Flag size={30} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-sm font-bold text-zinc-600">No open reports.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FEATURE FLAGS */}
        {tab === "feature-flags" && (
          <div>
            <h1 className="text-2xl font-black text-white mb-6">Feature Flags</h1>
            <div className="space-y-3">
              {featureFlags.map((flag: any) => (
                <div key={flag.id} className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div>
                    <p className="text-sm font-bold text-white font-mono">{flag.key}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{flag.description}</p>
                  </div>
                  <button
                    onClick={() => toggleFeatureFlag(flag.id, flag.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all cursor-pointer ${flag.value ? "bg-neon-green" : "bg-zinc-700"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.value ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === "announcements" && (
          <div>
            <h1 className="text-2xl font-black text-white mb-6">Announcements</h1>
            <AnnouncementForm sb={sb} />
          </div>
        )}
      </main>
    </div>
  );
}

function AnnouncementForm({ sb }: { sb: any }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await sb.from("announcements").insert({
        title, body, type,
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_dismissible: true,
      });
      if (error) throw error;

      toast.success("Announcement created!");
      setTitle(""); 
      setBody("");
    } catch (err: any) {
      console.error("Announcement creation failed:", err);
      toast.error(`Transmission failed: ${err.message || 'Unknown protocol error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="text-xs text-zinc-500 font-medium mb-1 block">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required
          className="w-full h-10 px-4 rounded-xl bg-white/5 border border-white/8 text-sm text-white outline-none focus:border-accent/30" />
      </div>
      <div>
        <label className="text-xs text-zinc-500 font-medium mb-1 block">Body</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} required rows={4}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white outline-none focus:border-accent/30 resize-none" />
      </div>
      <div>
        <label className="text-xs text-zinc-500 font-medium mb-1 block">Type</label>
        <select value={type} onChange={e => setType(e.target.value)}
          className="w-full h-10 px-4 rounded-xl bg-white/5 border border-white/8 text-sm text-white outline-none">
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-bold cursor-pointer disabled:opacity-50">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
        Publish
      </button>
    </form>
  );
}
