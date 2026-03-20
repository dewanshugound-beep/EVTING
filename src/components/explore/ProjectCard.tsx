"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, 
  Eye, 
  Flag, 
  FileCode, 
  Terminal, 
  ShieldAlert,
  HardDrive
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { reportVaultContent } from "@/app/explore/actions";

interface VaultProject {
  id: string;
  title: string;
  description: string;
  file_url: string;
  category: "Hacking" | "APK" | "Script" | "Tool";
  created_at: string;
  users?: {
    display_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export default function ProjectCard({ project }: { project: VaultProject }) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [codeContent, setCodeContent] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);

  const isScript = project.file_url.endsWith(".py") || project.file_url.endsWith(".js") || project.file_url.endsWith(".ts");

  const handlePreview = async () => {
    setIsPreviewing(true);
    setLoadingCode(true);
    try {
      const response = await fetch(project.file_url);
      const text = await response.text();
      setCodeContent(text);
    } catch (err) {
      toast.error("Failed to extract script data.");
    } finally {
      setLoadingCode(false);
    }
  };

  const handleReport = async () => {
    try {
      await reportVaultContent(project.id, "project", "Community Flag");
      toast.success("Signal sent to the Oracle.");
    } catch (err) {
      toast.error("Failed to report signal.");
    }
  };

  const categoryColors = {
    Hacking: "text-red-500 border-red-500/30 bg-red-500/5",
    APK: "text-blue-500 border-blue-500/30 bg-blue-500/5",
    Script: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5",
    Tool: "text-zinc-500 border-zinc-500/30 bg-zinc-500/5"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-surface p-5 hover:border-emerald-500/40 transition-all shadow-xl"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${categoryColors[project.category]}`}>
          {project.category}
        </div>
        <button 
          onClick={handleReport}
          className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
        >
          <Flag size={14} />
        </button>
      </div>

      <h3 className="text-lg font-black text-white mb-2 tracking-tight line-clamp-1">{project.title}</h3>
      <p className="text-xs text-zinc-500 mb-6 line-clamp-2 leading-relaxed italic h-8">
        "{project.description || "No signal data provided."}"
      </p>

      <div className="flex items-center gap-2 mb-6">
        <div className="h-6 w-6 rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
          {project.users?.avatar_url ? (
            <img src={project.users.avatar_url} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-zinc-700">?</div>
          )}
        </div>
        <div className="text-[10px] font-bold text-zinc-500">
          BY <span className="text-zinc-300">@{project.users?.username || "unknown"}</span> • {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        {isScript ? (
          <button 
            onClick={handlePreview}
            className="flex items-center justify-center gap-2 rounded-xl bg-surface-light border border-white/5 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-500 transition-all"
          >
            <Terminal size={14} /> PREVIEW
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-zinc-950 text-zinc-800 px-4 py-2.5 text-[10px] font-black tracking-widest cursor-default border border-transparent">
            <HardDrive size={12} /> BINARY
          </div>
        )}
        <a 
          href={project.file_url} 
          download
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all uppercase"
        >
          <Download size={14} /> DOWNLOAD
        </a>
      </div>

      {/* Script Preview Modal */}
      <AnimatePresence>
        {isPreviewing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewing(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-5xl h-[80vh] rounded-3xl border border-emerald-500/30 bg-black flex flex-col shadow-[0_0_100px_rgba(16,185,129,0.1)]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-950/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]" />
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  <span className="text-xs font-mono font-black text-emerald-500 tracking-widest flex items-center gap-2 uppercase">
                    <FileCode size={14} /> {project.title.replace(/\s+/g, '-').toLowerCase()}.script
                  </span>
                </div>
                <button 
                  onClick={() => setIsPreviewing(false)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-[10px] font-black hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
                >
                  TERMINATE
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 font-mono text-zinc-400 bg-zinc-950/20 selection:bg-emerald-500/20">
                {loadingCode ? (
                  <div className="flex h-full items-center justify-center flex-col gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                    <p className="text-[10px] font-black text-emerald-500 animate-pulse tracking-widest uppercase">Deciphering signal stream...</p>
                  </div>
                ) : (
                  <pre className="text-sm leading-relaxed scrollbar-hide">
                    <code className="block">
                      {codeContent || "// Error: Encrypted signal could not be deciphered."}
                    </code>
                  </pre>
                )}
              </div>

              <div className="px-6 py-3 border-t border-white/5 bg-zinc-950/50 rounded-b-3xl">
                <p className="text-[9px] font-black text-zinc-600 tracking-[0.2em] uppercase">
                  Matrix Preview System v2.0 • Script Analysis Active
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
