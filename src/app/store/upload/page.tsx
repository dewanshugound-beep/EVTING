"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info, FileUp, Tag, Shield, Eye, CheckCircle, Loader2, Upload,
  ArrowRight, ArrowLeft, X, Plus, Package, DollarSign
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth-hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const CATEGORIES = [
  "Scripts & Automation", "Games", "Desktop Software",
  "Security & Pentesting", "Open Source Libraries", "AI & ML Tools",
  "Browser Extensions", "Mobile Apps", "Themes & UI Kits",
  "Databases & APIs", "Bots & Automation", "Educational Tools",
];

const LICENSES = ["MIT", "GPL-2.0", "GPL-3.0", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "Proprietary", "Custom"];

const STEPS = [
  { id: 1, label: "Basic Info", icon: Info },
  { id: 2, label: "Files", icon: FileUp },
  { id: 3, label: "Metadata", icon: Tag },
  { id: 4, label: "Security", icon: Shield },
  { id: 5, label: "Review", icon: Eye },
];

export default function StoreUploadPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [license, setLicense] = useState("MIT");
  const [language, setLanguage] = useState("");
  const [price, setPrice] = useState("0");
  const [fileUrl, setFileUrl] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [securityDesc, setSecurityDesc] = useState("");
  const [requiresElevated, setRequiresElevated] = useState(false);
  const [uploading, setUploading] = useState(false);

  const slugify = (t: string) =>
    t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 100 * 1024 * 1024) return toast.error("File too large. Max 100MB.");

    setUploading(true);
    try {
      const sb = createBrowserSupabase();
      
      // Cleanup previous file if exists to prevent orphans
      if (fileUrl) {
        try {
          const oldPath = fileUrl.split("/storage/v1/object/public/tools/")[1];
          if (oldPath) await sb.storage.from("tools").remove([oldPath]);
        } catch (cleanupErr) {
          console.warn("Failed to cleanup orphaned file:", cleanupErr);
        }
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
      const path = `tools/${user.id}/${fileName}`;

      const { error } = await sb.storage.from("tools").upload(path, file);
      if (error) throw error;

      const { data: urlData } = sb.storage.from("tools").getPublicUrl(path);
      setFileUrl(urlData.publicUrl);
      toast.success("File uploaded successfully.");
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(`Upload error: ${err.message || "Interlink failure"}`);
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    if (!user) return toast.error("You must be logged in");
    if (!fileUrl) return toast.error("Please upload a file first");
    if (!title || !tagline || !category) return toast.error("Please fill in all required fields");

    setSubmitting(true);
    const sb = createBrowserSupabase();

    // Check if certified dev (auto-approve)
    const isCertified = user.role === "certified_dev" || user.role === "admin";
    const slug = slugify(title) + "-" + Math.random().toString(36).slice(2, 10);

    const { error } = await sb.from("store_listings").insert({
      user_id: user.id,
      title,
      slug,
      tagline,
      description_md: description,
      category,
      tags,
      license,
      language: language ? [language] : [],
      version,
      file_url: fileUrl,
      file_hash: fileHash || null,
      price: parseFloat(price) || 0,
      is_paid: parseFloat(price) > 0,
      security_desc: securityDesc,
      requires_elevated: requiresElevated,
      status: isCertified ? "approved" : "pending",
    });

    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      toast.success(isCertified ? "🎉 Listing published! (Certified Dev auto-approve)" : "Submitted for review! Admin will approve shortly.");
      router.push("/store");
    }
    setSubmitting(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  if (isLoaded && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Package size={40} className="text-zinc-700" />
        <p className="text-zinc-500">You must be logged in to upload</p>
        <Link href="/login" className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold">Sign In</Link>
      </div>
    );
  }

  const isDev = user.role === "dev" || user.role === "certified_dev" || user.role === "admin";
  if (isLoaded && user && !isDev) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield size={40} className="text-amber-400" />
        <p className="text-white font-bold">Dev tag required to upload</p>
        <p className="text-zinc-500 text-sm">You need the Dev role to publish to the store.</p>
        <Link href="/request-dev-tag" className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-bold">Request Dev Tag</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
          <Upload className="text-accent" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Publish to Store</h1>
          <p className="text-xs text-zinc-500">Share your tool with the developer community</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map(({ id, label, icon: Icon }) => (
          <React.Fragment key={id}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
              step === id ? "bg-accent/15 text-accent border border-accent/30" :
              step > id ? "text-neon-green" : "text-zinc-700"
            }`}>
              {step > id ? <CheckCircle size={12} /> : <Icon size={12} />}
              <span className="hidden sm:block">{label}</span>
            </div>
            {id < 5 && <div className={`flex-1 h-px ${step > id ? "bg-accent/30" : "bg-white/5"}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* STEP 1 - Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Basic Information</h2>
              <div>
                <label className="label-xs">Title <span className="text-red-400">*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="My Awesome Tool"
                  className="input-field" />
              </div>
              <div>
                <label className="label-xs">Tagline <span className="text-red-400">*</span></label>
                <input value={tagline} onChange={e => setTagline(e.target.value)} required placeholder="A one-line description" maxLength={120}
                  className="input-field" />
                <p className="text-[10px] text-zinc-700 text-right mt-1">{tagline.length}/120</p>
              </div>
              <div>
                <label className="label-xs">Description (Markdown supported)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={8}
                  placeholder="## About\n\nDescribe your tool in detail. Markdown is supported."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/30 resize-none font-mono" />
              </div>
            </div>
          )}

          {/* STEP 2 - Files */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Upload Files</h2>
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                fileUrl ? "border-neon-green/40 bg-neon-green/5" : "border-white/10 hover:border-white/20"
              }`}>
                {fileUrl ? (
                  <div>
                    <CheckCircle size={32} className="text-neon-green mx-auto mb-3" />
                    <p className="text-sm font-bold text-white">File uploaded successfully!</p>
                    <p className="text-xs text-zinc-500 mt-1 truncate max-w-xs mx-auto">{fileUrl.split("/").pop()}</p>
                    <button onClick={() => setFileUrl("")} className="mt-3 text-xs text-red-400 hover:underline cursor-pointer">Remove</button>
                  </div>
                ) : uploading ? (
                  <div>
                    <Loader2 size={32} className="text-accent animate-spin mx-auto mb-3" />
                    <p className="text-sm text-zinc-400">Uploading...</p>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <FileUp size={32} className="text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-white mb-1">Drag & drop or click to upload</p>
                    <p className="text-xs text-zinc-600">Any file type up to 100MB</p>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 - Metadata */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Metadata</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-xs">Version <span className="text-red-400">*</span></label>
                  <input value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0.0"
                    className="input-field" />
                </div>
                <div>
                  <label className="label-xs">License</label>
                  <select value={license} onChange={e => setLicense(e.target.value)} className="input-field">
                    {LICENSES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-xs">Category <span className="text-red-400">*</span></label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                  <option value="">Select category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label-xs">Primary Language</label>
                <input value={language} onChange={e => setLanguage(e.target.value)} placeholder="Python, JavaScript, Rust..."
                  className="input-field" />
              </div>
              <div>
                <label className="label-xs">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map(t => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent">
                      {t}
                      <button onClick={() => setTags(tags.filter(x => x !== t))} className="cursor-pointer hover:text-red-400"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag..." className="input-field flex-1" />
                  <button onClick={addTag} className="px-4 py-2 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-zinc-400 hover:bg-white/10 cursor-pointer">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="label-xs">Price (0 = Free)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                    min="0" max="999" step="0.01" placeholder="0.00"
                    className="input-field pl-9" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 - Security */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Security Declaration</h2>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-300">
                <p className="font-bold mb-1">⚠️ Honesty Required</p>
                <p>All submitted tools are reviewed by admins and may undergo security scanning. Providing false information will result in permanent ban.</p>
              </div>
              <div>
                <label className="label-xs">SHA256 File Hash (optional but recommended)</label>
                <input value={fileHash} onChange={e => setFileHash(e.target.value)} placeholder="e3b0c44298fc1c149afb...f855ad8cd99b"
                  className="input-field font-mono text-xs" />
              </div>
              <div>
                <label className="label-xs">What does this tool do? (be specific)</label>
                <textarea value={securityDesc} onChange={e => setSecurityDesc(e.target.value)} rows={5}
                  placeholder="Describe exactly what the tool does, what APIs it calls, what data it accesses, and any network connections it makes..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/30 resize-none" />
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <input type="checkbox" id="elevated" checked={requiresElevated} onChange={e => setRequiresElevated(e.target.checked)}
                  className="w-4 h-4 rounded accent-red-500" />
                <label htmlFor="elevated" className="text-sm text-zinc-400 cursor-pointer">
                  This tool requires elevated/admin/root privileges
                </label>
              </div>
              {requiresElevated && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  ⚠️ Tools requiring elevated privileges will undergo extra review before approval.
                </div>
              )}
            </div>
          )}

          {/* STEP 5 - Preview & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">Review & Submit</h2>
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Title</p>
                    <p className="text-white font-bold">{title || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Version</p>
                    <p className="text-white font-mono">{version || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Category</p>
                    <p className="text-zinc-300">{category || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">License</p>
                    <p className="text-zinc-300">{license}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Price</p>
                    <p className={parseFloat(price) > 0 ? "text-neon-green font-bold" : "text-zinc-500"}>
                      {parseFloat(price) > 0 ? `$${parseFloat(price).toFixed(2)}` : "Free"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">File</p>
                    <p className={fileUrl ? "text-neon-green" : "text-red-400"}>{fileUrl ? "✓ Uploaded" : "⚠ Not uploaded"}</p>
                  </div>
                </div>
                {tags.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-[11px] text-zinc-400">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Role notice */}
              <div className={`p-4 rounded-xl border text-xs ${
                user?.role === "certified_dev" || user?.role === "admin"
                  ? "border-neon-green/20 bg-neon-green/5 text-neon-green"
                  : "border-accent/20 bg-accent/5 text-accent"
              }`}>
                {user?.role === "certified_dev" || user?.role === "admin"
                  ? "⬡ Certified Dev — your listing will be auto-approved and go live immediately."
                  : "⚡ Dev — your listing will enter the pending queue for admin review."}
              </div>

              <motion.button
                onClick={handleSubmit}
                disabled={submitting || !fileUrl || !title || !category || !tagline}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full h-12 rounded-xl bg-accent text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {submitting ? "Submitting..." : "Submit Listing"}
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] text-sm text-zinc-400 hover:bg-white/5 disabled:opacity-30 cursor-pointer transition-all"
        >
          <ArrowLeft size={14} /> Back
        </button>
        {step < 5 && (
          <button
            onClick={() => setStep(Math.min(5, step + 1))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold cursor-pointer hover:bg-blue-500 transition-all"
          >
            Next <ArrowRight size={14} />
          </button>
        )}
      </div>

      <style jsx>{`
        .label-xs { display: block; font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .input-field { width: 100%; height: 2.5rem; padding: 0 1rem; border-radius: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); font-size: 0.875rem; color: white; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: rgba(88,166,255,0.3); }
        select.input-field { cursor: pointer; }
      `}</style>
    </div>
  );
}
