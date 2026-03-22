"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, LogOut, User as UserIcon, Mail, Shield, 
  ExternalLink, Loader2, Zap, LayoutGrid
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import MatrixRain from "@/components/MatrixRain";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on load
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
        } else {
          setUser(session.user);
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard session error:", err);
        router.push("/login");
      }
    }
    
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (err: any) {
      toast.error("Sign out failed");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden font-sans">
      <MatrixRain />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Main Dashboard</h1>
              <p className="text-zinc-500 text-sm mt-1">Management and profile overview for EVTING HUB</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/feed" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all">
              <LayoutGrid size={16} /> Community
            </Link>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-all cursor-pointer"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="rounded-3xl border border-white/[0.08] bg-zinc-900/40 backdrop-blur-2xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <Shield size={64} className="text-blue-500" />
              </div>

              <div className="relative flex flex-col items-center text-center">
                <div className="relative h-24 w-24 rounded-full border-2 border-blue-500 p-1 mb-6">
                  {user?.user_metadata?.picture ? (
                    <img src={user.user_metadata.picture} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="h-full w-full rounded-full bg-zinc-800 flex items-center justify-center">
                      <UserIcon size={40} className="text-zinc-600" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-blue-500 border-4 border-zinc-900 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  </div>
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                  {user?.user_metadata?.full_name || "Nexus User"}
                </h2>
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-6">
                  <Mail size={14} className="text-zinc-700" />
                  {user?.email}
                </div>

                <div className="w-full h-px bg-white/5 mb-6" />

                <div className="flex flex-col gap-3 w-full">
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-zinc-500">Account Role</span>
                    <span className="text-blue-400 font-bold uppercase tracking-wider">{user?.app_metadata?.provider || "Standard"}</span>
                  </div>
                  <Link href={`/u/${user?.user_metadata?.username || user?.id}`} className="flex items-center justify-center gap-2 h-11 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all">
                    View Public Profile <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions / Integration */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl border border-white/[0.08] bg-zinc-900/40 backdrop-blur-xl hover:bg-zinc-900/60 transition-all group">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Zap size={24} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Authenticated Access</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                  Your session is actively synchronized with the Evting Hub ecosystem. Enjoy seamless navigation across all services.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> System Active
                </div>
              </div>

              <div className="p-6 rounded-3xl border border-white/[0.08] bg-zinc-900/40 backdrop-blur-xl hover:bg-zinc-900/60 transition-all group">
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <LayoutGrid size={24} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Content Vault</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-4">
                  Manage your personal uploads, shared tools, and digital assets. Your data remains encrypted and safe within the EH vault.
                </p>
                <Link href="/vault" className="text-blue-400 text-xs font-bold uppercase tracking-widest hover:underline">
                  Browse Vault →
                </Link>
              </div>
            </div>

            <div className="p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/80 to-blue-900/10 backdrop-blur-xl text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white mb-3">Welcome to the Hub, {user?.user_metadata?.full_name?.split(' ')[0]}!</h3>
                <p className="text-zinc-500 text-sm mb-6">
                  You are now successfully logged in using your Google account. All your progress and profile settings are synced automatically.
                </p>
                <Link href="/feed" className="inline-block px-8 py-3 rounded-xl bg-white text-black font-black text-sm hover:bg-zinc-200 transition-all shadow-xl">
                  Start Exploring
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
