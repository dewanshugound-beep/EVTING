"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Package,
  Flag,
  BarChart3,
  Check,
  X,
  Ban,
  AlertTriangle,
  Loader2,
  Search,
  ChevronDown,
  Eye,
  Trash2,
  Star,
  MessageCircle,
  Send,
} from "lucide-react";
import {
  getDevRequests,
  approveDevRequest,
  rejectDevRequest,
  adminGetUsers,
  adminBanUser,
  adminUnbanUser,
  adminSetRole,
  adminWarnUser,
  adminGetReports,
  adminDismissReport,
  getAdminStats,
} from "./actions_v2";
import { getPendingListings, approveStoreListing, rejectStoreListing } from "../store/actions";
import Image from "next/image";

const TABS = [
  { id: "requests", label: "Dev Requests", icon: Shield },
  { id: "store", label: "Store Queue", icon: Package },
  { id: "users", label: "Users", icon: Users },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "stats", label: "Stats", icon: BarChart3 },
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
  const [activeTab, setActiveTab] = useState("requests");

  // Dev Requests
  const [devRequests, setDevRequests] = useState<any[]>([]);
  const [requestFilter, setRequestFilter] = useState("pending");
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Store Queue
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Users
  const [users, setUsers] = useState(initialUsers);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  // Reports
  const [reports, setReports] = useState(initialReports);

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Modals
  const [rejectModal, setRejectModal] = useState<{ id: string; type: "dev" | "listing" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [warnModal, setWarnModal] = useState<string | null>(null);
  const [warnMessage, setWarnMessage] = useState("");

  // Load dev requests
  useEffect(() => {
    if (activeTab === "requests") {
      setRequestsLoading(true);
      getDevRequests(requestFilter)
        .then(setDevRequests)
        .finally(() => setRequestsLoading(false));
    }
  }, [activeTab, requestFilter]);

  // Load pending listings
  useEffect(() => {
    if (activeTab === "store") {
      setListingsLoading(true);
      getPendingListings()
        .then(setPendingListings)
        .finally(() => setListingsLoading(false));
    }
  }, [activeTab]);

  // Load stats
  useEffect(() => {
    if (activeTab === "stats") {
      setStatsLoading(true);
      getAdminStats()
        .then(setStats)
        .finally(() => setStatsLoading(false));
    }
  }, [activeTab]);

  // Search users
  const searchUsers = useCallback(async () => {
    setUsersLoading(true);
    const data = await adminGetUsers(userSearch || undefined);
    setUsers(data);
    setUsersLoading(false);
  }, [userSearch]);

  useEffect(() => {
    if (activeTab === "users") {
      const t = setTimeout(searchUsers, 300);
      return () => clearTimeout(t);
    }
  }, [activeTab, userSearch, searchUsers]);

  // Actions
  const handleApproveDevRequest = async (id: string) => {
    await approveDevRequest(id);
    setDevRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    if (rejectModal.type === "dev") await rejectDevRequest(rejectModal.id, rejectReason);
    if (rejectModal.type === "listing") await rejectStoreListing(rejectModal.id, rejectReason);
    setRejectModal(null);
    setRejectReason("");
    // Refresh
    if (rejectModal.type === "dev") {
      setDevRequests(prev => prev.filter(r => r.id !== rejectModal.id));
    } else {
      setPendingListings(prev => prev.filter(l => l.id !== rejectModal.id));
    }
  };

  const handleApproveListing = async (id: string) => {
    await approveStoreListing(id);
    setPendingListings(prev => prev.filter(l => l.id !== id));
  };

  const handleBan = async (userId: string) => {
    if (!confirm("Ban this user?")) return;
    await adminBanUser(userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: true } : u));
  };

  const handleUnban = async (userId: string) => {
    await adminUnbanUser(userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: false } : u));
  };

  const handleSetRole = async (userId: string, role: string) => {
    await adminSetRole(userId, role);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  };

  const handleWarnSubmit = async () => {
    if (!warnModal || !warnMessage.trim()) return;
    await adminWarnUser(warnModal, warnMessage);
    setWarnModal(null);
    setWarnMessage("");
    alert("Warning sent");
  };

  const handleDismissReport = async (id: string) => {
    await adminDismissReport(id);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen">
      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-md w-full bg-[#0d0d14] border border-red-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-black text-white mb-3">Rejection Reason</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why..." className="w-full h-24 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none resize-none mb-4 placeholder:text-zinc-700" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-400 cursor-pointer">Cancel</button>
              <button onClick={handleRejectSubmit} disabled={!rejectReason.trim()} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white cursor-pointer disabled:opacity-40">Reject</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Warn Modal */}
      {warnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-md w-full bg-[#0d0d14] border border-amber-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-black text-white mb-3">Send Warning</h3>
            <textarea value={warnMessage} onChange={e => setWarnMessage(e.target.value)} placeholder="Write warning message..." className="w-full h-24 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none resize-none mb-4 placeholder:text-zinc-700" />
            <div className="flex gap-2">
              <button onClick={() => { setWarnModal(null); setWarnMessage(""); }} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-400 cursor-pointer">Cancel</button>
              <button onClick={handleWarnSubmit} disabled={!warnMessage.trim()} className="flex-1 py-2.5 rounded-xl bg-amber-600 text-sm font-bold text-white cursor-pointer disabled:opacity-40">Send Warning</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/5 px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <Shield className="text-red-400" size={24} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Panel</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === id ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 max-w-6xl">
        {/* TAB: DEV REQUESTS */}
        {activeTab === "requests" && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              {["pending", "approved", "rejected", "all"].map(s => (
                <button key={s} onClick={() => setRequestFilter(s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer ${requestFilter === s ? "bg-accent/10 text-accent" : "text-zinc-600 hover:text-zinc-300"}`}>{s}</button>
              ))}
            </div>

            {requestsLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="text-accent animate-spin" /></div>
            ) : devRequests.length === 0 ? (
              <p className="text-sm text-zinc-600 py-10 text-center">No {requestFilter} requests</p>
            ) : (
              <div className="space-y-3">
                {devRequests.map(r => (
                  <div key={r.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-500 overflow-hidden relative">
                          {r.users?.avatar_url ? <Image src={r.users.avatar_url} alt="" fill className="object-cover" /> : (r.users?.display_name?.[0] || "?")}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{r.users?.display_name || "User"}</p>
                          <p className="text-[10px] text-zinc-600">@{r.users?.username} · Joined {new Date(r.users?.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${r.status === "pending" ? "bg-amber-500/10 text-amber-400" : r.status === "approved" ? "bg-neon-green/10 text-neon-green" : "bg-red-500/10 text-red-400"}`}>{r.status}</span>
                    </div>

                    <div className="mt-3 p-3 rounded-lg bg-black/30 text-sm text-zinc-300">
                      <span className="text-[9px] text-zinc-600 tracking-widest uppercase block mb-1">Reason</span>
                      {r.reason}
                    </div>

                    {r.portfolio_url && (
                      <a href={r.portfolio_url} target="_blank" rel="noreferrer" className="text-[10px] text-accent hover:underline mt-2 block">{r.portfolio_url}</a>
                    )}

                    {r.status === "pending" && (
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleApproveDevRequest(r.id)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-neon-green/10 text-neon-green text-xs font-bold cursor-pointer hover:bg-neon-green/20"><Check size={12} /> Approve</button>
                        <button onClick={() => setRejectModal({ id: r.id, type: "dev" })} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-500/20"><X size={12} /> Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: STORE QUEUE */}
        {activeTab === "store" && (
          <div>
            <h2 className="text-lg font-black text-white mb-4">Pending Store Submissions</h2>
            {listingsLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="text-accent animate-spin" /></div>
            ) : pendingListings.length === 0 ? (
              <p className="text-sm text-zinc-600 py-10 text-center">No pending submissions</p>
            ) : (
              <div className="space-y-3">
                {pendingListings.map(l => (
                  <div key={l.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">{l.title}</h3>
                        <p className="text-[10px] text-zinc-600">by @{l.users?.username} · {l.category} · {new Date(l.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="badge-amber">PENDING</span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{l.description}</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleApproveListing(l.id)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-neon-green/10 text-neon-green text-xs font-bold cursor-pointer hover:bg-neon-green/20"><Check size={12} /> Approve</button>
                      <button onClick={() => setRejectModal({ id: l.id, type: "listing" })} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-500/20"><X size={12} /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: USERS */}
        {activeTab === "users" && (
          <div>
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 h-4 w-4" />
              <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by username or email..." className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/40 border border-white/10 outline-none text-sm text-white placeholder:text-zinc-700" />
            </div>

            {usersLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="text-accent animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] text-zinc-600 uppercase tracking-widest">
                      <th className="text-left py-2 px-3">User</th>
                      <th className="text-left py-2 px-3">Role</th>
                      <th className="text-left py-2 px-3">Joined</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-right py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500 overflow-hidden relative shrink-0">
                              {u.avatar_url ? <Image src={u.avatar_url} alt="" fill className="object-cover" /> : (u.display_name?.[0] || "?")}
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">{u.display_name || u.username}</p>
                              <p className="text-[10px] text-zinc-600">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={u.role}
                            onChange={e => handleSetRole(u.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border-0 outline-none ${
                              u.role === "admin" ? "bg-red-500/10 text-red-400" :
                              u.role === "dev" ? "bg-accent/10 text-accent" :
                              "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            <option value="member">Member</option>
                            <option value="dev">Dev</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-xs text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          {u.is_banned ? (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">BANNED</span>
                          ) : (
                            <span className="text-[10px] font-bold text-neon-green bg-neon-green/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            {u.is_banned ? (
                              <button onClick={() => handleUnban(u.id)} className="px-2 py-1 rounded-lg bg-neon-green/10 text-neon-green text-[10px] font-bold cursor-pointer">Unban</button>
                            ) : (
                              <button onClick={() => handleBan(u.id)} className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold cursor-pointer">Ban</button>
                            )}
                            <button onClick={() => setWarnModal(u.id)} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-bold cursor-pointer">Warn</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: REPORTS */}
        {activeTab === "reports" && (
          <div>
            <h2 className="text-lg font-black text-white mb-4">Reports Queue</h2>
            {reports.length === 0 ? (
              <p className="text-sm text-zinc-600 py-10 text-center">No pending reports</p>
            ) : (
              <div className="space-y-3">
                {reports.map((r: any) => (
                  <div key={r.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-zinc-300 mb-1">{r.reason}</p>
                        <p className="text-[10px] text-zinc-600">
                          Type: {r.content_type || r.target_type} · ID: {(r.content_id || r.target_id || "").slice(0, 8)}… · {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${r.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-700 text-zinc-400"}`}>{r.status}</span>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleDismissReport(r.id)} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold cursor-pointer">Dismiss</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: STATS */}
        {activeTab === "stats" && (
          <div>
            <h2 className="text-lg font-black text-white mb-6">Platform Statistics</h2>
            {statsLoading || !stats ? (
              <div className="py-10 flex justify-center"><Loader2 className="text-accent animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Users", value: stats.totalUsers, color: "text-accent" },
                  { label: "New Today", value: stats.newToday, color: "text-neon-green" },
                  { label: "New This Week", value: stats.newThisWeek, color: "text-neon-purple" },
                  { label: "Total Posts", value: stats.totalPosts, color: "text-amber-400" },
                  { label: "Visitors", value: visitorCount, color: "text-cyan-400" },
                  { label: "Pending Dev Requests", value: stats.pendingDevRequests, color: "text-red-400" },
                  { label: "Pending Listings", value: stats.pendingListings, color: "text-orange-400" },
                  { label: "Pending Reports", value: stats.pendingReports, color: "text-pink-400" },
                ].map(s => (
                  <div key={s.label} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
