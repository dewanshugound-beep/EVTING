"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, CheckCircle, Clock, XCircle, Send, Loader2, Star, ExternalLink } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth-hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function RequestDevTagPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [reason, setReason] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [skills, setSkills] = useState("");
  const [targetRole, setTargetRole] = useState<"dev" | "certified_dev">("dev");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }
    if (user.role === "dev" || user.role === "certified_dev" || user.role === "admin") {
      // Already has dev access
    }
    loadExistingRequest();
  }, [user, isLoaded]);

  async function loadExistingRequest() {
    if (!user) return;
    const sb = createBrowserSupabase();
    const { data } = await sb.from("dev_requests")
      .select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    setExistingRequest(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (reason.length < 50) return toast.error("Please write at least 50 characters explaining why you want the Dev tag.");

    setSubmitting(true);
    const sb = createBrowserSupabase();
    const { error } = await sb.from("dev_requests").insert({
      user_id: user.id,
      reason,
      portfolio_url: portfolioUrl.trim() || null,
      skills: skills.trim() || null,
      target_role: targetRole,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      toast.success("Request submitted! You'll be notified when admin reviews it.");
      loadExistingRequest();
    }
    setSubmitting(false);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 size={24} className="animate-spin text-accent" /></div>;
  }

  const isDevAlready = user?.role === "dev" || user?.role === "certified_dev" || user?.role === "admin";

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
          <Zap className="text-accent" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Request Dev Tag</h1>
          <p className="text-xs text-zinc-500">Gain access to publish tools to the store and create projects</p>
        </div>
      </div>

      {/* Already has dev access */}
      {isDevAlready && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-neon-green/20 bg-neon-green/5 text-center">
          <CheckCircle size={32} className="text-neon-green mx-auto mb-3" />
          <p className="text-lg font-bold text-white">You already have Dev access!</p>
          <p className="text-sm text-zinc-400 mt-1 mb-4">Your role: <span className="text-neon-green font-bold capitalize">{user?.role}</span></p>
          <Link href="/store/upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold">
            <Zap size={14} /> Start uploading to store
          </Link>
        </motion.div>
      )}

      {/* Existing pending request */}
      {!isDevAlready && existingRequest && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border mb-6 ${
            existingRequest.status === "pending" ? "border-amber-500/20 bg-amber-500/5" :
            existingRequest.status === "approved" ? "border-neon-green/20 bg-neon-green/5" :
            "border-red-500/20 bg-red-500/5"
          }`}>
          {existingRequest.status === "pending" && (
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-amber-400" />
              <div>
                <p className="font-bold text-white">Request Pending Review</p>
                <p className="text-sm text-zinc-400">Submitted {new Date(existingRequest.created_at).toLocaleDateString()}. Admin will review soon.</p>
              </div>
            </div>
          )}
          {existingRequest.status === "approved" && (
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-neon-green" />
              <p className="font-bold text-white">Your request was approved! 🎉</p>
            </div>
          )}
          {existingRequest.status === "rejected" && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <XCircle size={20} className="text-red-400" />
                <p className="font-bold text-white">Request not approved</p>
              </div>
              {existingRequest.admin_note && (
                <p className="text-sm text-zinc-400">Reason: {existingRequest.admin_note}</p>
              )}
              <button onClick={() => setExistingRequest(null)} className="mt-3 text-xs text-accent hover:underline cursor-pointer">
                Submit a new request
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Request form */}
      {!isDevAlready && (!existingRequest || existingRequest.status === "rejected") && (
        <div>
          {/* Dev tier info */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              {
                role: "dev" as const,
                label: "Dev",
                badge: "⚡ Dev",
                color: "accent",
                desc: "Publish tools (pending admin review), create projects, access dev analytics.",
              },
              {
                role: "certified_dev" as const,
                label: "Certified Dev",
                badge: "⬡ Certified Dev",
                color: "amber",
                desc: "Auto-approved listings, certified project badge, featured placement in store.",
              },
            ].map(({ role, label, badge, color, desc }) => (
              <button
                key={role}
                onClick={() => setTargetRole(role)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  targetRole === role
                    ? color === "amber"
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-accent/40 bg-accent/5"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                }`}
              >
                <p className={`text-sm font-black mb-1 ${color === "amber" ? "text-amber-400" : "text-accent"}`}>{badge}</p>
                <p className="text-xs text-zinc-400">{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                Why do you want Dev access? <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                rows={5}
                minLength={50}
                placeholder="Describe your projects, what you've built, and how you plan to contribute to the platform..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/30 resize-none"
              />
              <p className={`text-[10px] text-right mt-1 ${reason.length >= 50 ? "text-neon-green" : "text-zinc-700"}`}>
                {reason.length}/50 minimum
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                Portfolio / GitHub URL
              </label>
              <div className="relative">
                <ExternalLink size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/30"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">
                Skills & Technologies
              </label>
              <input
                type="text"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="Python, React, Security, AI, Reverse Engineering..."
                className="w-full h-10 px-4 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/30"
              />
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full h-12 rounded-xl bg-accent text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Request for Review
            </motion.button>
          </form>
        </div>
      )}
    </div>
  );
}
