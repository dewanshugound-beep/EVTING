"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Shield, 
  User, 
  Send, 
  Flag, 
  Trash2, 
  CheckCircle,
  Users,
  Zap
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";
import { toast } from "sonner";
import { dismissReport, resolveReport } from "./actions";
import Image from "next/image";
import { useDebounce } from "@/hooks/useDebounce";

interface UserData {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  role: string | null;
  avatar_url: string | null;
  is_banned: boolean;
  created_at: string;
  message_count: number;
}

const RankBadge = React.memo(({ role, messageCount }: { role?: string | null; messageCount?: number }) => {
  if (role === 'admin') return <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-[8px] font-black text-red-500 tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)] ml-2 uppercase animate-pulse">[OVERLORD]</span>;
  if ((messageCount || 0) > 50) return <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-black text-emerald-500 tracking-widest ml-2 uppercase">[HACKER]</span>;
  return <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[8px] font-black text-zinc-500 tracking-widest ml-2 uppercase">[NODE]</span>;
});
RankBadge.displayName = "RankBadge";

interface ReportData {
  id: string;
  reporter_id: string;
  content_id: string;
  content_type: "message" | "project";
  reason: string;
  status: "pending" | "dismissed" | "resolved";
  created_at: string;
  users?: {
    display_name: string;
    username: string;
  };
}

export default function AdminClient({ 
  initialUsers, 
  initialReports,
  visitorCount 
}: { 
  initialUsers: UserData[];
  initialReports: ReportData[];
  visitorCount: number;
}) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [reports, setReports] = useState<ReportData[]>(initialReports);
  const [activeTab, setActiveTab] = useState<"users" | "reports">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    const sb = createBrowserSupabase();
    const newStatus = !currentStatus;
    try {
      const { error } = await (sb
        .from("users") as any)
        .update({ is_banned: newStatus })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: newStatus } : u)));
      toast.success(newStatus ? "User disconnected from Matrix." : "User restored to Matrix.");
    } catch (err) {
      toast.error("Failed to toggle ban status.");
    }
  };

  const handleDismiss = async (reportId: string) => {
    try {
      await dismissReport(reportId);
      setReports((prev) => prev.filter(r => r.id !== reportId));
      toast.success("Report dismissed.");
    } catch (err) {
      toast.error("Failed to dismiss report.");
    }
  };

  const handleResolve = async (reportId: string, contentId: string, contentType: "message" | "project") => {
    try {
      await resolveReport(reportId, contentId, contentType);
      setReports((prev) => prev.filter(r => r.id !== reportId));
      toast.success("Content terminated.");
    } catch (err) {
      toast.error("Failed to resolve report.");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = debouncedSearchQuery.toLowerCase();
      const nameMatch = (u.display_name || "").toLowerCase().includes(query);
      const usernameMatch = (u.username || "").toLowerCase().includes(query);
      const emailMatch = (u.email || "").toLowerCase().includes(query);
      return nameMatch || usernameMatch || emailMatch;
    });
  }, [users, debouncedSearchQuery]);

  const activeReports = useMemo(() => {
    return reports.filter(r => r.status === "pending");
  }, [reports]);

  const handleBroadcast = async () => {
    if (!broadcastBody.trim()) {
      toast.error("Broadcast signal cannot be empty.");
      return;
    }
    setBroadcasting(true);
    const sb = createBrowserSupabase();
    try {
      const { data: channel } = await sb.from("channels").select("id").eq("name", "General").single();
      if (!channel) throw new Error("General channel not found.");
      const { error } = await (sb.from("messages") as any).insert({
        channel_id: (channel as any).id,
        body: broadcastBody.trim(),
        is_broadcast: true,
        sender_name: "ADMIN"
      });
      if (error) throw error;
      toast.success("BROADCAST EMITTED.");
      setBroadcastBody("");
    } catch (err: any) {
      toast.error("Broadcast failed.");
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Navigation & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${
              activeTab === 'users' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
            }`}
          >
            <Users size={14} /> Matrix Population
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all relative ${
              activeTab === 'reports' 
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' 
                : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
            }`}
          >
            <Flag size={14} /> Oracle's Eye
            {activeReports.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-black text-red-600 shadow-md">
                {activeReports.length}
              </span>
            )}
          </button>
        </div>

        <div className="px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400 text-xs font-black flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          SITE ACCESSES: <span className="text-xl font-bold font-mono tracking-tighter">{visitorCount.toLocaleString()}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "users" ? (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Search and Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="flex items-center gap-2 text-blue-500 text-xs font-black tracking-[0.2em] uppercase mb-2">
                  <Shield size={14} /> Core Command
                </div>
                <h1 className="text-5xl font-black tracking-tighter">Identity Services</h1>
              </div>
              <div className="relative group w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search credentials..."
                  className="w-full h-12 pl-12 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-blue-500 outline-none text-sm font-mono tracking-tighter"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Global Broadcast Section */}
            <div className="mb-12 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black tracking-widest uppercase mb-4 font-mono">
                <Zap size={14} className="animate-pulse" /> Global Broadcast System
              </div>
              <textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Transmit worldwide signal..."
                className="w-full h-24 p-4 rounded-xl bg-black/40 border border-emerald-500/20 focus:border-emerald-500/50 outline-none text-sm resize-none mb-4 font-mono tracking-tighter"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleBroadcast} 
                  disabled={broadcasting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 font-black text-xs tracking-widest text-white shadow-lg hover:bg-emerald-500 disabled:opacity-20 uppercase flex items-center gap-2 transition-all"
                >
                  <Send size={14} /> {broadcasting ? 'TRANSMITTING...' : 'SEND SIGNAL'}
                </button>
              </div>
            </div>

            {/* Population Table */}
            <div className="rounded-2xl border border-white/5 bg-zinc-900/20 overflow-hidden shadow-2xl">
              <table className="w-full">
                <thead className="bg-zinc-950/50">
                  <tr>
                    <th className="text-left p-4 text-[9px] font-black text-zinc-600 tracking-widest uppercase">Identity</th>
                    <th className="text-left p-4 text-[9px] font-black text-zinc-600 tracking-widest uppercase">Access Level</th>
                    <th className="text-left p-4 text-[9px] font-black text-zinc-600 tracking-widest uppercase">Signals</th>
                    <th className="text-right p-4 text-[9px] font-black text-zinc-600 tracking-widest uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/5 overflow-hidden shrink-0 relative">
                            {u.avatar_url ? (
                              <Image 
                                src={u.avatar_url} 
                                alt="ID" 
                                fill 
                                sizes="32px"
                                className="object-cover" 
                              />
                            ) : (
                              <User size={16} className="text-zinc-700 mx-auto mt-1" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-black text-white flex items-center">
                              {u.display_name || "Agent"}
                              <RankBadge role={u.role} messageCount={u.message_count} />
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono italic">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-current ${u.role === 'admin' ? 'text-red-500 bg-red-500/5' : 'text-blue-500 bg-blue-500/5'}`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Zap size={10} className="text-emerald-500" />
                          <span className="text-xs font-black font-mono text-zinc-400">{u.message_count || 0}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleBan(u.id, u.is_banned)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all ${
                            u.is_banned ? 'bg-red-600 text-white animate-pulse' : 'border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          {u.is_banned ? 'UNBAN' : 'TERMINATE'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div key="reports" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="mb-12">
              <div className="flex items-center gap-2 text-red-500 text-xs font-black tracking-widest uppercase mb-2">
                <Flag size={14} /> Oracle's Eye
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white">Security Breaches</h1>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {activeReports.length > 0 ? (
                activeReports.map((report) => (
                  <motion.div
                    key={report.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl border border-white/5 bg-zinc-900/30 hover:border-red-500/30 transition-all shadow-xl"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${report.content_type === 'project' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {report.content_type} Signal
                        </div>
                        <span className="text-[9px] text-zinc-700 font-mono tracking-tighter uppercase font-black">Archive: {report.content_id.slice(0, 12)}</span>
                      </div>
                      <p className="text-sm font-black text-white italic tracking-tight underline decoration-red-500/30 underline-offset-4">"{report.reason}"</p>
                      <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                        Flagged by <span className="text-zinc-300">@{report.users?.username || 'ANON'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDismiss(report.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 bg-zinc-800 text-zinc-400 text-[10px] font-black tracking-widest uppercase hover:bg-white/10 hover:text-white transition-all shadow-lg"
                      >
                        <CheckCircle size={14} /> DISMISS
                      </button>
                      <button
                        onClick={() => handleResolve(report.id, report.content_id, report.content_type)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black tracking-widest uppercase shadow-xl shadow-red-500/20 hover:bg-red-500 transition-all"
                      >
                        <Trash2 size={14} /> TERMINATE
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-zinc-950/20 opacity-40">
                  <Flag size={32} className="mx-auto text-zinc-800 mb-4" />
                  <p className="text-[10px] font-black text-zinc-700 tracking-[0.5em] uppercase">No active breaches in this sector.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
