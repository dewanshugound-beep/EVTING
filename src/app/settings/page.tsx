"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Bell,
  Lock,
  Palette,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { createBrowserSupabase } from "@/lib/supabase";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
  const { user } = useUser();
  const [section, setSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [skills, setSkills] = useState("");

  // Load existing profile
  useEffect(() => {
    if (!user?.id) return;
    const sb = createBrowserSupabase();
    sb.from("users")
      .select("display_name, bio, website, skills")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: any }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setBio(data.bio || "");
          setWebsite(data.website || "");
          setSkills((data.skills || []).join(", "));
        }
        setLoading(false);
      });
  }, [user?.id]);

  const saveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError("");

    try {
      const sb = createBrowserSupabase();
      const skillsArr = skills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

      const updates: Record<string, unknown> = {
        display_name: displayName.trim() || undefined,
        bio: bio.trim(),
        website: website.trim(),
        skills: skillsArr,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (sb.from("users") as any)
        .update(updates)
        .eq("id", user.id);

      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
          <Settings className="text-accent" size={22} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="w-48 space-y-1 shrink-0">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-left transition-all cursor-pointer ${
                section === id ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-xl">
          {section === "profile" && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-white">Profile</h2>

              {/* Avatar info (Clerk managed) */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-zinc-400">
                Your avatar and email are managed by Clerk. Click your avatar in the top-right to update them.
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none text-sm text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={300}
                  rows={4}
                  placeholder="Tell the community about yourself..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none text-sm text-white placeholder:text-zinc-700 resize-none"
                />
                <p className="text-[10px] text-zinc-700 text-right mt-1">{bio.length}/300</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none text-sm text-white placeholder:text-zinc-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-2 block">Skills (comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="Python, Rust, Security, AI, Web Dev"
                  className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 focus:border-accent/50 outline-none text-sm text-white placeholder:text-zinc-700"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}

              <motion.button
                onClick={saveProfile}
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/20 disabled:opacity-40 cursor-pointer"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </motion.button>
            </div>
          )}

          {section === "notifications" && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-white">Notifications</h2>
              {[
                { label: "Likes on my posts", key: "notif_likes", defaultChecked: true },
                { label: "New followers", key: "notif_follows", defaultChecked: true },
                { label: "Comments and replies", key: "notif_comments", defaultChecked: true },
                { label: "Mentions", key: "notif_mentions", defaultChecked: true },
                { label: "Store activity (stars, downloads)", key: "notif_store", defaultChecked: true },
                { label: "Dev tag updates", key: "notif_dev", defaultChecked: true },
              ].map(pref => (
                <div key={pref.key} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-sm text-zinc-300">{pref.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={pref.defaultChecked} className="sr-only peer" />
                    <div className="w-10 h-5.5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {section === "privacy" && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-white">Privacy & Security</h2>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-zinc-400 space-y-3">
                <p className="font-bold text-zinc-300">Password & 2FA</p>
                <p>Authentication is managed via Clerk. Use the profile menu to update your password or enable two-factor authentication.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <p className="text-sm font-bold text-white">Profile Visibility</p>
                <p className="text-[11px] text-zinc-500">Your profile is always public. Only you can edit your own profile.</p>
              </div>
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <p className="text-sm font-bold text-red-400 mb-1">Danger Zone</p>
                <p className="text-[11px] text-zinc-600 mb-3">Deleting your account is permanent and irreversible.</p>
                <button className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-500/20 transition-all">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {section === "appearance" && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-white">Appearance</h2>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-3 block">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {["dark", "darker", "oled"].map(theme => (
                    <button key={theme} className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${
                      theme === "dark" ? "border-accent/40 bg-accent/10 text-accent" : "border-white/5 bg-white/[0.02] text-zinc-600 hover:border-white/10"
                    }`}>
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-3 block">Accent Color</label>
                <div className="flex gap-3">
                  {[
                    { color: "#58a6ff", label: "Blue" },
                    { color: "#39d353", label: "Green" },
                    { color: "#a371f7", label: "Purple" },
                    { color: "#f78166", label: "Red" },
                    { color: "#e3b341", label: "Gold" },
                  ].map(({ color, label }) => (
                    <button key={color} title={label} style={{ backgroundColor: color }} className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white/40 cursor-pointer transition-all" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
