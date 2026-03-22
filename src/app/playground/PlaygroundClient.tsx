"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Copy, Download, Code, Eye, Terminal, Expand } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
    }
    h1 { color: #58a6ff; font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #8b949e; }
    button {
      margin-top: 1rem;
      background: #58a6ff;
      color: white;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    button:hover { background: #79c0ff; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🧪 Matrix Playground</h1>
    <p>Write HTML, CSS, and JS here. Runs instantly!</p>
    <button onclick="this.textContent = '✓ Clicked!'">Click me</button>
  </div>
</body>
</html>`;

export default function PlaygroundClient() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHtml, setPreviewHtml] = useState(DEFAULT_HTML);

  const runCode = () => {
    setIsRunning(true);
    setPreviewHtml(html);
    setActiveTab("preview");
    setTimeout(() => setIsRunning(false), 500);
    toast.success("Code executed!");
  };

  const resetCode = () => {
    setHtml(DEFAULT_HTML);
    setPreviewHtml(DEFAULT_HTML);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(html);
    toast.success("Copied to clipboard!");
  };

  const downloadCode = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "playground.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#08080d" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-12 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-neon-green" />
          <span className="text-sm font-black text-white">MatrixIN Playground</span>
          <span className="text-[10px] text-zinc-600 font-mono bg-white/5 px-2 py-0.5 rounded-full">HTML · CSS · JS</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={copyCode} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"><Copy size={13} /></button>
          <button onClick={downloadCode} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"><Download size={13} /></button>
          <button onClick={resetCode} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"><RotateCcw size={13} /></button>
          <motion.button
            onClick={runCode}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-green text-black text-xs font-black cursor-pointer shadow-lg shadow-neon-green/20"
          >
            <Play size={12} fill="currentColor" />
            {isRunning ? "Running..." : "Run"}
          </motion.button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/5">
        {[{ id: "code" as const, label: "Code", icon: Code }, { id: "preview" as const, label: "Preview", icon: Eye }].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === id ? "text-accent border-accent" : "text-zinc-600 border-transparent hover:text-zinc-400"}`}>
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 relative">
        {activeTab === "code" && (
          <textarea
            value={html}
            onChange={e => setHtml(e.target.value)}
            spellCheck={false}
            className="absolute inset-0 w-full h-full resize-none bg-transparent text-sm text-zinc-300 font-mono p-5 outline-none leading-relaxed"
            placeholder="Write your HTML, CSS, and JS here..."
          />
        )}
        {activeTab === "preview" && (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-same-origin"
            className="absolute inset-0 w-full h-full border-0"
            title="Preview"
          />
        )}
      </div>

      {/* Status bar */}
      <div className="h-7 px-5 flex items-center gap-4 border-t border-white/5 bg-black/20">
        <span className="text-[10px] text-zinc-700 font-mono">HTML | {html.split("\n").length} lines | {html.length} chars</span>
        <span className="text-[10px] text-neon-green font-mono ml-auto">● Sandbox Active</span>
      </div>
    </div>
  );
}
