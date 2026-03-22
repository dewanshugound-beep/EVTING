"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MatrixRain from "@/components/MatrixRain";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Github,
  Loader2,
  Zap,
  MessageSquare,
  Twitter,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      router.push("/feed");
      router.refresh();
    }
    setLoading(null);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("magic");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/feed` },
      });
      if (error) throw error;
      setMagicSent(true);
      toast.success("Magic link sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send link");
    } finally {
      setLoading(null);
    }
  };

  const handleOAuth = async (provider: "github" | "google" | "discord" | "twitter") => {
    setLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "OAuth transition failed");
      setLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-black overflow-hidden">
      <MatrixRain />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60 pointer-events-none" />
      
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-violet-600 to-emerald-500 shadow-[0_0_40px_rgba(88,166,255,0.3)] mb-4">
            <span className="text-xl font-black text-white tracking-tighter">EH</span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Welcome back</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to EVTING HUB</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-2xl p-6 shadow-2xl shadow-black/60">
          {/* OAuth providers */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <OAuthButton
              icon={<Github size={16} />}
              label="GitHub"
              onClick={() => handleOAuth("github")}
              loading={loading === "github"}
            />
            <OAuthButton
              icon={<GoogleIcon />}
              label="Google"
              onClick={() => handleOAuth("google")}
              loading={loading === "google"}
            />
            <OAuthButton
              icon={<MessageSquare size={16} />}
              label="Discord"
              onClick={() => handleOAuth("discord")}
              loading={loading === "discord"}
            />
            <OAuthButton
              icon={<Twitter size={16} />}
              label="Twitter"
              onClick={() => handleOAuth("twitter")}
              loading={loading === "twitter"}
            />
          </div>

          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[11px] text-zinc-600 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-white/4 p-1 mb-5">
            <button
              onClick={() => setMode("password")}
              className={`flex-1 py-2 text-[12px] font-semibold rounded-lg transition-all cursor-pointer ${
                mode === "password" ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <Lock size={12} className="inline mr-1.5" />Password
            </button>
            <button
              onClick={() => setMode("magic")}
              className={`flex-1 py-2 text-[12px] font-semibold rounded-lg transition-all cursor-pointer ${
                mode === "magic" ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <Zap size={12} className="inline mr-1.5" />Magic Link
            </button>
          </div>

          <AnimatePresence mode="wait">
            {magicSent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="text-4xl mb-3">📬</div>
                <p className="text-white font-bold mb-1">Check your email</p>
                <p className="text-zinc-500 text-sm">We sent a magic link to <span className="text-accent font-medium">{email}</span></p>
                <button onClick={() => setMagicSent(false)} className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer">
                  Try again
                </button>
              </motion.div>
            ) : mode === "password" ? (
              <motion.form key="password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium mb-1 block">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required placeholder="you@example.com"
                      className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium mb-1 block">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      type={showPass ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)}
                      required placeholder="••••••••"
                      className="w-full h-10 pl-9 pr-10 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 cursor-pointer">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <motion.button
                  type="submit" disabled={!!loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full h-11 rounded-xl bg-accent text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50 cursor-pointer mt-2"
                >
                  {loading === "email" ? <Loader2 size={16} className="animate-spin" /> : <><span>Sign In</span><ArrowRight size={14} /></>}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form key="magic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleMagicLink} className="space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium mb-1 block">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required placeholder="you@example.com"
                      className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>
                <motion.button
                  type="submit" disabled={!!loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full h-11 rounded-xl bg-violet-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading === "magic" ? <Loader2 size={16} className="animate-spin" /> : <><Zap size={14} /><span>Send Magic Link</span></>}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-[12px] text-zinc-600 mt-5">
            Don{"'"}t have an account?{" "}
            <Link href="/register" className="text-accent font-semibold hover:text-blue-400 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function OAuthButton({ icon, label, onClick, loading }: { icon: React.ReactNode; label: string; onClick: () => void; loading: boolean }) {
  return (
    <motion.button
      onClick={onClick} disabled={loading}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
      className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-zinc-300 font-medium hover:bg-white/10 hover:border-white/15 transition-all cursor-pointer disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      <span className="text-[12px]">{label}</span>
    </motion.button>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
