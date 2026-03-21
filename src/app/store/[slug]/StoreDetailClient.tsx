"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Download,
  Eye,
  GitBranch,
  Shield,
  ArrowLeft,
  Copy,
  Heart,
  Flag,
  Tag,
  Clock,
  CheckCircle,
  Award,
  Loader2,
  AlertTriangle,
  Send,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import {
  toggleListingStar,
  recordDownload,
  addStoreReview,
  hasStarredListing,
} from "../actions";
import { reportContent } from "@/app/admin/actions_v2";

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-zinc-700"} />
      ))}
    </div>
  );
}

export default function StoreDetailClient({
  listing,
  reviews: initialReviews,
}: {
  listing: any;
  reviews: any[];
}) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"readme" | "reviews" | "versions">("readme");
  const [starred, setStarred] = useState(false);
  const [starCount, setStarCount] = useState(listing.star_count || 0);
  const [downloadCount, setDownloadCount] = useState(listing.download_count || 0);
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState(initialReviews);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const author = listing.users;
  const isSecurity = listing.category === "security";

  // Check initial star status
  React.useEffect(() => {
    if (user?.id) {
      hasStarredListing(user.id, listing.id).then(setStarred);
    }
  }, [user?.id, listing.id]);

  const copyInstall = () => {
    navigator.clipboard.writeText(listing.install_command || `pip install ${listing.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStar = async () => {
    if (!user) return;
    setStarred(!starred);
    setStarCount((c: number) => starred ? c - 1 : c + 1);
    try { await toggleListingStar(listing.id); } catch { setStarred(starred); }
  };

  const handleDownload = async () => {
    if (isSecurity) {
      const dismissed = localStorage.getItem("security_disclaimer_dismissed");
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (!dismissed || Date.now() - parseInt(dismissed) > thirtyDaysMs) {
        setShowDisclaimer(true);
        return;
      }
    }
    executeDownload();
  };

  const executeDownload = async () => {
    setShowDisclaimer(false);
    if (isSecurity) localStorage.setItem("security_disclaimer_dismissed", Date.now().toString());
    setDownloadCount((c: number) => c + 1);
    await recordDownload(listing.id);
    if (listing.file_url) window.open(listing.file_url, "_blank");
  };

  const handleReview = async () => {
    if (!reviewBody.trim()) return;
    setReviewLoading(true);
    try {
      const result = await addStoreReview(listing.id, reviewBody, reviewRating);
      if (result.error) return alert(result.error);
      if (result.review) setReviews([result.review, ...reviews]);
      setReviewBody("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    await reportContent("listing", listing.id, reportReason);
    setShowReport(false);
    setReportReason("");
    alert("Report submitted");
  };

  return (
    <div className="min-h-screen">
      {/* Security Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-md w-full bg-[#0d0d14] border border-red-500/20 rounded-2xl p-6">
            <AlertTriangle className="text-red-400 mb-4" size={32} />
            <h2 className="text-xl font-black text-white mb-3">Legal Disclaimer</h2>
            <p className="text-sm text-zinc-400 mb-4">This tool is classified as a security/pentesting tool. By downloading, you agree:</p>
            <ul className="text-sm text-zinc-400 space-y-2 mb-6">
              <li>• For authorized security testing only</li>
              <li>• Unauthorized use is your sole responsibility</li>
              <li>• MatrixIN is not liable for misuse</li>
            </ul>
            <div className="flex gap-2">
              <button onClick={() => setShowDisclaimer(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-400 cursor-pointer">Cancel</button>
              <button onClick={executeDownload} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white cursor-pointer">I Agree & Download</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-md w-full bg-[#0d0d14] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-black text-white mb-3">Report Listing</h2>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Describe the issue..." className="w-full h-24 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none resize-none mb-4 placeholder:text-zinc-700" />
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-400 cursor-pointer">Cancel</button>
              <button onClick={handleReport} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white cursor-pointer">Submit Report</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/5 bg-zinc-950/50 relative overflow-hidden">
        <div className="hero-gradient absolute inset-0 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <Link href="/store" className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-accent transition-colors mb-6 font-bold tracking-widest uppercase">
            <ArrowLeft size={12} /> Back to Store
          </Link>

          {/* Pending banner */}
          {listing.status === "pending" && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold flex items-center gap-2">
              <Clock size={16} /> This listing is pending admin review and not yet public.
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                {listing.is_editors_pick && <span className="badge-amber flex items-center gap-1"><Award size={10} /> Editor&apos;s Pick</span>}
                <span className="badge-blue">{listing.category.toUpperCase()}</span>
                <span className="badge-green">v{listing.version}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{listing.title}</h1>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">{listing.description}</p>

              {/* Author */}
              <Link href={`/profile/${author?.username}`} className="flex items-center gap-3 group">
                <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400 overflow-hidden relative">
                  {author?.avatar_url ? <Image src={author.avatar_url} alt="" fill className="object-cover" /> : (author?.display_name?.[0] || "U")}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white group-hover:text-accent transition-colors">{author?.display_name}</span>
                    {author?.role === "dev" && <CheckCircle size={12} className="text-accent" />}
                  </div>
                  <span className="text-[10px] text-zinc-600">@{author?.username}</span>
                </div>
              </Link>

              {/* Stats */}
              <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1"><Star size={12} className="text-amber-400" />{starCount.toLocaleString()} stars</span>
                <span className="flex items-center gap-1"><Download size={12} />{downloadCount.toLocaleString()} downloads</span>
              </div>

              {listing.avg_rating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={listing.avg_rating} />
                  <span className="text-sm font-bold text-white">{Number(listing.avg_rating).toFixed(1)}</span>
                  <span className="text-[10px] text-zinc-600">({reviews.length} reviews)</span>
                </div>
              )}
            </div>

            {/* Actions sidebar */}
            <div className="w-full md:w-72 space-y-3 shrink-0">
              {listing.install_command && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase">Install</span>
                    <button onClick={copyInstall} className="text-[9px] text-zinc-600 hover:text-accent cursor-pointer flex items-center gap-1"><Copy size={10} />{copied ? "Copied!" : "Copy"}</button>
                  </div>
                  <code className="text-[11px] text-neon-green font-mono">{listing.install_command}</code>
                </div>
              )}

              <motion.button onClick={handleDownload} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer">
                <Download size={16} /> Download v{listing.version}
              </motion.button>

              <div className="flex gap-2">
                <motion.button onClick={handleStar} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${starred ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "border-white/10 text-zinc-400 hover:bg-white/5"}`}>
                  <Star size={14} className={starred ? "fill-amber-400" : ""} />{starred ? "Starred" : "Star"}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-zinc-400 hover:bg-white/5 flex items-center justify-center gap-1.5 cursor-pointer">
                  <GitBranch size={14} /> Fork
                </motion.button>
              </div>

              <button onClick={() => setShowReport(true)} className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-zinc-600 hover:text-red-400 transition-colors cursor-pointer uppercase tracking-widest">
                <Flag size={10} /> Report
              </button>

              {/* Meta */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5 text-[11px]">
                <div className="flex justify-between"><span className="text-zinc-600">License</span><span className="text-zinc-300 font-mono">{listing.license}</span></div>
                <div className="flex justify-between"><span className="text-zinc-600">Version</span><span className="text-zinc-300 font-mono">{listing.version}</span></div>
                <div className="flex justify-between"><span className="text-zinc-600">Created</span><span className="text-zinc-300">{new Date(listing.created_at).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-zinc-600">Updated</span><span className="text-zinc-300">{new Date(listing.updated_at).toLocaleDateString()}</span></div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(listing.tags || []).map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-zinc-500 tracking-wider uppercase flex items-center gap-1"><Tag size={8} />{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-14 z-20">
        <div className="mx-auto max-w-6xl px-6 flex gap-6">
          {(["readme", "reviews", "versions"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-bold capitalize transition-all cursor-pointer relative ${activeTab === tab ? "text-white" : "text-zinc-600 hover:text-zinc-300"}`}>
              {tab}{tab === "reviews" && ` (${reviews.length})`}
              {activeTab === tab && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" layoutId="detail-tab" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {activeTab === "readme" && (
          <div className="max-w-3xl whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-mono">
            {listing.readme_md || "No README provided."}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="max-w-3xl space-y-4">
            {/* Write review */}
            {user && (
              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 mb-6">
                <h3 className="text-sm font-bold text-white mb-3">Write a Review</h3>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} onClick={() => setReviewRating(i)} className="cursor-pointer">
                      <Star size={18} className={i <= reviewRating ? "text-amber-400 fill-amber-400" : "text-zinc-700"} />
                    </button>
                  ))}
                </div>
                <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} placeholder="Share your experience..." className="w-full h-20 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none resize-none mb-3 placeholder:text-zinc-700" />
                <motion.button onClick={handleReview} disabled={reviewLoading || !reviewBody.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 rounded-xl bg-accent text-white text-xs font-bold cursor-pointer disabled:opacity-30 flex items-center gap-1.5">
                  {reviewLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit
                </motion.button>
              </div>
            )}

            {reviews.map((review: any) => (
              <div key={review.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 overflow-hidden relative">
                      {review.users?.avatar_url ? <Image src={review.users.avatar_url} alt="" fill className="object-cover" /> : (review.users?.display_name?.[0] || "U")}
                    </div>
                    <span className="text-xs font-bold text-white">@{review.users?.username}</span>
                    <span className="text-[10px] text-zinc-600">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <StarRating rating={review.rating} size={11} />
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{review.body}</p>
              </div>
            ))}

            {reviews.length === 0 && <p className="text-sm text-zinc-600">No reviews yet. Be the first!</p>}
          </div>
        )}

        {activeTab === "versions" && (
          <div className="max-w-3xl text-sm text-zinc-500">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
              <span className="font-mono font-bold text-accent">v{listing.version}</span>
              <span className="text-zinc-600">{new Date(listing.updated_at).toLocaleDateString()}</span>
              <span className="text-zinc-400 flex-1">Current version</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
