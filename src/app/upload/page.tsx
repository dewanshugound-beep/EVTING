"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Terminal,
  Gamepad2,
  Package,
  Lock,
  GitBranch,
  Brain,
  Puzzle,
  Image as ImageIcon,
  Code2,
  ArrowRight,
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { createBrowserSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const categories = [
  { id: "scripts", label: "Scripts & Automation", icon: Terminal, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "games", label: "Games", icon: Gamepad2, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { id: "software", label: "Software & Apps", icon: Package, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "security", label: "Security Tools", icon: Lock, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { id: "oss", label: "Open Source", icon: GitBranch, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "ai", label: "AI / ML Models", icon: Brain, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { id: "extensions", label: "Extensions & Plugins", icon: Puzzle, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
];

const STEPS = ["Details", "Files", "Category", "Preview"];

export default function UploadPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [readmeMd, setReadmeMd] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [license, setLicense] = useState("MIT");
  const [osReqs, setOsReqs] = useState("");
  const [installCmd, setInstallCmd] = useState("");
  const [tags, setTags] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");

  // Check role
  useEffect(() => {
    async function checkRole() {
      if (!user?.id) { setLoading(false); return; }
      const sb = createBrowserSupabase();
      const { data } = await sb.from("users").select("role").eq("id", user.id).single();
      setRole((data as any)?.role || "member");
      setLoading(false);
    }
    checkRole();
  }, [user?.id]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "security") setShowDisclaimer(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedCategory) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("readme_md", readmeMd);
      formData.set("version", version);
      formData.set("category", selectedCategory);
      formData.set("license", license);
      formData.set("os_requirements", osReqs);
      formData.set("install_command", installCmd);
      formData.set("tags", tags);
      formData.set("file_url", fileUrl);

      const { createStoreListing } = await import("@/app/store/actions");
      const result = await createStoreListing(formData);

      if (result.success) {
        setSubmitted(true);
      }
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  // Not a dev or admin — redirect
  if (role !== "dev" && role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
          <Shield size={48} className="text-zinc-700 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Dev Access Required</h2>
          <p className="text-sm text-zinc-500 mb-6">Only verified developers can upload to the Store. Apply for your Dev tag to get started.</p>
          <Link href="/request-dev-tag">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="px-8 py-3 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/20 cursor-pointer">
              Request Dev Tag
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Success
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full p-8 rounded-2xl border border-neon-green/20 bg-neon-green/5 text-center">
          <CheckCircle size={48} className="text-neon-green mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Submitted for Review!</h2>
          <p className="text-sm text-zinc-400 mb-6">Your project has been submitted. An admin will review it shortly. You&apos;ll be notified when approved.</p>
          <div className="flex gap-2 justify-center">
            <Link href="/store"><button className="px-6 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-300 cursor-pointer">Browse Store</button></Link>
            <button onClick={() => { setSubmitted(false); setStep(0); setTitle(""); setDescription(""); }} className="px-6 py-2.5 rounded-xl bg-accent text-sm font-bold text-white cursor-pointer">Upload Another</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-12">
      {/* Security Disclaimer */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-md w-full bg-[#0d0d14] border border-red-500/20 rounded-2xl p-6">
            <AlertTriangle className="text-red-400 mb-4" size={32} />
            <h2 className="text-xl font-black text-white mb-3">Legal Disclaimer — Security Tools</h2>
            <p className="text-sm text-zinc-400 mb-4">By uploading security/pentesting tools, you agree:</p>
            <ul className="text-sm text-zinc-400 space-y-2 mb-6">
              <li className="flex items-start gap-2"><Shield size={14} className="text-red-400 mt-0.5 shrink-0" />For authorized testing only</li>
              <li className="flex items-start gap-2"><Shield size={14} className="text-red-400 mt-0.5 shrink-0" />Unauthorized use is user&apos;s sole responsibility</li>
              <li className="flex items-start gap-2"><Shield size={14} className="text-red-400 mt-0.5 shrink-0" />You have the right to distribute this tool</li>
            </ul>
            <div className="flex gap-2">
              <button onClick={() => { setShowDisclaimer(false); setSelectedCategory(""); }} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-400 cursor-pointer">Cancel</button>
              <button onClick={() => setShowDisclaimer(false)} className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white cursor-pointer">I Agree</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
            <Upload className="text-accent" size={24} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Upload to Store</h1>
        </div>
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase ${i <= step ? "bg-accent/10 text-accent" : "text-zinc-600"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${i < step ? "bg-accent text-white" : i === step ? "bg-accent/20 text-accent border border-accent/40" : "bg-zinc-800 text-zinc-600"}`}>
                  {i < step ? "✓" : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-accent/40" : "bg-zinc-800"}`} />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Step 1: Details */}
      {step === 0 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="My Awesome Tool" className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none text-sm text-white placeholder:text-zinc-700 transition-all" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your project..." className="w-full h-32 px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none text-sm text-white placeholder:text-zinc-700 resize-none transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">Version</label>
              <input type="text" value={version} onChange={e => setVersion(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 outline-none text-sm text-white font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">License</label>
              <select value={license} onChange={e => setLicense(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 outline-none text-sm text-white cursor-pointer">
                <option value="MIT">MIT</option>
                <option value="Apache-2.0">Apache 2.0</option>
                <option value="GPL-3.0">GPL 3.0</option>
                <option value="BSD-3">BSD 3-Clause</option>
                <option value="Proprietary">Proprietary</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="python, ai, automation" className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 outline-none text-sm text-white placeholder:text-zinc-700" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">Install Command (optional)</label>
            <input type="text" value={installCmd} onChange={e => setInstallCmd(e.target.value)} placeholder="pip install my-tool" className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 outline-none text-sm text-white placeholder:text-zinc-700 font-mono" />
          </div>
          <button disabled={!title.trim() || !description.trim()} onClick={() => setStep(1)} className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm cursor-pointer disabled:opacity-30 flex items-center justify-center gap-2">
            Next: Files <ArrowRight size={14} />
          </button>
        </motion.div>
      )}

      {/* Step 2: Files */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">File URL (direct download link)</label>
            <input type="url" value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://example.com/my-tool.zip" className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 outline-none text-sm text-white placeholder:text-zinc-700" />
            <p className="text-[10px] text-zinc-600 mt-1">Paste a direct download link (GitHub release, Google Drive, etc.)</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 flex items-center gap-2"><Code2 size={12} /> README (Markdown)</label>
            <textarea value={readmeMd} onChange={e => setReadmeMd(e.target.value)} placeholder="# My Project\n\nDescribe your project in detail..." className="w-full h-48 px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none text-sm text-white placeholder:text-zinc-700 resize-none font-mono" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm cursor-pointer flex items-center justify-center gap-2"><ArrowLeft size={14} /> Back</button>
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2">Next: Category <ArrowRight size={14} /></button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Category */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-3 block">Select Category *</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(({ id, label, icon: Icon, color }) => (
              <button key={id} onClick={() => handleCategorySelect(id)} className={`flex items-center gap-2 p-4 rounded-xl border text-left transition-all cursor-pointer ${selectedCategory === id ? color + " ring-1 ring-current" : "border-white/5 bg-white/[0.02] text-zinc-500 hover:bg-white/5"}`}>
                <Icon size={18} /><span className="text-xs font-bold tracking-wider uppercase">{label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm cursor-pointer flex items-center justify-center gap-2"><ArrowLeft size={14} /> Back</button>
            <button disabled={!selectedCategory} onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm cursor-pointer disabled:opacity-30 flex items-center justify-center gap-2">Next: Preview <ArrowRight size={14} /></button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Preview & Submit */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
            <h3 className="text-xl font-black text-white">{title}</h3>
            <p className="text-sm text-zinc-400">{description}</p>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="badge-blue">{selectedCategory.toUpperCase()}</span>
              <span className="badge-green">v{version}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 font-bold">{license}</span>
            </div>
            {tags && (
              <div className="flex flex-wrap gap-1.5">
                {tags.split(",").filter(Boolean).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-zinc-500 uppercase">{t.trim()}</span>
                ))}
              </div>
            )}
            {installCmd && <code className="block text-[11px] text-neon-green font-mono p-3 rounded-lg bg-black/40 border border-white/5">{installCmd}</code>}
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-400 text-xs flex items-center gap-2">
            <AlertTriangle size={14} /> Your listing will be submitted for admin review before going live.
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm cursor-pointer flex items-center justify-center gap-2"><ArrowLeft size={14} /> Back</button>
            <motion.button onClick={handleSubmit} disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl bg-accent text-white font-bold text-sm cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {submitting ? "Submitting..." : "Publish to Store"}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
