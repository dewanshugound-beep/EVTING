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
  Package,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/lib/auth-hooks";
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
    async function checkStar() {
      if (!user?.id) return;
      try {
        const isStarred = await hasStarredListing(user.id, listing.id);
        setStarred(isStarred);
      } catch (err) {
        console.error("Failed to check star status:", err);
      }
    }
    checkStar();
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

      {/* Sticky Header Nav */}
      <div className="sticky top-0 z-40 w-full glass border-b border-white/5 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/store" className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-xs font-black tracking-widest text-[#81ecff] font-headline uppercase">Command Registry</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">ID: {listing.id.split('-')[0]}</span>
          <div className="h-6 w-px bg-white/10" />
          <motion.button onClick={handleStar} className={`p-2 rounded-lg border transition-all ${starred ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "border-white/10 text-zinc-500 hover:text-white"}`}>
            <Star size={16} className={starred ? "fill-amber-400" : ""} />
          </motion.button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative w-full aspect-[21/9] md:aspect-[21/7] overflow-hidden bg-black">
        {listing.screenshots?.[0] ? (
          <Image src={listing.screenshots[0]} alt="" fill className="object-cover opacity-60" priority />
        ) : (
          <div className="absolute inset-0 grid-pattern opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        {/* Pulse Badge Overlay */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-surface-container-highest/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-[#81ecff] animate-pulse shadow-[0_0_8px_#81ecff]"></span>
          <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#81ecff]">V{listing.version} STABLE RELEASE</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 -mt-20 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Main Info */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                {listing.is_editors_pick && (
                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest flex items-center gap-1 uppercase">
                    <Award size={10} /> Editor&apos;s Pick
                  </span>
                )}
                <span className="badge-blue uppercase tracking-widest">{listing.category}</span>
                <span className="badge-green uppercase tracking-widest">Stable Release</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter font-headline uppercase leading-none">
                {listing.title}
              </h1>
              
              <div className="flex items-center gap-4">
                <Link href={author?.username ? `/u/${author.username}` : `/profile/${listing.user_id}`} className="flex items-center gap-3 group">
                  <div className="h-6 w-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 overflow-hidden relative">
                    {author?.avatar_url ? <Image src={author.avatar_url} alt="" fill className="object-cover" /> : (author?.display_name?.[0] || "U")}
                  </div>
                  <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">By {author?.display_name || "Unknown"}</span>
                </Link>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1">
                  <StarRating rating={listing.avg_rating} />
                  <span className="text-xs font-bold text-zinc-500 ml-1">({reviews.length})</span>
                </div>
              </div>

              <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl font-medium">
                {listing.tagline || listing.description}
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4 hover:border-white/10 transition-colors group">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Precision Audited</h4>
                  <p className="text-[11px] text-zinc-500 leading-normal">Verified for security and efficiency by the Matrix Architecture.</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4 hover:border-white/10 transition-colors group">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Shield size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Encrypted Payload</h4>
                  <p className="text-[11px] text-zinc-500 leading-normal">Deterministic build hash ensure zero tampering during deployment.</p>
                </div>
              </div>
            </div>

            {/* Tabs & Content area already exists below */}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield size={60} />
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Deployment Cost</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white font-headline tracking-tighter">
                      {listing.price > 0 ? `$${listing.price}` : "00.00"}
                    </span>
                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Tokens</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <motion.button onClick={handleDownload} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                    className="w-full py-4 rounded-xl bg-primary text-on-primary font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer no-line-rule">
                    <Download size={18} /> Deploy Module
                  </motion.button>
                  <div className="text-[9px] text-center text-zinc-600 uppercase font-black tracking-widest">
                    v{listing.version} | {((listing.file_size || 0) / 1024 / 1024).toFixed(2)} MB Payload
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Terminal Cmd</span>
                    <button onClick={copyInstall} className="text-[10px] text-accent hover:underline font-bold uppercase tracking-widest">
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 font-mono text-[11px] text-emerald-400 truncate">
                    <span className="text-zinc-600 mr-2">$</span>
                    {listing.install_command || `matrix deploy ${listing.slug}`}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={handleStar} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${starred ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "border-white/10 text-zinc-500 hover:bg-white/5"}`}>
                    <Star size={12} /> {starred ? "Starred" : "Star"}
                  </button>
                  <button className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-500 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    <GitBranch size={12} /> Fork
                  </button>
                </div>

                <button onClick={() => setShowReport(true)} className="w-full text-center text-[9px] font-black text-zinc-700 hover:text-red-500 transition-colors uppercase tracking-[0.2em] pt-2">
                  <Flag size={10} className="inline mr-1" /> Flag Anomaly
                </button>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Technical Specifications</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-600">OS Requirements</span>
                  <div className="flex gap-1">
                    {(listing.os_requirements || ["Windows", "Linux"]).map((os: string) => (
                      <span key={os} className="text-zinc-300 font-bold">{os}</span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-600">License</span>
                  <span className="text-zinc-300 font-mono font-bold">{listing.license || "MIT"}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-600">Stars / DLs</span>
                  <span className="text-zinc-300 font-bold">{starCount} / {downloadCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-14 z-20">
        <div className="mx-auto max-w-6xl px-6 flex gap-8">
          {(["readme", "reviews", "payload"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={`py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer relative ${activeTab === (tab === "payload" ? "versions" : tab) ? "text-primary" : "text-zinc-600 hover:text-zinc-300"}`}>
              {tab}{tab === "reviews" && <span className="ml-1.5 opacity-40">[{reviews.length}]</span>}
              {activeTab === (tab === "payload" ? "versions" : tab) && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_#81ecff]" layoutId="detail-tab" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-4xl">
          {activeTab === "readme" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Documentation Module</h3>
              </div>
              <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 font-medium text-zinc-400 leading-relaxed">
                {listing.readme_md ? (
                   <div className="whitespace-pre-wrap font-body">{listing.readme_md}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <Package size={32} className="text-zinc-800 mb-3" />
                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No extended documentation provided</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-8">
              {/* Review Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-4xl font-black text-white font-headline mb-1">{Number(listing.avg_rating || 0).toFixed(1)}</div>
                  <div className="flex justify-center mb-2"><StarRating rating={listing.avg_rating} /></div>
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Global Feedback Index</div>
                </div>
                <div className="col-span-2 flex flex-col justify-center space-y-2">
                  {[5,4,3,2,1].map(stars => {
                    const count = reviews.filter((r: any) => Math.round(r.rating) === stars).length;
                    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-zinc-500 w-3">{stars}</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-primary/40 rounded-full" />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-700 w-6">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write review */}
              {user && (
                <div className="p-6 rounded-2xl bg-accent/5 border border-accent/20 mb-10 group relative overflow-hidden">
                   <div className="relative z-10">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Submit Evaluation</h3>
                    <div className="flex gap-1.5 mb-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button key={i} onClick={() => setReviewRating(i)} className="cursor-pointer transition-transform hover:scale-110">
                          <Star size={20} className={i <= reviewRating ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-zinc-800"} />
                        </button>
                      ))}
                    </div>
                    <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)} placeholder="Transmission content..." className="w-full h-24 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:border-accent/40 outline-none resize-none mb-4 placeholder:text-zinc-800 transition-all" />
                    <motion.button onClick={handleReview} disabled={reviewLoading || !reviewBody.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="px-8 py-3 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer disabled:opacity-30 inline-flex items-center gap-2">
                      {reviewLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Execute Post
                    </motion.button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div key={review.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400 overflow-hidden relative">
                          {review.users?.avatar_url ? <Image src={review.users.avatar_url} alt="" fill className="object-cover" /> : (review.users?.display_name?.[0] || "U")}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-widest">@{review.users?.username}</p>
                          <p className="text-[9px] text-zinc-600 font-mono">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={10} />
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium pl-11">{review.body}</p>
                  </div>
                ))}

                {reviews.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl">
                    <MessageSquare size={32} className="text-zinc-900 mx-auto mb-3" />
                    <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em]">Zero reports found in global log</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "versions" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Payload History</h3>
              </div>
              <div className="space-y-3">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Package size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-mono uppercase">v{listing.version}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest">Stable</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">Deployed on {new Date(listing.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Download size={16} className="text-zinc-700 group-hover:text-primary transition-colors" />
                </div>
                {/* Future: Map through actual version history if table exists */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

