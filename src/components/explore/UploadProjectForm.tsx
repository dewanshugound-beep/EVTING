"use client";

import React, { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Upload, 
  Loader2, 
  X, 
  ShieldCheck, 
  FileBox, 
  ChevronRight,
  HardDrive
} from "lucide-react";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase";
import { uploadVaultProject } from "@/app/explore/actions";

export default function UploadProjectForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extensions
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['zip', 'apk', 'py', 'js', 'ts', 'exe', 'bin'];
    if (!ext || !allowed.includes(ext)) {
      toast.error("Format rejected by Matrix filter (.zip, .apk, .py, etc only)");
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    const supabase = createBrowserSupabase();

    try {
      const fileName = `${Math.random()}-${file.name.replace(/\s+/g, '_')}`;
      const filePath = `vault/${fileName}`;

      setUploadProgress(30);
      const { data, error } = await supabase.storage
        .from('vault-files')
        .upload(filePath, file);

      if (error) throw error;

      setUploadProgress(70);
      const { data: { publicUrl } } = supabase.storage
        .from('vault-files')
        .getPublicUrl(filePath);

      setFileUrl(publicUrl);
      setUploadProgress(100);
      toast.success("Binary stream synchronized.");
      setTimeout(() => setUploading(false), 500);
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fileUrl) {
      toast.error("Binary signal required.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("file_url", fileUrl);

    startTransition(async () => {
      try {
        await uploadVaultProject(formData);
        toast.success("Project archived in the Vault.");
        setIsOpen(false);
      } catch (err) {
        toast.error("Failed to archive project.");
      }
    });
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black tracking-widest text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all uppercase"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus size={18} /> UPLOAD PROJECT
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/5 bg-surface p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <ShieldCheck className="text-emerald-500" size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Archive Signal</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* File Upload Area */}
                <div 
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${
                    fileUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-emerald-500/30 bg-zinc-950/20'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={32} className="text-emerald-500 animate-spin" />
                      <p className="text-[10px] font-black text-emerald-500 animate-pulse tracking-widest uppercase text-center">
                        Synchronizing Signal... {uploadProgress}%
                      </p>
                    </div>
                  ) : fileUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <FileBox size={32} className="text-white" />
                      </div>
                      <p className="text-xs font-bold text-emerald-500 tracking-widest uppercase text-center">
                        Binary Archive Loaded
                      </p>
                      <p className="text-[8px] text-zinc-600 truncate max-w-[200px] italic">
                        {fileUrl}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload size={32} className="text-zinc-700 group-hover:text-emerald-500/50 transition-colors" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-white mb-1">Select Project Binary</p>
                        <p className="text-[9px] font-black text-zinc-600 tracking-widest uppercase">.ZIP • .APK • .PY • .TS</p>
                      </div>
                    </div>
                  )}
                  
                  {uploading && (
                    <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Project Name</label>
                  <input
                    name="title"
                    required
                    placeholder="Enter project cipher..."
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Classification</label>
                    <select
                      name="category"
                      className="w-full rounded-xl border border-white/5 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="Tool">TOOL</option>
                      <option value="Hacking">HACKING</option>
                      <option value="APK">APK</option>
                      <option value="Script">SCRIPT</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Verification</label>
                    <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 border border-white/5 text-emerald-500/20 px-4">
                      <HardDrive size={14} />
                      <span className="text-[9px] font-black italic tracking-tighter uppercase">Signal Validated</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Archival Note</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Brief architectural description..."
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all resize-none placeholder:text-zinc-700"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-2.5 text-xs font-bold text-zinc-600 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    ABORT
                  </button>
                  <button
                    disabled={isPending || uploading || !fileUrl}
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-2.5 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all uppercase disabled:opacity-30"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />} SYNC TO VAULT
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
