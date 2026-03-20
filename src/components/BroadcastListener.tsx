"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import React from 'react';

export default function BroadcastListener() {
  useEffect(() => {
    const sb = createBrowserSupabase();

    // Listen to new messages with is_broadcast: true
    const channel = sb
      .channel("global-broadcasts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "is_broadcast=eq.true",
        },
        (payload) => {
          const newMsg = payload.new as { body: string };
          
          toast(
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black tracking-widest uppercase">
                <Zap size={12} className="animate-pulse" /> System Broadcast
              </div>
              <div className="text-zinc-100 text-sm font-bold leading-tight">
                {newMsg.body}
              </div>
            </div>,
            {
              duration: 10000,
              className: "border-emerald-500/50 bg-[#0a0f0a] shadow-[0_0_20px_rgba(16,185,129,0.2)]",
            }
          );
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  return null; // This component doesn't render anything visible
}
