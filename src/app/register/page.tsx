"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { createBrowserSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MatrixRain from "@/components/MatrixRain";
import {
  Eye, EyeOff, Mail, Lock, User, Github, Loader2, Zap, MessageSquare, Twitter, ArrowRight, Check, X,
} from "lucide-react";
import { toast } from "sonner";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ chars", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : "bg-white/10"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">{labels[score - 1] || "Weak"}</span>
        <div className="flex gap-2">
          {checks.map(c => (
            <span key={c.label} className={`text-[9px] font-medium ${c.ok ? "text-emerald-500" : "text-zinc-700"}`}>
              {c.ok ? <Check size={8} className="inline" /> : <X size={8} className="inline" />} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPass) return toast.error("Passwords don't match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading("register");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: { username, full_name: username },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
    }
    setLoading(null);
  };

  const handleOAuth = async (provider: "github" | "google" | "discord" | "twitter") => {
    setLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-black overflow-hidden">
      <MatrixRain />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-violet-600 to-emerald-500 shadow-[0_0_40px_rgba(57,211,83,0.25)] mb-4">
            <span className="text-xl font-black text-white tracking-tighter">EH</span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Join EVTING HUB</h1>
          <p className="text-zinc-500 text-sm mt-1">The developer platform for builders</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/50 backdrop-blur-2xl p-6 shadow-2xl shadow-black/60">
          {done ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-xl font-black text-white mb-2">Check your email</h2>
              <p className="text-zinc-400 text-sm mb-1">We sent a verification link to</p>
              <p className="text-accent font-semibold text-sm mb-5">{email}</p>
              <p className="text-zinc-600 text-xs">Click the link to activate your account and start building.</p>
              <Link href="/login" className="inline-flex items-center gap-1.5 mt-6 text-sm text-accent font-semibold hover:text-blue-400 transition-colors">
                Back to login <ArrowRight size={12} />
              </Link>
            </motion.div>
          ) : (
            <>
              {/* OAuth */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {[
                  { p: "github" as const, icon: <Github size={15} />, label: "GitHub" },
                  { p: "google" as const, icon: <GoogleIcon />, label: "Google" },
                  { p: "discord" as const, icon: <MessageSquare size={15} />, label: "Discord" },
                  { p: "twitter" as const, icon: <Twitter size={15} />, label: "Twitter" },
                ].map(({ p, icon, label }) => (
                  <motion.button key={p} onClick={() => handleOAuth(p)} disabled={!!loading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/5 border border-white/[0.08] text-[12px] text-zinc-300 font-medium hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading === p ? <Loader2 size={13} className="animate-spin" /> : icon}
                    {label}
                  </motion.button>
                ))}
              </div>

              <div className="relative flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-[11px] text-zinc-600 font-medium">or create with email</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label htmlFor="username" className="text-[11px] text-zinc-500 font-medium mb-1 block">Username</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      id="username"
                      value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      required placeholder="devanshu_" maxLength={30}
                      className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="text-[11px] text-zinc-500 font-medium mb-1 block">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      id="email"
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required placeholder="you@example.com"
                      className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="text-[11px] text-zinc-500 font-medium mb-1 block">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      id="password"
                      type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      required placeholder="••••••••" minLength={8}
                      className="w-full h-10 pl-9 pr-10 rounded-xl bg-white/5 border border-white/[0.08] text-sm text-white placeholder:text-zinc-700 outline-none focus:border-accent/50 transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 cursor-pointer">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="text-[11px] text-zinc-500 font-medium mb-1 block">Confirm Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      id="confirmPassword"
                      type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                      required placeholder="••••••••"
                      className={`w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border text-sm text-white placeholder:text-zinc-700 outline-none transition-all ${
                        confirmPass && password !== confirmPass ? "border-red-500/50" : "border-white/[0.08] focus:border-accent/50"
                      }`}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  By signing up you agree to our{" "}
                  <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link> and{" "}
                  <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
                </p>

                <motion.button
                  type="submit" disabled={!!loading || (!!confirmPass && password !== confirmPass)}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading === "register" ? <Loader2 size={16} className="animate-spin" /> : <><Zap size={14} /><span>Create Account</span></>}
                </motion.button>
              </form>

              <p className="text-center text-[12px] text-zinc-600 mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-accent font-semibold hover:text-blue-400 transition-colors">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
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
