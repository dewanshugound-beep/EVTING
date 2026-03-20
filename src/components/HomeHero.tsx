"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Star,
  Eye,
  FolderLock,
  MessageSquare,
  Zap,
  Activity,
  GitBranch,
  Users,
} from "lucide-react";
import Link from "next/link";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

function BentoCard({
  children,
  className = "",
  href,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  id?: string;
}) {
  const inner = (
    <motion.div
      className={`bento-card rounded-2xl bg-surface-light p-6 overflow-hidden group cursor-pointer select-none relative ${className}`}
      id={id}
      whileHover={{
        borderColor: "rgba(59,130,246,0.7)",
        boxShadow:
          "0 0 30px rgba(59,130,246,0.18), inset 0 0 30px rgba(59,130,246,0.04)",
        transition: { duration: 0.25 },
      }}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-blue-600/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </motion.div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
      <span className="text-2xl font-black text-white">{value}</span>
      <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mt-0.5">
        {label}
      </span>
    </div>
  );
}

export default function HomeHero() {
  return (
    <>
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-black tracking-widest"
        >
          <Zap size={12} className="animate-pulse" />
          SYSTEM ONLINE — VERSION 2.0
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="max-w-3xl text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none mb-8"
        >
          <span className="text-blue-500">EVTING:</span>{" "}
          <span className="bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            THE DEV HUB.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="max-w-lg text-zinc-400 text-lg leading-relaxed text-glow-blue mb-10"
        >
          Encrypted file vault and real-time dev chat for the elite. Build fast.
          Ship faster. Leave no trace.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link href="/vault">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-sm tracking-wider shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all cursor-pointer"
            >
              <FolderLock size={15} /> Open Vault
            </motion.button>
          </Link>
          <Link href="/chat">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 font-black text-sm tracking-wider transition-all cursor-pointer"
            >
              <MessageSquare size={15} /> Enter Chat
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Bento Grid */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
        className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Vault (2 cols) */}
        <BentoCard href="/vault" id="bento-vault" className="md:col-span-2 min-h-[240px] flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mb-4">
              <FolderLock size={22} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-1">Encrypted Vault</h2>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
              Zero-knowledge AES-256 encrypted storage. Drag, drop, and secure your dev assets.
            </p>
          </div>
          <div className="flex items-center gap-2 text-blue-400 text-sm font-bold mt-6 group-hover:gap-3 transition-all">
            Open Vault <ArrowRight size={14} />
          </div>
        </BentoCard>

        {/* Chat */}
        <BentoCard href="/chat" id="bento-chat" className="flex flex-col justify-between min-h-[240px]">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mb-4">
              <MessageSquare size={22} className="text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-1">Dev Chat</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              E2E encrypted channels. No logs. No leaks.
            </p>
          </div>
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold mt-6 group-hover:gap-3 transition-all">
            Enter Chat <ArrowRight size={14} />
          </div>
        </BentoCard>

        {/* Stats */}
        <BentoCard id="bento-stats" className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-black tracking-widest uppercase mb-1">
            <Activity size={12} className="text-blue-500 animate-pulse" /> Live Network
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatPill value="1,204" label="Files" />
            <StatPill value="38" label="Nodes" />
            <StatPill value="99.9%" label="Uptime" />
            <StatPill value="12ms" label="Latency" />
          </div>
        </BentoCard>

        {/* Open Source */}
        <BentoCard id="bento-oss" className="flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <GitBranch size={22} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-black tracking-tight mb-1">Open Source</h2>
            <p className="text-zinc-500 text-sm">Built in public. Fork it.</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mt-6 group-hover:gap-3 transition-all">
            View Repo <ArrowRight size={14} />
          </div>
        </BentoCard>

        {/* Elite Access */}
        <BentoCard id="bento-team" className="flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Users size={22} className="text-violet-400" />
            </div>
            <h2 className="text-xl font-black tracking-tight mb-1">Elite Access</h2>
            <p className="text-zinc-500 text-sm">Invite-only dev teams. Role-based perms.</p>
          </div>
          <div className="flex items-center gap-2 text-violet-400 text-sm font-bold mt-6 group-hover:gap-3 transition-all">
            Request Access <ArrowRight size={14} />
          </div>
        </BentoCard>

        {/* Security */}
        <BentoCard id="bento-security" className="md:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
              <Shield size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="font-black text-sm">Enterprise-Grade Security</p>
              <p className="text-zinc-500 text-xs">AES-256-GCM · Zero-knowledge · SHA-256 integrity</p>
            </div>
          </div>
          <div className="flex gap-6 text-[11px] font-black tracking-widest text-zinc-600 uppercase">
            <span>SOC 2</span>
            <span>GDPR</span>
            <span>Open Audit</span>
          </div>
        </BentoCard>
      </motion.section>
    </>
  );
}
