"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase";

export default function VisitorTracker() {
  useEffect(() => {
    // Check if we've already tracked this session to avoid spamming
    const tracked = sessionStorage.getItem("matrix_tracked");
    if (tracked) return;

    async function track() {
      const sb = createBrowserSupabase();
      try {
        await sb.rpc("increment_visitor_count");
        sessionStorage.setItem("matrix_tracked", "true");
      } catch (err) {
        // Silent fail
      }
    }
    track();
  }, []);

  return null;
}
