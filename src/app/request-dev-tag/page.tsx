"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, XCircle, Clock, ExternalLink, Send } from "lucide-react";
import { submitDevRequest, getMyDevRequest } from "@/app/admin/actions_v2";
import { useUser } from "@clerk/nextjs";

export default function RequestDevTagPage() {
  const { user } = useUser();
  const [reason, setReason] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyDevRequest().then(setExistingRequest).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return setError("Please provide a reason");
    setLoading(true);
    setError("");

    try {
      const result = await submitDevRequest(reason.trim(), portfolioUrl.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Show existing request status
  if (existingRequest) {
    const statusConfig: Record<string, { icon: any; color: string; label: string; bg: string }> = {
      pending: { icon: Clock, color: "text-amber-400", label: "Pending Review", bg: "bg-amber-500/10 border-amber-500/20" },
      approved: { icon: CheckCircle, color: "text-neon-green", label: "Approved!", bg: "bg-neon-green/10 border-neon-green/20" },
      rejected: { icon: XCircle, color: "text-red-400", label: "Rejected", bg: "bg-red-500/10 border-red-500/20" },
    };
    const cfg = statusConfig[existingRequest.status] || statusConfig.pending;
    const StatusIcon = cfg.icon;

    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-md w-full p-8 rounded-2xl border ${cfg.bg}`}
        >
          <StatusIcon size={48} className={`${cfg.color} mb-4`} />
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Dev Tag Request: {cfg.label}</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Submitted: {new Date(existingRequest.created_at).toLocaleDateString()}
          </p>
          <div className="p-3 rounded-xl bg-black/30 text-sm text-zinc-300 mb-4">
            <span className="text-[10px] text-zinc-600 tracking-widest uppercase block mb-1">Your Reason</span>
            {existingRequest.reason}
          </div>
          {existingRequest.admin_note && (
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-sm text-red-300">
              <span className="text-[10px] text-red-500 tracking-widest uppercase block mb-1">Admin Note</span>
              {existingRequest.admin_note}
            </div>
          )}
          {existingRequest.status === "rejected" && (
            <button
              onClick={() => setExistingRequest(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-accent text-white font-bold text-sm cursor-pointer"
            >
              Submit New Request
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-8 rounded-2xl border border-neon-green/20 bg-neon-green/5 text-center"
        >
          <CheckCircle size={48} className="text-neon-green mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Request Submitted!</h2>
          <p className="text-sm text-zinc-400">
            An admin will review your request. You&apos;ll be notified when it&apos;s been processed.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-xl mx-auto px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
            <Shield className="text-accent" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Request Dev Tag</h1>
            <p className="text-sm text-zinc-500">Get verified to upload tools and projects to the Store</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5 mb-6 space-y-2 text-sm text-zinc-400">
          <p className="font-bold text-white text-xs tracking-widest uppercase">What you get as a Verified Dev:</p>
          <p>• ✓ Dev badge visible on your profile and posts</p>
          <p>• Upload tools, scripts, games, and software to the Store</p>
          <p>• Access to developer-only community channels</p>
          <p>• Higher reputation weight on your contributions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">
              Why do you want to become a verified developer? *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us about your experience, projects, and what you plan to contribute..."
              className="w-full h-32 px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none text-sm text-white placeholder:text-zinc-700 resize-none transition-all"
              required
              maxLength={1000}
            />
            <p className="text-[10px] text-zinc-700 mt-1 text-right">{reason.length}/1000</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 flex items-center gap-1">
              <ExternalLink size={10} />
              Portfolio / GitHub URL (optional)
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/yourusername"
              className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none text-sm text-white placeholder:text-zinc-700 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading || !reason.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/20 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {loading ? "Submitting..." : "Submit Request"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
